import { eq } from 'drizzle-orm'

import type { healthMetrics } from '@/db/schemas'

import { BaseRepository } from '@/db/repository/base-repository'

export class HealthMetricRepository extends BaseRepository<typeof healthMetrics> {
  async findAllByClientId(clientId: string) {
    return await this.db.select().from(this.table).where(eq(this.table.clientId, clientId))
  }
}
