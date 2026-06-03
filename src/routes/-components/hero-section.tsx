import { Link } from '@tanstack/react-router'
import {
  Activity,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock3,
  HeartPulse,
  Pill,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useSession } from '@/lib/auth-client'

const careSignals = [
  { label: 'Heart rate', value: '72 bpm', tone: 'text-emerald-600 dark:text-emerald-300' },
  { label: 'Sleep', value: '7h 40m', tone: 'text-cyan-600 dark:text-cyan-300' },
  { label: 'Adherence', value: '96%', tone: 'text-lime-700 dark:text-lime-300' },
]

const timeline = [
  {
    time: '09:30',
    title: 'Cardiology follow-up',
    detail: 'Dr. Rivera confirmed',
    icon: Stethoscope,
  },
  {
    time: '12:00',
    title: 'Medication refill',
    detail: 'Atorvastatin request queued',
    icon: Pill,
  },
  {
    time: '18:15',
    title: 'Blood pressure log',
    detail: '122/78 added to metrics',
    icon: HeartPulse,
  },
]

export function HeroSection() {
  const { data: session } = useSession.get()
  const isAuthenticated = session !== null

  return (
    <section className="relative mx-auto max-w-7xl overflow-hidden rounded-[1.75rem] border border-white/70 bg-linear-to-br from-white/92 via-blue-100/85 to-emerald-100/85 px-4 py-8 shadow-xl shadow-slate-900/10 sm:rounded-[2.25rem] sm:px-8 sm:py-10 lg:px-12 lg:py-16 dark:border-slate-700 dark:from-slate-950 dark:via-blue-950 dark:to-green-950">
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white to-transparent dark:via-cyan-300/50" />
      <div className="relative grid items-center gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12">
        <div className="space-y-6 sm:space-y-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-600/15 bg-cyan-100/80 px-4 py-2 text-sm font-medium text-cyan-900 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-100">
              <ShieldCheck className="h-4 w-4" />
              Encrypted care workflows for clients and specialists
            </div>
            <h1 className="max-w-4xl text-left font-heading text-4xl leading-[0.98] font-black tracking-[-0.05em] text-slate-950 sm:text-6xl sm:tracking-[-0.06em] lg:text-7xl dark:text-white">
              Healthcare that moves in one controlled flow.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-xl sm:leading-8 dark:text-slate-300">
              Healflow connects appointment booking, medicine refills, health metrics, specialist
              schedules, and secure account management into one calm operating system for care.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            {!isAuthenticated ? (
              <>
                <Button nativeButton={false}
                  size="lg"
                  className="w-full rounded-full bg-primary px-8 py-6 text-base font-bold text-primary-foreground shadow-sm hover:bg-primary/90 sm:w-auto"
                  render={
                    <Link to="/auth/sign-up" className="flex items-center gap-2">
                      Start your care hub <ArrowRight className="h-5 w-5" />
                    </Link>
                  }
                />
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full rounded-full border-cyan-700/15 bg-white/55 px-8 py-6 text-base text-slate-800 hover:bg-white hover:text-slate-950 sm:w-auto dark:border-cyan-200/25 dark:bg-slate-900/40 dark:text-white dark:hover:bg-slate-800 dark:hover:text-white"
                  render={<a href="#features">Explore workflows</a>}
                />
              </>
            ) : (
              <>
                <Button
                  size="lg"
                  className="w-full rounded-full bg-primary px-8 py-6 text-base font-bold text-primary-foreground shadow-sm hover:bg-primary/90 sm:w-auto"
                  render={
                    <Link to="/dashboard" className="flex items-center gap-2">
                      Open dashboard <ArrowRight className="h-5 w-5" />
                    </Link>
                  }
                />
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full rounded-full border-cyan-700/15 bg-white/55 px-8 py-6 text-base text-slate-800 hover:bg-white hover:text-slate-950 sm:w-auto dark:border-cyan-200/25 dark:bg-slate-900/40 dark:text-white dark:hover:bg-slate-800 dark:hover:text-white"
                  render={
                    <Link to="/dashboard/appointments" className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Book appointment
                    </Link>
                  }
                />
              </>
            )}
          </div>

          <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
            {careSignals.map((signal) => (
              <div
                key={signal.label}
                className="rounded-3xl border border-white/70 bg-white/65 p-4 shadow-sm shadow-slate-950/10 dark:border-cyan-200/15 dark:bg-slate-900/55"
              >
                <p className="text-xs tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                  {signal.label}
                </p>
                <p className={`mt-2 text-2xl font-black ${signal.tone}`}>{signal.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="rounded-[1.5rem] border border-cyan-100/25 bg-white/10 p-2 shadow-sm shadow-slate-950/10 sm:rounded-[2rem] sm:p-6 dark:border-cyan-200/15 dark:bg-slate-900/60">
            <div className="rounded-[1.25rem] bg-slate-50 p-4 text-slate-950 sm:rounded-[1.5rem] sm:p-5 dark:bg-slate-900 dark:text-white">
              <div className="mb-4 inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-black tracking-[0.16em] text-green-700 uppercase dark:bg-green-900/30 dark:text-green-200">
                Live care plan
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-slate-950/10 pb-5 dark:border-white/10">
                <div>
                  <p className="text-xs font-bold tracking-[0.2em] text-slate-500 uppercase dark:text-slate-400">
                    Client overview
                  </p>
                  <h2 className="mt-2 font-heading text-xl font-black tracking-tight sm:text-2xl">
                    Today in care
                  </h2>
                </div>
                <div className="rounded-2xl bg-slate-950 px-3 py-2 text-right text-white sm:px-4 sm:py-3 dark:bg-white dark:text-slate-950">
                  <p className="text-xs text-cyan-200 dark:text-slate-500">Score</p>
                  <p className="text-2xl font-black">91</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {timeline.map((item) => {
                  const Icon = item.icon

                  return (
                    <div
                      key={item.title}
                      className="grid grid-cols-[3.75rem_1fr] gap-2 rounded-2xl border border-slate-950/10 bg-white/70 p-2 sm:grid-cols-[4.5rem_1fr] sm:gap-3 sm:rounded-3xl sm:p-3 dark:border-white/10 dark:bg-white/5"
                    >
                      <div className="flex items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-cyan-100 dark:bg-white dark:text-slate-950">
                        {item.time}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-cyan-100 p-2 text-cyan-700 sm:p-3 dark:bg-cyan-400/10 dark:text-cyan-200">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold sm:text-base">{item.title}</p>
                          <p className="text-xs text-slate-500 sm:text-sm dark:text-slate-400">
                            {item.detail}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-950 p-4 text-white dark:bg-white dark:text-slate-950">
                  <div className="flex items-center gap-2 text-cyan-200 dark:text-cyan-700">
                    <Activity className="h-4 w-4" />
                    <span className="text-xs font-bold tracking-[0.16em] uppercase">Metrics</span>
                  </div>
                  <p className="mt-3 text-2xl font-black sm:text-3xl">8</p>
                  <p className="text-sm text-slate-300 dark:text-slate-600">logged this week</p>
                </div>
                <div className="rounded-3xl border border-slate-950/10 bg-lime-200 p-4 text-slate-950 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-xs font-bold tracking-[0.16em] uppercase">
                      Specialist
                    </span>
                  </div>
                  <p className="mt-3 text-lg font-black">Availability synced</p>
                  <p className="flex items-center gap-1 text-sm text-slate-700">
                    <Clock3 className="h-3.5 w-3.5" />
                    next slot in 22 min
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
