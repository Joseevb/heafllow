import { index, sqliteTable, unique } from 'drizzle-orm/sqlite-core'

import { users } from '@/db/schemas'
import { DAYS } from '@/types/date'

export const specialistAvailability = sqliteTable(
  'specialist_availability',
  (t) => ({
    id: t
      .text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    dayOfWeek: t.text('day_of_week', { enum: DAYS }).notNull(),
    startTime: t.integer('start_time', { mode: 'timestamp_ms' }).notNull(),
    endTime: t.integer('end_time', { mode: 'timestamp_ms' }).notNull(),
    isAvailable: t.integer('is_available', { mode: 'boolean' }).notNull(),

    specialistId: t
      .text('specialist_id')
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
  (t) => [
    index('specialist_availability_specialist_id_idx').on(t.specialistId),
    unique('uk_specialist_day_time').on(t.specialistId, t.dayOfWeek, t.startTime, t.endTime),
  ],
)
