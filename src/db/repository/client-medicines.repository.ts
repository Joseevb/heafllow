import { eq } from 'drizzle-orm'

import type { clientMedicines } from '@/db/schemas'

import { BaseRepository } from '@/db/repository/base-repository'

export class ClientMedicinesRepository extends BaseRepository<typeof clientMedicines> {
  async findAllByClientId(clientId: string) {
    return await this.db.select().from(this.table).where(eq(this.columns.userId, clientId))
  }

  async findAllByMedicineId(medicineId: number) {
    return await this.db.select().from(this.table).where(eq(this.columns.medicineId, medicineId))
  }
}
