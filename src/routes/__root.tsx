import type { QueryClient } from '@tanstack/react-query'

import { TanStackDevtools } from '@tanstack/react-devtools'
import { HeadContent, Link, Scripts, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { Compass, Home, InfoIcon } from 'lucide-react'

import { ThemeProvider } from '@/components/providers/theme-provider'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import appCss from '../styles.css?url'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start Starter',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFoundPage,
  errorComponent: ({ error, info, reset }) => {
    console.error('\nError\n', error, '\nInfo\n', info)
    return (
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <InfoIcon />
            </AlertDialogMedia>
            <AlertDialogTitle>An error has occurred</AlertDialogTitle>
            <AlertDialogDescription>
              An error happened when loading the page.
              <br />
              Please try to load the page again, and if it continues contact support.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className="cursor-pointer" onClick={reset}>
              Reload
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  },
})

function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.12),transparent_35%)]" />

      <Card className="relative w-full max-w-xl border border-border/60 bg-card/95 backdrop-blur-sm">
        <CardHeader className="gap-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-muted/60 px-3 py-1 text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
            <Compass className="size-3.5 text-primary" />
            404 Not Found
          </div>
          <CardTitle className="text-3xl font-semibold tracking-tight sm:text-4xl">
            This page is off the map.
          </CardTitle>
          <CardDescription className="max-w-lg text-base leading-7">
            The route you requested does not exist, may have moved, or is no longer available.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 sm:flex-row">
          <Link className={buttonVariants({ size: 'lg' })} to="/">
            <Home className="size-4" />
            Go Home
          </Link>

          <Link className={buttonVariants({ variant: 'outline', size: 'lg' })} to="/dashboard">
            Open Dashboard
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>
          <TooltipProvider>
            {children}
            <Toaster richColors={true} />
          </TooltipProvider>
        </ThemeProvider>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
