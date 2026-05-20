import { index, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core'

import { users } from '@/db/schemas'

export const clientMedicines = sqliteTable(
  'client_medicines',
  (t) => ({
    dosage: t.text('dosage').notNull(),
    frequency: t.text('frequency').notNull(),
    startDate: t.integer('start_date', { mode: 'timestamp_ms' }).notNull(),
    endDate: t.integer('end_date', { mode: 'timestamp_ms' }).notNull(),

    medicineId: t.integer('medicine_id').notNull(),
    userId: t
      .text('user_id')
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
    primaryKey({ columns: [t.userId, t.medicineId] }),
    index('client_medicines_medicine_id_idx').on(t.medicineId),
  ],
)
