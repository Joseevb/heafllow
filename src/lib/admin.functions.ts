import { createServerFn } from '@tanstack/react-start'
import { Result } from 'better-result'
import { and, desc, eq, inArray } from 'drizzle-orm'
import * as z from 'zod'

import type { UpdateUserData } from '@/types/auth'

import { db } from '@/db'
import { ClientsRepository } from '@/db/repository/clients-repository'
import { SpecialistsDataRepository } from '@/db/repository/specialists-data.repository'
import { UsersRepository } from '@/db/repository/users.repository'
import { accounts, clients, sessions, specialistsData, subscriptions, users } from '@/db/schemas'
import { auth } from '@/lib/auth'
import { authClient } from '@/lib/auth-client'
import { createRoleMiddleware } from '@/lib/auth.functions'
import { safeSerialize } from '@/lib/result'
import { adminAddSpecialistFormSchema } from '@/schemas/admin-add-specialist'

const usersRepository = new UsersRepository(db, users)
const clientsRepository = new ClientsRepository(db, clients)
const specialistsDataRepository = new SpecialistsDataRepository(db, specialistsData)

const adminRoleSchema = z.enum(['admin', 'client', 'specialist'])

const adminUserListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  image: z.string().nullable(),
  role: adminRoleSchema.nullable(),
  banned: z.boolean().nullable(),
  stripeCustomerId: z.string().nullable(),
  onboardingComplete: z.boolean(),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  hasActiveSubscription: z.boolean(),
})

const listAdminUsersResultSchema = z.array(adminUserListItemSchema)

const roleTransitionValidationSchema = z.object({
  allowed: z.boolean(),
  message: z.string(),
})

const adminUserDeletionValidationSchema = z.object({
  allowed: z.boolean(),
  message: z.string(),
  reason: z.enum(['ok', 'not-found', 'active-subscription']),
})

export type AdminUserListItem = z.infer<typeof adminUserListItemSchema>
export type RoleTransitionValidation = z.infer<typeof roleTransitionValidationSchema>
export type AdminUserDeletionValidation = z.infer<typeof adminUserDeletionValidationSchema>

export const softDeleteUserById = createServerFn()
  .inputValidator(z.string().nonempty().nonoptional())
  .middleware([createRoleMiddleware('admin')])
  .handler(async ({ data: userId }) =>
    Result.tryPromise(async () => {
      await db.transaction(async (tx) => {
        await tx
          .update(users)
          .set({
            name: 'Deleted User',
            email: `deleted_${userId}@deleted.invalid`,
            image: null,
            emailVerified: false,
            deletedAt: new Date(),
          })
          .where(eq(users.id, userId))

        await tx.delete(accounts).where(eq(accounts.userId, userId))
        await tx.delete(sessions).where(eq(sessions.userId, userId))
      })
    }).then(safeSerialize),
  )

export const listAdminUsers = createServerFn()
  .middleware([createRoleMiddleware('admin')])
  .handler(async () => {
    const rows = await db.select().from(users).orderBy(desc(users.createdAt))

    const activeSubscriptionRows = await db
      .select({ referenceId: subscriptions.referenceId })
      .from(subscriptions)
      .where(inArray(subscriptions.status, ['active', 'trialing']))

    const subscribedUserIds = new Set(activeSubscriptionRows.map((row) => row.referenceId))

    return listAdminUsersResultSchema.parse(
      rows.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image ?? null,
        role:
          user.role === 'admin' || user.role === 'client' || user.role === 'specialist'
            ? user.role
            : null,
        banned: user.banned ?? null,
        stripeCustomerId: user.stripeCustomerId ?? null,
        onboardingComplete: user.onboardingComplete,
        deletedAt: user.deletedAt ?? null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        hasActiveSubscription: subscribedUserIds.has(user.id),
      })),
    )
  })

export const validateAdminUserRoleTransition = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      userId: z.string().nonempty().nonoptional(),
      role: adminRoleSchema,
    }),
  )
  .middleware([createRoleMiddleware('admin')])
  .handler(async ({ data }) =>
    roleTransitionValidationSchema.parse(await getRoleTransitionValidation(data)),
  )

export const updateUserById = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      userId: z.string().nonempty().nonoptional(),
      data: z.custom<UpdateUserData>(),
    }),
  )
  .middleware([createRoleMiddleware('admin')])
  .handler(async ({ data }) => {
    const nextRole = parseAdminRole(data.data.role)

    if (nextRole) {
      const validation = await getRoleTransitionValidation({
        userId: data.userId,
        role: nextRole,
      })

      if (!validation.allowed) {
        return safeSerialize(Result.err({ message: validation.message }))
      }
    }

    const { data: res, error } = await authClient.admin.updateUser(data)

    if (error) {
      return safeSerialize(Result.err({ message: error.message }))
    }

    return safeSerialize(Result.ok(res))
  })

export const validateAdminUserDeletion = createServerFn()
  .inputValidator(z.string().nonempty().nonoptional())
  .middleware([createRoleMiddleware('admin')])
  .handler(async ({ data: userId }) =>
    adminUserDeletionValidationSchema.parse(await getDeleteValidation(userId)),
  )

export const createSpecialistUser = createServerFn({ method: 'POST' })
  .inputValidator(adminAddSpecialistFormSchema)
  .middleware([createRoleMiddleware('admin')])
  .handler(async ({ data }) =>
    Result.tryPromise(async () => {
      const createdUser = await auth.api.createUser({
        body: {
          email: data.email,
          password: data.password,
          name: `${data.firstName} ${data.lastName}`.trim(),
          role: 'specialist',
          data: {
            onboardingComplete: true,
          },
        },
      })

      const specialistResult = await specialistsDataRepository.save({
        specialistId: createdUser.user.id,
        licenseNumber: data.licenseNumber,
        specialty: data.specialty,
        consultationDurationMinutes: data.consultationDurationMinutes,
      })

      return specialistResult.match({
        ok: (specialistProfile) => ({
          user: createdUser.user,
          specialistProfile,
        }),
        err: (error) => {
          throw new Error(error.message)
        },
      })
    }).then(safeSerialize),
  )

async function getRoleTransitionValidation({
  userId,
  role,
}: {
  userId: string
  role: z.infer<typeof adminRoleSchema>
}): Promise<RoleTransitionValidation> {
  const user = await usersRepository.findByIdOrUndefined(userId)

  if (!user) {
    return {
      allowed: false,
      message: 'User not found.',
    }
  }

  const currentRole = parseAdminRole(user.role)

  if (currentRole === role) {
    return {
      allowed: true,
      message: 'Role is unchanged.',
    }
  }

  const [clientProfile, specialistProfile, hasAssignedClients] = await Promise.all([
    clientsRepository.findByClientId(userId),
    specialistsDataRepository.findBySpecialistId(userId),
    clientsRepository.hasPrimaryCareSpecialistReferences(userId),
  ])

  if (role === 'client' && !clientProfile) {
    return {
      allowed: false,
      message:
        'This user does not have a client profile yet. Create the client record before changing their role to client.',
    }
  }

  if (role === 'specialist' && !specialistProfile) {
    return {
      allowed: false,
      message:
        'This user does not have specialist profile data yet. Create the specialist profile before changing their role to specialist.',
    }
  }

  if (currentRole === 'specialist' && role !== 'specialist' && hasAssignedClients) {
    return {
      allowed: false,
      message:
        'This specialist is still assigned as a primary care specialist for one or more clients. Reassign those clients before changing the role.',
    }
  }

  return {
    allowed: true,
    message: 'Role can be updated.',
  }
}

async function getDeleteValidation(userId: string): Promise<AdminUserDeletionValidation> {
  const [user, activeSubscriptions] = await Promise.all([
    usersRepository.findByIdOrUndefined(userId),
    db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.referenceId, userId),
          inArray(subscriptions.status, ['active', 'trialing']),
        ),
      ),
  ])

  if (!user) {
    return {
      allowed: false,
      message: 'User not found.',
      reason: 'not-found',
    }
  }

  if (activeSubscriptions.length > 0) {
    return {
      allowed: false,
      message: 'This user has an active subscription and cannot be deleted.',
      reason: 'active-subscription',
    }
  }

  return {
    allowed: true,
    message: 'User can be deleted.',
    reason: 'ok',
  }
}

function parseAdminRole(role: UpdateUserData['role'] | string | null | undefined) {
  if (role === 'admin' || role === 'client' || role === 'specialist') {
    return role
  }

  return null
}
