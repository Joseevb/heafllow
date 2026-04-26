import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { getSession } from '@/lib/auth.functions'

export const Route = createFileRoute('/admin')({
  beforeLoad: async ({ location }) => {
    const session = await getSession()

    if (!session || session.user.role != 'admin') {
      throw redirect({
        to: '/auth',
        search: { redirect: location.href },
      })
    }

    return { user: session.user }
  },
  component: () => <Outlet />,
})
