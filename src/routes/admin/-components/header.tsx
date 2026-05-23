import { ShieldUser } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

export function AdminUsersHeader({ count }: { count: number }) {
  return (
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-100 p-2 dark:bg-blue-900/20">
            <ShieldUser className="size-5 text-blue-600" />
          </div>
          <h1 className="bg-linear-to-r from-blue-600 via-teal-600 to-green-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent dark:from-blue-400 dark:via-teal-400 dark:to-green-400">
            Admin Users
          </h1>
          <Badge variant="blue" size="sm">
            {count} Total
          </Badge>
        </div>
        <p className="max-w-2xl text-muted-foreground">
          Review user accounts, update roles, and manage soft-deletion from one place.
        </p>
      </div>
    </header>
  )
}
