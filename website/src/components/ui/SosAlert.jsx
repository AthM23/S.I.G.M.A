import { useEffect } from 'react'
import { useGlobeStore } from '../../store/globeStore'

const DISMISS_MS = 10_000

export default function SosAlert() {
  const sosTriggeredAt = useGlobeStore((s) => s.sosTriggeredAt)
  const clearSos = useGlobeStore((s) => s.clearSos)
  const liveHikerId = useGlobeStore((s) => s.liveHikerId)
  const dots = useGlobeStore((s) => s.dots)

  useEffect(() => {
    if (!sosTriggeredAt) return
    const t = setTimeout(clearSos, DISMISS_MS)
    return () => clearTimeout(t)
  }, [sosTriggeredAt, clearSos])

  if (!sosTriggeredAt) return null

  const hiker = dots.find((d) => d.id === liveHikerId)
  const name = hiker?.name ?? 'Unknown hiker'
  const station = hiker?.groundStation ?? '—'

  return (
    <div className="pointer-events-none fixed bottom-6 right-4 z-[110] w-80 sm:right-6">
      <div className="pointer-events-auto relative overflow-hidden rounded-2xl border border-red-500/50 bg-[linear-gradient(180deg,rgba(40,8,10,0.97),rgba(15,3,4,0.95))] p-4 shadow-[0_20px_60px_rgba(220,38,38,0.35)] ring-1 ring-red-500/30 animate-in slide-in-from-bottom-2 fade-in duration-200">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-400/60 to-transparent" />
        <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-red-500/25 blur-3xl" />

        <div className="relative flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-400/40 bg-red-500/20">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-red-300">
              SOS Alert
            </p>
            <p className="mt-1 text-base font-semibold tracking-[-0.01em] text-white/95">
              {name} triggered SOS
            </p>
            <p className="mt-1 text-xs text-white/55">
              {station} · immediate response required
            </p>
          </div>
          <button
            onClick={clearSos}
            aria-label="Dismiss SOS alert"
            className="shrink-0 rounded-lg border border-white/10 bg-white/[0.03] p-1.5 text-white/40 transition-colors hover:bg-white/[0.08] hover:text-white/80"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
