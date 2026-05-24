import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import type { AdminUserListItem } from '@/lib/functions/admin'

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
import {
  adminUsersQueryOptions,
  deleteAdminUserMutationOptions,
  validateAdminUserDeletionMutationOptions,
} from '@/queries/admin-queries'

export function DeleteAdminUserDialog({
  user,
  open,
  onOpenChange,
}: {
  user: AdminUserListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()

  const validationMutation = useMutation({
    ...validateAdminUserDeletionMutationOptions(),
  })

  const deleteMutation = useMutation({
    ...deleteAdminUserMutationOptions(),
    onSuccess: async () => {
      toast.success('User anonymized successfully.')
      await queryClient.invalidateQueries({ queryKey: adminUsersQueryOptions().queryKey })
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(error.message || 'Unable to delete user.')
    },
  })

  const validation = validationMutation.data

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen && user && !validationMutation.isPending && !validationMutation.data) {
          void validationMutation.mutateAsync(user.id)
        }

        if (!nextOpen) {
          validationMutation.reset()
          deleteMutation.reset()
        }

        onOpenChange(nextOpen)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {validation && !validation.allowed ? 'Cannot Delete User' : 'Delete User'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {validationMutation.isPending ? (
              'Validating whether this user can be deleted...'
            ) : validation && !validation.allowed ? (
              validation.message
            ) : user ? (
              <>
                You are about to anonymize <strong>{user.name}</strong> and revoke access for{' '}
                <strong>{user.email}</strong>. Historical billing IDs can remain on the record, but
                active subscriptions must be cancelled first. This cannot be undone.
              </>
            ) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {validation && !validation.allowed ? (
            <AlertDialogAction onClick={() => onOpenChange(false)}>Close</AlertDialogAction>
          ) : (
            <>
              <AlertDialogCancel
                disabled={deleteMutation.isPending || validationMutation.isPending}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={
                  !user ||
                  validationMutation.isPending ||
                  deleteMutation.isPending ||
                  validation?.allowed !== true
                }
                className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
                onClick={(event) => {
                  event.preventDefault()

                  if (!user) {
                    return
                  }

                  void deleteMutation.mutateAsync(user.id)
                }}
              >
                {deleteMutation.isPending || validationMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                {deleteMutation.isPending ? 'Deleting...' : 'Delete User'}
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
