import { eq } from 'drizzle-orm'
import type { appointments } from '@/db/schemas'
import { BaseRepository } from '@/db/repository/base-repository'

export class AppointmentsRepository extends BaseRepository<typeof appointments> {
  constructor(db: BaseRepository<typeof appointments>['db'], table: typeof appointments) {
    super(db, table)
  }

  async findAllByClientId(clientId: string) {
    return await this.db.select().from(this.table).where(eq(this.columns.clientId, clientId))
  }

  async findAllBySpecialistId(specialistId: string) {
    return await this.db
      .select()
      .from(this.table)
      .where(eq(this.columns.specialistId, specialistId))
  }
}
