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
  onboardingComplete: boolean
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
type InsertBuilder = { values: () => Promise<TransactionResult> }
type TransactionContext = {
  update: () => UpdateBuilder
  delete: () => DeleteBuilder
  insert: () => InsertBuilder
}
type TransactionCallback = (tx: TransactionContext) => Promise<unknown> | unknown

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
    onboardingComplete: true,
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

const createServerFnMock = (_opts?: unknown): Record<string, unknown> => ({
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

const createMiddlewareMock = () => ({
  server: (handler: unknown) => handler,
})

const getRequestHeadersMock = mock(() => ({ cookie: 'session=test' }))
const setResponseStatusMock = mock(() => {})
const getSessionMock = mock(async (): Promise<MockSession | null> => null)
const updateWhereMock = mock(async (): Promise<TransactionResult> => [])
const updateSetMock = mock(() => ({ where: updateWhereMock }))
const updateMock = mock(() => ({ set: updateSetMock }))
const deleteWhereMock = mock(async (): Promise<TransactionResult> => [])
const deleteMock = mock(() => ({ where: deleteWhereMock }))
const insertValuesMock = mock(async (): Promise<TransactionResult> => [])
const insertMock = mock(() => ({ values: insertValuesMock }))
const transactionMock = mock(async (callback: TransactionCallback) =>
  callback({
    update: updateMock,
    delete: deleteMock,
    insert: insertMock,
  }),
)
const onboardingDraft = {
  value: {} as Record<string, unknown>,
}
const updateSignUpSessionMock = mock(async () => ({ status: 'ok', value: undefined }))
const clearSignUpSessionMock = mock(async () => ({ success: true }))
const useSessionUpdateMock = mock(async (_data: unknown) => ({ status: 'ok', value: undefined }))
const useSessionClearMock = mock(async () => ({ success: true }))

mock.module('@tanstack/react-start', () => ({
  createServerFn: createServerFnMock,
  createMiddleware: createMiddlewareMock,
}))

mock.module('@tanstack/react-start/server', () => ({
  getRequestHeaders: getRequestHeadersMock,
  setResponseStatus: setResponseStatusMock,
  useSession: mock(() => ({
    data: onboardingDraft.value,
    update: useSessionUpdateMock,
    clear: useSessionClearMock,
  })),
}))

mock.module('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: getSessionMock,
      signUpEmail: mock(async () => ({ user: { id: 'user-1' } })),
    },
  },
}))

mock.module('@/db', () => ({
  db: {
    transaction: transactionMock,
    select: mock(() => ({
      from: mock(() => ({
        where: mock(() => ({
          limit: mock(async () => []),
        })),
      })),
    })),
  },
}))

mock.module('@tanstack/react-router', () => ({
  redirect: (input: unknown) => input,
}))

const {
  createRoleMiddleware,
  ensureRole,
  ensureSession,
  getSession,
  softDeleteUser,
  validateSignUpSession,
  finalizeOnboardingIfReady,
} = await import('../../src/lib/functions/auth')

describe('auth', () => {
  beforeEach(() => {
    getRequestHeadersMock.mockClear()
    setResponseStatusMock.mockClear()
    getSessionMock.mockClear()
    updateWhereMock.mockClear()
    updateSetMock.mockClear()
    updateMock.mockClear()
    deleteWhereMock.mockClear()
    deleteMock.mockClear()
    insertValuesMock.mockClear()
    insertMock.mockClear()
    transactionMock.mockClear()
    updateSignUpSessionMock.mockClear()
    clearSignUpSessionMock.mockClear()
    useSessionUpdateMock.mockClear()
    useSessionClearMock.mockClear()

    getRequestHeadersMock.mockImplementation(() => ({ cookie: 'session=test' }))
    setResponseStatusMock.mockImplementation(() => {})
    getSessionMock.mockImplementation(async () => null)
    updateWhereMock.mockImplementation(async () => [])
    updateSetMock.mockImplementation(() => ({ where: updateWhereMock }))
    updateMock.mockImplementation(() => ({ set: updateSetMock }))
    deleteWhereMock.mockImplementation(async () => [])
    deleteMock.mockImplementation(() => ({ where: deleteWhereMock }))
    insertValuesMock.mockImplementation(async () => [])
    insertMock.mockImplementation(() => ({ values: insertValuesMock }))
    transactionMock.mockImplementation(async (callback: TransactionCallback) =>
      callback({
        update: updateMock,
        delete: deleteMock,
        insert: insertMock,
      }),
    )
    onboardingDraft.value = {}
    updateSignUpSessionMock.mockImplementation(async () => ({ status: 'ok', value: undefined }))
    clearSignUpSessionMock.mockImplementation(async () => ({ success: true }))
    useSessionUpdateMock.mockImplementation(async (data: unknown) => {
      onboardingDraft.value = data as Record<string, unknown>
      return { status: 'ok', value: undefined }
    })
    useSessionClearMock.mockImplementation(async () => {
      onboardingDraft.value = {}
      return { success: true }
    })
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

  test('getSession returns null when no session exists', async () => {
    const result = await getSession()

    expect(result).toBeNull()
  })

  test('ensureSession throws unauthorized when there is no active session', async () => {
    await expect(ensureSession()).rejects.toThrow('Unauthorized')
    expect(setResponseStatusMock).toHaveBeenCalledWith(401)
  })

  test('ensureSession returns the session when authenticated', async () => {
    const session = createMockSession('admin')
    getSessionMock.mockImplementation(async () => session)

    const result = await ensureSession()

    expect(result.user.id).toBe(session.user.id)
    expect(result.user.role).toBe(session.user.role)
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
    const next = mock(({ context }: { context: { session: MockSession } }) => context)

    const middleware = createRoleMiddleware('admin') as unknown as (input: {
      next: typeof next
    }) => Promise<unknown>
    const result = await middleware({ next })

    expect(next).toHaveBeenCalledWith({ context: { session } })
    expect(result).toEqual({ session })
  })

  test('softDeleteUser anonymizes the user and removes related auth rows', async () => {
    getSessionMock.mockImplementation(async () => createMockSession('client', 'user-42'))

    const result = await softDeleteUser()

    expect(result.status).toBe('ok')
    expect(transactionMock).toHaveBeenCalled()
    const updateCalls = updateSetMock.mock.calls as Array<Array<UpdateShape>>
    const updatedUser = updateCalls[0]?.[0]

    expect(updatedUser).toBeDefined()
    expect(updatedUser?.name).toBe('Deleted User')
    expect(updatedUser?.email).toBe('deleted_user-42@deleted.invalid')
    expect(updatedUser?.image).toBeNull()
    expect(updatedUser?.emailVerified).toBe(false)
    expect(updatedUser?.deletedAt).toBeInstanceOf(Date)
    expect(deleteMock).toHaveBeenCalled()
  })

  test('softDeleteUser throws when no session', async () => {
    await expect(softDeleteUser()).rejects.toThrow('Unauthorized')
  })

  test('finalizeOnboardingIfReady returns skipped when no session exists', async () => {
    const result = await finalizeOnboardingIfReady()

    expect(result).toEqual({ success: true, skipped: true })
  })

  test('finalizeOnboardingIfReady returns skipped when onboarding is complete', async () => {
    getSessionMock.mockImplementation(async () => createMockSession('client'))

    const result = await finalizeOnboardingIfReady()

    expect(result).toEqual({ success: true, skipped: true })
  })

  test('finalizeOnboardingIfReady returns skipped when draft is incomplete', async () => {
    getSessionMock.mockImplementation(async () => ({
      ...createMockSession('client', 'user-test'),
      user: { ...createMockSession('client', 'user-test').user, onboardingComplete: false },
    }))
    onboardingDraft.value = {}

    const result = await finalizeOnboardingIfReady()

    expect(result).toEqual({ success: true, skipped: true })
  })

  describe('validateSignUpSession', () => {
    test('returns session when current state matches expected', async () => {
      onboardingDraft.value = {
        state: 'account',
        accountData: { firstName: 'John' },
      }

      const result = await validateSignUpSession({ data: 'account' })

      expect(result.state).toBe('account')
    })

    test('returns session when moving forward in flow', async () => {
      onboardingDraft.value = {
        state: 'account',
        accountData: { firstName: 'John' },
      }

      const result = await validateSignUpSession({ data: 'user-data' })

      expect(result.state).toBe('account')
    })

    test('throws redirect when session is behind expected state', async () => {
      onboardingDraft.value = {
        state: 'user-data',
        accountData: { firstName: 'John' },
        userData: { phoneNumber: '+123' },
      }

      await expect(validateSignUpSession({ data: 'account' })).rejects.toMatchObject({
        to: '/auth/sign-up',
      })
    })

    test('throws redirect when requesting user-data without account data', async () => {
      onboardingDraft.value = {
        state: 'account',
        accountData: undefined,
      }

      await expect(validateSignUpSession({ data: 'user-data' })).rejects.toMatchObject({
        to: '/auth/sign-up',
      })
    })
  })
})
