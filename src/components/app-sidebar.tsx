import type { ReactNode } from 'react'

import { Link } from '@tanstack/react-router'
import { ChevronRight, ChevronUp } from 'lucide-react'
import { useEffect, useState } from 'react'

import type { RoutePath } from '@/types/routes'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

type SidebarItemBase = {
  title: string
  icon: React.ComponentType<React.ComponentProps<'svg'>>
}

type SidebarItemLink = SidebarItemBase & {
  collapsible?: false
  url: RoutePath
}

type SidebarItemCollapsibleChild = {
  component: React.ReactElement
  title: string
}

type SidebarItemCollapsible = SidebarItemBase & {
  collapsible: true
  children: Array<SidebarItemCollapsibleChild>
}

type SidebarItem = SidebarItemLink | SidebarItemCollapsible

export type SidebarItems = ReadonlyArray<SidebarItem>

function CollapsibleItem({ item }: { item: SidebarItemCollapsible }) {
  const { state, isMobile } = useSidebar()
  const [open, setOpen] = useState(false)
  const isCollapsed = state === 'collapsed' && !isMobile

  useEffect(() => {
    if (isCollapsed) {
      setOpen(false)
    }
  }, [isCollapsed])

  if (isCollapsed) {
    return (
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton tooltip={item.title}>
                <item.icon />
                <span>{item.title}</span>
                <ChevronRight className="ml-auto opacity-50" />
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent side="right" align="start" className="w-48 rounded-lg">
            <DropdownMenuLabel>{item.title}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {item.children.map((child) => (
              <DropdownMenuItem key={child.title} render={child.component} />
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    )
  }

  return (
    <Collapsible key={item.title} open={open} onOpenChange={setOpen}>
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={item.title}
          render={
            <CollapsibleTrigger>
              <item.icon />
              <span>{item.title}</span>
              <ChevronUp
                className={cn(
                  'ml-auto transition-transform duration-200',
                  open ? 'rotate-0' : 'rotate-180',
                )}
              />
            </CollapsibleTrigger>
          }
        />
      </SidebarMenuItem>
      <CollapsibleContent className="w-full">
        <SidebarGroupContent className="w-full">
          {item.children.map((child) => (
            <SidebarMenuItem key={child.title} className="w-full">
              <SidebarMenuButton className="w-full" render={child.component} />
            </SidebarMenuItem>
          ))}
        </SidebarGroupContent>
      </CollapsibleContent>
    </Collapsible>
  )
}

interface AppSidebarProps {
  baseUrl: RoutePath
  footer?: ReactNode
  items: (baseUrl: RoutePath) => ReadonlyArray<SidebarItem>
  handleTransitionEnd?: (event: React.TransitionEvent<HTMLDivElement>) => void
}

export function AppSidebar({
  baseUrl,
  footer,
  items,
  handleTransitionEnd,
}: Readonly<AppSidebarProps>) {
  return (
    <Sidebar
      collapsible="icon"
      className="border-r-0 **:overflow-x-hidden **:overflow-y-hidden"
      onTransitionEnd={handleTransitionEnd}
    >
      <SidebarContent className="border-r-0">
        <SidebarGroup>
          <SidebarGroupLabel>HealFlow</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items(baseUrl).map((item) =>
                item.collapsible ? (
                  <CollapsibleItem key={item.title} item={item} />
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      render={
                        <Link to={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                ),
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {footer && <SidebarFooter className="p-1">{footer}</SidebarFooter>}
      <SidebarRail />
    </Sidebar>
  )
}
