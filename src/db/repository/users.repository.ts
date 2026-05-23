import type { getTableColumns } from 'drizzle-orm'

import { and, eq, inArray } from 'drizzle-orm'

import type { users } from '@/db/schemas'

import { BaseRepository } from '@/db/repository/base-repository'

export class UsersRepository extends BaseRepository<typeof users> {
  async findByIdOrUndefined(userId: string) {
    const rows = await this.db.select().from(this.table).where(eq(this.columns.id, userId)).limit(1)

    return rows.at(0)
  }

  async findAllSpecialistsByField(
    field: keyof ReturnType<typeof getTableColumns<typeof users>>,
    value: string,
  ) {
    return await this.db
      .select({ id: this.columns.id })
      .from(this.table)
      .where(and(eq(this.columns.role, 'specialist'), eq(this.columns[field] as any, value)))
  }

  async findSpecialistById(specialistId: string): Promise<typeof users.$inferSelect | undefined> {
    const rows = await this.db
      .select()
      .from(this.table)
      .where(and(eq(this.columns.id, specialistId), eq(this.columns.role, 'specialist')))
      .limit(1)

    return rows.at(0)
  }

  async findAllSpecialists() {
    return await this.db.select().from(this.table).where(eq(this.columns.role, 'specialist'))
  }

  async findAllSpecialistsByIds(specialistIds: Array<string>) {
    if (specialistIds.length === 0) return []

    return await this.db
      .select()
      .from(this.table)
      .where(and(eq(this.columns.role, 'specialist'), inArray(this.columns.id, specialistIds)))
  }

  async findAllActiveSpecialists() {
    return await this.db
      .select()
      .from(this.table)
      .where(and(eq(this.columns.role, 'specialist'), eq(this.columns.banned, false)))
  }

  async findActiveSpecialistById(
    specialistId: string,
  ): Promise<typeof users.$inferSelect | undefined> {
    const rows = await this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.columns.id, specialistId),
          eq(this.columns.role, 'specialist'),
          eq(this.columns.banned, false),
        ),
      )
      .limit(1)

    return rows.at(0)
  }
}
