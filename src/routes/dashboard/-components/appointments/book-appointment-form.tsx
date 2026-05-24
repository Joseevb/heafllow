import { formOptions } from '@tanstack/react-form'
import { AlertCircle, CalendarClock } from 'lucide-react'

import type { getSpecialists } from '@/lib/functions/specialists'
import type { BookAppointmentFormValues } from '@/schemas/appointments'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { withForm } from '@/hooks/form'
import { bookAppointmentSchema } from '@/schemas/appointments'

type AvailableSpecialist = Awaited<ReturnType<typeof getSpecialists>>[number]

type BookingDay = {
  date: string
  slots: Array<{ startsAt: string; label: string; status: 'available' | 'booked' }>
}

function getDayKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function parseDayKey(dayKey: string) {
  const [year, month, day] = dayKey.split('-').map(Number)

  return new Date(year, month - 1, day)
}

function QueryStateAlert({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="size-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-col gap-3">
        <p>{message}</p>
        {actionLabel && onAction && (
          <Button variant="outline" size="sm" className="w-fit" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
      <Spinner />
      <span>{message}</span>
    </div>
  )
}

export const formOpts = formOptions({
  defaultValues: {
    specialistId: '',
    selectedDate: '',
    appointmentDate: '',
    notes: '',
  } satisfies BookAppointmentFormValues,
  validators: {
    onSubmit: bookAppointmentSchema,
  },
})

export const BookAppointmentForm = withForm({
  ...formOpts,
  props: {
    specialists: [] as Array<AvailableSpecialist>,
    isSpecialistsPending: false,
    isSpecialistsError: false,
    specialistsErrorMessage: undefined as string | undefined,
    onRetrySpecialists: (() => undefined) as () => void,
    onSpecialistChange: ((_specialistId: string) => undefined) as (specialistId: string) => void,
    bookingDays: [] as Array<BookingDay>,
    isAvailabilityPending: false,
    isAvailabilityError: false,
    availabilityErrorMessage: undefined as string | undefined,
    onRetryAvailability: (() => undefined) as () => void,
    submitErrorMessage: undefined as string | undefined,
  },
  render: ({
    form,
    specialists,
    isSpecialistsPending,
    isSpecialistsError,
    specialistsErrorMessage,
    onRetrySpecialists,
    onSpecialistChange,
    bookingDays,
    isAvailabilityPending,
    isAvailabilityError,
    availabilityErrorMessage,
    onRetryAvailability,
    submitErrorMessage,
  }) => (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault()
        form.handleSubmit()
      }}
    >
      <FieldGroup>
        <form.AppField name="specialistId">
          {(field) => (
            <div className="space-y-2">
              {isSpecialistsPending ? (
                <LoadingState message="Loading specialists..." />
              ) : isSpecialistsError ? (
                <QueryStateAlert
                  title="Unable to load specialists"
                  message={specialistsErrorMessage || 'Please try again.'}
                  actionLabel="Retry"
                  onAction={onRetrySpecialists}
                />
              ) : specialists.length === 0 ? (
                <Alert>
                  <AlertCircle className="size-4" />
                  <AlertTitle>No specialists available</AlertTitle>
                  <AlertDescription>
                    There are no specialists available for booking right now.
                  </AlertDescription>
                </Alert>
              ) : (
                <field.Select
                  label="Select your specialist"
                  options={specialists.map((specialist) => ({
                    value: specialist.id,
                    label: `${specialist.name} (${specialist.specialistData?.specialty ?? 'Specialist'})`,
                  }))}
                  action={({ value }) => onSpecialistChange(value)}
                  placeholder="Choose a specialist"
                  required
                />
              )}
            </div>
          )}
        </form.AppField>

        <form.Subscribe
          selector={(state) => ({
            specialistId: state.values.specialistId,
            selectedDate: state.values.selectedDate,
            appointmentDate: state.values.appointmentDate,
            isSubmitting: state.isSubmitting,
          })}
        >
          {({ specialistId, selectedDate, appointmentDate, isSubmitting }) => {
            const selectedDay = selectedDate
              ? bookingDays.find((day) => day.date === selectedDate)
              : undefined

            const availableDateKeys = new Set(
              bookingDays
                .filter((day) => day.slots.some((slot) => slot.status === 'available'))
                .map((day) => day.date),
            )

            const availableSlots =
              selectedDay?.slots.filter((slot) => slot.status === 'available') ?? []

            if (!specialistId) {
              return null
            }

            return (
              <div className="grid gap-6 xl:grid-cols-[minmax(22rem,1.45fr)_minmax(18rem,1fr)]">
                <form.AppField name="selectedDate">
                  {(selectedDateField) => {
                    const isInvalid =
                      selectedDateField.state.meta.isTouched &&
                      !selectedDateField.state.meta.isValid

                    return (
                      <Field
                        className="min-w-0 space-y-4 rounded-xl border border-border/60 bg-card/70 p-4 xl:min-w-[24rem]"
                        data-invalid={isInvalid}
                      >
                        <div className="space-y-1">
                          <FieldLabel htmlFor={selectedDateField.name}>Select a day</FieldLabel>
                          <FieldDescription>
                            Only days with available slots can be selected.
                          </FieldDescription>
                        </div>

                        {isAvailabilityPending ? (
                          <LoadingState message="Loading specialist availability..." />
                        ) : isAvailabilityError ? (
                          <QueryStateAlert
                            title="Unable to load availability"
                            message={availabilityErrorMessage || 'Please try again.'}
                            actionLabel="Retry"
                            onAction={onRetryAvailability}
                          />
                        ) : bookingDays.length === 0 ? (
                          <Alert>
                            <AlertCircle className="size-4" />
                            <AlertTitle>No availability in this range</AlertTitle>
                            <AlertDescription>
                              This specialist has no open slots in the next 30 days.
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <Calendar
                            mode="single"
                            selected={selectedDate ? parseDayKey(selectedDate) : undefined}
                            onSelect={(date) => {
                              selectedDateField.handleChange(date ? getDayKey(date) : '')
                              form.setFieldValue('appointmentDate', '')
                            }}
                            disabled={(date) => !availableDateKeys.has(getDayKey(date))}
                            className="w-full rounded-xl border border-border/60 bg-background/80"
                          />
                        )}

                        {isInvalid && <FieldError errors={selectedDateField.state.meta.errors} />}
                      </Field>
                    )
                  }}
                </form.AppField>

                <div className="grid content-start gap-4 rounded-xl border border-border/60 bg-card/70 p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Available times</p>
                    <p className="text-sm text-muted-foreground">
                      Select one slot and add any notes for your specialist.
                    </p>
                  </div>

                  <form.AppField name="appointmentDate">
                    {(appointmentDateField) => {
                      const isInvalid =
                        appointmentDateField.state.meta.isTouched &&
                        !appointmentDateField.state.meta.isValid

                      return (
                        <Field data-invalid={isInvalid}>
                          {selectedDate && availableSlots.length > 0 ? (
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {availableSlots.map((slot) => (
                                <Button
                                  key={slot.startsAt}
                                  type="button"
                                  variant={
                                    appointmentDate === slot.startsAt ? 'default' : 'outline'
                                  }
                                  onClick={() => appointmentDateField.handleChange(slot.startsAt)}
                                  disabled={isSubmitting}
                                >
                                  <CalendarClock className="size-4" />
                                  {slot.label}
                                </Button>
                              ))}
                            </div>
                          ) : selectedDate ? (
                            <Alert>
                              <AlertCircle className="size-4" />
                              <AlertTitle>No slots on this day</AlertTitle>
                              <AlertDescription>
                                Please choose another available day to continue.
                              </AlertDescription>
                            </Alert>
                          ) : (
                            <Alert>
                              <AlertCircle className="size-4" />
                              <AlertTitle>Select a day first</AlertTitle>
                              <AlertDescription>
                                Pick an available day to see bookable appointment slots.
                              </AlertDescription>
                            </Alert>
                          )}

                          {isInvalid && (
                            <FieldError errors={appointmentDateField.state.meta.errors} />
                          )}
                        </Field>
                      )
                    }}
                  </form.AppField>

                  <form.AppField name="notes">
                    {(field) => (
                      <field.TextArea
                        label="Notes"
                        placeholder="Add any context or special requests for your appointment."
                      />
                    )}
                  </form.AppField>

                  {submitErrorMessage ? (
                    <QueryStateAlert
                      title="Unable to book appointment"
                      message={submitErrorMessage}
                    />
                  ) : null}

                  <form.AppForm>
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={!specialistId || !appointmentDate || isSubmitting}
                      >
                        {isSubmitting ? <Spinner /> : null}
                        Confirm Appointment
                      </Button>
                    </div>
                  </form.AppForm>
                </div>
              </div>
            )
          }}
        </form.Subscribe>
      </FieldGroup>
    </form>
  ),
})
