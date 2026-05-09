import { createServerFn } from '@tanstack/react-start'
import { and, eq, getTableColumns, inArray } from 'drizzle-orm'
import * as z from 'zod'

import { db } from '@/db'
import { SpecialistsDataRepository } from '@/db/repository/specialists-data.repository'
import { specialistsData, users } from '@/db/schemas'
import { selectUsersSchema } from '@/db/types/auth.zod'
import { selectSpecialistDataSchema } from '@/db/types/specialists-data.zod'

const specialistRepository = new SpecialistsDataRepository(db, specialistsData)

const specialistFieldKeys = Object.keys({
  ...selectUsersSchema.shape,
  ...selectSpecialistDataSchema.shape,
})

const specialistFieldSchema = z.enum(specialistFieldKeys as [string, ...Array<string>])

const getSpecialistsByQuerySchema = z.object({
  field: specialistFieldSchema,
  value: z.string().nonempty().nonoptional(),
})

export const getSpecialistByQuery = createServerFn()
  .inputValidator(getSpecialistsByQuerySchema)
  .handler(async ({ data }) => {
    const { field, value } = data

    const sdColumns = getTableColumns(specialistsData)
    const sdFieldSet = new Set(Object.keys(sdColumns))

    let specialistIds: Array<string>

    if (sdFieldSet.has(field)) {
      const rows = await db
        .select({ id: specialistsData.specialistId })
        .from(specialistsData)
        .where(eq(sdColumns[field as keyof typeof sdColumns] as any, value))
      specialistIds = rows.map((r) => r.id)
    } else {
      const rows = await db
        .select({ id: users.id })
        .from(users)
        .where(
          and(
            eq(users.role, 'specialist'),
            eq(
              getTableColumns(users)[
                field as keyof ReturnType<typeof getTableColumns<typeof users>>
              ] as any,
              value,
            ),
          ),
        )
      specialistIds = rows.map((r) => r.id)
    }

    if (specialistIds.length === 0) return []

    const specialists = await db
      .select()
      .from(users)
      .where(and(eq(users.role, 'specialist'), inArray(users.id, specialistIds)))

    const specialistDataNested = await Promise.all(
      specialists.map(async (s) => ({
        user: s,
        data: await specialistRepository.findBySpecialistId(s.id),
      })),
    )

    return specialistDataNested
      .filter(({ data: sd }) => sd.length > 0)
      .map(({ user, data: sd }) => ({
        ...user,
        specialistData: sd[0],
      }))
  })

export const getSpecialists = createServerFn().handler(async () => {
  const specialists = await db.select().from(users).where(eq(users.role, 'specialist'))

  const specialistDataNested = await Promise.all(
    specialists.map(async (s) => ({
      user: s,
      data: await specialistRepository.findBySpecialistId(s.id),
    })),
  )

  return specialistDataNested
    .filter(({ data: sd }) => sd.length > 0)
    .map(({ user, data: sd }) => ({
      ...user,
      specialistData: sd[0],
    }))
})
