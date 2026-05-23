import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Settings, Stethoscope, Timer } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentAccountSummaryQueryOptions } from '@/queries/settings-queries'
import { ProfileSummary } from '@/routes/dashboard/-components/settings/profile-summary'

export const Route = createFileRoute('/specialist/settings')({
  component: RouteComponent,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(getCurrentAccountSummaryQueryOptions())
  },
})

function RouteComponent() {
  const { data: account } = useSuspenseQuery(getCurrentAccountSummaryQueryOptions())

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-2 dark:bg-blue-900/20">
              <Settings className="size-5 text-blue-600" />
            </div>
            <h1 className="bg-linear-to-r from-blue-600 via-teal-600 to-green-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent dark:from-blue-400 dark:via-teal-400 dark:to-green-400">
              Specialist Settings
            </h1>
            <Badge variant="blue" size="sm">
              Account
            </Badge>
          </div>
          <p className="max-w-2xl text-muted-foreground">
            Review your account details and specialist profile information used across your care
            workspace.
          </p>
        </div>
      </header>

      <ProfileSummary
        name={account.name}
        email={account.email}
        role={account.role}
        createdAt={account.createdAt}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border border-border/60 bg-card/95 shadow-lg">
          <CardHeader>
            <CardTitle>Account Overview</CardTitle>
            <CardDescription>Core identity details for your specialist account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <InfoRow label="Full name" value={account.name} />
            <InfoRow label="Email" value={account.email} />
            <InfoRow label="Role" value={account.role ?? 'specialist'} />
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/95 shadow-lg">
          <CardHeader>
            <CardTitle>Specialist Workspace</CardTitle>
            <CardDescription>Current access and routing information for this area.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-teal-100 p-2 dark:bg-teal-900/20">
                  <Stethoscope className="size-5 text-teal-600" />
                </div>
                <div>
                  <p className="font-medium">Specialist dashboard enabled</p>
                  <p className="text-sm text-muted-foreground">
                    Your account is routed through the specialist workspace for appointments and
                    availability management.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-green-100 p-2 dark:bg-green-900/20">
                  <Timer className="size-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Availability managed separately</p>
                  <p className="text-sm text-muted-foreground">
                    Update bookable hours from the Availability page to keep scheduling current.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
