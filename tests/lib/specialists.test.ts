import { Database } from 'bun:sqlite'
import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { drizzle } from 'drizzle-orm/bun-sqlite'

const createServerFnMock = (): Record<string, unknown> => ({
  inputValidator() {
    return this
  },
  middleware() {
    return this
  },
  handler(fn: unknown) {
    return fn
  },
})

mock.module('@tanstack/react-start', () => ({
  createServerFn: createServerFnMock,
  createMiddleware: () => ({
    server: (handler: unknown) => handler,
  }),
}))

mock.module('@/lib/functions/auth', () => ({
  ensureSessionMiddleware: {},
}))

const sqlite = new Database(':memory:')
const testDb = drizzle({ client: sqlite })

mock.module('@/db', () => ({
  db: testDb,
}))

const { users } = await import('../../src/db/schemas/auth')
const { specialistsData } = await import('../../src/db/schemas/specialists-data')

const { getSpecialistByQuery, getSpecialists, getSpecialistById } =
  await import('../../src/lib/functions/specialists')

function resetTables() {
  sqlite.run('DROP TABLE IF EXISTS specialists_data')
  sqlite.run('DROP TABLE IF EXISTS users')

  sqlite.run(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      email_verified INTEGER NOT NULL DEFAULT 0,
      image TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      role TEXT,
      banned INTEGER DEFAULT 0,
      ban_reason TEXT,
      ban_expires INTEGER,
      stripe_customer_id TEXT,
      deleted_at INTEGER,
      onboarding_complete INTEGER NOT NULL DEFAULT 0
    )
  `)

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
}

async function seedSpecialist({
  id,
  name,
  email,
  licenseNumber,
}: {
  id: string
  name: string
  email: string
  licenseNumber?: string
}) {
  await testDb.insert(users).values({
    id,
    name,
    email,
    role: 'specialist',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  })

  if (!licenseNumber) return

  await testDb.insert(specialistsData).values({
    id: `data-${id}`,
    specialistId: id,
    licenseNumber,
    consultationDurationMinutes: 30,
    specialty: 'Cardiology',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  })
}

describe('specialists', () => {
  beforeEach(async () => {
    resetTables()
  })

  describe('getSpecialistByQuery', () => {
    test('searches by specialistsData field', async () => {
      await seedSpecialist({
        id: 'spec-1',
        name: 'Dr. Smith',
        email: 'smith@test.com',
        licenseNumber: 'LIC-001',
      })

      const result = await getSpecialistByQuery({
        data: { field: 'licenseNumber', value: 'LIC-001' },
      })

      expect(result).toHaveLength(1)
      expect(result[0]?.name).toBe('Dr. Smith')
      expect(result[0]?.specialistData?.licenseNumber).toBe('LIC-001')
    })

    test('searches by users field', async () => {
      await seedSpecialist({
        id: 'spec-2',
        name: 'Jones',
        email: 'jones@test.com',
        licenseNumber: 'LIC-002',
      })

      const result = await getSpecialistByQuery({
        data: { field: 'name', value: 'Jones' },
      })

      expect(result).toHaveLength(1)
      expect(result[0]?.name).toBe('Jones')
    })

    test('returns empty array when no specialists match', async () => {
      const result = await getSpecialistByQuery({
        data: { field: 'specialistId', value: 'nonexistent' },
      })

      expect(result).toEqual([])
    })

    test('filters out specialists without associated data', async () => {
      await seedSpecialist({
        id: 'spec-1',
        name: 'Dr. Smith',
        email: 'smith@test.com',
        licenseNumber: 'LIC-001',
      })
      await seedSpecialist({
        id: 'spec-2',
        name: 'Dr. Jones',
        email: 'jones@test.com',
      })

      const result = await getSpecialistByQuery({
        data: { field: 'name', value: 'Dr. Smith' },
      })

      expect(result).toHaveLength(1)
      expect(result[0]?.name).toBe('Dr. Smith')
    })
  })

  describe('getSpecialists', () => {
    test('returns all specialists with their data', async () => {
      await seedSpecialist({
        id: 'spec-1',
        name: 'Dr. Smith',
        email: 'smith@test.com',
        licenseNumber: 'LIC-001',
      })
      await seedSpecialist({
        id: 'spec-2',
        name: 'Dr. Jones',
        email: 'jones@test.com',
        licenseNumber: 'LIC-002',
      })

      const result = await getSpecialists()

      expect(result).toHaveLength(2)
      expect(result[0]?.specialistData?.licenseNumber).toBe('LIC-001')
      expect(result[1]?.specialistData?.licenseNumber).toBe('LIC-002')
    })

    test('filters out specialists without specialist data', async () => {
      await seedSpecialist({
        id: 'spec-1',
        name: 'Dr. Smith',
        email: 'smith@test.com',
        licenseNumber: 'LIC-001',
      })
      await seedSpecialist({
        id: 'spec-2',
        name: 'Dr. Jones',
        email: 'jones@test.com',
      })

      const result = await getSpecialists()

      expect(result).toHaveLength(1)
      expect(result[0]?.name).toBe('Dr. Smith')
    })

    test('returns empty array when no specialists exist', async () => {
      const result = await getSpecialists()

      expect(result).toEqual([])
    })
  })

  describe('getSpecialistById', () => {
    test('returns serialized specialist data', async () => {
      await seedSpecialist({
        id: 'spec-1',
        name: 'Dr. Smith',
        email: 'smith@test.com',
        licenseNumber: 'LIC-001',
      })

      const result = await getSpecialistById({
        data: 'spec-1',
      })

      expect(result.status).toBe('ok')
      if (result.status === 'ok') {
        expect(result.value.id).toBe('spec-1')
        expect(result.value.name).toBe('Dr. Smith')
        expect(result.value.specialistData.licenseNumber).toBe('LIC-001')
      }
    })

    test('returns error when specialist user is not found', async () => {
      const result = await getSpecialistById({
        data: 'nonexistent',
      })

      expect(result.status).toBe('error')
    })

    test('returns error when specialist data is not found', async () => {
      await seedSpecialist({
        id: 'spec-1',
        name: 'Dr. Smith',
        email: 'smith@test.com',
      })

      const result = await getSpecialistById({
        data: 'spec-1',
      })

      expect(result.status).toBe('error')
    })
  })
})
