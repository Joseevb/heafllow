import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import type { AdminUserListItem } from '@/lib/admin.functions'

import { adminUsersQueryOptions } from '@/queries/admin-queries'

import { DeleteAdminUserDialog } from './-components/delete-user-dialog'
import { EditAdminUserDialog } from './-components/edit-user-dialog'
import { AdminUsersEmptyState } from './-components/empty-state'
import { AdminUsersHeader } from './-components/header'
import { AdminUsersTable } from './-components/users-table'

export const Route = createFileRoute('/admin/')({
  component: RouteComponent,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(adminUsersQueryOptions())
  },
})

function RouteComponent() {
  const { data: users } = useSuspenseQuery(adminUsersQueryOptions())
  const [editingUser, setEditingUser] = useState<AdminUserListItem | null>(null)
  const [deletingUser, setDeletingUser] = useState<AdminUserListItem | null>(null)

  return (
    <div className="space-y-8">
      <AdminUsersHeader count={users.length} />

      {users.length === 0 ? (
        <AdminUsersEmptyState />
      ) : (
        <AdminUsersTable users={users} onEdit={setEditingUser} onDelete={setDeletingUser} />
      )}

      <EditAdminUserDialog
        user={editingUser}
        open={!!editingUser}
        onOpenChange={(open) => {
          if (!open) {
            setEditingUser(null)
          }
        }}
      />

      <DeleteAdminUserDialog
        user={deletingUser}
        open={!!deletingUser}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingUser(null)
          }
        }}
      />
    </div>
  )
}
