import { createServerFn } from '@tanstack/react-start'

import { db } from '@/db'
import { ClientMedicinesRepository } from '@/db/repository/client-medicines.repository'
import { clientMedicines } from '@/db/schemas'

import { ensureSessionMiddleware } from './auth'

const clientMedicinesRepository = new ClientMedicinesRepository(db, clientMedicines)

export const getClientMedicines = createServerFn()
  .middleware([ensureSessionMiddleware])
  .handler(
    async ({ context: { session } }) =>
      await clientMedicinesRepository.findAllByClientId(session.user.id),
  )
