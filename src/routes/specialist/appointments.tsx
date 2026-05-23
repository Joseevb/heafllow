import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { CalendarClock } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { SpecialistAppointmentUpdateInput } from '@/schemas/specialist'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { formatDate, formatTime } from '@/lib/utils'
import {
  specialistAppointmentsQueryOptions,
  specialistOverviewQueryOptions,
  updateSpecialistAppointmentMutationOptions,
} from '@/queries/specialist-dashboard-queries'

export const Route = createFileRoute('/specialist/appointments')({
  component: RouteComponent,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(specialistAppointmentsQueryOptions())
  },
})

function RouteComponent() {
  const queryClient = useQueryClient()
  const { data: appointments } = useSuspenseQuery(specialistAppointmentsQueryOptions())
  const [appointmentToCancel, setAppointmentToCancel] = useState<null | {
    id: string
    clientName: string
    appointmentDate: string
  }>(null)
  const [cancellationReason, setCancellationReason] = useState('')

  const updateAppointmentMutation = useMutation({
    ...updateSpecialistAppointmentMutationOptions(),
    onSuccess: async () => {
      await invalidateSpecialistQueries(queryClient)
      toast.success('Appointment updated successfully.')
      setAppointmentToCancel(null)
      setCancellationReason('')
    },
    onError: (error) => {
      toast.error(error.message || 'Unable to update appointment.')
    },
  })

  const actionableAppointments = appointments.filter(
    (appointment) => appointment.status === 'pending' || appointment.status === 'confirmed',
  )

  return (
    <>
      <div className="space-y-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-100 p-2 dark:bg-blue-900/20">
                <CalendarClock className="size-5 text-blue-600" />
              </div>
              <h1 className="bg-linear-to-r from-blue-600 via-teal-600 to-green-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent dark:from-blue-400 dark:via-teal-400 dark:to-green-400">
                Specialist Appointments
              </h1>
              <Badge variant="blue" size="sm">
                Visits
              </Badge>
            </div>
            <p className="max-w-2xl text-muted-foreground">
              Review your schedule, accept or cancel requests, and start consultations from a
              focused visit workspace.
            </p>
          </div>
        </header>

        <Card className="border border-border/60 bg-card/95 shadow-lg">
          <CardHeader>
            <CardTitle>Upcoming and Active Visits</CardTitle>
            <CardDescription>
              Your appointments are listed in chronological order with the key information needed to
              take action.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {appointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No appointments are assigned yet.</p>
            ) : (
              appointments.map((appointment) => {
                const canAccept = appointment.status === 'pending'
                const canCancel =
                  appointment.status === 'pending' || appointment.status === 'confirmed'
                const canStart =
                  appointment.status === 'pending' || appointment.status === 'confirmed'

                return (
                  <div
                    key={appointment.id}
                    className="rounded-2xl border border-border/60 bg-muted/30 p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div>
                          <p className="text-lg font-semibold">{appointment.client.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {appointment.client.email}
                          </p>
                        </div>

                        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-4">
                          <span>
                            {formatDate(appointment.appointmentDate.toISOString())} at{' '}
                            {formatTime(appointment.appointmentDate.toISOString())}
                          </span>
                          <span>{appointment.client.phoneNumber}</span>
                          <span>{appointment.activeMedicinesCount} active medicines</span>
                          <span>
                            Health score: {appointment.latestHealthScore?.overallScore ?? 'No data'}
                          </span>
                        </div>

                        {appointment.notes ? (
                          <p className="rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-sm text-muted-foreground">
                            {appointment.notes}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-col items-start gap-3 lg:items-end">
                        <Badge variant={getStatusVariant(appointment.status)}>
                          {appointment.status}
                        </Badge>
                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!canAccept || updateAppointmentMutation.isPending}
                            onClick={() =>
                              void updateAppointmentMutation.mutateAsync({
                                appointmentId: appointment.id,
                                status: 'confirmed',
                                notes: appointment.notes ?? undefined,
                              } satisfies SpecialistAppointmentUpdateInput)
                            }
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            disabled={!canCancel || updateAppointmentMutation.isPending}
                            onClick={() => {
                              setAppointmentToCancel({
                                id: appointment.id,
                                clientName: appointment.client.name,
                                appointmentDate: appointment.appointmentDate.toISOString(),
                              })
                              setCancellationReason(appointment.cancellationReason ?? '')
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            render={
                              <Link
                                to="/specialist/appointment/$appointmentId"
                                params={{ appointmentId: appointment.id }}
                              >
                                Start Appointment
                              </Link>
                            }
                            size="sm"
                            disabled={!canStart}
                            nativeButton={false}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {actionableAppointments.length === 0 ? (
          <Card className="border border-border/60 bg-card/95 shadow-lg">
            <CardContent className="py-8 text-sm text-muted-foreground">
              There are no pending or confirmed appointments that require action right now.
            </CardContent>
          </Card>
        ) : null}
      </div>

      <AlertDialog
        open={!!appointmentToCancel}
        onOpenChange={(open) => !open && setAppointmentToCancel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              {appointmentToCancel ? (
                <>
                  Cancel the appointment with{' '}
                  <span className="font-semibold">{appointmentToCancel.clientName}</span> on{' '}
                  <span className="font-semibold">
                    {formatDate(appointmentToCancel.appointmentDate)} at{' '}
                    {formatTime(appointmentToCancel.appointmentDate)}
                  </span>
                  .
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <label htmlFor="specialist-cancel-reason" className="text-sm font-medium">
              Cancellation reason
            </label>
            <Textarea
              id="specialist-cancel-reason"
              value={cancellationReason}
              onChange={(event) => setCancellationReason(event.target.value)}
              placeholder="Add optional context for the cancellation."
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateAppointmentMutation.isPending}>
              Keep Appointment
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={!appointmentToCancel || updateAppointmentMutation.isPending}
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault()

                if (!appointmentToCancel) {
                  return
                }

                void updateAppointmentMutation.mutateAsync({
                  appointmentId: appointmentToCancel.id,
                  status: 'cancelled',
                  notes: undefined,
                  cancellationReason: cancellationReason.trim() || undefined,
                } satisfies SpecialistAppointmentUpdateInput)
              }}
            >
              {updateAppointmentMutation.isPending ? 'Cancelling...' : 'Confirm Cancellation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

async function invalidateSpecialistQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: specialistAppointmentsQueryOptions().queryKey }),
    queryClient.invalidateQueries({ queryKey: specialistOverviewQueryOptions().queryKey }),
  ])
}

function getStatusVariant(status: string) {
  switch (status) {
    case 'confirmed':
      return 'success' as const
    case 'completed':
      return 'info' as const
    case 'cancelled':
      return 'error' as const
    case 'no-show':
      return 'secondary' as const
    default:
      return 'warning' as const
  }
}
