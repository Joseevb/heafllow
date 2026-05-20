import { index, sqliteTable } from 'drizzle-orm/sqlite-core'

import { users } from '@/db/schemas'

export const addresses = sqliteTable(
  'addresses',
  (t) => ({
    id: t
      .text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    street: t.text('street').notNull(),
    city: t.text('city').notNull(),
    state: t.text('state').notNull(),
    country: t.text('country').notNull(),
    zipCode: t.text('zipCode').notNull(),

    userId: t.text('user_id').references(() => users.id),

    createdAt: t
      .text('created_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: t
      .text('updated_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  }),
  (t) => [index('addresses_user_id_idx').on(t.userId)],
)
