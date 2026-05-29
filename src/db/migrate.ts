import 'dotenv/config'
import { migrate } from 'drizzle-orm/libsql/migrator'

if (import.meta.main) {
  const { db } = await import('./index')

  try {
    await migrate(db, { migrationsFolder: './drizzle' })
    console.log('Migrations applied successfully')
  } catch (error) {
    console.error('Failed to apply migrations')
    console.error(error)
    process.exitCode = 1
  }
}
