import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

import { ModeToggle } from '@/components/mode-toggle'
import { Button } from '@/components/ui/button'
import { getSession } from '@/lib/functions/auth'

export const Route = createFileRoute('/auth')({
  component: RouteComponent,
  beforeLoad: async ({ location }) => {
    // Onboarding sub-routes (social-callback, sign-up/user-data, payment)
    // need to be accessible to authenticated users who haven't completed onboarding
    if (location.pathname !== '/auth' && location.pathname !== '/auth/sign-up') return

    const session = await getSession()

    if (session) throw redirect({ to: '/dashboard' })
  },
})

function RouteComponent() {
  return (
    <div>
      <div className="absolute top-5 left-5 space-x-2">
        <Button
          size="icon"
          render={
            <Link to="/">
              <ArrowLeft />
            </Link>
          }
        />
        <ModeToggle mode="small" />
      </div>
      <Outlet />
    </div>
  )
}
