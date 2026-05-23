import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

import type { AdminAddSpecialistFormValues } from '@/schemas/admin-add-specialist'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { useAppForm } from '@/hooks/form'
import {
  adminUsersQueryOptions,
  createAdminSpecialistMutationOptions,
} from '@/queries/admin-queries'

import { AddSpecialistForm, formOpts } from './-components/add-specialist-form'
import { AddSpecialistHeader } from './-components/add-specialist-header'

export const Route = createFileRoute('/admin/add-specialist')({
  component: RouteComponent,
})

function RouteComponent() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const createSpecialistMutation = useMutation({
    ...createAdminSpecialistMutationOptions(),
    onSuccess: async () => {
      toast.success('Specialist created successfully.')
      await queryClient.invalidateQueries({ queryKey: adminUsersQueryOptions().queryKey })
      form.reset()
      await navigate({ to: '/admin' })
    },
    onError: (error) => {
      toast.error(error.message || 'Unable to create specialist.')
    },
  })

  const form = useAppForm({
    ...formOpts,
    onSubmit: async ({ value }: { value: AdminAddSpecialistFormValues }) => {
      await createSpecialistMutation.mutateAsync(value)
    },
  })

  return (
    <div className="space-y-8">
      <AddSpecialistHeader />

      <Card className="border-border/60 bg-card/95">
        <CardContent className="space-y-6 p-6">
          {createSpecialistMutation.isError ? (
            <Alert variant="destructive">
              <AlertTitle>Unable to create specialist</AlertTitle>
              <AlertDescription>{createSpecialistMutation.error.message}</AlertDescription>
            </Alert>
          ) : null}

          <AddSpecialistForm form={form} />
        </CardContent>
      </Card>
    </div>
  )
}
