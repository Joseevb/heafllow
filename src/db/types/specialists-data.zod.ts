import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import * as z from 'zod'

import { specialistsData } from '@/db/schemas'

export const selectSpecialistDataSchema = createSelectSchema(specialistsData)
export const insertSpecialistDataSchema = createInsertSchema(specialistsData, {
  licenseNumber: z.string().nonempty().nonoptional(),
  consultationDurationMinutes: z.number().min(15).nonoptional(),

  specialtyId: z.uuid().nonempty().nonoptional(),
  specialistId: z.uuid().nonempty().nonoptional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})
export const updateSpecialistDataSchema = createInsertSchema(specialistsData, {
  licenseNumber: z.string().nonempty().optional(),
  consultationDurationMinutes: z.number().min(15).optional(),

  specialtyId: z.uuid().nonempty().optional(),
  specialistId: z.uuid().nonempty().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export type SpecialistData = z.infer<typeof selectSpecialistDataSchema>
export type CreateSpecialistData = z.infer<typeof insertSpecialistDataSchema>
export type UpdateSpecialistData = z.infer<typeof updateSpecialistDataSchema>
