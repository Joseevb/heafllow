import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'

import type { SettingsFormValues } from '@/schemas/settings'

import { db } from '@/db'
import { AddressesRepository } from '@/db/repository/addresses.repository'
import { ClientsRepository } from '@/db/repository/clients-repository'
import { UsersRepository } from '@/db/repository/users.repository'
import { addresses, clients, users } from '@/db/schemas'
import { ensureSessionMiddleware } from '@/lib/functions/auth'
import { settingsFormSchema } from '@/schemas/settings'

const usersRepository = new UsersRepository(db, users)
const clientsRepository = new ClientsRepository(db, clients)
const addressesRepository = new AddressesRepository(db, addresses)

async function getAccountSummary(userId: string) {
  const user = await usersRepository.findById(userId).then((result) =>
    result.match({
      ok: (value) => value,
      err: () => undefined,
    }),
  )

  if (!user) {
    throw new Error('Unable to load account')
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
    onboardingComplete: user.onboardingComplete,
    createdAt: user.createdAt,
  }
}

export const getCurrentAccountSummary = createServerFn()
  .middleware([ensureSessionMiddleware])
  .handler(async ({ context: { session } }) => await getAccountSummary(session.user.id))

export const getUserSettings = createServerFn()
  .middleware([ensureSessionMiddleware])
  .handler(async ({ context: { session } }) => {
    const [user, client, address] = await Promise.all([
      getAccountSummary(session.user.id),
      clientsRepository.findByClientId(session.user.id),
      addressesRepository.findByUserId(session.user.id),
    ])

    if (!client) {
      throw new Error('Unable to load settings')
    }

    return {
      account: user,
      profile: {
        firstName: client.firstName,
        lastName: client.lastName,
        birthDate: client.birthDate,
        phoneNumber: client.phoneNumber,
        primaryCareSpecialist: client.primaryCareSpecialist,
      },
      address: {
        street: address?.street ?? '',
        city: address?.city ?? '',
        state: address?.state ?? '',
        country: address?.country ?? '',
        zipCode: address?.zipCode ?? '',
      },
    }
  })

export const updateUserSettings = createServerFn({ method: 'POST' })
  .inputValidator(settingsFormSchema)
  .middleware([ensureSessionMiddleware])
  .handler(async ({ data, context: { session } }) => {
    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          name: `${data.firstName} ${data.lastName}`.trim(),
          email: data.email,
          updatedAt: new Date(),
        })
        .where(eq(users.id, session.user.id))

      const existingClient = await clientsRepository.findByClientId(session.user.id)

      if (existingClient) {
        await tx
          .update(clients)
          .set({
            firstName: data.firstName,
            lastName: data.lastName,
            birthDate: data.birthDate,
            phoneNumber: data.phoneNumber,
            primaryCareSpecialist: data.primaryCareSpecialist,
            updatedAt: new Date(),
          })
          .where(eq(clients.id, existingClient.id))
      }

      const existingAddress = await addressesRepository.findByUserId(session.user.id)

      if (existingAddress) {
        await tx
          .update(addresses)
          .set({
            ...data.address,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(addresses.id, existingAddress.id))
      } else {
        await tx.insert(addresses).values({
          ...data.address,
          userId: session.user.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }
    })

    return {
      success: true,
      value: data,
    } satisfies { success: true; value: SettingsFormValues }
  })
