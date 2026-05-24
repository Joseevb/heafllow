import { formOptions } from '@tanstack/react-form'
import { AlertCircle, CalendarClock, Pill, Stethoscope } from 'lucide-react'

import type { getSpecialistByQuery } from '@/lib/functions/specialists'
import type { BookMedicineRefillFormValues } from '@/schemas/medicines'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { withForm } from '@/hooks/form'
import { bookMedicineRefillSchema } from '@/schemas/medicines'

type PrimaryCareSpecialist = Awaited<ReturnType<typeof getSpecialistByQuery>>[number]

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
        {actionLabel && onAction ? (
          <Button variant="outline" size="sm" className="w-fit" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
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
  } satisfies BookMedicineRefillFormValues,
  validators: {
    onSubmit: bookMedicineRefillSchema,
  },
})

export const BookMedicineRefillForm = withForm({
  ...formOpts,
  props: {
    selectedSpecialist: undefined as PrimaryCareSpecialist | undefined,
    medicationName: undefined as string | undefined,
    isSpecialistPending: false,
    isSpecialistError: false,
    specialistErrorMessage: undefined as string | undefined,
    onRetrySpecialist: (() => undefined) as () => void,
    bookingDays: [] as Array<BookingDay>,
    isAvailabilityPending: false,
    isAvailabilityError: false,
    availabilityErrorMessage: undefined as string | undefined,
    onRetryAvailability: (() => undefined) as () => void,
    submitErrorMessage: undefined as string | undefined,
  },
  render: ({
    form,
    selectedSpecialist,
    medicationName,
    isSpecialistPending,
    isSpecialistError,
    specialistErrorMessage,
    onRetrySpecialist,
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
        {isSpecialistPending ? (
          <LoadingState message="Loading primary care specialist..." />
        ) : isSpecialistError ? (
          <QueryStateAlert
            title="Unable to load primary care specialists"
            message={specialistErrorMessage || 'Please try again.'}
            actionLabel="Retry"
            onAction={onRetrySpecialist}
          />
        ) : !selectedSpecialist ? (
          <Alert>
            <AlertCircle className="size-4" />
            <AlertTitle>No primary care specialist available</AlertTitle>
            <AlertDescription>
              Prescription renewals require an available primary care specialist. Please try again
              later.
            </AlertDescription>
          </Alert>
        ) : (
          <div className={`grid gap-4 ${medicationName ? 'md:grid-cols-2' : ''}`}>
            <Field className="rounded-xl border border-blue-200/70 bg-blue-50/70 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/40">
                  <Stethoscope className="size-4 text-blue-700 dark:text-blue-300" />
                </div>
                <div className="space-y-1">
                  <FieldTitle>Primary Care Specialist</FieldTitle>
                  <p className="font-medium text-foreground">{selectedSpecialist.name}</p>
                  <FieldDescription>
                    Your renewal appointment will be booked with this available specialist.
                  </FieldDescription>
                </div>
              </div>
            </Field>

            {medicationName ? (
              <Field className="rounded-xl border border-teal-200/70 bg-teal-50/70 p-4 dark:border-teal-900/60 dark:bg-teal-950/20">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-teal-100 p-2 dark:bg-teal-900/40">
                    <Pill className="size-4 text-teal-700 dark:text-teal-300" />
                  </div>
                  <div className="space-y-1">
                    <FieldTitle>Medication</FieldTitle>
                    <p className="font-medium text-foreground">{medicationName}</p>
                    <FieldDescription>
                      This renewal request will include your selected medication in the appointment
                      notes.
                    </FieldDescription>
                  </div>
                </div>
              </Field>
            ) : null}
          </div>
        )}

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
                            Choose a day with an available primary care appointment slot.
                          </FieldDescription>
                        </div>

                        {isAvailabilityPending ? (
                          <LoadingState message="Loading renewal availability..." />
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
                              There are no open renewal appointments in the next 30 days.
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

                        {isInvalid ? (
                          <FieldError errors={selectedDateField.state.meta.errors} />
                        ) : null}
                      </Field>
                    )
                  }}
                </form.AppField>

                <div className="grid content-start gap-4 rounded-xl border border-border/60 bg-card/70 p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Available times</p>
                    <p className="text-sm text-muted-foreground">
                      Pick the best time for your renewal appointment.
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
                                Pick an available day to see bookable appointment times.
                              </AlertDescription>
                            </Alert>
                          )}

                          {isInvalid ? (
                            <FieldError errors={appointmentDateField.state.meta.errors} />
                          ) : null}
                        </Field>
                      )
                    }}
                  </form.AppField>

                  {submitErrorMessage ? (
                    <QueryStateAlert
                      title="Unable to schedule renewal"
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
                        Schedule Renewal
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
