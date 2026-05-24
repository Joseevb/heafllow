import { MoreHorizontal } from 'lucide-react'

import type { DataTableColumnDef } from '@/components/data-table'
import type { AdminUserListItem } from '@/lib/functions/admin'

import { DataTable } from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

function formatRole(role: AdminUserListItem['role']) {
  if (!role) {
    return 'Unassigned'
  }

  return role.charAt(0).toUpperCase() + role.slice(1)
}

function formatDate(value: Date) {
  return value.toLocaleDateString()
}

function createColumns({
  onEdit,
  onDelete,
}: {
  onEdit: (user: AdminUserListItem) => void
  onDelete: (user: AdminUserListItem) => void
}): Array<DataTableColumnDef<AdminUserListItem, unknown>> {
  return [
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const user = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-sm">
                  <MoreHorizontal className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onEdit(user)}>Edit</DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                disabled={user.hasActiveSubscription}
                onClick={() => onDelete(user)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
    {
      accessorKey: 'name',
      header: 'Name',
      tooltip: ({ row }) => row.name,
    },
    {
      accessorKey: 'email',
      header: 'Email',
      tooltip: ({ row }) => row.email,
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => <Badge variant="secondary">{formatRole(row.original.role)}</Badge>,
    },
    {
      accessorKey: 'banned',
      header: 'Access',
      cell: ({ row }) => (
        <Badge variant={row.original.banned ? 'error' : 'success'}>
          {row.original.banned ? 'Blocked' : 'Active'}
        </Badge>
      ),
    },
    {
      accessorKey: 'hasActiveSubscription',
      header: 'Subscription',
      cell: ({ row }) => (
        <Badge variant={row.original.hasActiveSubscription ? 'info' : 'secondary'}>
          {row.original.hasActiveSubscription ? 'Active' : 'None'}
        </Badge>
      ),
    },
    {
      accessorKey: 'onboardingComplete',
      header: 'Onboarding',
      cell: ({ row }) => (
        <Badge variant={row.original.onboardingComplete ? 'success' : 'warning'}>
          {row.original.onboardingComplete ? 'Complete' : 'Pending'}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => formatDate(row.original.createdAt),
      tooltip: ({ row }) => row.createdAt.toISOString(),
    },
    {
      accessorKey: 'updatedAt',
      header: 'Updated',
      cell: ({ row }) => formatDate(row.original.updatedAt),
      tooltip: ({ row }) => row.updatedAt.toISOString(),
    },
  ]
}

export function AdminUsersTable({
  users,
  onEdit,
  onDelete,
}: {
  users: Array<AdminUserListItem>
  onEdit: (user: AdminUserListItem) => void
  onDelete: (user: AdminUserListItem) => void
}) {
  return <DataTable columns={createColumns({ onEdit, onDelete })} data={users} />
}
