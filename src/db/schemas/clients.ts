import { sql } from 'drizzle-orm'
import { check, index, sqliteTable, unique } from 'drizzle-orm/sqlite-core'

import { users } from '@/db/schemas/auth'

export const clients = sqliteTable(
  'clients',
  (t) => ({
    id: t
      .text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    firstName: t.text('first_name').notNull(),
    lastName: t.text('last_name').notNull(),
    birthDate: t.integer('birth_date', { mode: 'timestamp' }).notNull(),
    phoneNumber: t.text('phone_number').notNull(),

    clientId: t.text('client_id').references(() => users.id),
    primaryCareSpecialist: t.text('primary_care_specialist').references(() => users.id),

    createdAt: t.integer('createdAt', { mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
    updatedAt: t.integer('updatedAt', { mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
  }),

  (t) => [
    index('clients_client_id_idx').on(t.clientId),
    index('clients_first_name_idx').on(t.firstName),
    index('clients_primary_care_specialist_idx').on(t.primaryCareSpecialist),
    check('client_not_specialist', sql`${t.clientId} != ${t.primaryCareSpecialist}`),
    unique('clients_phone_number_idx').on(t.phoneNumber),
  ],
)
