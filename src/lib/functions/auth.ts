import { redirect } from '@tanstack/react-router'
import { createMiddleware, createServerFn } from '@tanstack/react-start'
import { getRequestHeaders, setResponseStatus } from '@tanstack/react-start/server'
import { Result } from 'better-result'
import { and, eq, inArray } from 'drizzle-orm'
import * as z from 'zod'

import type { CreateAddress } from '@/db/types/addresses.zod'
import type { CreateClient } from '@/db/types/clients.zod'
import type { Permission } from '@/lib/permissions'
import type {
  UserData,
  SerializableSignUpSession,
  signUpSchema,
  socialSignUpAccountSchema,
  userDataSchema,
} from '@/schemas/auth'
import type { SignUpState } from '@/types/auth'

import { db } from '@/db'
import { accounts, addresses, clients, sessions, subscriptions, users } from '@/db/schemas'
import { auth } from '@/lib/auth'
import { permissions } from '@/lib/permissions'
import { safeSerialize } from '@/lib/result'
import {
  finalizeOnboardingInputSchema,
  parsedUserDataSchema,
  serializableUserDataSchema,
  signUpSessionAccountDataSchema,
  signUpUserInputSchema,
} from '@/schemas/auth'
import {
  clearSignUpSession,
  getSignUpSession,
  updateSignUpSession,
} from '@/session/onboarding-session'
import { signUpState } from '@/types/auth'

type CompleteSignUpDraft = SerializableSignUpSession & {
  accountData: NonNullable<SerializableSignUpSession['accountData']>
  userData: UserData
}

export const getSession = createServerFn({ method: 'GET' }).handler(async () => {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })

  return session
})

export const ensureSession = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await getSession()

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

  return Result.tryPromise(async () => {
    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          name: 'Deleted User',
          email: `deleted_${user.id}@deleted.invalid`,
          image: null,
          emailVerified: false,
          deletedAt: new Date(),
        })
        .where(eq(users.id, user.id))

      await tx.delete(accounts).where(eq(accounts.userId, user.id))
      await tx.delete(sessions).where(eq(sessions.userId, user.id))
    })
  }).then(safeSerialize)
})

export const signUpUser = createServerFn({ method: 'POST' })
  .inputValidator(signUpUserInputSchema)
  .handler(async ({ data: input }) => {
    switch (input.step) {
      case 'account':
        return await saveAccountStep(input.accountData)
      case 'social':
        return await saveSocialStep(input.accountData)
      case 'user-data':
        return await submitUserDataStep(input.userData)
    }
  })

export const finalizeOnboarding = createServerFn({ method: 'POST' })
  .inputValidator(finalizeOnboardingInputSchema)
  .handler(async ({ data: input }) => {
    const session = await ensureSession()

    if (session.user.onboardingComplete) {
      await clearDraftIfPresent()
      return { success: true, alreadyComplete: true }
    }

    if (input?.requireActiveSubscription ?? true) {
      const hasActiveSubscription = await userHasActiveSubscription(session.user.id)

      if (!hasActiveSubscription) {
        return { success: false, reason: 'missing-active-subscription' as const }
      }
    }

    const draft = await requireCompleteSignUpDraft()
    const existingClient = await findClientByUserId(session.user.id)
    const existingAddress = await findAddressByUserId(session.user.id)
    const clientPayload: CreateClient = {
      clientId: session.user.id,
      firstName: draft.accountData.firstName ?? '',
      lastName: draft.accountData.lastName ?? '',
      birthDate: draft.userData.birthDate,
      phoneNumber: draft.userData.phoneNumber,
      primaryCareSpecialist: draft.userData.primaryCareSpecialist,
    }
    const addressPayload: CreateAddress = {
      userId: session.user.id,
      street: draft.userData.address.street,
      city: draft.userData.address.city,
      state: draft.userData.address.state,
      country: draft.userData.address.country,
      zipCode: draft.userData.address.zipCode,
    }

    await db.transaction(async (tx) => {
      if (!existingClient) {
        await tx.insert(clients).values(clientPayload)
      }

      if (!existingAddress) {
        await tx.insert(addresses).values(addressPayload)
      }

      await tx.update(users).set({ onboardingComplete: true }).where(eq(users.id, session.user.id))
    })

    await clearSignUpSession()

    return { success: true, alreadyComplete: false }
  })

export const finalizeOnboardingIfReady = createServerFn({ method: 'POST' }).handler(async () => {
  const session = await getSession()

  if (!session || session.user.onboardingComplete) {
    return { success: true, skipped: true }
  }

  const draft = await getSignUpSession()

  if (!draft.accountData || !draft.userData) {
    return { success: true, skipped: true }
  }

  const result = await finalizeOnboarding({ data: { requireActiveSubscription: true } })

  return { ...result, skipped: false }
})

export const validateSignUpSession = createServerFn()
  .inputValidator(z.enum(signUpState))
  .handler(async ({ data: expectedState }) => {
    const session = await getSignUpSession()

    const flowOrder: Array<SignUpState | undefined> = [
      'account',
      'social-sign-on',
      'user-data',
      'success',
    ]
    const currentIdx = flowOrder.indexOf(session.state)
    const expectedIdx = flowOrder.indexOf(expectedState)

    if (currentIdx > expectedIdx) {
      throw redirect({ to: '/auth/sign-up' })
    }

    if (expectedState === 'user-data' && !session.accountData) {
      throw redirect({ to: '/auth/sign-up' })
    }

    return session
  })

async function saveAccountStep(accountData: z.infer<typeof signUpSchema>) {
  const serializedResult = await updateSignUpSession({
    data: {
      accountData: serializeAccountData(accountData),
      state: 'account',
    },
  })

  return { success: Result.deserialize(serializedResult).isOk() }
}

async function saveSocialStep(accountData: z.infer<typeof socialSignUpAccountSchema>) {
  const serializedResult = await updateSignUpSession({
    data: {
      accountData: {
        firstName: accountData.firstName ?? '',
        lastName: accountData.lastName ?? '',
        email: accountData.email,
        image: accountData.image ?? undefined,
      },
      state: 'social-sign-on',
    },
  })

  return { success: Result.deserialize(serializedResult).isOk() }
}

async function submitUserDataStep(userData: z.infer<typeof userDataSchema>) {
  const draft = await requireSignUpDraft()
  const accountData = draft.accountData
  const serializableUserData = serializeUserData(userData)

  const serializedResult = await updateSignUpSession({
    data: {
      ...draft,
      userData: serializableUserData,
      state: 'user-data',
    },
  })

  if (Result.deserialize(serializedResult).isErr()) {
    throw new Error('Failed to update sign-up session')
  }

  if (!accountData.password) {
    return { success: true, nextStep: 'payment' as const }
  }

  const headers = getRequestHeaders()

  await auth.api.signUpEmail({
    body: {
      name: `${accountData.firstName} ${accountData.lastName}`.trim(),
      email: accountData.email,
      password: accountData.password,
      image: accountData.image,
    },
    headers,
  })

  return { success: true, nextStep: 'payment' as const }
}

function serializeAccountData(accountData: z.infer<typeof signUpSchema>) {
  return signUpSessionAccountDataSchema.parse(accountData)
}

async function requireSignUpDraft() {
  const draft = await getSignUpSession()

  if (!draft.accountData) {
    throw new Error('Missing sign-up account data')
  }

  return draft as SerializableSignUpSession & {
    accountData: NonNullable<SerializableSignUpSession['accountData']>
  }
}

async function requireCompleteSignUpDraft() {
  const draft = await requireSignUpDraft()

  if (!draft.userData) {
    throw new Error('Missing sign-up user data')
  }

  const userData = parsedUserDataSchema.parse({
    ...draft.userData,
    birthDate: new Date(draft.userData.birthDate),
  })

  return {
    ...draft,
    userData,
  } as CompleteSignUpDraft
}

function serializeUserData(userData: UserData) {
  return serializableUserDataSchema.parse({
    ...userData,
    birthDate: userData.birthDate.toISOString(),
  })
}

async function clearDraftIfPresent() {
  const draft = await getSignUpSession()

  if (draft.accountData || draft.userData || draft.state) {
    await clearSignUpSession()
  }
}

async function userHasActiveSubscription(userId: string) {
  const activeSubscriptions = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.referenceId, userId),
        inArray(subscriptions.status, ['active', 'trialing']),
      ),
    )

  return activeSubscriptions.length > 0
}

async function findClientByUserId(userId: string) {
  const existingClients = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.clientId, userId))
    .limit(1)

  return existingClients[0]
}

async function findAddressByUserId(userId: string) {
  const existingAddresses = await db
    .select({ id: addresses.id })
    .from(addresses)
    .where(eq(addresses.userId, userId))
    .limit(1)

  return existingAddresses[0]
}
