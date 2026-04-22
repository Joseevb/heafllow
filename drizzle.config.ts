import { defineConfig } from 'drizzle-kit'
import 'dotenv/config'
import { env } from '@/env/server'

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schemas',
  dialect: 'turso',
  dbCredentials: {
    url: env.DB_FILE_NAME!,
  },
})
