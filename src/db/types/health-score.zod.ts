import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import * as z from 'zod'

import { healthScore } from '@/db/schemas'

const positiveInteger = z.number().positive().nonoptional()

export const selectHealthScoreSchema = createSelectSchema(healthScore)
export const insertHealthScoreSchema = createInsertSchema(healthScore, {
  overallScore: positiveInteger,
  cardiovascularScore: positiveInteger,
  metabolicScore: positiveInteger,
  lifestyleScore: positiveInteger,
  vitalScore: positiveInteger,
  dataPointsCount: positiveInteger,
  periodDays: positiveInteger,

  userId: z.string().nonempty().nonoptional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})
export const updateHealthScoreSchema = createUpdateSchema(healthScore, {
  overallScore: positiveInteger,
  cardiovascularScore: positiveInteger,
  metabolicScore: positiveInteger,
  lifestyleScore: positiveInteger,
  vitalScore: positiveInteger,
  dataPointsCount: positiveInteger,
  periodDays: positiveInteger,

  userId: z.string().nonempty().nonoptional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export type HealthScore = z.infer<typeof selectHealthScoreSchema>
export type CreateHealthScore = z.infer<typeof insertHealthScoreSchema>
export type UpdateHealthScore = z.infer<typeof updateHealthScoreSchema>
