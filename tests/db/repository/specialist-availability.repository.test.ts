import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'

import { Database } from 'bun:sqlite'
import { beforeEach, describe, expect, test } from 'bun:test'
import { drizzle } from 'drizzle-orm/bun-sqlite'

import type * as schema from '../../../src/db/schemas'

import { SpecialistAvailabilityRepository } from '../../../src/db/repository/specialist-availability.repository'
import { specialistAvailability } from '../../../src/db/schemas'

describe('SpecialistAvailabilityRepository', () => {
  let db: BunSQLiteDatabase<typeof schema>
  let repo: SpecialistAvailabilityRepository

  beforeEach(() => {
    const sqlite = new Database(':memory:')
    db = drizzle({ client: sqlite })

    sqlite.run(`
      CREATE TABLE specialist_availability (
        id TEXT PRIMARY KEY,
        specialist_id TEXT NOT NULL,
        day_of_week TEXT NOT NULL,
        start_time INTEGER NOT NULL,
        end_time INTEGER NOT NULL,
        is_available INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        CONSTRAINT uk_specialist_day_time UNIQUE (
          specialist_id,
          day_of_week,
          start_time,
          end_time
        )
      )
    `)

    repo = new SpecialistAvailabilityRepository(db, specialistAvailability)
  })

  describe('findAllBySpecialistId', () => {
    test('should find availability for a specialist ordered by day and time', async () => {
      await db.insert(specialistAvailability).values([
        {
          id: '1',
          specialistId: 'spec1',
          dayOfWeek: 'Monday',
          startTime: new Date('2026-01-05T09:00:00.000Z'),
          endTime: new Date('2026-01-05T17:00:00.000Z'),
          isAvailable: true,
        },
        {
          id: '2',
          specialistId: 'spec1',
          dayOfWeek: 'Tuesday',
          startTime: new Date('2026-01-06T10:00:00.000Z'),
          endTime: new Date('2026-01-06T18:00:00.000Z'),
          isAvailable: true,
        },
        {
          id: '3',
          specialistId: 'spec2',
          dayOfWeek: 'Wednesday',
          startTime: new Date('2026-01-07T08:00:00.000Z'),
          endTime: new Date('2026-01-07T16:00:00.000Z'),
          isAvailable: true,
        },
      ])

      const results = await repo.findAllBySpecialistId('spec1')
      expect(results.length).toBe(2)
      expect(results[0].dayOfWeek).toBe('Monday')
      expect(results[1].dayOfWeek).toBe('Tuesday')
    })

    test('should return empty array when specialist has no availability', async () => {
      const results = await repo.findAllBySpecialistId('non-existent')
      expect(results.length).toBe(0)
    })
  })

  describe('findAvailableBySpecialistIdBetweenDates', () => {
    test('should find available slots for matching days in date range', async () => {
      await db.insert(specialistAvailability).values([
        {
          id: 'find1',
          specialistId: 'spec1',
          dayOfWeek: 'Monday',
          startTime: new Date('2026-01-05T09:00:00.000Z'),
          endTime: new Date('2026-01-05T17:00:00.000Z'),
          isAvailable: true,
        },
        {
          id: 'find2',
          specialistId: 'spec1',
          dayOfWeek: 'Tuesday',
          startTime: new Date('2026-01-06T10:00:00.000Z'),
          endTime: new Date('2026-01-06T18:00:00.000Z'),
          isAvailable: true,
        },
        {
          id: 'find3',
          specialistId: 'spec1',
          dayOfWeek: 'Wednesday',
          startTime: new Date('2026-01-07T08:00:00.000Z'),
          endTime: new Date('2026-01-07T16:00:00.000Z'),
          isAvailable: true,
        },
        {
          id: 'find4',
          specialistId: 'spec2',
          dayOfWeek: 'Monday',
          startTime: new Date('2026-01-05T08:00:00.000Z'),
          endTime: new Date('2026-01-05T12:00:00.000Z'),
          isAvailable: true,
        },
      ])

      const results = await repo.findAvailableBySpecialistIdBetweenDates(
        'spec1',
        new Date('2026-01-05T00:00:00.000Z'),
        new Date('2026-01-07T23:59:59.999Z'),
      )

      expect(results.length).toBe(3)
      expect(results[0].dayOfWeek).toBe('Monday')
      expect(results[1].dayOfWeek).toBe('Tuesday')
      expect(results[2].dayOfWeek).toBe('Wednesday')
    })

    test('should exclude unavailable slots', async () => {
      await db.insert(specialistAvailability).values([
        {
          id: 'unavail1',
          specialistId: 'spec1',
          dayOfWeek: 'Monday',
          startTime: new Date('2026-01-05T09:00:00.000Z'),
          endTime: new Date('2026-01-05T17:00:00.000Z'),
          isAvailable: true,
        },
        {
          id: 'unavail2',
          specialistId: 'spec1',
          dayOfWeek: 'Monday',
          startTime: new Date('2026-01-05T20:00:00.000Z'),
          endTime: new Date('2026-01-05T22:00:00.000Z'),
          isAvailable: false,
        },
      ])

      const results = await repo.findAvailableBySpecialistIdBetweenDates(
        'spec1',
        new Date('2026-01-05T00:00:00.000Z'),
        new Date('2026-01-05T23:59:59.999Z'),
      )

      expect(results.length).toBe(1)
      expect(results[0].id).toBe('unavail1')
    })

    test('should return empty when date range covers no matching days', async () => {
      await db.insert(specialistAvailability).values([
        {
          id: 'nomatch1',
          specialistId: 'spec1',
          dayOfWeek: 'Monday',
          startTime: new Date('2026-01-05T09:00:00.000Z'),
          endTime: new Date('2026-01-05T17:00:00.000Z'),
          isAvailable: true,
        },
      ])

      const results = await repo.findAvailableBySpecialistIdBetweenDates(
        'spec1',
        new Date('2026-01-08T00:00:00.000Z'),
        new Date('2026-01-11T23:59:59.999Z'),
      )

      expect(results.length).toBe(0)
    })

    test('should return empty when no availability records exist', async () => {
      const results = await repo.findAvailableBySpecialistIdBetweenDates(
        'spec1',
        new Date('2026-01-05T00:00:00.000Z'),
        new Date('2026-01-07T23:59:59.999Z'),
      )

      expect(results.length).toBe(0)
    })
  })

  describe('findByIdAndSpecialistId', () => {
    test('should find a record by id and specialist id', async () => {
      await db.insert(specialistAvailability).values([
        {
          id: 'fbi1',
          specialistId: 'spec1',
          dayOfWeek: 'Monday',
          startTime: new Date('2026-01-05T09:00:00.000Z'),
          endTime: new Date('2026-01-05T17:00:00.000Z'),
          isAvailable: true,
        },
        {
          id: 'fbi2',
          specialistId: 'spec1',
          dayOfWeek: 'Tuesday',
          startTime: new Date('2026-01-06T10:00:00.000Z'),
          endTime: new Date('2026-01-06T18:00:00.000Z'),
          isAvailable: true,
        },
      ])

      const result = await repo.findByIdAndSpecialistId('fbi1', 'spec1')
      expect(result.length).toBe(1)
      expect(result[0].id).toBe('fbi1')
      expect(result[0].dayOfWeek).toBe('Monday')
    })

    test('should return empty array when id does not match', async () => {
      await db.insert(specialistAvailability).values([
        {
          id: 'fbi3',
          specialistId: 'spec1',
          dayOfWeek: 'Monday',
          startTime: new Date('2026-01-05T09:00:00.000Z'),
          endTime: new Date('2026-01-05T17:00:00.000Z'),
          isAvailable: true,
        },
      ])

      const result = await repo.findByIdAndSpecialistId('non-existent', 'spec1')
      expect(result.length).toBe(0)
    })

    test('should return empty array when specialist id does not match', async () => {
      await db.insert(specialistAvailability).values([
        {
          id: 'fbi4',
          specialistId: 'spec1',
          dayOfWeek: 'Monday',
          startTime: new Date('2026-01-05T09:00:00.000Z'),
          endTime: new Date('2026-01-05T17:00:00.000Z'),
          isAvailable: true,
        },
      ])

      const result = await repo.findByIdAndSpecialistId('fbi4', 'wrong-spec')
      expect(result.length).toBe(0)
    })
  })

  describe('deleteByIdAndSpecialistId', () => {
    test('should delete a record by id and specialist id', async () => {
      await db.insert(specialistAvailability).values([
        {
          id: 'del1',
          specialistId: 'spec1',
          dayOfWeek: 'Monday',
          startTime: new Date('2026-01-05T09:00:00.000Z'),
          endTime: new Date('2026-01-05T17:00:00.000Z'),
          isAvailable: true,
        },
        {
          id: 'del2',
          specialistId: 'spec1',
          dayOfWeek: 'Tuesday',
          startTime: new Date('2026-01-06T10:00:00.000Z'),
          endTime: new Date('2026-01-06T18:00:00.000Z'),
          isAvailable: true,
        },
      ])

      const result = await repo.deleteByIdAndSpecialistId('del1', 'spec1')
      expect(result.length).toBe(1)
      expect(result[0].id).toBe('del1')

      const remaining = await repo.findAllBySpecialistId('spec1')
      expect(remaining.length).toBe(1)
      expect(remaining[0].id).toBe('del2')
    })

    test('should return empty array when record does not exist', async () => {
      const result = await repo.deleteByIdAndSpecialistId('non-existent', 'spec1')
      expect(result.length).toBe(0)
    })

    test('should return empty array when specialist id does not match', async () => {
      await db.insert(specialistAvailability).values([
        {
          id: 'del3',
          specialistId: 'spec1',
          dayOfWeek: 'Monday',
          startTime: new Date('2026-01-05T09:00:00.000Z'),
          endTime: new Date('2026-01-05T17:00:00.000Z'),
          isAvailable: true,
        },
      ])

      const result = await repo.deleteByIdAndSpecialistId('del3', 'wrong-spec')
      expect(result.length).toBe(0)

      const remaining = await repo.findAllBySpecialistId('spec1')
      expect(remaining.length).toBe(1)
    })
  })

  describe('deleteBySpecialistIdAndDayOfWeek', () => {
    test('should delete all records for a specialist on a given day', async () => {
      await db.insert(specialistAvailability).values([
        {
          id: 'delday1',
          specialistId: 'spec1',
          dayOfWeek: 'Monday',
          startTime: new Date('2026-01-05T09:00:00.000Z'),
          endTime: new Date('2026-01-05T12:00:00.000Z'),
          isAvailable: true,
        },
        {
          id: 'delday2',
          specialistId: 'spec1',
          dayOfWeek: 'Monday',
          startTime: new Date('2026-01-05T14:00:00.000Z'),
          endTime: new Date('2026-01-05T17:00:00.000Z'),
          isAvailable: true,
        },
        {
          id: 'delday3',
          specialistId: 'spec1',
          dayOfWeek: 'Tuesday',
          startTime: new Date('2026-01-06T10:00:00.000Z'),
          endTime: new Date('2026-01-06T18:00:00.000Z'),
          isAvailable: true,
        },
        {
          id: 'delday4',
          specialistId: 'spec2',
          dayOfWeek: 'Monday',
          startTime: new Date('2026-01-05T08:00:00.000Z'),
          endTime: new Date('2026-01-05T12:00:00.000Z'),
          isAvailable: true,
        },
      ])

      const result = await repo.deleteBySpecialistIdAndDayOfWeek('spec1', 'Monday')
      expect(result.length).toBe(2)
      expect(result.map((r) => r.id).sort()).toEqual(['delday1', 'delday2'])

      const remaining = await repo.findAllBySpecialistId('spec1')
      expect(remaining.length).toBe(1)
      expect(remaining[0].id).toBe('delday3')
    })

    test('should return empty array when no records match', async () => {
      const result = await repo.deleteBySpecialistIdAndDayOfWeek('spec1', 'Monday')
      expect(result.length).toBe(0)
    })
  })
})
