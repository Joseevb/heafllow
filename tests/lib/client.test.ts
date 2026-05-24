import { beforeEach, describe, expect, mock, test } from 'bun:test'

const createServerFnMock = (opts?: unknown): Record<string, unknown> => ({
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

type DbRow = Record<string, unknown>

const selectResults: Array<Array<DbRow>> = []
const insertResults: Array<Array<DbRow>> = []
let insertShouldReject = false
const insertError = new Error('DB error')

function selectBuilder() {
  let cached: Array<DbRow> | null = null
  const obj = {
    from: () => obj,
    where: () => obj,
    orderBy: () => obj,
    limit: () => obj,
    then: (resolve: (value: Array<DbRow>) => unknown) => {
      if (cached === null) cached = selectResults.shift() ?? []
      return Promise.resolve(cached).then(resolve)
    },
  }
  return obj
}

function insertBuilder() {
  let cached: Array<DbRow> | null = null
  const obj = {
    values: () => obj,
    returning: () => {
      if (insertShouldReject) {
        insertShouldReject = false
        return Promise.reject(insertError)
      }
      if (cached === null) cached = insertResults.shift() ?? []
      return Promise.resolve(cached)
    },
  }
  return obj
}

const mockClientData = {
  id: '1',
  clientId: 'user-123',
  firstName: 'John',
  lastName: 'Doe',
  birthDate: new Date('1990-01-01'),
  phoneNumber: '+1234567890',
  primaryCareSpecialist: 'spec-1',
  createdAt: new Date(),
  updatedAt: new Date(),
}

mock.module('@tanstack/react-start', () => ({
  createServerFn: createServerFnMock,
  createMiddleware: () => ({
    server: (handler: unknown) => handler,
  }),
}))

mock.module('@/db', () => ({
  db: {
    select: selectBuilder,
    insert: insertBuilder,
  },
}))

const { saveClientData, findByClientId } = await import('../../src/lib/functions/client')

describe('client', () => {
  beforeEach(() => {
    selectResults.length = 0
    insertResults.length = 0
    insertShouldReject = false
  })

  describe('saveClientData', () => {
    const input = {
      clientId: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      birthDate: new Date('1990-01-01'),
      phoneNumber: '+1234567890',
      primaryCareSpecialist: 'spec-1',
    }

    test('saves client data and returns serialized result', async () => {
      insertResults.push([mockClientData])

      const result = await saveClientData({ data: input })

      expect(result.status).toBe('ok')
      if (result.status === 'ok') {
        expect(result.value).toMatchObject({ clientId: 'user-123' })
      }
    })

    test('returns error when save fails', async () => {
      insertShouldReject = true

      const result = await saveClientData({ data: input })

      expect(result.status).toBe('error')
    })
  })

  describe('findByClientId', () => {
    test('returns client data for existing client', async () => {
      selectResults.push([mockClientData])

      const result = await findByClientId({ data: 'user-123' })

      expect(result).toMatchObject({ clientId: 'user-123' })
    })

    test('returns undefined for non-existent client', async () => {
      selectResults.push([])

      const result = await findByClientId({ data: 'non-existent' })

      expect(result).toBeUndefined()
    })
  })
})
