import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import * as z from 'zod'

import type { Address } from '@/db/types/addresses.zod'
import type { User } from '@/db/types/auth.zod'
import type { Client } from '@/db/types/clients.zod'

import { ModeToggle } from '@/components/mode-toggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/db'
import { ClientsRepository } from '@/db/repository/clients-repository'
import { accounts, addresses, clients, sessions, subscriptions } from '@/db/schemas'
import { authClient } from '@/lib/auth-client'
import { finalizeOnboardingIfReady, getSession } from '@/lib/auth.functions'

export const Route = createFileRoute('/dashboard/')({
  component: RouteComponent,
  beforeLoad: async () => {
    await finalizeOnboardingIfReady()

    const session = await getSession()

    if (!session) throw redirect({ to: '/auth' })

    const clientData = await getClientData({ data: session.user.id })
    const addressData = await getAddressData({ data: session.user.id })
    const authData = await getAuthData({ data: session.user.id })

    if (!clientData) {
      throw redirect({ to: '/auth/sign-up/payment' })
    }

    const user: User = {
      ...session.user,
      image: session.user.image ?? null,
      role: session.user.role ?? null,
      banned: session.user.banned ?? null,
      banReason: session.user.banReason ?? null,
      banExpires: session.user.banExpires ?? null,
      stripeCustomerId: session.user.stripeCustomerId ?? null,
      deletedAt: session.user.deletedAt ?? null,
    }

    return { user, clientData, addressData, authData }
  },
})

const getClientData = createServerFn()
  .inputValidator(z.string())
  .handler(async ({ data: clientId }) => {
    const repo = new ClientsRepository(db, clients)
    return await repo.findByClientId(clientId)
  })

const getAddressData = createServerFn()
  .inputValidator(z.string())
  .handler(async ({ data: userId }) => {
    const result = await db.select().from(addresses).where(eq(addresses.userId, userId)).limit(1)

    return result[0]
  })

const getAuthData = createServerFn()
  .inputValidator(z.string())
  .handler(async ({ data: userId }) => {
    const [userSessions, userAccounts, userSubscriptions] = await Promise.all([
      db.select().from(sessions).where(eq(sessions.userId, userId)),
      db.select().from(accounts).where(eq(accounts.userId, userId)),
      db.select().from(subscriptions).where(eq(subscriptions.referenceId, userId)),
    ])

    return {
      sessions: userSessions,
      accounts: userAccounts,
      subscriptions: userSubscriptions,
    }
  })

type DashboardData = {
  authUser: User
  client: Client
  address: Address | undefined
  sessions: Array<typeof sessions.$inferSelect>
  accounts: Array<typeof accounts.$inferSelect>
  subscriptions: Array<typeof subscriptions.$inferSelect>
}

function buildDashboardData(
  user: User,
  clientData: Client,
  addressData: Address | undefined,
  authData: {
    sessions: Array<typeof sessions.$inferSelect>
    accounts: Array<typeof accounts.$inferSelect>
    subscriptions: Array<typeof subscriptions.$inferSelect>
  },
): DashboardData {
  return {
    authUser: user,
    client: clientData,
    address: addressData,
    sessions: authData.sessions,
    accounts: authData.accounts,
    subscriptions: authData.subscriptions,
  }
}

function RouteComponent() {
  const { user, clientData, addressData, authData } = Route.useRouteContext()

  const navigate = useNavigate()

  const data = buildDashboardData(user, clientData, addressData, authData)

  return (
    <>
      <Button
        variant="destructive"
        onClick={async () => {
          await authClient.signOut()
          navigate({ to: '/auth' })
        }}
      >
        Logout
      </Button>
      <ModeToggle mode="small" />
      <Card>
        <CardHeader>
          <CardTitle>Hello "/dashboard"!</CardTitle>
        </CardHeader>
        <CardContent>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </CardContent>
      </Card>
    </>
  )
}
