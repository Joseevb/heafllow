import { beforeEach, describe, expect, mock, test } from 'bun:test'

type Role = 'admin' | 'client' | 'specialist'
type FullSession = {
  id: string
  createdAt: Date
  updatedAt: Date
  userId: string
  expiresAt: Date
  token: string
  ipAddress?: string | null
  userAgent?: string | null
  impersonatedBy?: string | null
}
type FullUser = {
  id: string
  role: Role
  createdAt: Date
  updatedAt: Date
  email: string
  emailVerified: boolean
  name: string
  image: string | null
  firstName: string
  lastName: string
  phoneNumber: string
  banned: boolean | null
  banReason: string | null
  banExpires: Date | null
  deletedAt: Date | null
}
type MockSession = {
  user: FullUser
  session: FullSession
}
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
type MiddlewareContext = { session: MockSession }
type MiddlewareNext = (input: { context: MiddlewareContext }) => MiddlewareContext
type MiddlewareRunner = (input: { next: MiddlewareNext }) => Promise<MiddlewareContext>

const createMockSession = (role: Role, userId = 'user-1'): MockSession => ({
  user: {
    id: userId,
    role,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    email: `${userId}@example.com`,
    emailVerified: true,
    name: 'Test User',
    image: null,
    firstName: 'Test',
    lastName: 'User',
    phoneNumber: '555-0100',
    banned: null,
    banReason: null,
    banExpires: null,
    deletedAt: null,
  },
  session: {
    id: 'session-1',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    userId,
    expiresAt: new Date('2026-01-02T00:00:00.000Z'),
    token: 'token-1',
    ipAddress: null,
    userAgent: null,
    impersonatedBy: null,
  },
})

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

const getRequestHeadersMock = mock(() => ({ cookie: 'session=test' }))
const setResponseStatusMock = mock(() => {})
const getSessionMock = mock(async (): Promise<MockSession | null> => null)
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

mock.module('@tanstack/react-start', () => ({
  createServerFn: createServerFnMock,
  createMiddleware: () => ({
    server: <T extends MiddlewareRunner>(handler: T) => handler,
  }),
}))

mock.module('@tanstack/react-start/server', () => ({
  getRequestHeaders: getRequestHeadersMock,
  setResponseStatus: setResponseStatusMock,
}))

mock.module('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: getSessionMock,
    },
  },
}))

mock.module('@/db', () => ({
  db: {
    transaction: transactionMock,
  },
}))

const { createRoleMiddleware, ensureRole, ensureSession, getSession, softDeleteUser } =
  await import('../../src/lib/auth.functions')
const { ensureSessionMiddleware } = await import('../../src/lib/auth.functions')

describe('auth.functions', () => {
  beforeEach(() => {
    getRequestHeadersMock.mockClear()
    setResponseStatusMock.mockClear()
    getSessionMock.mockClear()
    updateWhereMock.mockClear()
    updateSetMock.mockClear()
    updateMock.mockClear()
    deleteWhereMock.mockClear()
    deleteMock.mockClear()
    transactionMock.mockClear()

    getRequestHeadersMock.mockImplementation(() => ({ cookie: 'session=test' }))
    setResponseStatusMock.mockImplementation(() => {})
    getSessionMock.mockImplementation(async () => null)
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
  })

  test('getSession returns the auth session and forwards request headers', async () => {
    const session = createMockSession('admin')
    getSessionMock.mockImplementation(async () => session)

    const result = await getSession()

    expect(result?.user.id).toBe(session.user.id)
    expect(result?.user.role).toBe(session.user.role)
    expect(result?.session.id).toBe(session.session.id)
    expect(getSessionMock).toHaveBeenCalledWith({ headers: { cookie: 'session=test' } })
  })

  test('ensureSession throws unauthorized when there is no active session', async () => {
    await expect(ensureSession()).rejects.toThrow('Unauthorized')
    expect(setResponseStatusMock).toHaveBeenCalledWith(401)
  })

  test('ensureRole returns the session for the expected role', async () => {
    const session = createMockSession('admin')
    getSessionMock.mockImplementation(async () => session)

    const input: Parameters<typeof ensureRole>[0] = { data: 'admin' }
    const result = await ensureRole(input)

    expect(result.user.id).toBe(session.user.id)
    expect(result.user.role).toBe(session.user.role)
    expect(result.session.id).toBe(session.session.id)
  })

  test('ensureRole throws forbidden when the session role does not match', async () => {
    getSessionMock.mockImplementation(async () => createMockSession('client'))

    const input: Parameters<typeof ensureRole>[0] = { data: 'admin' }
    await expect(ensureRole(input)).rejects.toThrow('Forbidden')
    expect(setResponseStatusMock).toHaveBeenCalledWith(403)
  })

  test('createRoleMiddleware injects the ensured session into context', async () => {
    const session = createMockSession('admin')
    getSessionMock.mockImplementation(async () => session)
    const next = mock(({ context }: { context: MiddlewareContext }) => context)

    const middleware = createRoleMiddleware('admin') as unknown as MiddlewareRunner
    const result = await middleware({ next })

    expect(next).toHaveBeenCalledWith({ context: { session } })
    expect(result).toEqual({ session })
  })

  test('ensureSessionMiddleware injects the ensured session into context', async () => {
    const session = createMockSession('admin')
    getSessionMock.mockImplementation(async () => session)
    const next = mock(({ context }: { context: MiddlewareContext }) => context)

    const middleware = ensureSessionMiddleware as unknown as MiddlewareRunner
    const result = await middleware({ next })

    expect(next).toHaveBeenCalledWith({ context: { session } })
    expect(result).toEqual({ session })
  })

  test('softDeleteUser anonymizes the user and removes related auth rows', async () => {
    getSessionMock.mockImplementation(async () => createMockSession('client', 'user-42'))

    const result = await softDeleteUser()

    expect(result.status).toBe('ok')
    expect(transactionMock).toHaveBeenCalled()
    expect(updateMock).toHaveBeenCalled()
    const updateCalls = updateSetMock.mock.calls as Array<Array<UpdateShape>>
    const updatedUser = updateCalls[0]?.[0]

    expect(updatedUser).toBeDefined()
    expect(updatedUser?.name).toBe('Deleted User')
    expect(updatedUser?.email).toBe('deleted_user-42@deleted.invalid')
    expect(updatedUser?.firstName).toBe('Deleted User')
    expect(updatedUser?.lastName).toBe('Deleted User')
    expect(updatedUser?.image).toBeNull()
    expect(updatedUser?.emailVerified).toBe(false)
    expect(updatedUser?.deletedAt).toBeInstanceOf(Date)
    expect(deleteMock).toHaveBeenCalled()
  })
})
