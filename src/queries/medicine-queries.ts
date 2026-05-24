import { queryOptions } from '@tanstack/react-query'

import { getClientMedicines } from '@/lib/functions/medicines'

export const getClientMedicinesQueryOptions = () =>
  queryOptions({
    queryKey: ['client-medicines'],
    queryFn: getClientMedicines,
  })
