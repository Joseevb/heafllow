import { mutationOptions, queryOptions } from '@tanstack/react-query'
import { Result } from 'better-result'

import type {
  SpecialistAppointmentUpdateInput,
  SpecialistAvailabilityFormValues,
  SpecialistStartAppointmentInput,
} from '@/schemas/specialist'

import {
  completeSpecialistAppointment,
  deleteSpecialistAvailability,
  getSpecialistAppointmentById,
  getSpecialistAppointments,
  getSpecialistAvailability,
  getSpecialistOverview,
  searchExternalMedicines,
  upsertSpecialistAvailability,
  updateSpecialistAppointment,
} from '@/lib/specialist-dashboard.functions'

function unwrapServerResult<T>(
  result:
    | Awaited<ReturnType<typeof upsertSpecialistAvailability>>
    | Awaited<ReturnType<typeof deleteSpecialistAvailability>>
    | Awaited<ReturnType<typeof updateSpecialistAppointment>>
    | Awaited<ReturnType<typeof completeSpecialistAppointment>>,
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

export const specialistOverviewQueryOptions = () =>
  queryOptions({
    queryKey: ['specialist', 'overview'],
    queryFn: getSpecialistOverview,
  })

export const specialistAppointmentsQueryOptions = () =>
  queryOptions({
    queryKey: ['specialist', 'appointments'],
    queryFn: getSpecialistAppointments,
  })

export const specialistAvailabilityQueryOptions = () =>
  queryOptions({
    queryKey: ['specialist', 'availability'],
    queryFn: getSpecialistAvailability,
  })

export const specialistAppointmentDetailQueryOptions = (appointmentId: string) =>
  queryOptions({
    queryKey: ['specialist', 'appointments', appointmentId],
    queryFn: () => getSpecialistAppointmentById({ data: { appointmentId } }),
  })

export const specialistMedicineSearchQueryOptions = (query: string) =>
  queryOptions({
    queryKey: ['specialist', 'medicine-search', query],
    queryFn: () => searchExternalMedicines({ data: { query } }),
  })

export const upsertSpecialistAvailabilityMutationOptions = () =>
  mutationOptions({
    mutationKey: ['specialist', 'availability', 'upsert'],
    mutationFn: async (input: SpecialistAvailabilityFormValues) =>
      unwrapServerResult(await upsertSpecialistAvailability({ data: input })),
  })

export const deleteSpecialistAvailabilityMutationOptions = () =>
  mutationOptions({
    mutationKey: ['specialist', 'availability', 'delete'],
    mutationFn: async (id: string) =>
      unwrapServerResult(await deleteSpecialistAvailability({ data: id })),
  })

export const updateSpecialistAppointmentMutationOptions = () =>
  mutationOptions({
    mutationKey: ['specialist', 'appointments', 'update'],
    mutationFn: async (input: SpecialistAppointmentUpdateInput) =>
      unwrapServerResult(await updateSpecialistAppointment({ data: input })),
  })

export const completeSpecialistAppointmentMutationOptions = () =>
  mutationOptions({
    mutationKey: ['specialist', 'appointments', 'complete'],
    mutationFn: async (input: SpecialistStartAppointmentInput) =>
      unwrapServerResult(await completeSpecialistAppointment({ data: input })),
  })
