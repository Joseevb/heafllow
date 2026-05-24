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

const mockMetric = {
  id: 'metric-1',
  clientId: 'client-1',
  weight: 75.5,
  height: 180,
  bloodPressureSystolic: 120,
  bloodPressureDiastolic: 80,
  heartRate: 72,
  createdAt: new Date('2026-06-01'),
  updatedAt: new Date('2026-06-01'),
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

const { getClientMetrics, getRecentClientMetrics } =
  await import('../../src/lib/functions/health-metrics')

const mockSession = { user: { id: 'client-1' } }

describe('health-metrics', () => {
  beforeEach(() => {
    selectResults.length = 0
  })

  describe('getClientMetrics', () => {
    test('returns all metrics for the authenticated client', async () => {
      selectResults.push([
        { ...mockMetric, id: 'metric-1' },
        { ...mockMetric, id: 'metric-2' },
      ])

      const result = await getClientMetrics({ context: { session: mockSession } })

      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({ id: 'metric-1' })
      expect(result[1]).toMatchObject({ id: 'metric-2' })
    })

    test('returns empty array when no metrics exist', async () => {
      selectResults.push([])

      const result = await getClientMetrics({ context: { session: mockSession } })

      expect(result).toEqual([])
    })
  })

  describe('getRecentClientMetrics', () => {
    const dates = {
      from: new Date('2026-05-01'),
      to: new Date('2026-06-30'),
    }

    test('returns metrics within the date range', async () => {
      selectResults.push([{ ...mockMetric, id: 'metric-1' }])

      const result = await getRecentClientMetrics({
        data: dates,
        context: { session: mockSession },
      })

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ id: 'metric-1' })
    })

    test('returns empty array when no metrics in range', async () => {
      selectResults.push([])

      const result = await getRecentClientMetrics({
        data: dates,
        context: { session: mockSession },
      })

      expect(result).toEqual([])
    })
  })
})
