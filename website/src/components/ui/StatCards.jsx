import { Activity, AlertTriangle, ShieldAlert } from 'lucide-react'
import { useGlobeStore } from '../../store/globeStore'
import { cn } from '@/lib/utils'

export default function StatCards() {
  const dots = useGlobeStore((s) => s.dots)
  const warnings = dots.filter((d) => d.status === 'warning').length
  const critical = dots.filter((d) => d.status === 'critical').length

  const stats = [
    {
      label: 'Active Hikers',
      icon: Activity,
      value: dots.length,
      tone: 'neutral',
    },
    {
      label: 'Warnings',
      icon: ShieldAlert,
      value: warnings,
      tone: warnings > 0 ? 'warning' : 'neutral',
    },
    {
      label: 'Critical',
      icon: AlertTriangle,
      value: critical,
      tone: critical > 0 ? 'critical' : 'neutral',
    },
  ]

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-3 backdrop-blur-xl shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
      <p className="px-2 pb-3 pt-1 text-[0.64rem] font-medium uppercase tracking-[0.24em] text-white/40">
        Overview
      </p>

      <div className="flex flex-col gap-2">
        {stats.map((stat) => {
          const Icon = stat.icon
          const isCritical = stat.tone === 'critical'
          const isWarning = stat.tone === 'warning'
          return (
            <article
              key={stat.label}
              className={cn(
                'flex items-center gap-3 rounded-xl border px-3 py-3 transition-colors',
                isCritical
                  ? 'border-red-400/30 bg-red-500/10'
                  : isWarning
                    ? 'border-amber-400/25 bg-amber-500/10'
                    : 'border-white/8 bg-white/[0.03]'
              )}
            >
              <div
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-lg border',
                  isCritical
                    ? 'border-red-400/30 bg-red-400/15 text-red-200'
                    : isWarning
                      ? 'border-amber-400/25 bg-amber-400/15 text-amber-200'
                      : 'border-white/10 bg-white/[0.05] text-white/70'
                )}
              >
                <Icon className="size-[18px]" strokeWidth={1.75} />
              </div>

              <div className="flex min-w-0 flex-1 items-baseline justify-between gap-2">
                <p
                  className={cn(
                    'truncate text-[0.64rem] font-medium uppercase tracking-[0.2em]',
                    isCritical
                      ? 'text-red-100/80'
                      : isWarning
                        ? 'text-amber-100/80'
                        : 'text-white/50'
                  )}
                >
                  {stat.label}
                </p>
                <p
                  className={cn(
                    'text-2xl font-medium leading-none tracking-[-0.04em] tabular-nums',
                    isCritical
                      ? 'text-red-50'
                      : isWarning
                        ? 'text-amber-50'
                        : 'text-white/92'
                  )}
                >
                  {stat.value}
                </p>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
