import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import type * as schema from '../../../src/db/schemas'

import { Database } from 'bun:sqlite'
import { beforeEach, describe, expect, test } from 'bun:test'
import { drizzle } from 'drizzle-orm/bun-sqlite'

import { HealthMetricRepository } from '../../../src/db/repository/health-metric.repository'
import { healthMetrics } from '../../../src/db/schemas'

describe('HealthMetricRepository', () => {
  let db: BunSQLiteDatabase<typeof schema>
  let repo: HealthMetricRepository

  beforeEach(() => {
    const sqlite = new Database(':memory:')
    db = drizzle({ client: sqlite })

    sqlite.run(`
      CREATE TABLE "health-metrics" (
        id TEXT PRIMARY KEY,
        metric_type TEXT NOT NULL,
        value REAL NOT NULL,
        unit TEXT NOT NULL,
        notes TEXT,
        source TEXT,
        user_id TEXT NOT NULL,
        recorded_by_specialist_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `)

    repo = new HealthMetricRepository(db, healthMetrics)
  })

  describe('findAllByClientId', () => {
    test('should find all metrics for a client', async () => {
      await db.insert(healthMetrics).values([
        {
          id: '1',
          clientId: 'client1',
          metricType: 'BLOOD_PRESSURE_SYSTOLIC',
          value: 120,
          unit: 'mmHg',
          recordedBySpecialistId: 'spec1',
        },
        {
          id: '2',
          clientId: 'client1',
          metricType: 'HEART_RATE',
          value: 72,
          unit: 'bpm',
          recordedBySpecialistId: 'spec1',
        },
        {
          id: '3',
          clientId: 'client2',
          metricType: 'BLOOD_PRESSURE_SYSTOLIC',
          value: 130,
          unit: 'mmHg',
          recordedBySpecialistId: 'spec2',
        },
      ])

      const results = await repo.findAllByClientId('client1')
      expect(results.length).toBe(2)
      expect(results[0].clientId).toBe('client1')
      expect(results[1].clientId).toBe('client1')
    })

    test('should return empty array when client has no metrics', async () => {
      const results = await repo.findAllByClientId('non-existent')
      expect(results.length).toBe(0)
    })
  })

  describe('inherited methods', () => {
    test('should use inherited findById method', async () => {
      await db.insert(healthMetrics).values({
        id: 'metric1',
        clientId: 'client1',
        metricType: 'BLOOD_PRESSURE_SYSTOLIC',
        value: 120,
        unit: 'mmHg',
        recordedBySpecialistId: 'spec1',
      })

      const result = await repo.findById('metric1')
      expect(result.status).toBe('ok')
      if (result.status === 'ok') {
        expect(result.value.clientId).toBe('client1')
        expect(result.value.metricType).toBe('BLOOD_PRESSURE_SYSTOLIC')
      }
    })

    test('should use inherited save method', async () => {
      const result = await repo.save({
        id: 'metric2',
        clientId: 'client1',
        metricType: 'HEART_RATE',
        recordedBySpecialistId: 'spec1',
        value: 75,
        unit: 'bpm',
      })

      expect(result.status).toBe('ok')
      if (result.status === 'ok') {
        expect(result.value.id).toBe('metric2')
      }
    })
  })
})
