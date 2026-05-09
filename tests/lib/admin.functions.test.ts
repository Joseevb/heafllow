import { beforeEach, describe, expect, mock, test } from 'bun:test'

type TransactionResult = Array<Record<string, unknown>>
type UpdateShape = Record<string, unknown>
type UpdateQuery = { where: () => Promise<TransactionResult> }
type UpdateBuilder = { set: (values: UpdateShape) => UpdateQuery }
type DeleteBuilder = { where: () => Promise<TransactionResult> }
type TransactionContext = {
  update: () => UpdateBuilder
  delete: () => DeleteBuilder
}
type TransactionCallback = (tx: TransactionContext) => Promise<unknown> | unknown
type MockUpdateUserResponse = {
  data: Record<string, unknown> | null
  error: { message: string } | null
}

interface MockServerChain {
  inputValidator: () => MockServerChain
  middleware: (middlewares: Array<unknown>) => MockServerChain
  handler: <TInput, TResult>(
    handler: (input: TInput) => TResult | Promise<TResult>,
  ) => (input: TInput) => Promise<TResult>
}

const createServerFnMock = (): MockServerChain => {
  const chain: MockServerChain = {
    inputValidator() {
      return chain
    },
    middleware() {
      return chain
    },
    handler(handler) {
      return async (input) => await handler(input)
    },
  }

  return chain
}

const updateWhereMock = mock(async (): Promise<TransactionResult> => [])
const updateSetMock = mock(() => ({ where: updateWhereMock }))
const updateMock = mock(() => ({ set: updateSetMock }))
const deleteWhereMock = mock(async (): Promise<TransactionResult> => [])
const deleteMock = mock(() => ({ where: deleteWhereMock }))
const transactionMock = mock(async (callback: TransactionCallback) =>
  callback({
    update: updateMock,
    delete: deleteMock,
  }),
)
const updateUserMock = mock(
  async (): Promise<MockUpdateUserResponse> => ({
    data: null,
    error: null,
  }),
)

mock.module('@tanstack/react-start', () => ({
  createServerFn: createServerFnMock,
}))

mock.module('@/db', () => ({
  db: {
    transaction: transactionMock,
  },
}))

mock.module('@/lib/auth-client', () => ({
  authClient: {
    admin: {
      updateUser: updateUserMock,
    },
  },
}))

mock.module('@/lib/auth.functions', () => ({
  createRoleMiddleware: mock(() => ({ type: 'role-middleware' })),
}))

const { softDeleteUserById, updateUserById } = await import('../../src/lib/admin.functions')

describe('admin.functions', () => {
  beforeEach(() => {
    updateWhereMock.mockClear()
    updateSetMock.mockClear()
    updateMock.mockClear()
    deleteWhereMock.mockClear()
    deleteMock.mockClear()
    transactionMock.mockClear()
    updateUserMock.mockClear()

    updateWhereMock.mockImplementation(async () => [])
    updateSetMock.mockImplementation(() => ({ where: updateWhereMock }))
    updateMock.mockImplementation(() => ({ set: updateSetMock }))
    deleteWhereMock.mockImplementation(async () => [])
    deleteMock.mockImplementation(() => ({ where: deleteWhereMock }))
    transactionMock.mockImplementation(async (callback: TransactionCallback) =>
      callback({
        update: updateMock,
        delete: deleteMock,
      }),
    )
    updateUserMock.mockImplementation(async () => ({ data: null, error: null }))
  })

  test('softDeleteUserById anonymizes the target user inside a transaction', async () => {
    const input: Parameters<typeof softDeleteUserById>[0] = { data: 'user-123' }
    const result = await softDeleteUserById(input)

    expect(result.status).toBe('ok')
    expect(transactionMock).toHaveBeenCalled()
    const updateCalls = updateSetMock.mock.calls as Array<Array<UpdateShape>>
    const updatedUser = updateCalls[0]?.[0]

    expect(updatedUser).toBeDefined()
    expect(updatedUser?.name).toBe('Deleted User')
    expect(updatedUser?.email).toBe('deleted_user-123@deleted.invalid')
    expect(updatedUser?.firstName).toBe('Deleted User')
    expect(updatedUser?.lastName).toBe('Deleted User')
    expect(updatedUser?.image).toBeNull()
    expect(updatedUser?.emailVerified).toBe(false)
    expect(updatedUser?.deletedAt).toBeInstanceOf(Date)
    expect(deleteMock).toHaveBeenCalled()
  })

  test('updateUserById returns a serialized success result', async () => {
    const response = { id: 'user-123', role: 'admin' }
    updateUserMock.mockImplementation(async () => ({ data: response, error: null }))

    const payload = { userId: 'user-123', data: { role: 'admin' } }
    const input: Parameters<typeof updateUserById>[0] = { data: payload }
    const result = await updateUserById(input)

    expect(updateUserMock).toHaveBeenCalledWith(payload)
    expect(result.status).toBe('ok')
    if (result.status === 'ok') {
      expect(result.value).toEqual(expect.objectContaining({ id: 'user-123', role: 'admin' }))
    }
  })

  test('updateUserById returns a serialized error when auth client fails', async () => {
    updateUserMock.mockImplementation(async () => ({
      data: null,
      error: { message: 'Update failed' },
    }))

    const result = await updateUserById({
      data: { userId: 'user-123', data: { role: 'admin' } },
    })

    expect(result.status).toBe('error')
    if (result.status === 'error') {
      expect(result.error.message).toBe('Update failed')
    }
  })
})
