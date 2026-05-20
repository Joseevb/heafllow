import { index, sqliteTable } from 'drizzle-orm/sqlite-core'

import { users } from '@/db/schemas/auth'
import { SPECIALTIES } from '@/types/specialties'

export const specialistsData = sqliteTable(
  'specialists_data',
  (t) => ({
    id: t
      .text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    licenseNumber: t.text('license_number').notNull().unique(),
    consultationDurationMinutes: t.integer('consultation_duration_minutes').notNull(),

    specialistId: t
      .text('specialist_id')
      .notNull()
      .references(() => users.id)
      .unique(),
    specialty: t.text('specialty', { enum: SPECIALTIES }).notNull(),

    createdAt: t
      .integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: t
      .integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .$onUpdate(() => new Date()),
  }),
  (t) => [index('specialists_data_specialty_idx').on(t.specialty)],
)
