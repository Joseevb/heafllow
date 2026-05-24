import { mutationOptions, queryOptions } from '@tanstack/react-query'
import { Result } from 'better-result'

import {
  cancelAppointment,
  createAppointment,
  getClientAppointmentHistory,
  getClientUpcomingAppointments,
  getSpecialistBookingAvailability,
} from '@/lib/functions/appointments'

function unwrapServerResult<T>(
  result:
    | Awaited<ReturnType<typeof getSpecialistBookingAvailability>>
    | Awaited<ReturnType<typeof createAppointment>>,
) {
  const parsedResult = Result.deserialize(result)

  return parsedResult.match({
    ok: (value) => value as T,
    err: (error) => {
      throw new Error(
        typeof error === 'object' &&
          error &&
          'message' in error &&
          typeof error.message === 'string'
          ? error.message
          : 'Request failed',
      )
    },
  })
}

export const getUpcomingAppointmentsQueryOptions = () =>
  queryOptions({
    queryKey: ['upcomingAppointments'],
    queryFn: getClientUpcomingAppointments,
  })

export const getAppointmentHistoryQueryOptions = () =>
  queryOptions({
    queryKey: ['appointmentHistory'],
    queryFn: getClientAppointmentHistory,
  })

export const getSpecialistBookingAvailabilityQueryOptions = (input: {
  specialistId: string
  startDate: Date
  endDate: Date
}) =>
  queryOptions({
    queryKey: [
      'specialist-booking-availability',
      input.specialistId,
      input.startDate.toISOString(),
      input.endDate.toISOString(),
    ],
    queryFn: async () =>
      unwrapServerResult<
        Awaited<ReturnType<typeof getSpecialistBookingAvailability>> extends infer _T
          ? Array<{
              date: string
              slots: Array<{ startsAt: string; label: string; status: 'available' | 'booked' }>
            }>
          : never
      >(
        await getSpecialistBookingAvailability({
          data: input,
        }),
      ),
  })

export const createAppointmentMutationOptions = () =>
  mutationOptions({
    mutationKey: ['appointments', 'create'],
    mutationFn: async (input: { specialistId: string; appointmentDate: Date; notes?: string }) =>
      unwrapServerResult(await createAppointment({ data: input })),
  })

export const cancelAppointmentMutationOptions = () =>
  mutationOptions({
    mutationKey: ['appointments', 'cancel'],
    mutationFn: async (input: { appointmentId: string; reason?: string }) =>
      unwrapServerResult(await cancelAppointment({ data: input })),
  })
