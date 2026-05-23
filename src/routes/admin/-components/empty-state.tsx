import { ShieldUser } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'

export function AdminUsersEmptyState() {
  return (
    <Card className="border border-border/60 bg-card/95 shadow-lg">
      <CardContent className="flex flex-col items-center gap-6 px-8 py-14 text-center">
        <div className="flex size-20 items-center justify-center rounded-3xl bg-blue-100 dark:bg-blue-900/20">
          <ShieldUser className="size-10 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">No users found</h2>
          <p className="mx-auto max-w-xl text-sm leading-6 text-muted-foreground">
            Users will appear here once accounts are created in the application.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
