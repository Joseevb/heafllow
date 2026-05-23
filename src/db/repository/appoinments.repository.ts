import { and, asc, desc, eq, gt, gte, inArray, lte } from 'drizzle-orm'

import type { appointments } from '@/db/schemas'

import { BaseRepository } from '@/db/repository/base-repository'

export class AppointmentsRepository extends BaseRepository<typeof appointments> {
  constructor(db: BaseRepository<typeof appointments>['db'], table: typeof appointments) {
    super(db, table)
  }

  async findAllByClientId(clientId: string) {
    return await this.db.select().from(this.table).where(eq(this.columns.clientId, clientId))
  }

  async findUpcomingByClientId(clientId: string, now: Date) {
    return await this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.columns.clientId, clientId),
          gt(this.columns.appointmentDate, now),
          inArray(this.columns.status, ['pending', 'confirmed']),
        ),
      )
      .orderBy(asc(this.columns.appointmentDate))
  }

  async findHistoryByClientId(clientId: string, now: Date) {
    return await this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.columns.clientId, clientId),
          inArray(this.columns.status, ['completed', 'cancelled', 'no-show']),
          lte(this.columns.appointmentDate, now),
        ),
      )
      .orderBy(desc(this.columns.appointmentDate))
  }

  async findCompletedHistoryByClientId(clientId: string) {
    return await this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.columns.clientId, clientId),
          inArray(this.columns.status, ['completed', 'cancelled', 'no-show']),
        ),
      )
      .orderBy(desc(this.columns.appointmentDate))
  }

  async findAllBySpecialistId(specialistId: string) {
    return await this.db
      .select()
      .from(this.table)
      .where(eq(this.columns.specialistId, specialistId))
      .orderBy(asc(this.columns.appointmentDate))
  }

  async findByIdAndSpecialistId(id: string, specialistId: string) {
    return await this.db
      .select()
      .from(this.table)
      .where(and(eq(this.columns.id, id), eq(this.columns.specialistId, specialistId)))
      .limit(1)
  }

  async findUpcomingBySpecialistId(specialistId: string, now: Date) {
    return await this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.columns.specialistId, specialistId),
          gte(this.columns.appointmentDate, now),
          inArray(this.columns.status, ['pending', 'confirmed']),
        ),
      )
      .orderBy(asc(this.columns.appointmentDate))
  }

  async findRecentCompletedBySpecialistId(specialistId: string, limit = 10) {
    return await this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.columns.specialistId, specialistId),
          inArray(this.columns.status, ['completed', 'cancelled', 'no-show']),
        ),
      )
      .orderBy(desc(this.columns.appointmentDate))
      .limit(limit)
  }

  async findActiveByIdAndSpecialistId(id: string, specialistId: string) {
    return await this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.columns.id, id),
          eq(this.columns.specialistId, specialistId),
          inArray(this.columns.status, ['pending', 'confirmed']),
        ),
      )
      .limit(1)
  }

  async findScheduledBySpecialistIdBetweenDates(
    specialistId: string,
    startDate: Date,
    endDate: Date,
  ) {
    return await this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.columns.specialistId, specialistId),
          inArray(this.columns.status, ['pending', 'confirmed']),
          gte(this.columns.appointmentDate, startDate),
          lte(this.columns.appointmentDate, endDate),
        ),
      )
      .orderBy(asc(this.columns.appointmentDate))
  }

  async findSchedulableByIdAndClientId(id: string, clientId: string) {
    return await this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.columns.id, id),
          eq(this.columns.clientId, clientId),
          inArray(this.columns.status, ['pending', 'confirmed']),
        ),
      )
  }

  async completeById(id: string, notes: string) {
    return await this.update(id, {
      status: 'completed',
      notes,
    })
  }

  async createFollowUp(input: {
    clientId: string
    specialistId: string
    appointmentDate: Date
    durationMinutes: number
    notes?: string
  }) {
    return await this.save({
      clientId: input.clientId,
      specialistId: input.specialistId,
      appointmentDate: input.appointmentDate,
      durationMinutes: input.durationMinutes,
      status: 'pending',
      notes: input.notes,
    })
  }
}
