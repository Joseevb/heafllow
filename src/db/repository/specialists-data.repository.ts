import type { getTableColumns } from 'drizzle-orm'

import { Result } from 'better-result'
import { eq } from 'drizzle-orm'

import type { specialistsData } from '@/db/schemas'

import { BaseRepository, EntityNotFoundError } from '@/db/repository/base-repository'

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

  async findBySpecialistId(specialistId: string) {
    return Result.tryPromise({
      try: async () => {
        const rows = await this.db
          .select()
          .from(this.table)
          .where(eq(this.columns.specialistId, specialistId))
          .limit(1)

        if (rows.length < 1)
          throw new Error(`Could not find specialist data for specialsist ${specialistId}`)

        return rows[0]
      },
      catch: () => new EntityNotFoundError({ field: 'specialistId', value: specialistId }),
    })
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

    return rows.length > 0
      ? Result.ok(rows[0])
      : Result.err(new EntityNotFoundError({ field: 'specialistId', value: specialistId }))
  }
}
