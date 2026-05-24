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

const selectResults: Array<Array<Record<string, unknown>>> = []

function selectBuilder() {
  let cached: Array<Record<string, unknown>> | null = null
  const obj = {
    from: () => obj,
    where: () => obj,
    orderBy: () => obj,
    limit: () => obj,
    then: (resolve: (value: Array<Record<string, unknown>>) => unknown) => {
      if (cached === null) cached = selectResults.shift() ?? []
      return Promise.resolve(cached).then(resolve)
    },
  }
  return obj
}

mock.module('@tanstack/react-start', () => ({
  createServerFn: createServerFnMock,
  createMiddleware: () => ({
    server: (handler: unknown) => handler,
  }),
}))

mock.module('@/lib/functions/auth', () => ({
  ensureSessionMiddleware: {},
}))

mock.module('@/db', () => ({
  db: { select: selectBuilder },
}))

const { getClientMedicines } = await import('../../src/lib/functions/medicines')

describe('medicines', () => {
  beforeEach(() => {
    selectResults.length = 0
  })

  test('getClientMedicines returns medicines for the session user', async () => {
    const expected = [
      {
        id: 1,
        userId: 'user-123',
        name: 'Aspirin',
        dosage: '100mg',
        medicineId: 1,
        frequency: 'daily',
        startDate: new Date(),
        endDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        userId: 'user-123',
        name: 'Vitamin D',
        dosage: '1000IU',
        medicineId: 2,
        frequency: 'daily',
        startDate: new Date(),
        endDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]
    selectResults.push(expected)

    const result = await getClientMedicines({
      context: { session: { user: { id: 'user-123' } } },
    })

    expect(result).toEqual(expected)
  })

  test('getClientMedicines returns empty array when no medicines found', async () => {
    selectResults.push([])

    const result = await getClientMedicines({
      context: { session: { user: { id: 'user-456' } } },
    })

    expect(result).toHaveLength(0)
  })
})
