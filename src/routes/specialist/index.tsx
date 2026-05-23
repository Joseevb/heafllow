import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { CalendarClock, Stethoscope, Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatTime } from '@/lib/utils'
import { specialistOverviewQueryOptions } from '@/queries/specialist-dashboard-queries'
import { StatCard } from '@/routes/dashboard/-components/stat-card'

export const Route = createFileRoute('/specialist/')({
  component: RouteComponent,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(specialistOverviewQueryOptions())
  },
})

function RouteComponent() {
  const { data } = useSuspenseQuery(specialistOverviewQueryOptions())

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-2 dark:bg-blue-900/20">
              <Stethoscope className="size-5 text-blue-600" />
            </div>
            <h1 className="bg-linear-to-r from-blue-600 via-teal-600 to-green-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent dark:from-blue-400 dark:via-teal-400 dark:to-green-400">
              Specialist Dashboard
            </h1>
            <Badge variant="blue" size="sm">
              Care Team
            </Badge>
          </div>
          <p className="max-w-2xl text-muted-foreground">
            Review your clinic day, keep availability current, and stay on top of patient follow-up.
          </p>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={CalendarClock}
          iconBg="bg-blue-100 dark:bg-blue-900/20"
          iconColor="text-blue-600"
          label="Upcoming"
          value={data.summary.upcomingAppointmentsCount}
          sublabel="appointments"
        />
        <StatCard
          icon={Stethoscope}
          iconBg="bg-teal-100 dark:bg-teal-900/20"
          iconColor="text-teal-600"
          label="Completed"
          value={data.summary.completedAppointmentsCount}
          sublabel="recent visits"
        />
        <StatCard
          icon={Users}
          iconBg="bg-green-100 dark:bg-green-900/20"
          iconColor="text-green-600"
          label="Assigned Clients"
          value={data.summary.assignedClientsCount}
        />
        <StatCard
          icon={CalendarClock}
          iconBg="bg-cyan-100 dark:bg-cyan-900/20"
          iconColor="text-cyan-600"
          label="Availability Blocks"
          value={data.summary.availabilityBlocksCount}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border border-border/60 bg-card/95 shadow-lg">
          <CardHeader>
            <CardTitle>Today and Next Up</CardTitle>
            <CardDescription>Your next appointments with quick patient context.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.upcomingAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming appointments scheduled.</p>
            ) : (
              data.upcomingAppointments.slice(0, 5).map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-xl border border-border/60 bg-muted/30 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{appointment.client.name}</p>
                      <p className="text-sm text-muted-foreground">{appointment.client.email}</p>
                    </div>
                    <Badge variant={appointment.status === 'confirmed' ? 'success' : 'warning'}>
                      {appointment.status}
                    </Badge>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                    <span>{formatDate(appointment.appointmentDate.toISOString())}</span>
                    <span>{formatTime(appointment.appointmentDate.toISOString())}</span>
                    <span>{appointment.activeMedicinesCount} active medicines</span>
                    <span>
                      Health score: {appointment.latestHealthScore?.overallScore ?? 'No data'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/95 shadow-lg">
          <CardHeader>
            <CardTitle>Assigned Clients</CardTitle>
            <CardDescription>
              Clients currently linked to you as primary care specialist.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.assignedClients.length === 0 ? (
              <p className="text-sm text-muted-foreground">No assigned clients yet.</p>
            ) : (
              data.assignedClients.map((client) => (
                <div key={client.id} className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <p className="font-medium">{client.name}</p>
                  <p className="text-sm text-muted-foreground">{client.email}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{client.phoneNumber}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
