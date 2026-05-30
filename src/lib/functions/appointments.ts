import { createServerFn } from '@tanstack/react-start'
import { Result } from 'better-result'
import * as z from 'zod'

import type { Specialist } from '@/db/types/specialists-data.zod'

import { db } from '@/db'
import { AppointmentsRepository } from '@/db/repository/appoinments.repository'
import { DatabaseError, EntityNotFoundError } from '@/db/repository/base-repository'
import { SpecialistAvailabilityRepository } from '@/db/repository/specialist-availability.repository'
import { SpecialistsDataRepository } from '@/db/repository/specialists-data.repository'
import { UsersRepository } from '@/db/repository/users.repository'
import { appointments, specialistAvailability, specialistsData, users } from '@/db/schemas'
import { selectAppointmentsSchema } from '@/db/types/appointments.zod'
import { safeSerialize } from '@/lib/result'

import { ensureSessionMiddleware } from './auth'

const appointmentsRepository = new AppointmentsRepository(db, appointments)
const specialistAvailabilityRepository = new SpecialistAvailabilityRepository(
  db,
  specialistAvailability,
)
const specialistsDataRepository = new SpecialistsDataRepository(db, specialistsData)
const usersRepository = new UsersRepository(db, users)

const specialistBookingAvailabilitySchema = z
  .object({
    specialistId: z.string().nonempty().nonoptional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((value) => value.endDate >= value.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  })

const createAppointmentInputSchema = z.object({
  specialistId: z.string().nonempty().nonoptional(),
  appointmentDate: z.coerce.date(),
  notes: z.string().trim().max(1000).optional(),
})

const cancelAppointmentInputSchema = z.object({
  appointmentId: z.string().nonempty().nonoptional(),
  reason: z.string().trim().max(1000).optional(),
})

function createSpecialistNotFoundError(specialistId: string) {
  return new EntityNotFoundError({
    field: 'specialistId',
    value: specialistId,
  })
}

function getDayKey(date: Date) {
  return date.toISOString().split('T')[0]
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

function formatSlotLabel(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

async function getRequiredSpecialistDataResult(specialistId: string) {
  return Result.mapError(
    await specialistsDataRepository.findBySpecialistId(specialistId),
    (cause) =>
      cause instanceof EntityNotFoundError ? cause : createSpecialistNotFoundError(specialistId),
  )
}

async function getAppointmentSpecialistResult(specialistId: string) {
  const userResult = await Result.tryPromise({
    try: async () => {
      const user = await usersRepository.findSpecialistById(specialistId)

      if (!user) {
        throw createSpecialistNotFoundError(specialistId)
      }

      return user
    },
    catch: (cause) =>
      cause instanceof EntityNotFoundError ? cause : createSpecialistNotFoundError(specialistId),
  })

  const specialistDataResult = await getRequiredSpecialistDataResult(specialistId)

  return await Result.gen(async function* () {
    const user = yield* userResult
    const specialistData = yield* specialistDataResult

    return Result.ok({
      ...user,
      specialistData,
    })
  })
}

function buildBookingDays({
  startDate,
  endDate,
  consultationDurationMinutes,
  availabilityBlocks,
  scheduledAppointments,
}: {
  startDate: Date
  endDate: Date
  consultationDurationMinutes: number
  availabilityBlocks: Awaited<
    ReturnType<typeof specialistAvailabilityRepository.findAvailableBySpecialistIdBetweenDates>
  >
  scheduledAppointments: Awaited<
    ReturnType<typeof appointmentsRepository.findScheduledBySpecialistIdBetweenDates>
  >
}) {
  const durationMs = consultationDurationMinutes * 60 * 1000
  const bookedSlotStarts = new Set(
    scheduledAppointments.map((appointment) => appointment.appointmentDate.toISOString()),
  )
  const days = new Map<
    string,
    {
      date: string
      slots: Map<string, { startsAt: string; label: string; status: 'available' | 'booked' }>
    }
  >()

  for (const block of availabilityBlocks) {
    const blockStartTime = new Date(block.startTime)
    const blockEndTime = new Date(block.endTime)

    for (
      const cursor = new Date(startDate);
      cursor <= endDate;
      cursor.setDate(cursor.getDate() + 1)
    ) {
      const currentDay = new Date(cursor)

      if (currentDay.toLocaleDateString('en-US', { weekday: 'long' }) !== block.dayOfWeek) {
        continue
      }

      const startsAt = new Date(currentDay)
      startsAt.setHours(blockStartTime.getUTCHours(), blockStartTime.getUTCMinutes(), 0, 0)

      const endsAt = new Date(currentDay)
      endsAt.setHours(blockEndTime.getUTCHours(), blockEndTime.getUTCMinutes(), 0, 0)

      let slotStart = new Date(startsAt)

      while (slotStart.getTime() + durationMs <= endsAt.getTime()) {
        const slot = new Date(slotStart)

        if (slot >= startDate && slot <= endDate) {
          const dayKey = getDayKey(slot)
          const day = days.get(dayKey) ?? {
            date: dayKey,
            slots: new Map(),
          }

          day.slots.set(slot.toISOString(), {
            startsAt: slot.toISOString(),
            label: formatSlotLabel(slot),
            status: bookedSlotStarts.has(slot.toISOString()) ? 'booked' : 'available',
          })

          days.set(dayKey, day)
        }

        slotStart = new Date(slotStart.getTime() + durationMs)
      }
    }
  }

  return Array.from(days.values())
    .map((day) => ({
      date: day.date,
      slots: Array.from(day.slots.values()).sort((left, right) =>
        left.startsAt.localeCompare(right.startsAt),
      ),
    }))
    .sort((left, right) => left.date.localeCompare(right.date))
}

export const buildAppointmentSummary = createServerFn()
  .middleware([ensureSessionMiddleware])
  .inputValidator(selectAppointmentsSchema)
  .handler(async ({ data: appointment }) => {
    const specialistResult: Result<Specialist, unknown> = await getAppointmentSpecialistResult(
      appointment.specialistId,
    )

    if (specialistResult.isOk()) {
      return {
        ...appointment,
        specialist: specialistResult.value,
      }
    }

    throw new Error('Failed to get specialist')
  })

export const getClientUpcomingAppointments = createServerFn()
  .middleware([ensureSessionMiddleware])
  .handler(async ({ context: { session } }) => {
    const upcomingAppointments = await appointmentsRepository.findUpcomingByClientId(
      session.user.id,
      new Date(),
    )

    return await Promise.all(
      upcomingAppointments.map(
        async (appointment) => await buildAppointmentSummary({ data: appointment }),
      ),
    )
  })

export const getClientAppointmentHistory = createServerFn()
  .middleware([ensureSessionMiddleware])
  .handler(async ({ context: { session } }) => {
    const appointmentHistory = await appointmentsRepository.findCompletedHistoryByClientId(
      session.user.id,
    )

    return await Promise.all(
      appointmentHistory.map(
        async (appointment) => await buildAppointmentSummary({ data: appointment }),
      ),
    )
  })

export const getSpecialistBookingAvailability = createServerFn()
  .inputValidator(specialistBookingAvailabilitySchema)
  .middleware([ensureSessionMiddleware])
  .handler(async ({ data }) => {
    const specialistResult = await getRequiredSpecialistDataResult(data.specialistId)

    return Result.gen(async function* () {
      const specialist = yield* specialistResult

      const [availabilityBlocks, scheduledAppointments] = await Promise.all([
        specialistAvailabilityRepository.findAvailableBySpecialistIdBetweenDates(
          data.specialistId,
          data.startDate,
          data.endDate,
        ),
        appointmentsRepository.findScheduledBySpecialistIdBetweenDates(
          data.specialistId,
          data.startDate,
          data.endDate,
        ),
      ])

      return Result.ok(
        buildBookingDays({
          startDate: data.startDate,
          endDate: data.endDate,
          consultationDurationMinutes: specialist.consultationDurationMinutes,
          availabilityBlocks,
          scheduledAppointments,
        }),
      )
    }).then(safeSerialize)
  })

export const createAppointment = createServerFn({ method: 'POST' })
  .inputValidator(createAppointmentInputSchema)
  .middleware([ensureSessionMiddleware])
  .handler(async ({ data, context: { session } }) => {
    const specialistResult = await getRequiredSpecialistDataResult(data.specialistId)

    return Result.gen(async function* () {
      const specialist = yield* specialistResult
      const appointmentDayStart = startOfDay(data.appointmentDate)
      const appointmentDayEnd = endOfDay(data.appointmentDate)

      const [availabilityBlocks, scheduledAppointments] = await Promise.all([
        specialistAvailabilityRepository.findAvailableBySpecialistIdBetweenDates(
          data.specialistId,
          appointmentDayStart,
          appointmentDayEnd,
        ),
        appointmentsRepository.findScheduledBySpecialistIdBetweenDates(
          data.specialistId,
          appointmentDayStart,
          appointmentDayEnd,
        ),
      ])

      const selectedSlot = buildBookingDays({
        startDate: appointmentDayStart,
        endDate: appointmentDayEnd,
        consultationDurationMinutes: specialist.consultationDurationMinutes,
        availabilityBlocks,
        scheduledAppointments,
      })
        .flatMap((day) => day.slots)
        .find(
          (slot) =>
            slot.startsAt === data.appointmentDate.toISOString() && slot.status === 'available',
        )

      if (!selectedSlot) {
        return yield* Result.err({
          message: 'Selected time slot is no longer available.',
        })
      }

      const saveResult = await Result.tryPromise({
        try: async () => {
          const savedAppointment = await appointmentsRepository.save({
            clientId: session.user.id,
            specialistId: data.specialistId,
            appointmentDate: data.appointmentDate,
            durationMinutes: specialist.consultationDurationMinutes,
            status: 'pending',
            notes: data.notes,
          })

          let createdAppointment: typeof appointments.$inferSelect | undefined
          let saveError: DatabaseError | undefined

          savedAppointment.match({
            ok: (appointment) => {
              createdAppointment = appointment
            },
            err: (error) => {
              saveError = error
            },
          })

          if (saveError) {
            throw saveError
          }

          return createdAppointment!
        },
        catch: (cause) => ({
          message: cause instanceof DatabaseError ? cause.message : 'Failed to create appointment.',
        }),
      })

      const createdAppointment = yield* saveResult

      return Result.ok(createdAppointment)
    }).then(safeSerialize)
  })

export const cancelAppointment = createServerFn({ method: 'POST' })
  .inputValidator(cancelAppointmentInputSchema)
  .middleware([ensureSessionMiddleware])
  .handler(async ({ data, context: { session } }) => {
    return Result.gen(async function* () {
      const matchingAppointments = await appointmentsRepository.findSchedulableByIdAndClientId(
        data.appointmentId,
        session.user.id,
      )

      const appointment = matchingAppointments[0]

      if (!appointment) {
        return yield* Result.err({
          message: 'Appointment could not be cancelled.',
        })
      }

      const updateResult = await appointmentsRepository.update(data.appointmentId, {
        status: 'cancelled',
        cancellationReason: data.reason || null,
      })

      const updatedAppointment = yield* updateResult.mapError((error) => ({
        message:
          error instanceof DatabaseError
            ? 'Failed to cancel appointment.'
            : 'Appointment could not be cancelled.',
      }))

      return Result.ok(updatedAppointment)
    }).then(safeSerialize)
  })
