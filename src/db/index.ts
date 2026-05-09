import { drizzle } from 'drizzle-orm/bun-sqlite'

import { env } from '@/env/server'

export const db = drizzle(env.DB_FILE_NAME)
