import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Search } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import { toast } from 'sonner'

import type { SpecialistStartAppointmentInput } from '@/schemas/specialist'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAppForm } from '@/hooks/form'
import { formatDate, formatTime } from '@/lib/utils'
import {
  completeSpecialistAppointmentMutationOptions,
  specialistAppointmentDetailQueryOptions,
  specialistAppointmentsQueryOptions,
  specialistMedicineSearchQueryOptions,
  specialistOverviewQueryOptions,
} from '@/queries/specialist-dashboard-queries'
import { availableSpecialistsQueryOptions } from '@/queries/specialist-queries'

export const Route = createFileRoute('/specialist/appointment/$appointmentId')({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(
        specialistAppointmentDetailQueryOptions(params.appointmentId),
      ),
      context.queryClient.ensureQueryData(availableSpecialistsQueryOptions()),
    ])
  },
})

function RouteComponent() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { appointmentId } = Route.useParams()
  const { data: appointment } = useSuspenseQuery(
    specialistAppointmentDetailQueryOptions(appointmentId),
  )
  const { data: specialists } = useSuspenseQuery(availableSpecialistsQueryOptions())
  const [medicineQuery, setMedicineQuery] = useState('')
  const deferredMedicineQuery = useDeferredValue(medicineQuery.trim())
  const medicineSearchQuery = useQuery({
    ...specialistMedicineSearchQueryOptions(deferredMedicineQuery),
    enabled: deferredMedicineQuery.length >= 2,
  })

  const form = useAppForm({
    defaultValues: {
      ...defaultVisitValues,
      appointmentId: appointment.id,
      notes: appointment.notes ?? '',
    },
    onSubmit: async ({ value }: { value: SpecialistStartAppointmentInput }) => {
      await completeAppointmentMutation.mutateAsync(value)
    },
  })

  const completeAppointmentMutation = useMutation({
    ...completeSpecialistAppointmentMutationOptions(),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: specialistAppointmentsQueryOptions().queryKey }),
        queryClient.invalidateQueries({ queryKey: specialistOverviewQueryOptions().queryKey }),
        queryClient.invalidateQueries({ queryKey: ['specialist', 'appointments', appointmentId] }),
      ])
      toast.success('Appointment completed successfully.')
      await navigate({ to: '/specialist/appointments' })
    },
    onError: (error) => {
      toast.error(error.message || 'Unable to complete appointment.')
    },
  })

  const canComplete = appointment.status === 'pending' || appointment.status === 'confirmed'

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" onClick={() => void navigate({ to: '/specialist/appointments' })}>
          <ArrowLeft className="size-4" />
          Back to Appointments
        </Button>
        <Badge variant={appointment.status === 'confirmed' ? 'success' : 'warning'}>
          {appointment.status}
        </Badge>
      </div>

      <Card className="border border-border/60 bg-card/95 shadow-lg">
        <CardHeader>
          <CardTitle>{appointment.client.name}</CardTitle>
          <CardDescription>
            {formatDate(appointment.appointmentDate.toISOString())} at{' '}
            {formatTime(appointment.appointmentDate.toISOString())}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
          <div>{appointment.client.email}</div>
          <div>{appointment.client.phoneNumber}</div>
          <div>Health score: {appointment.latestHealthScore?.overallScore ?? 'No data'}</div>
        </CardContent>
      </Card>

      {!canComplete ? (
        <Card className="border border-border/60 bg-card/95 shadow-lg">
          <CardContent className="py-8 text-sm text-muted-foreground">
            This appointment is no longer in a state that can be completed from the visit workspace.
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-border/60 bg-card/95 shadow-lg">
          <CardHeader>
            <CardTitle>Complete Visit</CardTitle>
            <CardDescription>
              Add visit notes, optional medicines, and any follow-up appointment details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                form.handleSubmit()
              }}
            >
              <form.AppField name="notes">
                {(field) => (
                  <field.TextArea
                    label="Visit Notes"
                    description="Summarize the consultation and next steps"
                    placeholder="Discussed symptoms, treatment plan, and patient guidance."
                    required
                  />
                )}
              </form.AppField>

              <form.AppField name="addMedicine">
                {(field) => (
                  <field.Select
                    label="Add Medicine"
                    description="Search the medicine catalog or enter medicine details manually"
                    options={[
                      { label: 'No', value: 'false' },
                      { label: 'Yes', value: 'true' },
                    ]}
                    required
                  />
                )}
              </form.AppField>

              <form.Subscribe selector={(state) => state.values.addMedicine === 'true'}>
                {(shouldAddMedicine) =>
                  shouldAddMedicine ? (
                    <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-4">
                      <div className="space-y-2">
                        <label htmlFor="medicine-search" className="text-sm font-medium">
                          Search Medicine
                        </label>
                        <div className="relative">
                          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="medicine-search"
                            className="pl-9"
                            value={medicineQuery}
                            onChange={(event) => setMedicineQuery(event.target.value)}
                            placeholder="Search external medicine catalog"
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          This currently uses a mock search and returns no medicines until the
                          external API is connected.
                        </p>
                      </div>

                      {deferredMedicineQuery.length >= 2 ? (
                        <div className="rounded-xl border border-border/60 bg-background/80 p-3">
                          {medicineSearchQuery.isFetching ? (
                            <p className="text-sm text-muted-foreground">Searching medicines...</p>
                          ) : medicineSearchQuery.data?.length ? (
                            <div className="space-y-2">
                              {medicineSearchQuery.data.map((medicine) => (
                                <button
                                  key={medicine.id}
                                  type="button"
                                  className="w-full rounded-lg border border-border/60 px-3 py-2 text-left text-sm transition hover:bg-muted/50"
                                  onClick={() => {
                                    form.setFieldValue('medicine.name', medicine.name)
                                    form.setFieldValue('medicine.medicineId', medicine.id)
                                  }}
                                >
                                  {medicine.name}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No medicines found. You can still fill the medicine details manually.
                            </p>
                          )}
                        </div>
                      ) : null}

                      <div className="grid gap-4 md:grid-cols-2">
                        <form.AppField name="medicine.name">
                          {(field) => <field.TextField label="Medicine Name" required />}
                        </form.AppField>
                        <form.AppField name="medicine.medicineId">
                          {(field) => (
                            <field.TextField
                              type="number"
                              label="Medicine ID"
                              required
                              value={String(field.state.value)}
                              onChange={(event) => field.handleChange(Number(event.target.value))}
                            />
                          )}
                        </form.AppField>
                        <form.AppField name="medicine.dosage">
                          {(field) => <field.TextField label="Dosage" required />}
                        </form.AppField>
                        <form.AppField name="medicine.frequency">
                          {(field) => <field.TextField label="Frequency" required />}
                        </form.AppField>
                        <form.AppField name="medicine.startDate">
                          {(field) => <field.TextField type="date" label="Start Date" required />}
                        </form.AppField>
                        <form.AppField name="medicine.endDate">
                          {(field) => <field.TextField type="date" label="End Date" required />}
                        </form.AppField>
                      </div>
                    </div>
                  ) : null
                }
              </form.Subscribe>

              <form.AppField name="scheduleFollowUp">
                {(field) => (
                  <field.Select
                    label="Schedule Follow-up"
                    description="Create a follow-up appointment if needed"
                    options={[
                      { label: 'No', value: 'false' },
                      { label: 'Yes', value: 'true' },
                    ]}
                    required
                  />
                )}
              </form.AppField>

              <form.Subscribe selector={(state) => state.values.scheduleFollowUp === 'true'}>
                {(shouldScheduleFollowUp) =>
                  shouldScheduleFollowUp ? (
                    <div className="grid gap-4 rounded-2xl border border-border/60 bg-muted/20 p-4">
                      <form.AppField name="followUp.specialistId">
                        {(field) => (
                          <field.Select
                            label="Follow-up Specialist"
                            options={specialists.map((specialist) => ({
                              value: specialist.id,
                              label: `${specialist.name} • ${specialist.specialistData?.specialty ?? 'Specialist'}`,
                            }))}
                            required
                          />
                        )}
                      </form.AppField>
                      <div className="grid gap-4 md:grid-cols-2">
                        <form.AppField name="followUp.appointmentDate">
                          {(field) => (
                            <field.TextField
                              type="datetime-local"
                              label="Follow-up Appointment"
                              required
                            />
                          )}
                        </form.AppField>
                        <form.AppField name="followUp.notes">
                          {(field) => <field.TextField label="Follow-up Notes" />}
                        </form.AppField>
                      </div>
                    </div>
                  ) : null
                }
              </form.Subscribe>

              <form.AppForm>
                <div className="flex justify-end">
                  <form.SubscribeButton label="Complete Appointment" />
                </div>
              </form.AppForm>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

const defaultVisitValues: SpecialistStartAppointmentInput = {
  appointmentId: '',
  notes: '',
  addMedicine: 'false',
  medicine: {
    query: '',
    name: '',
    medicineId: 0,
    dosage: '',
    frequency: '',
    startDate: '',
    endDate: '',
  },
  scheduleFollowUp: 'false',
  followUp: {
    specialistId: '',
    appointmentDate: '',
    notes: '',
  },
}
