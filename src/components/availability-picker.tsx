import { AlertCircle, CalendarClock } from 'lucide-react'
import { useMemo } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

export type BookingDay = {
  date: string
  slots: Array<{ startsAt: string; label: string; status: 'available' | 'booked' }>
}

export function AvailabilityPicker({
  bookingDays,
  selectedDate,
  selectedSlot,
  onDateChange,
  onSlotChange,
  isPending,
  isError,
  errorMessage,
  onRetry,
  isSubmitting = false,
  dayLabel = 'Select a day',
  dayDescription = 'Only days with available slots can be selected.',
  loadingMessage = 'Loading availability...',
  emptyTitle = 'No availability in this range',
  emptyMessage = 'There are no open slots in the selected range.',
  timesTitle = 'Available times',
  timesDescription = 'Select one available slot.',
  noSlotsTitle = 'No slots on this day',
  noSlotsMessage = 'Please choose another available day to continue.',
  noDayTitle = 'Select a day first',
  noDayMessage = 'Pick an available day to see bookable times.',
  dateErrors,
  slotErrors,
  showDateError = false,
  showSlotError = false,
  className,
  dayPanelClassName,
  slotPanelClassName,
  slotListClassName,
  slotPanelFooter,
}: {
  bookingDays: Array<BookingDay>
  selectedDate: string
  selectedSlot: string
  onDateChange: (value: string) => void
  onSlotChange: (value: string) => void
  isPending: boolean
  isError: boolean
  errorMessage?: string
  onRetry?: () => void
  isSubmitting?: boolean
  dayLabel?: string
  dayDescription?: string
  loadingMessage?: string
  emptyTitle?: string
  emptyMessage?: string
  timesTitle?: string
  timesDescription?: string
  noSlotsTitle?: string
  noSlotsMessage?: string
  noDayTitle?: string
  noDayMessage?: string
  dateErrors?: Array<{ message?: string } | undefined>
  slotErrors?: Array<{ message?: string } | undefined>
  showDateError?: boolean
  showSlotError?: boolean
  className?: string
  dayPanelClassName?: string
  slotPanelClassName?: string
  slotListClassName?: string
  slotPanelFooter?: React.ReactNode
}) {
  const selectedDay = selectedDate
    ? bookingDays.find((day) => day.date === selectedDate)
    : undefined

  const availableDateKeys = useMemo(
    () =>
      new Set(
        bookingDays
          .filter((day) => day.slots.some((slot) => slot.status === 'available'))
          .map((day) => day.date),
      ),
    [bookingDays],
  )

  const availableSlots = selectedDay?.slots.filter((slot) => slot.status === 'available') ?? []

  return (
    <div
      className={cn('grid gap-6 xl:grid-cols-[minmax(22rem,1.45fr)_minmax(18rem,1fr)]', className)}
    >
      <Field
        className={cn(
          'min-w-0 space-y-4 rounded-xl border border-border/60 bg-card/70 p-4 xl:min-w-[24rem]',
          dayPanelClassName,
        )}
        data-invalid={showDateError}
      >
        <div className="space-y-1">
          <FieldLabel>{dayLabel}</FieldLabel>
          <FieldDescription>{dayDescription}</FieldDescription>
        </div>

        {isPending ? (
          <LoadingState message={loadingMessage} />
        ) : isError ? (
          <QueryStateAlert
            title="Unable to load availability"
            message={errorMessage || 'Please try again.'}
            actionLabel={onRetry ? 'Retry' : undefined}
            onAction={onRetry}
          />
        ) : bookingDays.length === 0 ? (
          <Alert>
            <AlertCircle className="size-4" />
            <AlertTitle>{emptyTitle}</AlertTitle>
            <AlertDescription>{emptyMessage}</AlertDescription>
          </Alert>
        ) : (
          <Calendar
            mode="single"
            selected={selectedDate ? parseDayKey(selectedDate) : undefined}
            onSelect={(date) => onDateChange(date ? getDayKey(date) : '')}
            disabled={(date) => !availableDateKeys.has(getDayKey(date))}
            className="w-full rounded-xl border border-border/60 bg-background/80"
          />
        )}

        {showDateError ? <FieldError errors={dateErrors} /> : null}
      </Field>

      <div
        className={cn(
          'grid content-start gap-4 rounded-xl border border-border/60 bg-card/70 p-4',
          slotPanelClassName,
        )}
      >
        <div className="space-y-1">
          <p className="text-sm font-medium">{timesTitle}</p>
          <p className="text-sm text-muted-foreground">{timesDescription}</p>
        </div>

        <Field data-invalid={showSlotError}>
          {selectedDate && availableSlots.length > 0 ? (
            <div className={cn('max-h-80 overflow-y-auto pr-1 sm:max-h-96', slotListClassName)}>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {availableSlots.map((slot) => (
                  <Button
                    key={slot.startsAt}
                    type="button"
                    variant={selectedSlot === slot.startsAt ? 'default' : 'outline'}
                    onClick={() => onSlotChange(slot.startsAt)}
                    disabled={isSubmitting}
                  >
                    <CalendarClock className="size-4" />
                    {slot.label}
                  </Button>
                ))}
              </div>
            </div>
          ) : selectedDate ? (
            <Alert>
              <AlertCircle className="size-4" />
              <AlertTitle>{noSlotsTitle}</AlertTitle>
              <AlertDescription>{noSlotsMessage}</AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertCircle className="size-4" />
              <AlertTitle>{noDayTitle}</AlertTitle>
              <AlertDescription>{noDayMessage}</AlertDescription>
            </Alert>
          )}

          {showSlotError ? <FieldError errors={slotErrors} /> : null}
        </Field>

        {slotPanelFooter}
      </div>
    </div>
  )
}

export function useBookingDateRange(daysAhead = 30) {
  return useMemo(() => {
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + daysAhead)

    return { startDate, endDate }
  }, [daysAhead])
}

export function getDayKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function parseDayKey(dayKey: string) {
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
