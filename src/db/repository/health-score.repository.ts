import { eq } from 'drizzle-orm'

import type { healthScore } from '@/db/schemas'

import { BaseRepository } from '@/db/repository/base-repository'

export class HealthScoreRepository extends BaseRepository<typeof healthScore> {
  async findByClientId(clientId: string) {
    const res = await this.db.select().from(this.table).where(eq(this.columns.userId, clientId))
    return res[0]
  }
}
