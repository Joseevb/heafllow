import { createFileRoute, redirect } from '@tanstack/react-router'

import { getSession, signUpUser } from '@/lib/functions/auth'

export const Route = createFileRoute('/auth/callback/social')({
  server: {
    handlers: {
      GET: async () => {
        const session = await getSession()
        if (!session) throw redirect({ to: '/auth/sign-up' })

        if (session.user.onboardingComplete) {
          console.log('[SOCIAL-CALLBACK] PRE EXISTING USER: REDIRECTING TO DASHBOARD]')
          throw redirect({ to: '/dashboard' })
        }

        console.log('[SOCIAL-CALLBACK] NEW USER: REDIRECTING TO USER-DATA FLOW')

        await signUpUser({
          data: {
            step: 'social',
            accountData: session.user,
          },
        })

        throw redirect({ to: '/auth/sign-up/user-data' })
      },
    },
  },
})
