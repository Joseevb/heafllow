import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import * as z from 'zod'

import { clientMedicines } from '@/db/schemas'

export const selectUserMedicinesSchema = createSelectSchema(clientMedicines)
export const insertUserMedicinesSchema = createInsertSchema(clientMedicines, {
  dosage: z.string().nonempty().nonoptional(),
  frequency: z.string().nonempty().nonoptional(),
  startDate: z.date().nonoptional(),
  endDate: z
    .date()
    .nonoptional()
    .refine((date) => date >= new Date(), 'End date must be in the future'),

  userId: z.uuid().nonempty().nonoptional(),
  medicineId: z.number().positive().nonoptional(),
}).omit({ createdAt: true, updatedAt: true })
export const updateUserMedicinesSchema = createUpdateSchema(clientMedicines, {
  dosage: z.string().nonempty().optional(),
  frequency: z.string().nonempty().optional(),
  startDate: z.date().optional(),
  endDate: z
    .date()
    .optional()
    .refine((date) => date === undefined || date >= new Date(), 'End date must be in the future'),

  userId: z.uuid().nonempty().optional(),
  medicineId: z.number().positive().optional(),
}).omit({ createdAt: true, updatedAt: true })

export type ClientMedicines = z.infer<typeof selectUserMedicinesSchema>
export type CreateClientMedicines = z.infer<typeof insertUserMedicinesSchema>
export type UpdateClientMedicines = z.infer<typeof updateUserMedicinesSchema>
