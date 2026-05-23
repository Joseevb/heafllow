import { Link, useNavigate } from '@tanstack/react-router'
import { LogOut, Settings, User as UserIcon } from 'lucide-react'

import type { BetterAuthUser } from '@/types/auth'
import type { RoutePath } from '@/types/routes'

import { useTheme } from '@/components/providers/theme-provider'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoonIcon } from '@/components/ui/moon'
import { SunIcon } from '@/components/ui/sun'
import { signOut } from '@/lib/auth-client'
import { getInitials } from '@/lib/utils'

export function UserMenu({
  user,
  compact = false,
  settingsPath = '/dashboard/settings',
}: Readonly<{ user: BetterAuthUser; compact?: boolean; settingsPath?: RoutePath }>) {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className={
              compact
                ? 'size-10 p-0 hover:bg-sidebar-accent'
                : 'w-full justify-start gap-3 px-3 py-6 hover:bg-sidebar-accent'
            }
          >
            <div className="flex size-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
              {getInitials(user.name)}
            </div>
            {!compact ? (
              <div className="flex flex-col items-start text-sm">
                <span className="font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </div>
            ) : null}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            render={
              <Link to={settingsPath}>
                <UserIcon className="mr-2 size-4" />
                Profile
              </Link>
            }
          />
          <DropdownMenuItem
            render={
              <Link to={settingsPath}>
                <Settings className="mr-2 size-4" />
                Settings
              </Link>
            }
          />
          <DropdownMenuItem onClick={(e) => setTheme(theme === 'light' ? 'dark' : 'light', e)}>
            {theme === 'light' ? (
              <MoonIcon className="mr-2 size-4" />
            ) : (
              <SunIcon className="mr-2 size-4" />
            )}
            {theme === 'light' ? 'Dark mode' : 'Light mode'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={async () => {
              await signOut()
              await navigate({ to: '/' })
            }}
          >
            <LogOut className="mr-2 size-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
