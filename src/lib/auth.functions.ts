import { createMiddleware, createServerFn } from '@tanstack/react-start'
import { getRequestHeaders, setResponseStatus } from '@tanstack/react-start/server'
import { Result } from 'better-result'
import { eq } from 'drizzle-orm'
import * as z from 'zod'

import type { Permission } from '@/lib/permissions'

import { db } from '@/db'
import { accounts, sessions, users } from '@/db/schemas'
import { auth } from '@/lib/auth'
import { permissions } from '@/lib/permissions'
import { safeSerialize } from '@/lib/result'

export const getSession = createServerFn({ method: 'GET' }).handler(async () => {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })

  return session
})

export const ensureSession = createServerFn({ method: 'GET' }).handler(async () => {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })

  if (!session) {
    setResponseStatus(401)
    throw new Error('Unauthorized')
  }

  return session
})

export const ensureSessionMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) =>
    next({
      context: { session: await ensureSession() },
    }),
)

export const ensureRole = createServerFn()
  .inputValidator(z.enum(permissions))
  .handler(async ({ data: role }) => {
    const session = await ensureSession()

    if (session.user.role !== role) {
      setResponseStatus(403)
      throw new Error('Forbidden')
    }

    return session
  })

export const createRoleMiddleware = (role: Permission) =>
  createMiddleware({ type: 'function' }).server(async ({ next }) =>
    next({
      context: { session: await ensureRole({ data: role }) },
    }),
  )

export const softDeleteUser = createServerFn().handler(async () => {
  const { user } = await ensureSession()

  const result = await Result.tryPromise(async () => {
    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          name: 'Deleted User',
          email: `deleted_${user.id}@deleted.invalid`,
          firstName: 'Deleted User',
          lastName: 'Deleted User',
          image: null,
          emailVerified: false,
          deletedAt: new Date(),
        })
        .where(eq(users.id, user.id))

      await tx.delete(accounts).where(eq(accounts.userId, user.id))
      await tx.delete(sessions).where(eq(sessions.userId, user.id))
    })
  })

  return safeSerialize(result)
})
