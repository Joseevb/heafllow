import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { Activity, Calendar, FileText, Home, Pill, Settings } from 'lucide-react'

import type { SidebarItems } from '@/components/app-sidebar'
import type { RoutePath } from '@/types/routes'

import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { UserMenu } from '@/components/user-menu'
import { getSession } from '@/lib/auth.functions'

export const Route = createFileRoute('/dashboard')({
  component: RouteComponent,
  beforeLoad: async () => {
    const session = await getSession()

    if (!session) throw redirect({ to: '/auth' })

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
    title: 'Medications',
    icon: Pill,
    url: '/dashboard/medications',
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
  {
    title: 'Settings',
    icon: Settings,
    url: '/dashboard/settings',
  },
]

function RouteComponent() {
  const {
    session: { user },
  } = Route.useRouteContext()

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar
          renderTrigger={true}
          baseUrl="/dashboard"
          items={sidebarItems}
          footer={<UserMenu user={user} />}
        />

        <SidebarInset>
          <Outlet />
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
