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

function consume(queue: Array<Array<DbRow>>) {
  let cached: Array<DbRow> | null = null
  const fn = () => {
    if (cached === null) cached = queue.shift() ?? []
    return cached
  }
  const builder = {
    from: () => builder,
    where: () => builder,
    orderBy: () => builder,
    limit: () => builder,
    values: () => builder,
    set: () => builder,
    returning: () => Promise.resolve(fn()),
    then: (resolve: (value: Array<DbRow>) => unknown) => Promise.resolve(fn()).then(resolve),
  }
  return builder
}

const mockHealthScore = {
  id: 'score-1',
  userId: 'client-1',
  score: 85,
  category: 'good',
  createdAt: new Date('2026-06-15'),
  updatedAt: new Date('2026-06-15'),
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
  db: {
    select: () => consume(selectResults),
  },
}))

const { getClientLatestHealthScore } = await import('../../src/lib/functions/health-score')

const mockSession = { user: { id: 'client-1' } }

describe('health-score', () => {
  beforeEach(() => {
    selectResults.length = 0
  })

  describe('getClientLatestHealthScore', () => {
    test('returns the latest health score for the authenticated client', async () => {
      selectResults.push([mockHealthScore])

      const result = await getClientLatestHealthScore({ context: { session: mockSession } })

      expect(result).toMatchObject({ id: 'score-1', score: 85, category: 'good' })
    })

    test('returns null when no health score exists', async () => {
      selectResults.push([])

      const result = await getClientLatestHealthScore({ context: { session: mockSession } })

      expect(result).toBeNull()
    })
  })
})
