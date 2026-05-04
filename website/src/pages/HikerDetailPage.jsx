import { Link, useParams } from 'react-router-dom'
import { useGlobeStore } from '../store/globeStore'
import { useSettingsStore } from '../store/settingsStore'
import { useSyncTick } from '../hooks/useSyncTick'

const STATUS_PILL = {
  normal: 'bg-green-500/15 text-green-400 border border-green-500/25',
  warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
  critical: 'bg-red-500/15 text-red-400 border border-red-500/25',
}

const STATUS_LABEL = { normal: 'Normal', warning: 'Warning', critical: 'Critical' }

function relativeTime(iso) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60) return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  return `${Math.floor(secs / 3600)}h ago`
}

function VitalCard({ label, value, unit, offline }) {
  return (
    <div className="border border-white/10 bg-white/[0.02] p-4">
      <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/40">{label}</p>
      {offline ? (
        <p className="text-sm text-white/30">sensor offline</p>
      ) : (
        <div className="flex items-end gap-1.5">
          <p className="text-3xl font-semibold leading-none tabular-nums text-white/95">{value ?? '—'}</p>
          <p className="mb-0.5 text-sm text-white/40">{unit}</p>
        </div>
      )}
    </div>
  )
}

function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <p className="text-sm uppercase tracking-[0.16em] text-white/60">Hiker not found</p>
      <Link
        to="/people"
        className="text-xs text-white/40 underline underline-offset-4 transition-colors hover:text-white/70"
      >
        Back to People
      </Link>
    </div>
  )
}

function formatTemp(celsius, unit) {
  if (celsius == null) return '—'
  if (unit === 'F') return `${((celsius * 9) / 5 + 32).toFixed(1)}`
  return celsius.toFixed(1)
}

function tempUnit(unit) {
  return unit === 'F' ? '°F' : '°C'
}

function triageSummaryFor(hiker) {
  const s = hiker.sensors ?? {}
  const firstName = hiker.name.split(' ')[0]

  if (hiker.id === 1) {
    return `Vitals nominal. Heart rate, SpO₂, and body temperature are all within the steady-state band. Live wrist-sensor feed is active and stable — no elevated risk indicators.`
  }

  if (hiker.status === 'critical') {
    if (s.spO2 != null && s.spO2 <= 90) {
      return `SpO₂ at ${s.spO2}% is below the critical floor and has been trending down for the past ~6 minutes. Pattern is consistent with altitude distress during the current ascent segment. Recommend immediate voice contact with ${firstName}, pause forward movement, and prepare for controlled descent if saturation does not recover within 3 minutes of rest.`
    }
    if (s.heartRate != null && s.heartRate >= 170) {
      return `Heart rate of ${s.heartRate} bpm has sustained above the critical threshold for ~4 minutes. Given ${firstName}'s recent exertion profile, this is outside expected recovery behavior. Initiate radio check-in, confirm consciousness and hydration status, and flag ${hiker.groundStation} operator for standby.`
    }
    if (s.temperature != null && s.temperature >= 39.5) {
      return `Core temperature at ${s.temperature.toFixed(1)}°C indicates probable heat stress. Ambient humidity (${s.humidity ?? '—'}%) is elevating thermal load. Advise ${firstName} to shelter in shade, remove outer layer, begin measured hydration, and hold position until temperature retreats below 38.5°C.`
    }
    return `Multiple vitals are outside acceptable bounds. Cross-sensor degradation suggests an acute event — recommend immediate radio contact and standby for extraction coordination.`
  }

  if (hiker.status === 'warning') {
    if (s.heartRate != null && s.heartRate >= 140) {
      return `Heart rate trending at ${s.heartRate} bpm — elevated but consistent with sustained uphill effort across the last ~12 minutes. No concurrent SpO₂ or temperature drift. Expected to normalize within 10 minutes of a rest window; no operator action required unless trend persists past 20 minutes.`
    }
    if (s.spO2 != null && s.spO2 <= 94) {
      return `SpO₂ drifting to ${s.spO2}% — within the warning band but above the critical floor. Pattern matches altitude-acclimatization behavior observed in similar terrain segments. Recommend a passive hydration reminder; escalate only if saturation drops another 2 points.`
    }
    if (s.temperature != null && s.temperature >= 38.0) {
      return `Body temperature at ${s.temperature.toFixed(1)}°C is mildly elevated. Likely exertion-driven given the current ascent profile. Monitor for humidity-driven compounding; no immediate intervention required.`
    }
    return `One or more vitals outside the nominal band but no critical indicators. Continue passive monitoring on standard cadence.`
  }

  return `All vitals within nominal envelope. ${firstName} has maintained steady pace and stable sensor signatures over the last 30 minutes. No elevated risk flags across heart rate, oxygen, or thermal channels. Next automated review in 15 minutes.`
}

function historyFor(hiker) {
  if (hiker.id === 1) return []

  const s = hiker.sensors ?? {}
  const rng = (n) => ((hiker.id * 2654435761) % (10 ** n))
  const baseMin = 6 + (rng(2) % 12)

  const events = [
    { t: 1, text: `Telemetry sync with ${hiker.groundStation}` },
    { t: baseMin, text: `Waypoint reached — segment ${String.fromCharCode(65 + (hiker.id % 6))}-${3 + (hiker.id % 5)}` },
    { t: baseMin + 14 + (rng(1) % 7), text: s.heartRate != null ? `Heart rate peak of ${s.heartRate + 6 + (rng(1) % 8)} bpm during ascent` : 'Elevation gain logged' },
    { t: baseMin + 26 + (rng(1) % 6), text: 'Voice check-in — nominal' },
    { t: baseMin + 41 + (rng(1) % 9), text: hiker.status === 'critical' ? 'Critical threshold crossed — operator notified' : hiker.status === 'warning' ? 'Warning threshold crossed — passive watch' : 'Hydration reminder acknowledged' },
    { t: baseMin + 58 + (rng(1) % 8), text: `Battery at ${hiker.battPct != null ? Math.round(hiker.battPct) + 4 : 92}% — last checkpoint` },
    { t: baseMin + 74 + (rng(1) % 10), text: 'Route deviation <20m — within corridor' },
  ]

  return events.sort((a, b) => a.t - b.t)
}

function SectionHeader({ title, meta }) {
  return (
    <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-2">
      <span className="text-[10px] uppercase tracking-[0.22em] text-white/45">{title}</span>
      {meta && <span className="text-[10px] uppercase tracking-[0.18em] text-white/30">{meta}</span>}
    </div>
  )
}

export default function HikerDetailPage() {
  useSyncTick()
  const { id } = useParams()
  const dots = useGlobeStore((s) => s.dots)
  const liveHikerId = useGlobeStore((s) => s.liveHikerId)
  const liveDataStale = useGlobeStore((s) => s.liveDataStale)
  const temperatureUnit = useSettingsStore((s) => s.temperatureUnit)
  const hiker = dots.find((d) => String(d.id) === id)

  if (!hiker) return <NotFound />

  const s = hiker.sensors ?? {}
  const hrInvalid = s.heartRateValid === false
  const isLive = hiker.id === liveHikerId

  const summary = triageSummaryFor(hiker)
  const history = historyFor(hiker)

  return (
    <div className="fixed inset-x-0 bottom-0 top-12 overflow-y-auto bg-[#030303] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">

        {/* Back link */}
        <Link
          to="/people"
          className="mb-8 inline-flex items-center gap-1.5 text-xs text-white/40 transition-colors hover:text-white/70"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M8.5 2.5L4 7l4.5 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          People
        </Link>

        {/* Header */}
        <div className="mb-10 border border-white/10 bg-white/[0.02] p-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-white/95">{hiker.name}</h1>
            <span className={`px-2.5 py-0.5 text-xs font-medium ${STATUS_PILL[hiker.status]}`}>
              {STATUS_LABEL[hiker.status]}
            </span>
            {isLive && (
              <span className="inline-flex items-center gap-1.5 border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-xs font-medium text-sky-400">
                <span className={`h-2 w-2 rounded-full bg-sky-400 ${liveDataStale ? 'opacity-40' : 'animate-pulse'}`} />
                {liveDataStale ? 'LIVE (stale)' : 'LIVE'}
              </span>
            )}
            <span className="ml-auto font-mono text-xs text-white/45">{hiker.groundStation}</span>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-3 text-xs">
            <span className="text-white/40">Last seen</span>
            <span className="tabular-nums text-white/70">{relativeTime(hiker.lastSeen)}</span>
          </div>
        </div>

        {/* Vitals */}
        <section className="mb-8">
          <SectionHeader title="Vitals" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <VitalCard label="Heart Rate" value={s.heartRate} unit="bpm" offline={hrInvalid} />
            <VitalCard label="SpO₂" value={s.spO2} unit="%" />
            <VitalCard label="Temperature" value={formatTemp(s.temperature, temperatureUnit)} unit={tempUnit(temperatureUnit)} />
            <VitalCard label="Humidity" value={s.humidity} unit="%" />
            <VitalCard label="Light" value={s.light?.toLocaleString()} unit="lux" />
            {hiker.battPct != null && (
              <VitalCard label="Battery" value={Math.round(hiker.battPct)} unit="%" />
            )}
          </div>
        </section>

        {/* Triage summary */}
        <section className="mb-8 border border-white/10 bg-white/[0.02] p-6">
          <SectionHeader title="Triage Summary" meta="Rule-based demo" />
          <p className="text-sm leading-relaxed text-white/80">{summary}</p>
        </section>

        {/* History */}
        <section className="border border-white/10 bg-white/[0.02] p-6">
          <SectionHeader title="History" meta="Last 90 min" />
          {history.length === 0 ? (
            <p className="text-sm text-white/40">No events logged.</p>
          ) : (
            <ol className="divide-y divide-white/8">
              {history.map((event, idx) => (
                <li key={idx} className="flex items-start gap-4 py-3 text-sm">
                  <span className="w-14 shrink-0 tabular-nums text-xs font-medium text-white/45">
                    -{event.t}m
                  </span>
                  <span className="text-white/80">{event.text}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  )
}
