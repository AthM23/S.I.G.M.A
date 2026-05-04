import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useGlobeStore } from '../store/globeStore'
import { useSyncTick } from '../hooks/useSyncTick'

const STATUS_SEVERITY = { critical: 0, warning: 1, normal: 2 }

const STATUS_DOT = {
  normal: 'bg-emerald-400',
  warning: 'bg-amber-400',
  critical: 'bg-rose-400',
}

const STATUS_RING = {
  normal: 'shadow-[0_0_0_2px_rgba(52,211,153,0.22)]',
  warning: 'shadow-[0_0_0_2px_rgba(251,191,36,0.26)]',
  critical: 'shadow-[0_0_0_2px_rgba(251,113,133,0.26)]',
}

const STATUS_PILL = {
  normal: 'bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-500/25',
  warning: 'bg-amber-500/10 text-amber-200 ring-1 ring-inset ring-amber-500/25',
  critical: 'bg-rose-500/10 text-rose-300 ring-1 ring-inset ring-rose-500/25',
}

const STATUS_LABEL = { normal: 'Stable', warning: 'Warning', critical: 'Critical' }

const SORT_OPTIONS = [
  { value: 'lastSeen_new', label: 'Most recent' },
  { value: 'lastSeen_old', label: 'Least recent' },
  { value: 'severity', label: 'Severity' },
  { value: 'heartRate', label: 'Heart rate' },
  { value: 'name', label: 'Name' },
]

function relativeTime(iso) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60) return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  return `${Math.floor(secs / 3600)}h ago`
}

function formatLight(lx) {
  if (lx == null) return '--'
  if (lx >= 1000) return `${(lx / 1000).toFixed(1)}k lx`
  return `${lx} lx`
}

function InitialsBadge({ name, status }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2a2118] to-[#1a130d] text-[15px] font-medium tracking-wide text-amber-100/95 ring-1 ring-amber-200/10 ${STATUS_RING[status]}`}
    >
      {initials}
    </div>
  )
}

function HikerGridCard({ hiker, isLive }) {
  const sensors = hiker.sensors ?? {}
  const hrInvalid = sensors.heartRateValid === false

  return (
    <Link
      to={`/people/${hiker.id}`}
      className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#3a2e22]/60 bg-gradient-to-b from-[#1a1410] to-[#120d09] p-7 shadow-[0_1px_0_rgba(255,224,180,0.04)_inset,0_8px_24px_-12px_rgba(0,0,0,0.7)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#4f3d2d] hover:shadow-[0_14px_32px_-14px_rgba(0,0,0,0.85)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/30"
    >
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/15 to-transparent" />

      {/* Name + status */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <InitialsBadge name={hiker.name} status={hiker.status} />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-medium leading-snug text-stone-100 [overflow-wrap:anywhere]">
              {hiker.name}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${STATUS_DOT[hiker.status]}`} />
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_PILL[hiker.status]}`}>
                {STATUS_LABEL[hiker.status]}
              </span>
            </div>
          </div>
        </div>
        {isLive && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-400/10 px-2.5 py-1 text-[11px] font-medium text-amber-200 ring-1 ring-inset ring-amber-400/25">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300" />
            Live
          </span>
        )}
      </div>

      {/* Primary vitals */}
      <div className="mt-6 grid grid-cols-2 gap-5">
        <div className="min-w-0">
          <p className="text-[10.5px] uppercase tracking-[0.1em] text-stone-500">Heart rate</p>
          <p className="mt-2 flex items-baseline gap-1.5">
            <span className="text-[26px] font-medium leading-none tabular-nums text-stone-50">
              {hrInvalid ? '--' : sensors.heartRate}
            </span>
            <span className="text-[12px] text-stone-500">bpm</span>
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-[10.5px] uppercase tracking-[0.1em] text-stone-500">Oxygen</p>
          <p className="mt-2 flex items-baseline gap-1.5">
            <span className="text-[26px] font-medium leading-none tabular-nums text-stone-50">
              {sensors.spO2 ?? '--'}
            </span>
            <span className="text-[12px] text-stone-500">%</span>
          </p>
        </div>
      </div>

      {/* Secondary vitals */}
      <dl className="mt-6 space-y-3 border-t border-[#2a2119]/80 pt-5 text-[13px]">
        <div className="flex items-baseline justify-between gap-2">
          <dt className="text-stone-500">Temperature</dt>
          <dd className="tabular-nums text-stone-200">
            {sensors.temperature != null ? `${sensors.temperature.toFixed(1)} °C` : '--'}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <dt className="text-stone-500">Humidity</dt>
          <dd className="tabular-nums text-stone-200">
            {sensors.humidity != null ? `${sensors.humidity}%` : '--'}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <dt className="text-stone-500">Light</dt>
          <dd className="tabular-nums text-stone-200">{formatLight(sensors.light)}</dd>
        </div>
      </dl>

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#2a2119]/80 pt-4 text-[12px]">
        <span className="truncate text-stone-500">{relativeTime(hiker.lastSeen)}</span>
        <span className="shrink-0 rounded-full bg-[#221a12] px-3 py-1 text-stone-400 ring-1 ring-inset ring-[#3a2e22]/60">
          {hiker.groundStation}
        </span>
      </div>
    </Link>
  )
}

function StatusChip({ status, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-all',
        active ? STATUS_PILL[status] : 'text-stone-400 hover:bg-white/[0.04] hover:text-stone-200',
      ].join(' ')}
    >
      <span className={['h-2 w-2 rounded-full transition-opacity', STATUS_DOT[status], active ? 'opacity-100' : 'opacity-35'].join(' ')} />
      {STATUS_LABEL[status]}
    </button>
  )
}

export default function PeoplePage() {
  useSyncTick()
  const dots = useGlobeStore((s) => s.dots)
  const liveHikerId = useGlobeStore((s) => s.liveHikerId)

  const [sort, setSort] = useState('lastSeen_new')
  const [statusFilter, setStatusFilter] = useState(['normal', 'warning', 'critical'])
  const [gsFilter, setGsFilter] = useState('all')
  const [validHrOnly, setValidHrOnly] = useState(false)
  const [search, setSearch] = useState('')

  const gsIds = useMemo(() => [...new Set(dots.map((d) => d.groundStation))].sort(), [dots])
  const criticalCount = useMemo(() => dots.filter((d) => d.status === 'critical').length, [dots])
  const warningCount = useMemo(() => dots.filter((d) => d.status === 'warning').length, [dots])

  const filtered = useMemo(() => {
    let r = dots.filter((d) => statusFilter.includes(d.status))
    if (gsFilter !== 'all') r = r.filter((d) => d.groundStation === gsFilter)
    if (validHrOnly) r = r.filter((d) => d.sensors?.heartRateValid !== false)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      r = r.filter((d) => d.name.toLowerCase().includes(q))
    }
    return [...r].sort((a, b) => {
      switch (sort) {
        case 'lastSeen_new': return new Date(b.lastSeen) - new Date(a.lastSeen)
        case 'lastSeen_old': return new Date(a.lastSeen) - new Date(b.lastSeen)
        case 'severity': return STATUS_SEVERITY[a.status] - STATUS_SEVERITY[b.status]
        case 'heartRate': {
          const ah = a.sensors?.heartRateValid !== false ? (a.sensors?.heartRate ?? -1) : -1
          const bh = b.sensors?.heartRateValid !== false ? (b.sensors?.heartRate ?? -1) : -1
          return bh - ah
        }
        case 'name': return a.name.localeCompare(b.name)
        default: return 0
      }
    })
  }, [dots, gsFilter, search, sort, statusFilter, validHrOnly])

  function toggleStatus(s) {
    setStatusFilter((prev) =>
      prev.includes(s)
        ? prev.length > 1 ? prev.filter((x) => x !== s) : prev
        : [...prev, s]
    )
  }

  return (
    <div className="page-scroll-warm fixed inset-x-0 bottom-0 top-12 overflow-x-hidden overflow-y-auto">
      <div className="mx-auto w-full max-w-[1600px] px-6 pb-16 pt-16 sm:px-10 sm:pt-20 xl:px-14">

        {/* Page header */}
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-[#2a2119]/80 pb-8">
          <div>
            <p className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-amber-200/60">
              Mission roster
            </p>
            <h1 className="mt-2 font-serif text-[38px] leading-[1.05] tracking-[-0.01em] text-stone-50">
              People
            </h1>
            <p className="mt-2 text-[14px] text-stone-400">
              Live vitals and status for every active hiker.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-[#2a2119] bg-[#120d09]/70 px-7 py-5 text-[13px]">
            <div className="flex items-baseline gap-2">
              <span className="text-[22px] font-medium tabular-nums text-stone-100">{dots.length}</span>
              <span className="text-stone-500">active</span>
            </div>
            <span className="h-5 w-px bg-[#2a2119]" />
            <div className="flex items-baseline gap-2">
              <span className="text-[22px] font-medium tabular-nums text-amber-200">{warningCount}</span>
              <span className="text-stone-500">warning</span>
            </div>
            <span className="h-5 w-px bg-[#2a2119]" />
            <div className="flex items-baseline gap-2">
              <span className="text-[22px] font-medium tabular-nums text-rose-200">{criticalCount}</span>
              <span className="text-stone-500">critical</span>
            </div>
          </div>
        </div>

        {/* Filter panel */}
        <div className="mb-8 rounded-2xl border border-[#2a2119] bg-[#120d09]/70 p-6">
          {/* Search */}
          <div className="relative mb-6">
            <svg
              className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-stone-500"
              viewBox="0 0 16 16"
              fill="none"
            >
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search hikers by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 w-full rounded-xl border border-[#2a2119] bg-[#0c0806] pl-12 pr-4 text-[14px] text-stone-100 placeholder:text-stone-500 transition-colors focus:border-amber-300/30 focus:outline-none focus:ring-2 focus:ring-amber-400/10"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Status */}
            <div>
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-stone-500">
                Status
              </p>
              <div className="flex flex-wrap gap-2 rounded-xl bg-[#0c0806] p-2 ring-1 ring-inset ring-[#2a2119]">
                {(['normal', 'warning', 'critical']).map((s) => (
                  <StatusChip key={s} status={s} active={statusFilter.includes(s)} onClick={() => toggleStatus(s)} />
                ))}
              </div>
            </div>

            {/* Sort */}
            <div>
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-stone-500">
                Sort by
              </p>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="h-12 w-full rounded-xl border border-[#2a2119] bg-[#0c0806] px-3 pr-8 text-[13px] text-stone-200 transition-colors focus:border-amber-300/30 focus:outline-none"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-[#0c0806]">
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Station */}
            <div>
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-stone-500">
                Station
              </p>
              <select
                value={gsFilter}
                onChange={(e) => setGsFilter(e.target.value)}
                className="h-12 w-full rounded-xl border border-[#2a2119] bg-[#0c0806] px-3 pr-8 text-[13px] text-stone-200 transition-colors focus:border-amber-300/30 focus:outline-none"
              >
                <option value="all" className="bg-[#0c0806]">All stations</option>
                {gsIds.map((id) => (
                  <option key={id} value={id} className="bg-[#0c0806]">{id}</option>
                ))}
              </select>
            </div>

            {/* Data quality */}
            <div>
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-stone-500">
                Data quality
              </p>
              <button
                type="button"
                onClick={() => setValidHrOnly((v) => !v)}
                className={[
                  'flex h-12 w-full items-center justify-between gap-3 rounded-xl px-4 text-[13px] font-medium transition-colors',
                  validHrOnly
                    ? 'bg-amber-400/10 text-amber-200 ring-1 ring-inset ring-amber-400/30'
                    : 'bg-[#0c0806] text-stone-400 ring-1 ring-inset ring-[#2a2119] hover:text-stone-200',
                ].join(' ')}
              >
                <span>Valid HR only</span>
                <span className={['relative h-[14px] w-7 rounded-full transition-colors', validHrOnly ? 'bg-amber-300/80' : 'bg-stone-700/60'].join(' ')}>
                  <span className={['absolute top-[2px] h-[10px] w-[10px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.5)] transition-transform', validHrOnly ? 'translate-x-[15px]' : 'translate-x-[2px]'].join(' ')} />
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Result count */}
        <p className="mb-6 px-1 text-[13px] text-stone-500">
          Showing{' '}
          <span className="tabular-nums text-stone-200">{filtered.length}</span>{' '}
          {filtered.length === 1 ? 'hiker' : 'hikers'}
          {filtered.length !== dots.length && (
            <span> of {dots.length}</span>
          )}
        </p>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#2a2119] bg-[#120d09]/50 px-6 py-20 text-center">
            <p className="text-[16px] text-stone-300">No hikers match the current filters.</p>
            <p className="mt-2 text-[13px] text-stone-500">
              Try adjusting the status chips or clearing the search.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((hiker) => (
              <HikerGridCard
                key={hiker.id}
                hiker={hiker}
                isLive={hiker.id === liveHikerId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
