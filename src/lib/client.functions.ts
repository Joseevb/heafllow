import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { db } from '@/db'
import { ClientsRepository } from '@/db/repository/clients-repository'
import { clients } from '@/db/schemas'
import { insertClientSchema } from '@/db/types/clients.zod'
import { safeSerialize } from '@/lib/result'

const clientsRepository = new ClientsRepository(db, clients)

export const saveClientData = createServerFn({ method: 'POST' })
  .inputValidator(insertClientSchema)
  .handler(async ({ data }) => clientsRepository.save(data).then(safeSerialize))

export const findByClientId = createServerFn()
  .inputValidator(z.string().nonempty().nonoptional())
  .handler(async ({ data }) => clientsRepository.findByClientId(data))
