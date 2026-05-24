import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { useEffect } from 'react'
import { toast } from 'sonner'

import type { AdminUserListItem } from '@/lib/functions/admin'
import type { AdminUserEditInput } from '@/schemas/admin'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAppForm } from '@/hooks/form'
import {
  adminUsersQueryOptions,
  updateAdminUserMutationOptions,
  validateAdminUserRoleTransitionMutationOptions,
} from '@/queries/admin-queries'

import { EditAdminUserForm, formOpts } from './edit-user-form'

export function EditAdminUserDialog({
  user,
  open,
  onOpenChange,
}: {
  user: AdminUserListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()

  const updateUserMutation = useMutation({
    ...updateAdminUserMutationOptions(),
    onSuccess: async () => {
      toast.success('User updated successfully.')
      await queryClient.invalidateQueries({ queryKey: adminUsersQueryOptions().queryKey })
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(error.message || 'Unable to update user.')
    },
  })

  const roleValidationMutation = useMutation({
    ...validateAdminUserRoleTransitionMutationOptions(),
  })

  const form = useAppForm({
    ...formOpts,
    onSubmit: async ({ value }: { value: AdminUserEditInput }) => {
      if (!user) {
        return
      }

      if (value.role !== (user.role ?? 'client')) {
        const validation = await roleValidationMutation.mutateAsync({
          userId: user.id,
          role: value.role,
        })

        if (!validation.allowed) {
          toast.error(validation.message)
          return
        }
      }

      await updateUserMutation.mutateAsync({
        userId: user.id,
        data: {
          name: value.name,
          email: value.email,
          role: value.role,
          banned: value.banned === 'true',
        },
      })
    },
  })

  const selectedRole = useStore(form.store, (state) => state.values.role)
  const currentRole = user?.role ?? 'client'

  useEffect(() => {
    if (!user || !open || selectedRole === currentRole) {
      roleValidationMutation.reset()
      return
    }

    void roleValidationMutation.mutateAsync({
      userId: user.id,
      role: selectedRole,
    })
  }, [currentRole, open, roleValidationMutation, selectedRole, user])

  useEffect(() => {
    if (!user) {
      return
    }

    form.reset({
      name: user.name,
      email: user.email,
      role: user.role ?? 'client',
      banned: user.banned ? 'true' : 'false',
    })
  }, [form, user])

  if (!user) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update account access for {user.name}.</DialogDescription>
        </DialogHeader>

        {roleValidationMutation.data && !roleValidationMutation.data.allowed ? (
          <Alert variant="destructive">
            <AlertTitle>Role change blocked</AlertTitle>
            <AlertDescription>{roleValidationMutation.data.message}</AlertDescription>
          </Alert>
        ) : null}

        <EditAdminUserForm form={form} />
      </DialogContent>
    </Dialog>
  )
}
