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
const createUserMock = mock(async () => ({
  user: {
    id: 'new-specialist-123',
    email: 'specialist@healflow.com',
    role: 'specialist',
  },
}))

const selectQueue: Array<Array<Record<string, unknown>>> = []

function shiftSelectResult() {
  return (selectQueue.shift() ?? []) as Array<Record<string, unknown>>
}

function createWhereResult() {
  return {
    limit: async () => shiftSelectResult(),
    then: (resolve: (value: Array<Record<string, unknown>>) => unknown) =>
      Promise.resolve(shiftSelectResult()).then(resolve),
  }
}

const selectWhereMock = mock(() => createWhereResult())
const selectFromMock = mock(() => ({ where: selectWhereMock }))
const selectMock = mock(() => ({ from: selectFromMock }))

mock.module('@tanstack/react-start', () => ({
  createServerFn: createServerFnMock,
  createMiddleware: () => ({
    server: (handler: unknown) => handler,
  }),
}))

mock.module('@/db', () => ({
  db: {
    transaction: transactionMock,
    select: selectMock,
  },
}))

mock.module('@/lib/auth-client', () => ({
  authClient: {
    admin: {
      updateUser: updateUserMock,
    },
  },
}))

mock.module('@/lib/auth', () => ({
  auth: {
    api: {
      createUser: createUserMock,
    },
  },
}))

const {
  softDeleteUserById,
  updateUserById,
  validateAdminUserDeletion,
  validateAdminUserRoleTransition,
} = await import('../../src/lib/functions/admin')

describe('admin', () => {
  beforeEach(() => {
    updateWhereMock.mockClear()
    updateSetMock.mockClear()
    updateMock.mockClear()
    deleteWhereMock.mockClear()
    deleteMock.mockClear()
    transactionMock.mockClear()
    updateUserMock.mockClear()
    createUserMock.mockClear()
    selectWhereMock.mockClear()
    selectFromMock.mockClear()
    selectMock.mockClear()

    selectQueue.length = 0

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
    createUserMock.mockImplementation(async () => ({
      user: {
        id: 'new-specialist-123',
        email: 'specialist@healflow.com',
        role: 'specialist',
      },
    }))
    selectWhereMock.mockImplementation(() => createWhereResult())
    selectFromMock.mockImplementation(() => ({ where: selectWhereMock }))
    selectMock.mockImplementation(() => ({ from: selectFromMock }))
  })

  test('softDeleteUserById anonymizes the target user inside a transaction', async () => {
    selectQueue.push([{ id: 'user-123', role: 'admin' }])

    const input: Parameters<typeof softDeleteUserById>[0] = { data: 'user-123' }
    const result = await softDeleteUserById(input)

    expect(result.status).toBe('ok')
    expect(transactionMock).toHaveBeenCalled()
    const updateCalls = updateSetMock.mock.calls as Array<Array<UpdateShape>>
    const updatedUser = updateCalls[0]?.[0]

    expect(updatedUser).toBeDefined()
    expect(updatedUser?.name).toBe('Deleted User')
    expect(updatedUser?.email).toBe('deleted_user-123@deleted.invalid')
    expect(updatedUser?.image).toBeNull()
    expect(updatedUser?.emailVerified).toBe(false)
    expect(updatedUser?.deletedAt).toBeInstanceOf(Date)
    expect(deleteMock).toHaveBeenCalledTimes(2)
  })

  test('updateUserById returns a serialized success result', async () => {
    const response = { id: 'user-123', role: 'admin' }
    updateUserMock.mockImplementation(async () => ({ data: response, error: null }))
    selectQueue.push([{ id: 'user-123', role: 'admin' }])

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
    selectQueue.push([{ id: 'user-123', role: 'admin' }])

    const result = await updateUserById({
      data: { userId: 'user-123', data: { role: 'admin' } },
    })

    expect(result.status).toBe('error')
    if (result.status === 'error') {
      expect(result.error.message).toBe('Update failed')
    }
  })

  test('updateUserById blocks specialist role changes without specialist profile data', async () => {
    selectQueue.push([{ id: 'user-123', role: 'client' }], [], [], [])

    const result = await updateUserById({
      data: { userId: 'user-123', data: { role: 'specialist' } },
    })

    expect(updateUserMock).not.toHaveBeenCalled()
    expect(result.status).toBe('error')
    if (result.status === 'error') {
      expect(result.error.message).toBe(
        'This user does not have specialist profile data yet. Create the specialist profile before changing their role to specialist.',
      )
    }
  })

  test('validateAdminUserRoleTransition blocks specialists with assigned clients', async () => {
    selectQueue.push(
      [{ id: 'user-123', role: 'specialist' }],
      [{ id: 'client-profile' }],
      [{ id: 'specialist-profile', specialistId: 'user-123' }],
      [{ id: 'assigned-client' }],
    )

    const result = await validateAdminUserRoleTransition({
      data: { userId: 'user-123', role: 'admin' },
    })

    expect(result.allowed).toBe(false)
    expect(result.message).toBe(
      'This specialist is still assigned as a primary care specialist for one or more clients. Reassign those clients before changing the role.',
    )
  })

  test('validateAdminUserDeletion allows users with historical billing but no active subscription', async () => {
    selectQueue.push([{ id: 'user-123', role: 'client' }], [])

    const result = await validateAdminUserDeletion({ data: 'user-123' })

    expect(result).toEqual({
      allowed: true,
      message: 'User can be deleted.',
      reason: 'ok',
    })
  })

  test('validateAdminUserDeletion blocks active subscriptions', async () => {
    selectQueue.push([{ id: 'user-123', role: 'client' }], [{ id: 'sub-123' }])

    const result = await validateAdminUserDeletion({ data: 'user-123' })

    expect(result).toEqual({
      allowed: false,
      message: 'This user has an active subscription and cannot be deleted.',
      reason: 'active-subscription',
    })
  })

  test('validateAdminUserDeletion returns not-found for missing user', async () => {
    selectQueue.push([], [])

    const result = await validateAdminUserDeletion({ data: 'non-existent' })

    expect(result).toEqual({
      allowed: false,
      message: 'User not found.',
      reason: 'not-found',
    })
  })

  test('validateAdminUserRoleTransition returns allowed when role is unchanged', async () => {
    selectQueue.push([{ id: 'user-123', role: 'admin' }])

    const result = await validateAdminUserRoleTransition({
      data: { userId: 'user-123', role: 'admin' },
    })

    expect(result).toEqual({
      allowed: true,
      message: 'Role is unchanged.',
    })
  })

  test('validateAdminUserRoleTransition blocks client role without client profile', async () => {
    selectQueue.push([{ id: 'user-123', role: 'specialist' }], [], [{ id: 'spec-profile' }], [])

    const result = await validateAdminUserRoleTransition({
      data: { userId: 'user-123', role: 'client' },
    })

    expect(result).toEqual({
      allowed: false,
      message:
        'This user does not have a client profile yet. Create the client record before changing their role to client.',
    })
  })

  test('validateAdminUserRoleTransition returns user not found', async () => {
    selectQueue.push([])

    const result = await validateAdminUserRoleTransition({
      data: { userId: 'non-existent', role: 'admin' },
    })

    expect(result).toEqual({
      allowed: false,
      message: 'User not found.',
    })
  })
})
