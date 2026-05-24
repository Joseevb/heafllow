import { queryOptions } from '@tanstack/react-query'

import { getSpecialistByQuery, getSpecialists } from '@/lib/functions/specialists'
import { SPECIALTIES } from '@/types/specialties'

function isActiveSpecialist<
  TSpecialist extends { banned?: boolean | null; deletedAt?: Date | null },
>(specialist: TSpecialist) {
  return !specialist.banned && !specialist.deletedAt
}

export const availableSpecialistsQueryOptions = () =>
  queryOptions({
    queryKey: ['specialists', 'all'],
    queryFn: async () => (await getSpecialists()).filter(isActiveSpecialist),
  })

export const primaryCareSpecialistQueryOptions = queryOptions({
  queryKey: ['specialists', 'primary care'],
  queryFn: async () =>
    (
      await getSpecialistByQuery({
        data: {
          field: 'specialty',
          value: SPECIALTIES[0],
        },
      })
    ).filter(isActiveSpecialist),
})
