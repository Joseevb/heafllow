import { eq } from 'drizzle-orm'

import type { clients } from '@/db/schemas'

import { BaseRepository } from '@/db/repository/base-repository'

export class ClientsRepository extends BaseRepository<typeof clients> {
  async findByClientId(clientId: string) {
    const rows = await this.db
      .select()
      .from(this.table)
      .where(eq(this.columns.clientId, clientId))
      .limit(1)

    return rows.at(0)
  }

  async hasPrimaryCareSpecialistReferences(specialistId: string) {
    const rows = await this.db
      .select({ id: this.columns.id })
      .from(this.table)
      .where(eq(this.columns.primaryCareSpecialist, specialistId))
      .limit(1)

    return rows.length > 0
  }

  async findAllByPrimaryCareSpecialist(specialistId: string) {
    return await this.db
      .select()
      .from(this.table)
      .where(eq(this.columns.primaryCareSpecialist, specialistId))
  }
}
