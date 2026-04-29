import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import type * as schema from '../../../src/db/schemas'

import { Database } from 'bun:sqlite'
import { beforeEach, describe, expect, test } from 'bun:test'
import { drizzle } from 'drizzle-orm/bun-sqlite'

import { ClientMedicinesRepository } from '../../../src/db/repository/client-medicines.repository'
import { clientMedicines } from '../../../src/db/schemas'

describe('ClientMedicinesRepository', () => {
  let db: BunSQLiteDatabase<typeof schema>
  let repo: ClientMedicinesRepository

  beforeEach(() => {
    const sqlite = new Database(':memory:')
    db = drizzle({ client: sqlite })

    sqlite.run(`
      CREATE TABLE client_medicines (
        dosage TEXT NOT NULL,
        frequency TEXT NOT NULL,
        start_date INTEGER NOT NULL,
        end_date INTEGER NOT NULL,
        user_id TEXT NOT NULL,
        medicine_id INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (user_id, medicine_id)
      )
    `)

    repo = new ClientMedicinesRepository(db, clientMedicines)
  })

  describe('findByClientId', () => {
    test('should find all medicines for a client', async () => {
      await db.insert(clientMedicines).values([
        {
          userId: 'client1',
          medicineId: 1,
          dosage: '10mg',
          frequency: 'daily',
          startDate: new Date('2026-01-01T00:00:00.000Z'),
          endDate: new Date('2026-02-01T00:00:00.000Z'),
        },
        {
          userId: 'client1',
          medicineId: 2,
          dosage: '20mg',
          frequency: 'daily',
          startDate: new Date('2026-01-01T00:00:00.000Z'),
          endDate: new Date('2026-02-01T00:00:00.000Z'),
        },
        {
          userId: 'client2',
          medicineId: 1,
          dosage: '15mg',
          frequency: 'daily',
          startDate: new Date('2026-01-01T00:00:00.000Z'),
          endDate: new Date('2026-02-01T00:00:00.000Z'),
        },
      ])

      const results = await repo.findByClientId('client1')
      expect(results.length).toBe(2)
      expect(results[0].userId).toBe('client1')
      expect(results[1].userId).toBe('client1')
    })

    test('should return empty array when client has no medicines', async () => {
      const results = await repo.findByClientId('non-existent')
      expect(results.length).toBe(0)
    })
  })

  describe('findByMedicineId', () => {
    test('should find all clients using a medicine', async () => {
      await db.insert(clientMedicines).values([
        {
          userId: 'client1',
          medicineId: 1,
          dosage: '10mg',
          frequency: 'daily',
          startDate: new Date('2026-01-01T00:00:00.000Z'),
          endDate: new Date('2026-02-01T00:00:00.000Z'),
        },
        {
          userId: 'client2',
          medicineId: 1,
          dosage: '20mg',
          frequency: 'daily',
          startDate: new Date('2026-01-01T00:00:00.000Z'),
          endDate: new Date('2026-02-01T00:00:00.000Z'),
        },
        {
          userId: 'client1',
          medicineId: 2,
          dosage: '30mg',
          frequency: 'daily',
          startDate: new Date('2026-01-01T00:00:00.000Z'),
          endDate: new Date('2026-02-01T00:00:00.000Z'),
        },
      ])

      const results = await repo.findByMedicineId(1)
      expect(results.length).toBe(2)
      expect(results[0].medicineId).toBe(1)
      expect(results[1].medicineId).toBe(1)
    })

    test('should return empty array when medicine not found', async () => {
      const results = await repo.findByMedicineId(999)
      expect(results.length).toBe(0)
    })
  })
})
