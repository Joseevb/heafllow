import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import * as z from 'zod'

import { appointments, appointmentStatus } from '@/db/schemas'

export const selectAppointmentsSchema = createSelectSchema(appointments)
export const insertAppointmentsSchema = createInsertSchema(appointments, {
  appointmentDate: z
    .date()
    .nonoptional()
    .refine((date) => date >= new Date()),
  durationMinutes: z.number().nonoptional(),
  status: z.enum(appointmentStatus).nonoptional(),

  cancellationReason: z.string().optional(),
  notes: z.string().optional(),

  clientId: z.string().nonempty().nonoptional(),
  specialistId: z.string().nonempty().nonoptional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})
export const updateAppointmentsSchema = createUpdateSchema(appointments, {
  appointmentDate: z
    .date()
    .optional()
    .refine(
      (date) => date === undefined || date >= new Date(),
      'Appointment date must be in the future',
    ),
  durationMinutes: z.number().optional(),
  status: z.enum(appointmentStatus).optional(),

  cancellationReason: z.string().optional(),
  notes: z.string().optional(),

  clientId: z.string().nonempty().optional(),
  specialistId: z.string().nonempty().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export type Appointment = z.infer<typeof selectAppointmentsSchema>
export type CreateAppointment = z.infer<typeof insertAppointmentsSchema>
export type UpdateAppointment = z.infer<typeof updateAppointmentsSchema>
