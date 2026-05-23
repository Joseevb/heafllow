import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Clock3, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import type { SpecialistAvailabilityFormValues } from '@/schemas/specialist'
import type { DayName } from '@/types/date'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldDescription, FieldGroup, FieldLegend, FieldSet } from '@/components/ui/field'
import { useAppForm } from '@/hooks/form'
import {
  deleteSpecialistAvailabilityMutationOptions,
  specialistAvailabilityQueryOptions,
  specialistOverviewQueryOptions,
  upsertSpecialistAvailabilityMutationOptions,
} from '@/queries/specialist-dashboard-queries'
import { specialistAvailabilityFormSchema } from '@/schemas/specialist'
import { DAYS } from '@/types/date'

type AvailabilitySlot = {
  id: string
  dayOfWeek: DayName
  startTime: Date
  endTime: Date
  isAvailable: boolean
}

type AvailabilityDaySummary = {
  dayOfWeek: DayName
  startTime: string
  endTime: string
  intervalMinutes: number
  slots: Array<{
    id: string
    startTime: string
    endTime: string
    isAvailable: boolean
  }>
  formValues: SpecialistAvailabilityFormValues
}

export const Route = createFileRoute('/specialist/availability')({
  component: RouteComponent,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(specialistAvailabilityQueryOptions())
  },
})

function RouteComponent() {
  const queryClient = useQueryClient()
  const { data } = useSuspenseQuery(specialistAvailabilityQueryOptions())
  const upsertAvailabilityMutation = useMutation({
    ...upsertSpecialistAvailabilityMutationOptions(),
    onSuccess: async () => {
      await invalidateAvailabilityQueries(queryClient)
      toast.success('Availability saved successfully.')
      form.reset(buildDefaultAvailabilityValues(data.consultationDurationMinutes))
    },
    onError: (error) => {
      toast.error(error.message || 'Unable to save availability.')
    },
  })

  const deleteAvailabilityMutation = useMutation({
    ...deleteSpecialistAvailabilityMutationOptions(),
    onSuccess: async () => {
      await invalidateAvailabilityQueries(queryClient)
      toast.success('Availability slot deleted.')
    },
    onError: (error) => {
      toast.error(error.message || 'Unable to delete availability slot.')
    },
  })

  const defaultAvailabilityValues = buildDefaultAvailabilityValues(data.consultationDurationMinutes)

  const form = useAppForm({
    defaultValues: defaultAvailabilityValues,
    validators: {
      onSubmit: ({ value }) => {
        const result = specialistAvailabilityFormSchema.safeParse(value)

        if (result.success) {
          return undefined
        }

        return result.error.issues.map((issue) => issue.message)
      },
    },
    onSubmit: async ({ value }: { value: SpecialistAvailabilityFormValues }) => {
      await upsertAvailabilityMutation.mutateAsync(value)
    },
  })

  const availabilityByDay = DAYS.map((day) => buildDaySummary(day, data.availability)).filter(
    (day): day is AvailabilityDaySummary => day !== null,
  )

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-2 dark:bg-blue-900/20">
              <Clock3 className="size-5 text-blue-600" />
            </div>
            <h1 className="bg-linear-to-r from-blue-600 via-teal-600 to-green-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent dark:from-blue-400 dark:via-teal-400 dark:to-green-400">
              Availability
            </h1>
            <Badge variant="blue" size="sm">
              Scheduling
            </Badge>
          </div>
          <p className="max-w-2xl text-muted-foreground">
            Create weekly appointment slots based on your consultation duration, adjust interval
            size when needed, and remove individual slots directly from the schedule.
          </p>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border border-border/60 bg-card/95 shadow-lg">
          <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
            <CardDescription>
              Saving a day replaces that day&apos;s slots using the selected time range and
              interval.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {availabilityByDay.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No availability slots have been added yet.
              </p>
            ) : (
              availabilityByDay.map((day) => (
                <div
                  key={day.dayOfWeek}
                  className="rounded-2xl border border-border/60 bg-muted/30 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium">{day.dayOfWeek}</p>
                      <p className="text-sm text-muted-foreground">
                        {day.startTime} - {day.endTime} in {day.intervalMinutes}-minute intervals
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => form.reset(day.formValues)}>
                      Edit Day
                    </Button>
                  </div>

                  <div className="mt-4 space-y-2">
                    {day.slots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/80 px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{slot.startTime}</span>
                          <span className="text-muted-foreground">to {slot.endTime}</span>
                          <Badge variant={slot.isAvailable ? 'success' : 'secondary'}>
                            {slot.isAvailable ? 'Available' : 'Unavailable'}
                          </Badge>
                        </div>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          disabled={deleteAvailabilityMutation.isPending}
                          onClick={() => void deleteAvailabilityMutation.mutateAsync(slot.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/95 shadow-lg">
          <CardHeader>
            <CardTitle>Availability Editor</CardTitle>
            <CardDescription>
              Default interval follows your consultation duration and can be updated here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-6"
              onSubmit={(event) => {
                event.preventDefault()
                form.handleSubmit()
              }}
            >
              <FieldSet className="rounded-2xl border border-border/60 bg-card/80 p-5">
                <FieldLegend>Weekly Slot Range</FieldLegend>
                <FieldDescription>
                  Choose a weekday, set the overall time range, and slots will be generated in the
                  interval you specify.
                </FieldDescription>
                <FieldGroup>
                  <form.AppField name="dayOfWeek">
                    {(field) => (
                      <field.Select
                        label="Day"
                        options={DAYS.map((day) => ({ label: day, value: day }))}
                        required
                      />
                    )}
                  </form.AppField>

                  <div className="grid gap-4 md:grid-cols-2">
                    <form.AppField name="startTime">
                      {(field) => <field.TextField type="time" label="Start Time" required />}
                    </form.AppField>
                    <form.AppField name="endTime">
                      {(field) => <field.TextField type="time" label="End Time" required />}
                    </form.AppField>
                  </div>

                  <form.AppField name="intervalMinutes">
                    {(field) => (
                      <field.TextField
                        type="number"
                        label="Slot Interval"
                        description="Usually matches the consultation duration"
                        min={15}
                        step={5}
                        required
                        value={String(field.state.value)}
                        onChange={(event) => field.handleChange(Number(event.target.value))}
                      />
                    )}
                  </form.AppField>

                  <form.AppField name="isAvailable">
                    {(field) => (
                      <field.Select
                        label="Status"
                        options={[
                          { label: 'Available', value: 'true' },
                          { label: 'Unavailable', value: 'false' },
                        ]}
                        required
                      />
                    )}
                  </form.AppField>
                </FieldGroup>
              </FieldSet>

              <form.AppForm>
                <div className="flex justify-end">
                  <form.SubscribeButton label="Save Availability" />
                </div>
              </form.AppForm>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function buildDefaultAvailabilityValues(
  consultationDurationMinutes: number,
): SpecialistAvailabilityFormValues {
  return {
    dayOfWeek: 'Monday',
    startTime: '09:00',
    endTime: '12:00',
    intervalMinutes: consultationDurationMinutes,
    isAvailable: 'true',
  }
}

function buildDaySummary(
  dayOfWeek: DayName,
  slots: Array<AvailabilitySlot>,
): AvailabilityDaySummary | null {
  const daySlots = slots
    .filter((slot) => slot.dayOfWeek === dayOfWeek)
    .sort((left, right) => left.startTime.getTime() - right.startTime.getTime())

  if (daySlots.length === 0) {
    return null
  }

  const firstSlot = daySlots[0]
  const lastSlot = daySlots[daySlots.length - 1]
  const intervalMinutes = Math.max(
    1,
    Math.round((firstSlot.endTime.getTime() - firstSlot.startTime.getTime()) / 60000),
  )

  return {
    dayOfWeek,
    startTime: formatAvailabilityTime(firstSlot.startTime),
    endTime: formatAvailabilityTime(lastSlot.endTime),
    intervalMinutes,
    slots: daySlots.map((slot) => ({
      id: slot.id,
      startTime: formatAvailabilityTime(slot.startTime),
      endTime: formatAvailabilityTime(slot.endTime),
      isAvailable: slot.isAvailable,
    })),
    formValues: {
      dayOfWeek,
      startTime: formatAvailabilityTime(firstSlot.startTime),
      endTime: formatAvailabilityTime(lastSlot.endTime),
      intervalMinutes,
      isAvailable: firstSlot.isAvailable ? 'true' : 'false',
    } satisfies SpecialistAvailabilityFormValues,
  }
}

function formatAvailabilityTime(date: Date) {
  return `${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')}`
}

async function invalidateAvailabilityQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: specialistAvailabilityQueryOptions().queryKey }),
    queryClient.invalidateQueries({ queryKey: specialistOverviewQueryOptions().queryKey }),
  ])
}
