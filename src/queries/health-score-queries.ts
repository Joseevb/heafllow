import { queryOptions } from '@tanstack/react-query'

import { getClientLatestHealthScore } from '@/lib/functions/health-score'

export const getClientLatestHealthScoreQueryOptions = () =>
  queryOptions({
    queryKey: ['latest-query-options'],
    queryFn: getClientLatestHealthScore,
  })
