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
const updateResults: Array<Array<DbRow>> = []

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
  const obj = {
    values: () => ({
      returning: () => Promise.resolve(insertResults.shift() ?? []),
    }),
  }
  return obj
}

function updateBuilder() {
  const obj = {
    set: () => ({
      where: () => ({
        returning: () => Promise.resolve(updateResults.shift() ?? []),
      }),
    }),
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
  db: {
    select: selectBuilder,
    insert: insertBuilder,
    update: updateBuilder,
    delete: () => ({
      where: () => ({
        returning: async () => [],
      }),
    }),
  },
}))

const {
  buildAppointmentSummary,
  getClientUpcomingAppointments,
  getClientAppointmentHistory,
  createAppointment,
  cancelAppointment,
} = await import('../../src/lib/functions/appointments')

const mockAppointment = {
  id: 'apt-1',
  clientId: 'client-1',
  specialistId: 'spec-1',
  appointmentDate: new Date('2026-06-15T10:00:00Z'),
  durationMinutes: 30,
  status: 'pending',
  notes: null,
  cancellationReason: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockSession = { user: { id: 'client-1' } }

describe('appointments', () => {
  beforeEach(() => {
    selectResults.length = 0
    insertResults.length = 0
    updateResults.length = 0
  })

  describe('buildAppointmentSummary', () => {
    test('returns appointment with specialist data when specialist is found', async () => {
      selectResults.push([{ id: 'spec-1', name: 'Dr. Test', consultationDurationMinutes: 30 }])
      selectResults.push([{ specialistId: 'spec-1', licenseNumber: 'LIC-001' }])

      const result = await buildAppointmentSummary({ data: mockAppointment })

      expect(result).toMatchObject({
        id: 'apt-1',
        specialist: expect.objectContaining({ id: 'spec-1', name: 'Dr. Test' }),
      })
    })

    test('throws when specialist is not found', async () => {
      selectResults.push([])

      await expect(buildAppointmentSummary({ data: mockAppointment })).rejects.toThrow(
        'Failed to get specialist',
      )
    })
  })

  describe('getClientUpcomingAppointments', () => {
    test('returns list of upcoming appointments with summaries', async () => {
      selectResults.push([
        { ...mockAppointment, id: 'apt-1' },
        { ...mockAppointment, id: 'apt-2' },
      ])
      selectResults.push([{ id: 'spec-1', name: 'Dr. Test', consultationDurationMinutes: 30 }])
      selectResults.push([{ specialistId: 'spec-1', licenseNumber: 'LIC-001' }])
      selectResults.push([{ id: 'spec-1', name: 'Dr. Test', consultationDurationMinutes: 30 }])
      selectResults.push([{ specialistId: 'spec-1', licenseNumber: 'LIC-001' }])

      const result = await getClientUpcomingAppointments({
        context: { session: mockSession },
      })

      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({ id: 'apt-1' })
      expect(result[1]).toMatchObject({ id: 'apt-2' })
    })

    test('returns empty array when no upcoming appointments', async () => {
      selectResults.push([])

      const result = await getClientUpcomingAppointments({
        context: { session: mockSession },
      })

      expect(result).toEqual([])
    })
  })

  describe('getClientAppointmentHistory', () => {
    test('returns list of completed appointments with summaries', async () => {
      selectResults.push([
        { ...mockAppointment, id: 'apt-3', status: 'completed' },
        { ...mockAppointment, id: 'apt-4', status: 'cancelled' },
      ])
      selectResults.push([{ id: 'spec-1', name: 'Dr. Test', consultationDurationMinutes: 30 }])
      selectResults.push([{ specialistId: 'spec-1', licenseNumber: 'LIC-001' }])
      selectResults.push([{ id: 'spec-1', name: 'Dr. Test', consultationDurationMinutes: 30 }])
      selectResults.push([{ specialistId: 'spec-1', licenseNumber: 'LIC-001' }])

      const result = await getClientAppointmentHistory({
        context: { session: mockSession },
      })

      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({ id: 'apt-3' })
      expect(result[1]).toMatchObject({ id: 'apt-4' })
    })

    test('returns empty array when no history', async () => {
      selectResults.push([])

      const result = await getClientAppointmentHistory({
        context: { session: mockSession },
      })

      expect(result).toEqual([])
    })
  })

  describe('createAppointment', () => {
    const createInput = {
      specialistId: 'spec-1',
      appointmentDate: new Date('2026-06-15T10:00:00Z'),
      notes: 'Check-up',
    }

    test('creates appointment successfully when slot is available', async () => {
      selectResults.push([
        { id: 'spec-1', specialistId: 'spec-1', consultationDurationMinutes: 30 },
      ])
      selectResults.push([
        {
          id: 'block-1',
          specialistId: 'spec-1',
          dayOfWeek: 'Monday',
          startTime: new Date('1970-01-01T09:00:00Z'),
          endTime: new Date('1970-01-01T17:00:00Z'),
          isAvailable: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ])
      selectResults.push([])
      insertResults.push([{ ...mockAppointment, id: 'new-apt' }])

      const result = await createAppointment({
        data: createInput,
        context: { session: mockSession },
      })

      expect(result.status).toBe('ok')
      if (result.status === 'ok') {
        expect(result.value).toMatchObject({ id: 'new-apt' })
      }
    })

    test('returns error when slot is not available', async () => {
      selectResults.push([
        { id: 'spec-1', specialistId: 'spec-1', consultationDurationMinutes: 30 },
      ])
      selectResults.push([])
      selectResults.push([])

      const result = await createAppointment({
        data: createInput,
        context: { session: mockSession },
      })

      expect(result.status).toBe('error')
      if (result.status === 'error') {
        expect(result.error.message).toBe('Selected time slot is no longer available.')
      }
    })

    test('returns error when specialist is not found', async () => {
      selectResults.push([])

      const result = await createAppointment({
        data: createInput,
        context: { session: mockSession },
      })

      expect(result.status).toBe('error')
    })
  })

  describe('cancelAppointment', () => {
    test('cancels appointment successfully', async () => {
      selectResults.push([{ id: 'apt-1', clientId: 'client-1', status: 'pending' }])
      updateResults.push([{ id: 'apt-1', status: 'cancelled', cancellationReason: null }])

      const result = await cancelAppointment({
        data: { appointmentId: 'apt-1' },
        context: { session: mockSession },
      })

      expect(result.status).toBe('ok')
      if (result.status === 'ok') {
        expect(result.value).toMatchObject({ id: 'apt-1', status: 'cancelled' })
      }
    })

    test('returns error when appointment is not found', async () => {
      selectResults.push([])

      const result = await cancelAppointment({
        data: { appointmentId: 'non-existent' },
        context: { session: mockSession },
      })

      expect(result.status).toBe('error')
      if (result.status === 'error') {
        expect(result.error.message).toBe('Appointment could not be cancelled.')
      }
    })
  })
})
