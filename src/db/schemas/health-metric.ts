import { index, sqliteTable } from 'drizzle-orm/sqlite-core'

import { users } from '@/db/schemas'
import { HealthMetricTypeKeys } from '@/types/health-metrics'

export const healthMetrics = sqliteTable(
  'health-metrics',
  (t) => ({
    id: t
      .text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    metricType: t.text('metric_type', { enum: HealthMetricTypeKeys }).notNull(),
    value: t.real('value').notNull(),
    unit: t.text('unit').notNull(),
    notes: t.text('notes'),
    source: t.text('source').default('manual'),

    clientId: t
      .text('user_id')
      .notNull()
      .references(() => users.id),
    recordedBySpecialistId: t
      .text('recorded_by_specialist_id')
      .notNull()
      .references(() => users.id),

    createdAt: t
      .integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: t
      .integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .$onUpdate(() => new Date()),
  }),
  (t) => [index('health_metrics_client_id_idx').on(t.clientId)],
)
