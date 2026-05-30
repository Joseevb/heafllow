import { Link } from '@tanstack/react-router'
import { Image } from '@unpic/react'

import { ModeToggle } from '@/components/mode-toggle'
import { Button } from '@/components/ui/button'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import { UserIcon } from '@/components/ui/user'

export function Header() {
  return (
    <header className="fixed z-50 flex w-full flex-row justify-between bg-linear-to-br from-slate-100/90 via-blue-50/90 to-green-50/90 px-4 py-3 sm:p-6 dark:from-slate-900/90 dark:via-blue-950/90 dark:to-green-950/75">
      <div>
        <Link to="/">
          <Image src={'/logo220.png'} alt="logo" width={40} height={40} />
        </Link>
      </div>
      <NavigationMenu>
        <NavigationMenuList className="gap-3">
          <NavigationMenuItem>
            <ModeToggle mode="small" />
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              className={navigationMenuTriggerStyle()}
              render={
                <Button
                  nativeButton={false}
                  render={
                    <Link to="/auth/sign-up">
                      <UserIcon />
                      Sign up
                    </Link>
                  }
                />
              }
            />
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </header>
  )
}
