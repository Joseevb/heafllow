import { eq } from 'drizzle-orm'

import type { specialistsData } from '@/db/schemas'

import { BaseRepository } from '@/db/repository/base-repository'

export class SpecialistsDataRepository extends BaseRepository<typeof specialistsData> {
  async findBySpecialistId(specialistId: string) {
    return await this.db
      .select()
      .from(this.table)
      .where(eq(this.columns.specialistId, specialistId))
  }
}
