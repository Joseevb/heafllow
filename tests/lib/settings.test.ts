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

type TransactionResult = Array<Record<string, unknown>>
type UpdateShape = Record<string, unknown>
type UpdateQuery = { where: () => Promise<TransactionResult> }
type UpdateBuilder = { set: (values: UpdateShape) => UpdateQuery }
type InsertBuilder = { values: (values: Record<string, unknown>) => void }
type TransactionContext = {
  update: (table: unknown) => UpdateBuilder
  insert: (table: unknown) => InsertBuilder
}
type TransactionCallback = (tx: TransactionContext) => Promise<unknown> | unknown

const txUpdateWhereMock = mock(async (): Promise<TransactionResult> => [])
const txUpdateSetMock = mock(() => ({ where: txUpdateWhereMock }))
const txUpdateMock = mock(() => ({ set: txUpdateSetMock }))
const txInsertValuesMock = mock(() => {})
const txInsertMock = mock(() => ({ values: txInsertValuesMock }))
const transactionMock = mock(async (callback: TransactionCallback) =>
  callback({
    update: txUpdateMock,
    insert: txInsertMock,
  } as TransactionContext),
)

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
  db: {
    transaction: transactionMock,
    select: selectBuilder,
    update: () => ({ set: () => ({ where: () => Promise.resolve([]) }) }),
    insert: () => ({ values: () => ({}) }),
  },
}))

const { getCurrentAccountSummary, getUserSettings, updateUserSettings } =
  await import('../../src/lib/functions/settings')

describe('settings', () => {
  const userData = {
    id: 'user-123',
    name: 'John Doe',
    email: 'john@test.com',
    image: 'avatar.png',
    role: 'client',
    onboardingComplete: true,
    createdAt: new Date('2024-01-01'),
  }

  const clientData = {
    id: 'client-1',
    clientId: 'user-123',
    firstName: 'John',
    lastName: 'Doe',
    birthDate: new Date('1990-01-01'),
    phoneNumber: '+1234567890',
    primaryCareSpecialist: 'spec-1',
  }

  const addressData = {
    id: 'addr-1',
    userId: 'user-123',
    street: '123 Main St',
    city: 'Portland',
    state: 'OR',
    country: 'US',
    zipCode: '97201',
  }

  beforeEach(() => {
    selectResults.length = 0
    transactionMock.mockClear()
    txUpdateMock.mockClear()
    txUpdateSetMock.mockClear()
    txUpdateWhereMock.mockClear()
    txInsertMock.mockClear()
    txInsertValuesMock.mockClear()
  })

  describe('getCurrentAccountSummary', () => {
    test('returns account summary for session user', async () => {
      selectResults.push([{ ...userData }])

      const result = await getCurrentAccountSummary({
        context: { session: { user: { id: 'user-123' } } },
      })

      expect(result).toMatchObject({
        id: 'user-123',
        name: 'John Doe',
        email: 'john@test.com',
        role: 'client',
      })
    })

    test('throws when user is not found', async () => {
      selectResults.push([])

      await expect(
        getCurrentAccountSummary({
          context: { session: { user: { id: 'nonexistent' } } },
        }),
      ).rejects.toThrow('Unable to load account')
    })
  })

  describe('getUserSettings', () => {
    test('returns settings with client and address', async () => {
      selectResults.push([{ ...userData }])
      selectResults.push([{ ...clientData }])
      selectResults.push([{ ...addressData }])

      const result = await getUserSettings({
        context: { session: { user: { id: 'user-123' } } },
      })

      expect(result).toMatchObject({
        account: { id: 'user-123', name: 'John Doe' },
        profile: { firstName: 'John', lastName: 'Doe' },
        address: { street: '123 Main St', city: 'Portland' },
      })
    })

    test('returns settings with empty address when not found', async () => {
      selectResults.push([{ ...userData }])
      selectResults.push([{ ...clientData }])
      selectResults.push([])

      const result = await getUserSettings({
        context: { session: { user: { id: 'user-123' } } },
      })

      expect(result.address).toEqual({
        street: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
      })
    })

    test('throws when client is not found', async () => {
      selectResults.push([{ ...userData }])
      selectResults.push([])
      selectResults.push([{ ...addressData }])

      await expect(
        getUserSettings({
          context: { session: { user: { id: 'user-123' } } },
        }),
      ).rejects.toThrow('Unable to load settings')
    })
  })

  describe('updateUserSettings', () => {
    const input = {
      firstName: 'Jane',
      lastName: 'Deer',
      email: 'jane@test.com',
      phoneNumber: '+1987654321',
      birthDate: '1992-05-15',
      primaryCareSpecialist: 'spec-2',
      address: {
        street: '456 Oak Ave',
        city: 'Salem',
        state: 'OR',
        country: 'US',
        zipCode: '97301',
      },
    }

    test('updates user, client, and existing address in transaction', async () => {
      selectResults.push([{ ...clientData }])
      selectResults.push([{ ...addressData }])

      const result = await updateUserSettings({
        data: input,
        context: { session: { user: { id: 'user-123' } } },
      })

      expect(transactionMock).toHaveBeenCalled()
      expect(txUpdateMock).toHaveBeenCalledTimes(3)
      expect(result).toEqual({
        success: true,
        value: input,
      })
    })

    test('inserts new address when none exists', async () => {
      selectResults.push([{ ...clientData }])
      selectResults.push([])

      const result = await updateUserSettings({
        data: input,
        context: { session: { user: { id: 'user-123' } } },
      })

      expect(txInsertMock).toHaveBeenCalled()
      expect(txInsertValuesMock).toHaveBeenCalled()
      expect(result.success).toBe(true)
    })

    test('handles missing client inside transaction', async () => {
      selectResults.push([])
      selectResults.push([{ ...addressData }])

      const result = await updateUserSettings({
        data: input,
        context: { session: { user: { id: 'user-123' } } },
      })

      expect(transactionMock).toHaveBeenCalled()
      expect(txUpdateMock).toHaveBeenCalledTimes(2)
      expect(result.success).toBe(true)
    })

    test('passes the transaction context to all operations', async () => {
      selectResults.push([{ ...clientData }])
      selectResults.push([{ ...addressData }])

      await updateUserSettings({
        data: input,
        context: { session: { user: { id: 'user-123' } } },
      })

      const txCallback = transactionMock.mock.calls[0]?.[0] as TransactionCallback
      const fakeTx = {
        update: txUpdateMock,
        insert: txInsertMock,
      }
      await txCallback(fakeTx as TransactionContext)

      expect(txUpdateMock).toHaveBeenCalled()
    })
  })
})
