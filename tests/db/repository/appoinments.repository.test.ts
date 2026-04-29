import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'

import { Database } from 'bun:sqlite'
import { beforeEach, describe, expect, test } from 'bun:test'
import { drizzle } from 'drizzle-orm/bun-sqlite'

import type * as schema from '../../../src/db/schemas'

import { AppointmentsRepository } from '../../../src/db/repository/appoinments.repository'
import { appointments } from '../../../src/db/schemas'

describe('AppointmentsRepository', () => {
  let db: BunSQLiteDatabase<typeof schema>
  let repo: AppointmentsRepository

  beforeEach(() => {
    const sqlite = new Database(':memory:')
    db = drizzle({ client: sqlite })

    sqlite.run(`
      CREATE TABLE appointments (
        id TEXT PRIMARY KEY,
        duration_minutes INTEGER NOT NULL,
        notes TEXT,
        cancellation_reason TEXT,
        client_id TEXT NOT NULL,
        specialist_id TEXT NOT NULL,
        status TEXT NOT NULL,
        appointment_date INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        CONSTRAINT client_not_specialist CHECK (client_id != specialist_id)
      )
    `)

    repo = new AppointmentsRepository(db, appointments)
  })

  describe('findAllByClientId', () => {
    test('should find all appointments for a client', async () => {
      await db.insert(appointments).values([
        {
          id: '1',
          clientId: 'client1',
          specialistId: 'spec1',
          status: 'confirmed',
          durationMinutes: 30,
          appointmentDate: new Date('2026-01-01T09:00:00.000Z'),
        },
        {
          id: '2',
          clientId: 'client1',
          specialistId: 'spec2',
          status: 'completed',
          durationMinutes: 45,
          appointmentDate: new Date('2026-01-01T10:00:00.000Z'),
        },
        {
          id: '3',
          clientId: 'client2',
          specialistId: 'spec1',
          status: 'confirmed',
          durationMinutes: 30,
          appointmentDate: new Date('2026-01-01T11:00:00.000Z'),
        },
      ])

      const results = await repo.findAllByClientId('client1')
      expect(results.length).toBe(2)
      expect(results[0].clientId).toBe('client1')
      expect(results[1].clientId).toBe('client1')
    })

    test('should return empty array when client has no appointments', async () => {
      const results = await repo.findAllByClientId('non-existent')
      expect(results.length).toBe(0)
    })
  })

  describe('findAllBySpecialistId', () => {
    test('should find all appointments for a specialist', async () => {
      await db.insert(appointments).values([
        {
          id: '1',
          clientId: 'client1',
          specialistId: 'spec1',
          status: 'confirmed',
          durationMinutes: 30,
          appointmentDate: new Date('2026-01-01T09:00:00.000Z'),
        },
        {
          id: '2',
          clientId: 'client2',
          specialistId: 'spec1',
          status: 'completed',
          durationMinutes: 45,
          appointmentDate: new Date('2026-01-01T10:00:00.000Z'),
        },
        {
          id: '3',
          clientId: 'client1',
          specialistId: 'spec2',
          status: 'confirmed',
          durationMinutes: 30,
          appointmentDate: new Date('2026-01-01T11:00:00.000Z'),
        },
      ])

      const results = await repo.findAllBySpecialistId('spec1')
      expect(results.length).toBe(2)
      expect(results[0].specialistId).toBe('spec1')
      expect(results[1].specialistId).toBe('spec1')
    })

    test('should return empty array when specialist has no appointments', async () => {
      const results = await repo.findAllBySpecialistId('non-existent')
      expect(results.length).toBe(0)
    })
  })
})
