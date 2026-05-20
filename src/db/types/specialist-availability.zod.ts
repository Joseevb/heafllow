import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import * as z from 'zod'

import { specialistAvailability } from '@/db/schemas'
import { DAYS } from '@/types/date'

export const selectSpecialistAvailabilitySchema = createSelectSchema(specialistAvailability)
export const insertSpecialistAvailabilitySchema = createInsertSchema(specialistAvailability, {
  dayOfWeek: z.enum(DAYS).nonoptional(),
  startTime: z.date().nonoptional(),
  endTime: z.date().nonoptional(),
  isAvailable: z.boolean().nonoptional(),

  specialistId: z.string().nonempty().nonoptional(),
}).omit({ id: true, createdAt: true, updatedAt: true })
export const updateSpecialistAvailabilitySchema = createUpdateSchema(specialistAvailability)

export type SpecialistAvailability = z.infer<typeof selectSpecialistAvailabilitySchema>
export type CreateSpecialistAvailability = z.infer<typeof insertSpecialistAvailabilitySchema>
export type UpdateSpecialistAvailability = z.infer<typeof updateSpecialistAvailabilitySchema>
