import { createFileRoute, redirect } from '@tanstack/react-router'

import { finalizeOnboarding, getSession } from '@/lib/functions/auth'

export const Route = createFileRoute('/auth/callback/payment')({
  server: {
    handlers: {
      GET: async () => {
        const session = await getSession()

        if (!session) {
          throw redirect({ to: '/auth' })
        }

        if (session.user.onboardingComplete) {
          throw redirect({ to: '/dashboard' })
        }

        const result = await finalizeOnboarding({ data: { requireActiveSubscription: true } })

        if (!result.success) {
          throw redirect({
            to: '/auth/sign-up/payment',
            search: { error: 'provisioning_failed' },
          })
        }

        throw redirect({ to: '/dashboard' })
      },
    },
  },
})
