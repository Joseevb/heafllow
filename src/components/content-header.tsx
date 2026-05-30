import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

export function ContentHeader() {
  return (
    <header className="flex h-12 items-center gap-2 border-b bg-background px-4 md:border-none md:bg-transparent md:px-1">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-4 md:hidden" />
      <span className="text-sm font-semibold md:hidden">HealFlow</span>
    </header>
  )
}
