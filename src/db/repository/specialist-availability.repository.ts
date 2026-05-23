import { and, asc, eq, inArray } from 'drizzle-orm'

import type { specialistAvailability } from '@/db/schemas'
import type { DayName } from '@/types/date'

import { BaseRepository } from '@/db/repository/base-repository'

export class SpecialistAvailabilityRepository extends BaseRepository<
  typeof specialistAvailability
> {
  async findAllBySpecialistId(specialistId: string) {
    return await this.db
      .select()
      .from(this.table)
      .where(eq(this.columns.specialistId, specialistId))
      .orderBy(asc(this.columns.dayOfWeek), asc(this.columns.startTime))
  }

  async findAvailableBySpecialistIdBetweenDates(
    specialistId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const daysOfWeek = buildDayRange(startDate, endDate)

    return await this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.columns.specialistId, specialistId),
          eq(this.columns.isAvailable, true),
          inArray(this.columns.dayOfWeek, daysOfWeek),
        ),
      )
      .orderBy(asc(this.columns.dayOfWeek), asc(this.columns.startTime))
  }

  async findByIdAndSpecialistId(id: string, specialistId: string) {
    return await this.db
      .select()
      .from(this.table)
      .where(and(eq(this.columns.id, id), eq(this.columns.specialistId, specialistId)))
      .limit(1)
  }

  async deleteByIdAndSpecialistId(id: string, specialistId: string) {
    return await this.db
      .delete(this.table)
      .where(and(eq(this.columns.id, id), eq(this.columns.specialistId, specialistId)))
      .returning({ id: this.columns.id })
  }

  async deleteBySpecialistIdAndDayOfWeek(specialistId: string, dayOfWeek: DayName) {
    return await this.db
      .delete(this.table)
      .where(
        and(eq(this.columns.specialistId, specialistId), eq(this.columns.dayOfWeek, dayOfWeek)),
      )
      .returning({ id: this.columns.id })
  }
}

function buildDayRange(startDate: Date, endDate: Date): Array<DayName> {
  const days = new Set<DayName>()
  const current = new Date(startDate)

  while (current <= endDate) {
    days.add(current.toLocaleDateString('en-US', { weekday: 'long' }) as DayName)
    current.setDate(current.getDate() + 1)
  }

  return Array.from(days)
}
