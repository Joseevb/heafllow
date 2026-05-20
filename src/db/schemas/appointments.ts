import { sql } from 'drizzle-orm'
import { check, index, sqliteTable } from 'drizzle-orm/sqlite-core'

import { users } from '@/db/schemas/auth'

export const appointmentStatus = [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no-show',
] as const

export const appointments = sqliteTable(
  'appointments',
  (t) => ({
    id: t
      .text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    status: t.text('status', { enum: appointmentStatus }).notNull(),
    durationMinutes: t.integer('duration_minutes').notNull(),
    appointmentDate: t.integer('appointment_date', { mode: 'timestamp_ms' }).notNull(),

    notes: t.text('notes'),
    cancellationReason: t.text('cancellation_reason'),

    clientId: t
      .text('client_id')
      .notNull()
      .references(() => users.id),
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
    index('appointments_client_id_idx').on(t.clientId),
    index('appointments_specialist_id_idx').on(t.specialistId),
    check('client_not_specialist', sql`${t.clientId} != ${t.specialistId}`),
  ],
)
