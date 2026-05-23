import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { CalendarClock, Home, Settings } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import type { SidebarItems } from '@/components/app-sidebar'

import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider, useSidebar } from '@/components/ui/sidebar'
import { UserMenu } from '@/components/user-menu'
import { getSession } from '@/lib/auth.functions'

export const Route = createFileRoute('/specialist')({
  beforeLoad: async ({ location }) => {
    const session = await getSession()

    if (!session || session.user.role !== 'specialist') {
      throw redirect({
        to: '/auth',
        search: { redirect: location.href },
      })
    }

    return { session }
  },
  component: RouteComponent,
})

const sidebarItems = (): SidebarItems => [
  { title: 'Overview', icon: Home, url: '/specialist' },
  { title: 'Appointments', icon: CalendarClock, url: '/specialist/appointments' },
  { title: 'Availability', icon: Settings, url: '/specialist/availability' },
]

function RouteComponent() {
  const {
    session: { user },
  } = Route.useRouteContext()

  return (
    <SidebarProvider defaultOpen={true}>
      <SpecialistLayout user={user} />
    </SidebarProvider>
  )
}

function SpecialistLayout({
  user,
}: {
  user: ReturnType<typeof Route.useRouteContext>['session']['user']
}) {
  const { state } = useSidebar()
  const [isUserMenuCompact, setIsUserMenuCompact] = useState(state === 'collapsed')

  useEffect(() => {
    if (state === 'expanded') {
      setIsUserMenuCompact(false)
    }
  }, [state])

  const handleSidebarTransitionEnd = useCallback(
    (event: React.TransitionEvent<HTMLDivElement>) => {
      if (event.propertyName !== 'width') {
        return
      }

      if (state === 'collapsed') {
        setIsUserMenuCompact(true)
      }
    },
    [state],
  )

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar
        renderTrigger={true}
        baseUrl="/specialist"
        items={sidebarItems}
        footer={
          <UserMenu user={user} compact={isUserMenuCompact} settingsPath="/specialist/settings" />
        }
        handleTransitionEnd={handleSidebarTransitionEnd}
      />

      <SidebarInset className="bg-card p-4 pl-0">
        <div className="m-2 ml-0 rounded-2xl bg-background p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </div>
  )
}
