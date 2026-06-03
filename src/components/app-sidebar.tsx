import type { ReactNode } from 'react'

import { Link } from '@tanstack/react-router'
import { Image } from '@unpic/react'
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
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
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

const sidebarFadeClass =
  'transition-opacity duration-200 ease-linear group-data-[collapsible=icon]:opacity-0'

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
                <span className={sidebarFadeClass}>{item.title}</span>
                <ChevronRight className={cn('ml-auto opacity-50', sidebarFadeClass)} />
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
              <span className={sidebarFadeClass}>{item.title}</span>
              <ChevronUp
                className={cn(
                  'ml-auto transition-[opacity,transform] duration-200 ease-linear',
                  'group-data-[collapsible=icon]:opacity-0',
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
      <SidebarHeader
        className={cn('group/sidebar-header relative h-19 justify-center overflow-hidden')}
      >
        <div
          className={cn(
            'absolute inset-x-2 inset-y-0 z-10 flex items-center justify-between gap-2 opacity-100',
            'transition-opacity duration-200 ease-linear group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:z-0 group-data-[collapsible=icon]:opacity-0',
          )}
        >
          <div className="flex shrink-0 justify-start">
            <Image src="/logo624.png" alt="Healflow logo" width={150} height={60} />
          </div>
          <SidebarTrigger className="relative z-10 hidden shrink-0 md:inline-flex" />
        </div>
        <div
          className={cn(
            'pointer-events-none absolute inset-x-2 inset-y-0 z-0 flex items-center opacity-0',
            'transition-opacity duration-200 ease-linear group-data-[collapsible=icon]:pointer-events-auto group-data-[collapsible=icon]:z-10 group-data-[collapsible=icon]:opacity-100',
          )}
        >
          <div className="flex shrink-0 justify-start">
            <Image
              src="/logo220.png"
              alt="Healflow logo"
              width={34}
              height={34}
              className="transition-opacity duration-200 ease-linear group-hover/sidebar-header:opacity-0"
            />
          </div>
          <SidebarTrigger className="pointer-events-none absolute left-0 hidden opacity-0 transition-opacity duration-200 ease-linear group-hover/sidebar-header:pointer-events-auto group-hover/sidebar-header:opacity-100 md:inline-flex" />
        </div>
      </SidebarHeader>
      <SidebarContent className="border-r-0">
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
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
                          <span className={sidebarFadeClass}>{item.title}</span>
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
