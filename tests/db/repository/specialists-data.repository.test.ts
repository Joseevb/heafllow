import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'

import { Database } from 'bun:sqlite'
import { beforeEach, describe, expect, test } from 'bun:test'
import { drizzle } from 'drizzle-orm/bun-sqlite'

import type * as schema from '../../../src/db/schemas'

import { SpecialistsDataRepository } from '../../../src/db/repository/specialists-data.repository'
import { specialistsData } from '../../../src/db/schemas'

describe('SpecialistsDataRepository', () => {
  let db: BunSQLiteDatabase<typeof schema>
  let repo: SpecialistsDataRepository

  beforeEach(() => {
    const sqlite = new Database(':memory:')
    db = drizzle({ client: sqlite })

    sqlite.run(`
      CREATE TABLE specialists_data (
        id TEXT PRIMARY KEY,
        license_number TEXT NOT NULL UNIQUE,
        consultation_duration_minutes INTEGER NOT NULL,
        specialist_id TEXT NOT NULL UNIQUE,
        specialty TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `)

    repo = new SpecialistsDataRepository(db, specialistsData)
  })

  describe('findBySpecialistId', () => {
    test('should find specialist data by specialist id', async () => {
      await db.insert(specialistsData).values([
        {
          id: '1',
          licenseNumber: 'LIC-001',
          consultationDurationMinutes: 30,
          specialistId: 'spec1',
          specialty: 'Cardiology',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        },
        {
          id: '2',
          licenseNumber: 'LIC-002',
          consultationDurationMinutes: 45,
          specialistId: 'spec2',
          specialty: 'Dermatology',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      ])

      const result = await repo.findBySpecialistId('spec1')

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.specialistId).toBe('spec1')
        expect(result.value.specialty).toBe('Cardiology')
        expect(result.value.licenseNumber).toBe('LIC-001')
        expect(result.value.consultationDurationMinutes).toBe(30)
      }
    })

    test('should return error when specialist is not found', async () => {
      const result = await repo.findBySpecialistId('non-existent')

      expect(result.isErr()).toBe(true)
    })
  })

  describe('findAllSpecialistIdsByField', () => {
    test('should find specialist ids by specialty field', async () => {
      await db.insert(specialistsData).values([
        {
          id: '1',
          licenseNumber: 'LIC-001',
          consultationDurationMinutes: 30,
          specialistId: 'spec1',
          specialty: 'Cardiology',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        },
        {
          id: '2',
          licenseNumber: 'LIC-002',
          consultationDurationMinutes: 45,
          specialistId: 'spec2',
          specialty: 'Cardiology',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        },
        {
          id: '3',
          licenseNumber: 'LIC-003',
          consultationDurationMinutes: 60,
          specialistId: 'spec3',
          specialty: 'Dermatology',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      ])

      const result = await repo.findAllSpecialistIdsByField('specialty', 'Cardiology')

      expect(result).toHaveLength(2)
      expect(result.map((r) => r.id).sort()).toEqual(['spec1', 'spec2'])
    })

    test('should return empty array when no records match', async () => {
      const result = await repo.findAllSpecialistIdsByField('specialty', 'Neurology')

      expect(result).toHaveLength(0)
    })

    test('should find specialist ids by license number field', async () => {
      await db.insert(specialistsData).values([
        {
          id: '1',
          licenseNumber: 'LIC-001',
          consultationDurationMinutes: 30,
          specialistId: 'spec1',
          specialty: 'Cardiology',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      ])

      const result = await repo.findAllSpecialistIdsByField('licenseNumber', 'LIC-001')

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('spec1')
    })
  })

  describe('updateBySpecialistId', () => {
    test('should update specialist data fields', async () => {
      await db.insert(specialistsData).values([
        {
          id: '1',
          licenseNumber: 'LIC-001',
          consultationDurationMinutes: 30,
          specialistId: 'spec1',
          specialty: 'Cardiology',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      ])

      const result = await repo.updateBySpecialistId('spec1', {
        consultationDurationMinutes: 60,
        specialty: 'Cardiology',
      })

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.specialistId).toBe('spec1')
        expect(result.value.consultationDurationMinutes).toBe(60)
        expect(result.value.specialty).toBe('Cardiology')
        expect(result.value.licenseNumber).toBe('LIC-001')
      }
    })

    test('should return error when specialist does not exist', async () => {
      const result = await repo.updateBySpecialistId('non-existent', {
        consultationDurationMinutes: 60,
      })

      expect(result.isErr()).toBe(true)
    })

    test('should update updatedAt timestamp', async () => {
      const baseTime = new Date('2026-01-01T00:00:00.000Z')

      await db.insert(specialistsData).values([
        {
          id: '1',
          licenseNumber: 'LIC-001',
          consultationDurationMinutes: 30,
          specialistId: 'spec1',
          specialty: 'Cardiology',
          createdAt: baseTime,
          updatedAt: baseTime,
        },
      ])

      const result = await repo.updateBySpecialistId('spec1', {
        consultationDurationMinutes: 45,
      })

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.consultationDurationMinutes).toBe(45)
        expect(result.value.updatedAt.getTime()).toBeGreaterThan(baseTime.getTime())
      }
    })

    test('should update multiple fields simultaneously', async () => {
      await db.insert(specialistsData).values([
        {
          id: '1',
          licenseNumber: 'LIC-001',
          consultationDurationMinutes: 30,
          specialistId: 'spec1',
          specialty: 'Cardiology',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      ])

      const result = await repo.updateBySpecialistId('spec1', {
        consultationDurationMinutes: 50,
        specialty: 'Neurology',
      })

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.consultationDurationMinutes).toBe(50)
        expect(result.value.specialty).toBe('Neurology')
      }
    })
  })
})
