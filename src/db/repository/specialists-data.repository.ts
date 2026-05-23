import type { getTableColumns } from 'drizzle-orm'

import { eq } from 'drizzle-orm'

import type { specialistsData } from '@/db/schemas'

import { BaseRepository } from '@/db/repository/base-repository'

export class SpecialistsDataRepository extends BaseRepository<typeof specialistsData> {
  async findAllSpecialistIdsByField(
    field: keyof ReturnType<typeof getTableColumns<typeof specialistsData>>,
    value: string,
  ) {
    return await this.db
      .select({ id: this.columns.specialistId })
      .from(this.table)
      .where(eq(this.columns[field] as any, value))
  }

  async findBySpecialistId(
    specialistId: string,
  ): Promise<typeof specialistsData.$inferSelect | undefined> {
    const rows = await this.db
      .select()
      .from(this.table)
      .where(eq(this.columns.specialistId, specialistId))
      .limit(1)

    return rows.at(0)
  }

  async updateBySpecialistId(
    specialistId: string,
    partial: Partial<typeof specialistsData.$inferInsert>,
  ) {
    const rows = await this.db
      .update(this.table)
      .set(partial)
      .where(eq(this.columns.specialistId, specialistId))
      .returning()

    return rows.at(0)
  }
}
