import { createServerFn } from '@tanstack/react-start'
import { Result } from 'better-result'
import { addDays, startOfDay } from 'date-fns'
import * as z from 'zod'

import { db } from '@/db'
import { AppointmentsRepository } from '@/db/repository/appoinments.repository'
import { ClientMedicinesRepository } from '@/db/repository/client-medicines.repository'
import { ClientsRepository } from '@/db/repository/clients-repository'
import { HealthMetricRepository } from '@/db/repository/health-metric.repository'
import { HealthScoreRepository } from '@/db/repository/health-score.repository'
import { SpecialistAvailabilityRepository } from '@/db/repository/specialist-availability.repository'
import { SpecialistsDataRepository } from '@/db/repository/specialists-data.repository'
import { UsersRepository } from '@/db/repository/users.repository'
import {
  appointments,
  clientMedicines,
  clients,
  healthMetrics,
  healthScore,
  specialistAvailability,
  specialistsData,
  users,
} from '@/db/schemas'
import { ensureSessionMiddleware } from '@/lib/auth.functions'
import { safeSerialize } from '@/lib/result'
import {
  specialistAppointmentUpdateSchema,
  specialistAvailabilityFormSchema,
  specialistStartAppointmentSchema,
} from '@/schemas/specialist'

const appointmentsRepository = new AppointmentsRepository(db, appointments)
const clientMedicinesRepository = new ClientMedicinesRepository(db, clientMedicines)
const clientsRepository = new ClientsRepository(db, clients)
const healthMetricRepository = new HealthMetricRepository(db, healthMetrics)
const healthScoreRepository = new HealthScoreRepository(db, healthScore)
const specialistAvailabilityRepository = new SpecialistAvailabilityRepository(
  db,
  specialistAvailability,
)
const specialistsDataRepository = new SpecialistsDataRepository(db, specialistsData)
const usersRepository = new UsersRepository(db, users)

export const getSpecialistOverview = createServerFn()
  .middleware([ensureSessionMiddleware])
  .handler(async ({ context: { session } }) => {
    const now = new Date()
    const upcomingAppointments = await appointmentsRepository.findUpcomingBySpecialistId(
      session.user.id,
      now,
    )
    const recentAppointments = await appointmentsRepository.findRecentCompletedBySpecialistId(
      session.user.id,
      5,
    )
    const availability = await specialistAvailabilityRepository.findAllBySpecialistId(
      session.user.id,
    )
    const specialistClients = await clientsRepository.findAllByPrimaryCareSpecialist(
      session.user.id,
    )

    return {
      summary: {
        upcomingAppointmentsCount: upcomingAppointments.length,
        completedAppointmentsCount: recentAppointments.filter((item) => item.status === 'completed')
          .length,
        availabilityBlocksCount: availability.filter((item) => item.isAvailable).length,
        assignedClientsCount: specialistClients.length,
      },
      upcomingAppointments: await Promise.all(
        upcomingAppointments.map(
          async (appointment) => await buildSpecialistAppointmentSummary(appointment),
        ),
      ),
      recentAppointments: await Promise.all(
        recentAppointments.map(
          async (appointment) => await buildSpecialistAppointmentSummary(appointment),
        ),
      ),
      availability,
      assignedClients: await Promise.all(
        specialistClients.map(async (client) => await buildClientOverview(client.clientId ?? '')),
      ),
    }
  })

export const getSpecialistAppointments = createServerFn()
  .middleware([ensureSessionMiddleware])
  .handler(async ({ context: { session } }) => {
    const specialistAppointments = await appointmentsRepository.findAllBySpecialistId(
      session.user.id,
    )

    return await Promise.all(
      specialistAppointments.map(
        async (appointment) => await buildSpecialistAppointmentSummary(appointment),
      ),
    )
  })

export const getSpecialistAvailability = createServerFn()
  .middleware([ensureSessionMiddleware])
  .handler(async ({ context: { session } }) => {
    const [availability, specialistProfile] = await Promise.all([
      specialistAvailabilityRepository.findAllBySpecialistId(session.user.id),
      specialistsDataRepository.findBySpecialistId(session.user.id),
    ])

    if (!specialistProfile) {
      throw new Error('Specialist profile not found.')
    }

    return {
      availability,
      consultationDurationMinutes: specialistProfile.consultationDurationMinutes,
    }
  })

export const upsertSpecialistAvailability = createServerFn({ method: 'POST' })
  .inputValidator(specialistAvailabilityFormSchema)
  .middleware([ensureSessionMiddleware])
  .handler(async ({ data, context: { session } }) =>
    Result.tryPromise(async () => {
      const intervalMinutes = data.intervalMinutes
      const specialistProfile = await specialistsDataRepository.findBySpecialistId(session.user.id)

      if (!specialistProfile) {
        throw new Error('Specialist profile not found.')
      }

      await specialistAvailabilityRepository.deleteBySpecialistIdAndDayOfWeek(
        session.user.id,
        data.dayOfWeek,
      )

      const slots = buildAvailabilitySlots({
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        intervalMinutes,
        isAvailable: data.isAvailable === 'true',
        specialistId: session.user.id,
      })

      if (slots.length === 0) {
        throw new Error('No availability slots could be created for this range.')
      }

      const savedSlots = await Promise.all(
        slots.map(
          async (slot) =>
            await specialistAvailabilityRepository.save(slot).then((result) =>
              result.match({
                ok: (value) => value,
                err: (error) => {
                  throw new Error(error.message)
                },
              }),
            ),
        ),
      )

      if (specialistProfile.consultationDurationMinutes !== intervalMinutes) {
        await specialistsDataRepository.updateBySpecialistId(session.user.id, {
          consultationDurationMinutes: intervalMinutes,
        })
      }

      return savedSlots
    }).then(safeSerialize),
  )

export const deleteSpecialistAvailability = createServerFn({ method: 'POST' })
  .inputValidator(z.string().trim().min(1))
  .middleware([ensureSessionMiddleware])
  .handler(async ({ data: id, context: { session } }) =>
    Result.tryPromise(async () => {
      const existing = await specialistAvailabilityRepository.findByIdAndSpecialistId(
        id,
        session.user.id,
      )

      if (!existing[0]) {
        throw new Error('Availability slot not found.')
      }

      const deleted = await specialistAvailabilityRepository.deleteByIdAndSpecialistId(
        id,
        session.user.id,
      )

      if (deleted.length === 0) {
        throw new Error('Availability slot not found.')
      }

      return { id }
    }).then(safeSerialize),
  )

export const getSpecialistAppointmentById = createServerFn()
  .inputValidator(z.object({ appointmentId: z.string().trim().min(1) }))
  .middleware([ensureSessionMiddleware])
  .handler(async ({ data, context: { session } }) => {
    const rows = await appointmentsRepository.findByIdAndSpecialistId(
      data.appointmentId,
      session.user.id,
    )
    const appointment = rows[0]

    if (!appointment) {
      throw new Error('Appointment not found.')
    }

    return await buildSpecialistAppointmentSummary(appointment)
  })

export const searchExternalMedicines = createServerFn()
  .inputValidator(z.object({ query: z.string() }))
  .middleware([ensureSessionMiddleware])
  .handler(async () => {
    return [] as Array<{ id: number; name: string }>
  })

export const updateSpecialistAppointment = createServerFn({ method: 'POST' })
  .inputValidator(specialistAppointmentUpdateSchema)
  .middleware([ensureSessionMiddleware])
  .handler(async ({ data, context: { session } }) =>
    Result.tryPromise(async () => {
      const appointment = await appointmentsRepository.findActiveByIdAndSpecialistId(
        data.appointmentId,
        session.user.id,
      )

      if (!appointment[0]) {
        throw new Error('Appointment not found.')
      }

      return await appointmentsRepository
        .update(data.appointmentId, {
          status: data.status,
          notes: data.notes,
          cancellationReason:
            data.status === 'cancelled' ? (data.cancellationReason ?? null) : null,
        })
        .then((result) =>
          result.match({
            ok: (value) => value,
            err: (error) => {
              throw new Error(error.message)
            },
          }),
        )
    }).then(safeSerialize),
  )

export const completeSpecialistAppointment = createServerFn({ method: 'POST' })
  .inputValidator(specialistStartAppointmentSchema)
  .middleware([ensureSessionMiddleware])
  .handler(async ({ data, context: { session } }) =>
    Result.tryPromise(async () => {
      const appointmentRows = await appointmentsRepository.findActiveByIdAndSpecialistId(
        data.appointmentId,
        session.user.id,
      )
      const appointment = appointmentRows[0]

      if (!appointment) {
        throw new Error('Appointment not found.')
      }

      const appointmentUpdateResult = await appointmentsRepository.completeById(
        data.appointmentId,
        data.notes,
      )

      appointmentUpdateResult.match({
        ok: () => undefined,
        err: (error) => {
          throw new Error(error.message)
        },
      })

      if (data.addMedicine === 'true' && data.medicine) {
        await clientMedicinesRepository.saveOrUpdateByClientAndMedicineId({
          clientId: appointment.clientId,
          medicineId: data.medicine.medicineId,
          name: data.medicine.name,
          dosage: data.medicine.dosage,
          frequency: data.medicine.frequency,
          startDate: new Date(data.medicine.startDate),
          endDate: new Date(data.medicine.endDate),
        })
      }

      if (data.scheduleFollowUp === 'true' && data.followUp) {
        const targetSpecialist = await usersRepository.findActiveSpecialistById(
          data.followUp.specialistId,
        )
        const targetSpecialistProfile = await specialistsDataRepository.findBySpecialistId(
          data.followUp.specialistId,
        )

        if (!targetSpecialist || !targetSpecialistProfile) {
          throw new Error('Follow-up specialist not found.')
        }

        const followUpResult = await appointmentsRepository.createFollowUp({
          clientId: appointment.clientId,
          specialistId: data.followUp.specialistId,
          appointmentDate: new Date(data.followUp.appointmentDate),
          durationMinutes: targetSpecialistProfile.consultationDurationMinutes,
          notes: data.followUp.notes,
        })

        followUpResult.match({
          ok: () => undefined,
          err: (error) => {
            throw new Error(error.message)
          },
        })
      }

      return await buildSpecialistAppointmentSummary({
        ...appointment,
        status: 'completed',
        notes: data.notes,
      })
    }).then(safeSerialize),
  )

async function buildSpecialistAppointmentSummary(appointment: typeof appointments.$inferSelect) {
  const [client, clientMetrics, latestHealthScore, clientMedicinesList, specialist] =
    await Promise.all([
      buildClientOverview(appointment.clientId),
      healthMetricRepository.findAllByClientIdBetweenDates(
        appointment.clientId,
        startOfDay(addDays(new Date(), -30)),
        new Date(),
      ),
      healthScoreRepository.findLatestByClientId(appointment.clientId),
      clientMedicinesRepository.findAllByClientId(appointment.clientId),
      usersRepository.findSpecialistById(appointment.specialistId),
    ])

  return {
    ...appointment,
    client,
    specialist,
    recentMetricCount: clientMetrics.length,
    latestHealthScore,
    activeMedicinesCount: clientMedicinesList.length,
  }
}

async function buildClientOverview(clientId: string) {
  const [user, clientProfile] = await Promise.all([
    usersRepository.findByIdOrUndefined(clientId),
    clientsRepository.findByClientId(clientId),
  ])

  if (!user || !clientProfile) {
    throw new Error('Client not found.')
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phoneNumber: clientProfile.phoneNumber,
    birthDate: clientProfile.birthDate,
  }
}

function buildAvailabilityDate(time: string) {
  const [hours, minutes] = time.split(':').map(Number)

  return new Date(Date.UTC(2026, 0, 1, hours, minutes, 0, 0))
}

function buildAvailabilitySlots({
  dayOfWeek,
  startTime,
  endTime,
  intervalMinutes,
  isAvailable,
  specialistId,
}: {
  dayOfWeek: z.infer<typeof specialistAvailabilityFormSchema>['dayOfWeek']
  startTime: string
  endTime: string
  intervalMinutes: number
  isAvailable: boolean
  specialistId: string
}) {
  const rangeStart = buildAvailabilityDate(startTime)
  const rangeEnd = buildAvailabilityDate(endTime)
  const intervalMs = intervalMinutes * 60 * 1000
  const slots: Array<{
    specialistId: string
    dayOfWeek: z.infer<typeof specialistAvailabilityFormSchema>['dayOfWeek']
    startTime: Date
    endTime: Date
    isAvailable: boolean
  }> = []

  for (
    let cursor = rangeStart.getTime();
    cursor + intervalMs <= rangeEnd.getTime();
    cursor += intervalMs
  ) {
    slots.push({
      specialistId,
      dayOfWeek,
      startTime: new Date(cursor),
      endTime: new Date(cursor + intervalMs),
      isAvailable,
    })
  }

  return slots
}
