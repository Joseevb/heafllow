import { formOptions } from '@tanstack/react-form'
import { AlertCircle } from 'lucide-react'

import type { BookingDay } from '@/components/availability-picker'
import type { getSpecialists } from '@/lib/functions/specialists'
import type { BookAppointmentFormValues } from '@/schemas/appointments'

import { AvailabilityPicker } from '@/components/availability-picker'
import { SpecialistSummaryCard } from '@/components/specialist-summary-card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { withForm } from '@/hooks/form'
import { bookAppointmentSchema } from '@/schemas/appointments'

type AvailableSpecialist = Awaited<ReturnType<typeof getSpecialists>>[number]

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
    formId: undefined as string | undefined,
    hideSubmitActions: false,
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
    formId,
    hideSubmitActions,
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
      id={formId}
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
            if (!specialistId) {
              return null
            }

            const selectedSpecialist = specialists.find(
              (specialist) => specialist.id === specialistId,
            )

            return (
              <div className="space-y-4">
                {selectedSpecialist ? (
                  <SpecialistSummaryCard
                    name={selectedSpecialist.name}
                    specialty={selectedSpecialist.specialistData?.specialty}
                    email={selectedSpecialist.email}
                    consultationDurationMinutes={
                      selectedSpecialist.specialistData?.consultationDurationMinutes
                    }
                  />
                ) : null}

                <form.AppField name="selectedDate">
                  {(selectedDateField) => (
                    <form.AppField name="appointmentDate">
                      {(appointmentDateField) => {
                        const isDateInvalid =
                          selectedDateField.state.meta.isTouched &&
                          !selectedDateField.state.meta.isValid
                        const isSlotInvalid =
                          appointmentDateField.state.meta.isTouched &&
                          !appointmentDateField.state.meta.isValid

                        return (
                          <AvailabilityPicker
                            bookingDays={bookingDays}
                            selectedDate={selectedDate}
                            selectedSlot={appointmentDate}
                            onDateChange={(value) => {
                              selectedDateField.handleChange(value)
                              form.setFieldValue('appointmentDate', '')
                            }}
                            onSlotChange={appointmentDateField.handleChange}
                            isPending={isAvailabilityPending}
                            isError={isAvailabilityError}
                            errorMessage={availabilityErrorMessage}
                            onRetry={onRetryAvailability}
                            isSubmitting={isSubmitting}
                            loadingMessage="Loading specialist availability..."
                            emptyMessage="This specialist has no open slots in the next 30 days."
                            timesDescription="Select one slot and add any notes for your specialist."
                            noDayMessage="Pick an available day to see bookable appointment slots."
                            dateErrors={selectedDateField.state.meta.errors}
                            slotErrors={appointmentDateField.state.meta.errors}
                            showDateError={isDateInvalid}
                            showSlotError={isSlotInvalid}
                            slotPanelFooter={
                              <>
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

                                {hideSubmitActions ? null : (
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
                                )}
                              </>
                            }
                          />
                        )
                      }}
                    </form.AppField>
                  )}
                </form.AppField>
              </div>
            )
          }}
        </form.Subscribe>
      </FieldGroup>
    </form>
  ),
})
