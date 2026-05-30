import { cn } from '@/lib/utils'

type SpecialistSummaryItem = {
  label: string
  value: string
}

export function SpecialistSummaryCard({
  name,
  specialty,
  email,
  consultationDurationMinutes,
  className,
  items,
}: {
  name: string
  specialty?: string | null
  email?: string | null
  consultationDurationMinutes?: number | null
  className?: string
  items?: Array<SpecialistSummaryItem>
}) {
  const resolvedItems = items ?? [
    { label: 'Specialist', value: name },
    { label: 'Specialty', value: specialty ?? 'Specialist' },
    { label: 'Email', value: email ?? 'Not available' },
    {
      label: 'Session length',
      value:
        consultationDurationMinutes != null
          ? `${consultationDurationMinutes} min`
          : 'Not available',
    },
  ]

  return (
    <div
      className={cn(
        'grid gap-3 rounded-2xl border border-border/60 bg-card/90 p-4 md:grid-cols-2 xl:grid-cols-4',
        className,
      )}
    >
      {resolvedItems.map((item) => (
        <div key={item.label}>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {item.label}
          </p>
          <p className="text-sm text-foreground first:font-medium">{item.value}</p>
        </div>
      ))}
    </div>
  )
}
