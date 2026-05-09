import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'

import { Database } from 'bun:sqlite'
import { beforeEach, describe, expect, test } from 'bun:test'
import { drizzle } from 'drizzle-orm/bun-sqlite'

import type * as schema from '../../../src/db/schemas'

import { HealthScoreRepository } from '../../../src/db/repository/health-score.repository'
import { healthScore } from '../../../src/db/schemas'

describe('HealthScoreRepository', () => {
  let db: BunSQLiteDatabase<typeof schema>
  let repo: HealthScoreRepository

  beforeEach(() => {
    const sqlite = new Database(':memory:')
    db = drizzle({ client: sqlite })

    sqlite.run(`
      CREATE TABLE health_score (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        overall_score INTEGER NOT NULL,
        cardiovascular_score INTEGER NOT NULL,
        metabolic_score INTEGER NOT NULL,
        lifestyle_score INTEGER NOT NULL,
        vital_score INTEGER NOT NULL,
        data_points_count INTEGER NOT NULL,
        period_days INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `)

    repo = new HealthScoreRepository(db, healthScore)
  })

  describe('findByClientId', () => {
    test('should find health score for a client', async () => {
      await db.insert(healthScore).values([
        {
          id: '1',
          userId: 'client1',
          overallScore: 85,
          cardiovascularScore: 80,
          metabolicScore: 81,
          lifestyleScore: 82,
          vitalScore: 83,
          dataPointsCount: 10,
        },
        {
          id: '2',
          userId: 'client2',
          overallScore: 92,
          cardiovascularScore: 90,
          metabolicScore: 91,
          lifestyleScore: 93,
          vitalScore: 94,
          dataPointsCount: 12,
        },
      ])

      const result = await repo.findByClientId('client1')
      expect(result).toBeDefined()
      if (result) {
        expect(result.userId).toBe('client1')
        expect(result.overallScore).toBe(85)
      }
    })

    test('should return undefined when client not found', async () => {
      const result = await repo.findByClientId('non-existent')
      expect(result).toBeUndefined()
    })

    test('should return the first matching record', async () => {
      await db.insert(healthScore).values([
        {
          id: '1',
          userId: 'client1',
          overallScore: 85,
          cardiovascularScore: 80,
          metabolicScore: 81,
          lifestyleScore: 82,
          vitalScore: 83,
          dataPointsCount: 10,
        },
        {
          id: '2',
          userId: 'client1',
          overallScore: 90,
          cardiovascularScore: 84,
          metabolicScore: 85,
          lifestyleScore: 86,
          vitalScore: 87,
          dataPointsCount: 11,
        },
      ])

      const result = await repo.findByClientId('client1')
      expect(result).toBeDefined()
      if (result) {
        expect(result.id).toBe('1')
        expect(result.userId).toBe('client1')
      }
    })
  })
})
