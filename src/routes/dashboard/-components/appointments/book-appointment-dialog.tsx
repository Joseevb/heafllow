import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { Plus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'

import type { BookAppointmentFormValues } from '@/schemas/appointments'

import { Button } from '@/components/ui/button'
import {
  DialogClose,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useAppForm } from '@/hooks/form'
import {
  createAppointmentMutationOptions,
  getSpecialistBookingAvailabilityQueryOptions,
  getUpcomingAppointmentsQueryOptions,
} from '@/queries/appointment-queries'
import { availableSpecialistsQueryOptions } from '@/queries/specialist-queries'

import { BookAppointmentForm, formOpts } from './book-appointment-form'

function useBookingDateRange() {
  return useMemo(() => {
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 30)

    return { startDate, endDate }
  }, [])
}

export default function BookAppointmentDialog() {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [, startTransition] = useTransition()
  const { startDate, endDate } = useBookingDateRange()

  const createAppointmentMutation = useMutation({
    ...createAppointmentMutationOptions(),
    onSuccess: async (_, variables) => {
      toast.success('Appointment booked successfully.')

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getUpcomingAppointmentsQueryOptions().queryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: getSpecialistBookingAvailabilityQueryOptions({
            specialistId: variables.specialistId,
            startDate,
            endDate,
          }).queryKey,
        }),
      ])

      form.reset()
      setIsOpen(false)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to book appointment.')
    },
  })

  const form = useAppForm({
    ...formOpts,
    onSubmit: async ({ value }: { value: BookAppointmentFormValues }) => {
      await createAppointmentMutation.mutateAsync({
        specialistId: value.specialistId,
        appointmentDate: new Date(value.appointmentDate),
        notes: value.notes || undefined,
      })
    },
  })

  const selectedSpecialistId = useStore(form.store, (state) => state.values.specialistId)
  const selectedDate = useStore(form.store, (state) => state.values.selectedDate)
  const selectedAppointmentDate = useStore(form.store, (state) => state.values.appointmentDate)
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)

  const specialistsQuery = useQuery(availableSpecialistsQueryOptions())
  const availabilityQuery = useQuery({
    ...getSpecialistBookingAvailabilityQueryOptions({
      specialistId: selectedSpecialistId || '',
      startDate,
      endDate,
    }),
    enabled: Boolean(selectedSpecialistId),
  })

  const bookingDays = availabilityQuery.data ?? []

  useEffect(() => {
    if (!selectedSpecialistId) {
      form.setFieldValue('selectedDate', '')
      form.setFieldValue('appointmentDate', '')
      return
    }

    if (bookingDays.length === 0) {
      if (selectedDate) {
        form.setFieldValue('selectedDate', '')
      }

      if (selectedAppointmentDate) {
        form.setFieldValue('appointmentDate', '')
      }

      return
    }

    const activeDay = bookingDays.find((day) => day.date === selectedDate)
    const hasAvailableSelectedDay =
      activeDay?.slots.some((slot) => slot.status === 'available') ?? false
    const nextSelectedDate = hasAvailableSelectedDay
      ? selectedDate
      : bookingDays.find((day) => day.slots.some((slot) => slot.status === 'available'))?.date || ''

    if (selectedDate !== nextSelectedDate) {
      form.setFieldValue('selectedDate', nextSelectedDate)
    }

    const activeSlot = bookingDays
      .flatMap((day) => day.slots)
      .find((slot) => slot.startsAt === selectedAppointmentDate && slot.status === 'available')

    if (!activeSlot) {
      form.setFieldValue('appointmentDate', '')
    }
  }, [bookingDays, form, selectedAppointmentDate, selectedDate, selectedSpecialistId])

  const handleSpecialistChange = useCallback(
    (specialistId: string) => {
      startTransition(() => {
        if (selectedSpecialistId !== specialistId) {
          form.setFieldValue('selectedDate', '')
          form.setFieldValue('appointmentDate', '')
        }
      })
    },
    [form, selectedSpecialistId],
  )

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open)

      if (!open) {
        form.reset()
        createAppointmentMutation.reset()
      }
    },
    [createAppointmentMutation, form],
  )

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" />
            Book Appointment
          </Button>
        }
      />

      <DialogContent
        className={
          selectedSpecialistId
            ? 'flex max-h-[min(90vh,64rem)] w-full flex-col overflow-hidden sm:max-w-4xl xl:max-w-5xl'
            : 'flex max-h-[min(90vh,64rem)] w-full flex-col overflow-hidden sm:max-w-xl'
        }
      >
        <DialogHeader className="shrink-0">
          <DialogTitle>Book Appointment</DialogTitle>
          <DialogDescription>
            Choose a specialist, pick an available day, and confirm your appointment slot.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <BookAppointmentForm
            formId="book-appointment-form"
            hideSubmitActions
            form={form}
            specialists={specialistsQuery.data ?? []}
            isSpecialistsPending={specialistsQuery.isPending}
            isSpecialistsError={specialistsQuery.isError}
            specialistsErrorMessage={specialistsQuery.error?.message}
            onRetrySpecialists={() => void specialistsQuery.refetch()}
            onSpecialistChange={handleSpecialistChange}
            bookingDays={bookingDays}
            isAvailabilityPending={availabilityQuery.isPending}
            isAvailabilityError={availabilityQuery.isError}
            availabilityErrorMessage={availabilityQuery.error?.message}
            onRetryAvailability={() => void availabilityQuery.refetch()}
            submitErrorMessage={
              createAppointmentMutation.isError
                ? createAppointmentMutation.error.message
                : undefined
            }
          />
        </div>

        <DialogFooter className="shrink-0 border-t border-border/60 pt-4">
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            type="submit"
            form="book-appointment-form"
            disabled={!selectedSpecialistId || !selectedAppointmentDate || isSubmitting}
          >
            {isSubmitting ? 'Confirming...' : 'Confirm Appointment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
