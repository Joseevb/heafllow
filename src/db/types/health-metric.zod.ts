import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import * as z from 'zod'

import { healthMetrics } from '@/db/schemas'
import { HealthMetricTypeKeys } from '@/types/health-metrics'

export const selectHealthMetricSchema = createSelectSchema(healthMetrics)
export const insertHealthMetricSchema = createInsertSchema(healthMetrics, {
  metricType: z.enum(HealthMetricTypeKeys).nonoptional(),
  value: z.number().positive().nonoptional(),
  unit: z.string().nonempty().nonoptional(),
  source: z.string().nonempty().nonoptional().default('manual'),

  notes: z.string().optional(),

  recordedBySpecialistId: z.uuid().nonempty().nonoptional(),
  clientId: z.uuid().nonempty().nonoptional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})
export const updateHealthMetricSchema = createUpdateSchema(healthMetrics, {
  metricType: z.enum(HealthMetricTypeKeys).optional(),
  value: z.number().positive().optional(),
  unit: z.string().nonempty().optional(),
  source: z.string().nonempty().optional().default('manual'),

  notes: z.string().optional(),

  recordedBySpecialistId: z.uuid().nonempty().optional(),
  clientId: z.uuid().nonempty().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})
