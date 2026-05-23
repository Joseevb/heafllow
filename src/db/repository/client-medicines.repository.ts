import { and, eq } from 'drizzle-orm'

import type { clientMedicines } from '@/db/schemas'

import { BaseRepository } from '@/db/repository/base-repository'

export class ClientMedicinesRepository extends BaseRepository<typeof clientMedicines> {
  async findAllByClientId(clientId: string) {
    return await this.db.select().from(this.table).where(eq(this.columns.userId, clientId))
  }

  async findByClientIdAndMedicineId(clientId: string, medicineId: number) {
    const rows = await this.db
      .select()
      .from(this.table)
      .where(and(eq(this.columns.userId, clientId), eq(this.columns.medicineId, medicineId)))

    return rows.at(0)
  }

  async findAllByMedicineId(medicineId: number) {
    return await this.db.select().from(this.table).where(eq(this.columns.medicineId, medicineId))
  }

  async saveOrUpdateByClientAndMedicineId(input: {
    clientId: string
    medicineId: number
    name: string
    dosage: string
    frequency: string
    startDate: Date
    endDate: Date
  }) {
    const existing = await this.findByClientIdAndMedicineId(input.clientId, input.medicineId)

    if (existing) {
      return await this.db
        .update(this.table)
        .set({
          name: input.name,
          dosage: input.dosage,
          frequency: input.frequency,
          startDate: input.startDate,
          endDate: input.endDate,
        })
        .where(
          and(
            eq(this.columns.userId, input.clientId),
            eq(this.columns.medicineId, input.medicineId),
          ),
        )
        .returning()
        .then((rows) => rows[0])
    }

    return await this.save({
      userId: input.clientId,
      medicineId: input.medicineId,
      name: input.name,
      dosage: input.dosage,
      frequency: input.frequency,
      startDate: input.startDate,
      endDate: input.endDate,
    }).then((result) =>
      result.match({
        ok: (value) => value,
        err: (error) => {
          throw error
        },
      }),
    )
  }
}
