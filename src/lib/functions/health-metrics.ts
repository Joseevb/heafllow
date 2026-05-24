import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { db } from '@/db'
import { HealthMetricRepository } from '@/db/repository/health-metric.repository'
import { healthMetrics } from '@/db/schemas'

import { ensureSessionMiddleware } from './auth'

const healthMetricsRepository = new HealthMetricRepository(db, healthMetrics)

export const getClientMetrics = createServerFn()
  .middleware([ensureSessionMiddleware])
  .handler(
    async ({ context: { session } }) =>
      await healthMetricsRepository.findAllByClientId(session.user.id),
  )

const datesSchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
})

export type FromToDates = z.infer<typeof datesSchema>

export const getRecentClientMetrics = createServerFn()
  .middleware([ensureSessionMiddleware])
  .inputValidator(datesSchema)
  .handler(
    async ({ data: dates, context: { session } }) =>
      await healthMetricsRepository.findAllByClientIdBetweenDates(
        session.user.id,
        dates.from,
        dates.to,
      ),
  )
