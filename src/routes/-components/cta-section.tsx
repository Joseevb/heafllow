import { Link } from '@tanstack/react-router'
import { ArrowRight, CalendarPlus, LayoutDashboard } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useSession } from '@/lib/auth-client'

export function CTASection() {
  const { data: session } = useSession.get()
  const isAuthenticated = session !== null

  return (
    <section className="mx-auto max-w-7xl pt-10 pb-16 sm:pb-24">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-linear-to-br from-blue-50 via-white to-green-50 p-6 text-slate-950 shadow-lg shadow-slate-900/10 sm:p-10 lg:p-12 dark:border-slate-800 dark:from-slate-900 dark:via-blue-950 dark:to-green-950 dark:text-white">
        <div className="absolute top-8 right-8 hidden rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-black lg:block dark:border-slate-700 dark:bg-slate-900">
          Start where your care actually happens
        </div>
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <p className="text-sm font-black tracking-[0.22em] text-teal-800 uppercase dark:text-cyan-200">
              Ready to enter the flow
            </p>
            <h2 className="mt-4 border-none pb-0 font-heading text-4xl leading-tight font-black tracking-[-0.05em] sm:text-6xl">
              Replace scattered healthcare tasks with one focused workspace.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700 dark:text-cyan-50/80">
              Book the appointment, monitor the metric, refill the medicine, and keep specialists in
              sync from the same app surface.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            {!isAuthenticated ? (
              <>
                <Button
                  nativeButton={false}
                  size="lg"
                  className="rounded-full bg-primary px-8 py-6 text-base font-black text-primary-foreground hover:bg-primary/90"
                  render={
                    <Link to="/auth/sign-up" className="flex items-center gap-2">
                      Create account <ArrowRight className="h-5 w-5" />
                    </Link>
                  }
                />
                <Button
                  nativeButton={false}
                  variant="outline"
                  size="lg"
                  className="rounded-full border-slate-300 bg-white/70 px-8 py-6 text-base font-bold hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
                  render={<Link to="/auth">Sign in</Link>}
                />
              </>
            ) : (
              <>
                <Button
                  nativeButton={false}
                  size="lg"
                  className="rounded-full bg-primary px-8 py-6 text-base font-black text-primary-foreground hover:bg-primary/90"
                  render={
                    <Link to="/dashboard" className="flex items-center gap-2">
                      <LayoutDashboard className="h-5 w-5" />
                      Open dashboard
                    </Link>
                  }
                />
                <Button
                  nativeButton={false}
                  variant="outline"
                  size="lg"
                  className="rounded-full border-slate-300 bg-white/70 px-8 py-6 text-base font-bold hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
                  render={
                    <Link to="/dashboard/appointments" className="flex items-center gap-2">
                      <CalendarPlus className="h-5 w-5" />
                      Book appointment
                    </Link>
                  }
                />
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
