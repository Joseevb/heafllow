import { eq } from 'drizzle-orm'
import type { clientMedicines } from '@/db/schemas'
import { BaseRepository } from '@/db/repository/base-repository'

export class ClientMedicinesRepository extends BaseRepository<typeof clientMedicines> {
  constructor(db: BaseRepository<typeof clientMedicines>['db'], table: typeof clientMedicines) {
    super(db, table)
  }

  async findByClientId(clientId: string) {
    return await this.db.select().from(this.table).where(eq(this.columns.userId, clientId))
  }

  async findByMedicineId(medicineId: number) {
    return await this.db.select().from(this.table).where(eq(this.columns.medicineId, medicineId))
  }
}
