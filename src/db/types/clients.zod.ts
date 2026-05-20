import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import * as z from 'zod'

import { clients } from '@/db/schemas/clients'

export const selectClientSchema = createSelectSchema(clients)
export const insertClientSchema = createInsertSchema(clients, {
  firstName: z.string().nonempty().nonoptional(),
  lastName: z.string().nonempty().nonoptional(),
  birthDate: z.date().nonoptional(),
  phoneNumber: z.string().nonempty().nonoptional(),

  clientId: z.string().nonempty().nonoptional(),
  primaryCareSpecialist: z.string().nonempty().nonoptional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})
export const updateClientSchema = createUpdateSchema(clients, {
  firstName: z.string().nonempty().optional(),
  lastName: z.string().nonempty().optional(),
  birthDate: z.date().optional(),
  phoneNumber: z.string().nonempty().optional(),

  clientId: z.string().nonempty().optional(),
  primaryCareSpecialist: z.string().nonempty().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export type Client = z.infer<typeof selectClientSchema>
export type CreateClient = z.infer<typeof insertClientSchema>
export type UpdateClient = z.infer<typeof updateClientSchema>
