import { createServerFn } from '@tanstack/react-start'

import { db } from '@/db'
import { HealthScoreRepository } from '@/db/repository/health-score.repository'
import { healthScore } from '@/db/schemas'

import { ensureSessionMiddleware } from './auth'

const healthScoreRepository = new HealthScoreRepository(db, healthScore)

export const getClientLatestHealthScore = createServerFn()
  .middleware([ensureSessionMiddleware])
  .handler(
    async ({ context: { session } }) =>
      (await healthScoreRepository.findLatestByClientId(session.user.id)) ?? null,
  )
