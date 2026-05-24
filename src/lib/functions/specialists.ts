import { createServerFn } from '@tanstack/react-start'
import { Result } from 'better-result'
import { getTableColumns } from 'drizzle-orm'
import * as z from 'zod'

import { db } from '@/db'
import { EntityNotFoundError } from '@/db/repository/base-repository'
import { SpecialistsDataRepository } from '@/db/repository/specialists-data.repository'
import { UsersRepository } from '@/db/repository/users.repository'
import { specialistsData, users } from '@/db/schemas'
import { selectUsersSchema } from '@/db/types/auth.zod'
import { selectSpecialistDataSchema } from '@/db/types/specialists-data.zod'
import { safeSerialize } from '@/lib/result'

import { ensureSessionMiddleware } from './auth'

const specialistRepository = new SpecialistsDataRepository(db, specialistsData)
const usersRepository = new UsersRepository(db, users)

const specialistFieldKeys = Object.keys({
  ...selectUsersSchema.shape,
  ...selectSpecialistDataSchema.shape,
})

const specialistFieldSchema = z.enum(specialistFieldKeys as [string, ...Array<string>])

const getSpecialistsByQuerySchema = z.object({
  field: specialistFieldSchema,
  value: z.string().nonempty().nonoptional(),
})

const requiredString = z.string().nonempty().nonoptional()

function createSpecialistNotFoundError(specialistId: string) {
  return new EntityNotFoundError({
    field: 'specialistId',
    value: specialistId,
  })
}

export const getSpecialistByQuery = createServerFn()
  .inputValidator(getSpecialistsByQuerySchema)
  .handler(async ({ data }) => {
    const { field, value } = data

    const sdColumns = getTableColumns(specialistsData)
    const sdFieldSet = new Set(Object.keys(sdColumns))

    let specialistIds: Array<string>

    if (sdFieldSet.has(field)) {
      const rows = await specialistRepository.findAllSpecialistIdsByField(
        field as keyof typeof sdColumns,
        value,
      )
      specialistIds = rows.map((r) => r.id)
    } else {
      const rows = await usersRepository.findAllSpecialistsByField(
        field as keyof ReturnType<typeof getTableColumns<typeof users>>,
        value,
      )
      specialistIds = rows.map((r) => r.id)
    }

    if (specialistIds.length === 0) return []

    const specialists = await usersRepository.findAllSpecialistsByIds(specialistIds)

    const specialistDataNested = await Promise.all(
      specialists.map(async (s) => ({
        user: s,
        specialistData: await specialistRepository.findBySpecialistId(s.id),
      })),
    )

    return specialistDataNested
      .filter(({ specialistData }) => specialistData)
      .map(({ user, specialistData }) => ({
        ...user,
        specialistData,
      }))
  })

export const getSpecialists = createServerFn().handler(async () => {
  const specialists = await usersRepository.findAllSpecialists()

  const specialistDataNested = await Promise.all(
    specialists.map(async (s) => ({
      user: s,
      specialistData: await specialistRepository.findBySpecialistId(s.id),
    })),
  )

  return specialistDataNested
    .filter(({ specialistData }) => specialistData)
    .map(({ user, specialistData }) => ({
      ...user,
      specialistData,
    }))
})

export const getSpecialistById = createServerFn()
  .middleware([ensureSessionMiddleware])
  .inputValidator(requiredString)
  .handler(async ({ data: specialistId }) => {
    const userResult = await Result.tryPromise({
      try: async () => {
        const user = await usersRepository.findSpecialistById(specialistId)
        if (!user) {
          throw createSpecialistNotFoundError(specialistId)
        }

        return user
      },
      catch: (cause) =>
        cause instanceof EntityNotFoundError ? cause : createSpecialistNotFoundError(specialistId),
    })

    const specialistDataResult = await Result.tryPromise({
      try: async () => {
        const specialist = await specialistRepository.findBySpecialistId(specialistId)

        if (!specialist) {
          throw createSpecialistNotFoundError(specialistId)
        }

        return specialist
      },
      catch: (cause) =>
        cause instanceof EntityNotFoundError ? cause : createSpecialistNotFoundError(specialistId),
    })

    return Result.gen(async function* () {
      const user = yield* userResult
      const specialist = yield* specialistDataResult

      return Result.ok({
        ...user,
        specialistData: specialist,
      })
    }).then(safeSerialize)
  })
