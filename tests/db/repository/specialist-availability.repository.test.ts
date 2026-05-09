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
        CONSTRAINT uk_specialist_day_time UNIQUE (day_of_week, start_time, end_time)
      )
    `)

    repo = new SpecialistAvailabilityRepository(db, specialistAvailability)
  })

  describe('findBySpecialistId', () => {
    test('should find availability for a specialist', async () => {
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

      const results = await repo.findBySpecialistId('spec1')
      expect(results.length).toBe(2)
      expect(results[0].specialistId).toBe('spec1')
      expect(results[1].specialistId).toBe('spec1')
    })

    test('should return empty array when specialist has no availability', async () => {
      const results = await repo.findBySpecialistId('non-existent')
      expect(results.length).toBe(0)
    })
  })
})
