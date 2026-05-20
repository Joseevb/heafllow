import { eq } from 'drizzle-orm'

import type { clients } from '@/db/schemas'

import { BaseRepository } from '@/db/repository/base-repository'

export class ClientsRepository extends BaseRepository<typeof clients> {
  async findByClientId(clientId: string) {
    const res = await this.db.select().from(this.table).where(eq(this.columns.clientId, clientId))

    return res.length > 0 ? res[0] : undefined
  }
}
