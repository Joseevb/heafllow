import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { Activity, Calendar, FileText, Home, Pill } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import type { SidebarItems } from '@/components/app-sidebar'
import type { RoutePath } from '@/types/routes'

import { AppSidebar } from '@/components/app-sidebar'
import { ContentHeader } from '@/components/content-header'
import { SidebarInset, SidebarProvider, useSidebar } from '@/components/ui/sidebar'
import { UserMenu } from '@/components/user-menu'
import { getSession } from '@/lib/functions/auth'

export const Route = createFileRoute('/dashboard')({
  component: RouteComponent,
  beforeLoad: async () => {
    const session = await getSession()

    if (!session) throw redirect({ to: '/auth' })
    if (session.user.role == 'admin') throw redirect({ to: '/admin' })
    if (session.user.role == 'specialist') throw redirect({ to: '/specialist' })

    return { session }
  },
})

const sidebarItems = (_baseUrl: RoutePath): SidebarItems => [
  {
    title: 'Dashboard',
    icon: Home,
    url: '/dashboard',
  },
  {
    title: 'Appointments',
    icon: Calendar,
    url: '/dashboard/appointments',
  },
  {
    title: 'Medicines',
    icon: Pill,
    url: '/dashboard/medicines',
  },
  {
    title: 'Health Metrics',
    icon: Activity,
    url: '/dashboard/health-metrics',
  },
  {
    title: 'Medical Records',
    icon: FileText,
    url: '/dashboard' as RoutePath,
  },
]

function RouteComponent() {
  const {
    session: { user },
  } = Route.useRouteContext()

  return (
    <SidebarProvider defaultOpen={true}>
      <DashboardLayout user={user} />
    </SidebarProvider>
  )
}

function DashboardLayout({
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
        baseUrl="/dashboard"
        items={sidebarItems}
        footer={<UserMenu user={user} compact={isUserMenuCompact} />}
        handleTransitionEnd={handleSidebarTransitionEnd}
      />

      <SidebarInset className="bg-card">
        <ContentHeader />

        <div className="flex-1 md:p-4 md:pl-0">
          <div className="h-full rounded-2xl bg-background p-4 max-md:rounded-none md:p-6">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </div>
  )
}
