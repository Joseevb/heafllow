import * as z from 'zod'

import { DAYS } from '@/types/date'

function requiredString(message: string) {
  return z.string().trim().min(1, message)
}

export const specialistAvailabilityFormSchema = z
  .object({
    dayOfWeek: z.enum(DAYS),
    startTime: requiredString('Start time is required'),
    endTime: requiredString('End time is required'),
    intervalMinutes: z.coerce.number().min(15, 'Interval must be at least 15 minutes'),
    isAvailable: z.enum(['true', 'false']),
  })
  .superRefine((data, ctx) => {
    if (data.endTime <= data.startTime) {
      ctx.addIssue({
        code: 'custom',
        message: 'End time must be after start time.',
        path: ['endTime'],
      })
    }

    if (data.intervalMinutes <= 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Interval must be greater than 0.',
        path: ['intervalMinutes'],
      })
    }
  })

export const specialistAppointmentUpdateSchema = z.object({
  appointmentId: z.string().trim().min(1),
  status: z.enum(['confirmed', 'cancelled', 'no-show']),
  notes: z.string().trim().max(1000).optional(),
  cancellationReason: z.string().trim().max(1000).optional(),
})

export const specialistStartAppointmentSchema = z
  .object({
    appointmentId: z.string().trim().min(1),
    notes: z.string().trim().min(1, 'Visit notes are required').max(2000),
    addMedicine: z.enum(['true', 'false']),
    medicine: z
      .object({
        query: z.string().optional(),
        name: z.string(),
        medicineId: z.coerce.number(),
        dosage: z.string(),
        frequency: z.string(),
        startDate: z.string(),
        endDate: z.string(),
      })
      .optional(),
    scheduleFollowUp: z.enum(['true', 'false']),
    followUp: z
      .object({
        specialistId: z.string(),
        appointmentDate: z.string(),
        notes: z.string().trim().max(1000).optional(),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.addMedicine === 'true') {
      if (!data.medicine?.name.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: 'Medicine name is required',
          path: ['medicine', 'name'],
        })
      }

      if (!Number.isFinite(data.medicine?.medicineId) || (data.medicine?.medicineId ?? 0) <= 0) {
        ctx.addIssue({
          code: 'custom',
          message: 'Medicine ID must be positive',
          path: ['medicine', 'medicineId'],
        })
      }

      if (!data.medicine?.dosage.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: 'Dosage is required',
          path: ['medicine', 'dosage'],
        })
      }

      if (!data.medicine?.frequency.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: 'Frequency is required',
          path: ['medicine', 'frequency'],
        })
      }

      if (!data.medicine?.startDate.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: 'Start date is required',
          path: ['medicine', 'startDate'],
        })
      }

      if (!data.medicine?.endDate.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: 'End date is required',
          path: ['medicine', 'endDate'],
        })
      }
    }

    if (data.scheduleFollowUp === 'true') {
      if (!data.followUp?.specialistId.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: 'Select a specialist for the follow-up',
          path: ['followUp', 'specialistId'],
        })
      }

      if (!data.followUp?.appointmentDate.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: 'Select a follow-up time',
          path: ['followUp', 'appointmentDate'],
        })
      }
    }
  })

export type SpecialistAvailabilityFormInput = z.input<typeof specialistAvailabilityFormSchema>
export type SpecialistAvailabilityFormValues = z.infer<typeof specialistAvailabilityFormSchema>
export type SpecialistAppointmentUpdateInput = z.infer<typeof specialistAppointmentUpdateSchema>
export type SpecialistStartAppointmentInput = z.infer<typeof specialistStartAppointmentSchema>
