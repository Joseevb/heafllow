import { eq } from 'drizzle-orm'
import type { specialistAvailability } from '@/db/schemas'
import { BaseRepository } from '@/db/repository/base-repository'

export class SpecialistAvailabilityRepository extends BaseRepository<typeof specialistAvailability> {
  constructor(
    db: BaseRepository<typeof specialistAvailability>['db'],
    table: typeof specialistAvailability,
  ) {
    super(db, table)
  }

  async findBySpecialistId(specialistId: string) {
    return await this.db
      .select()
      .from(this.table)
      .where(eq(this.columns.specialistId, specialistId))
  }
}
