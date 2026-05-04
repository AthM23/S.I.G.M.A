import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useGlobeStore } from '../../store/globeStore'
import { useSettingsStore } from '../../store/settingsStore'

const DEFAULT_CARD_SIZE = { width: 344, height: 420 }
const VIEWPORT_PADDING = 12
const TOP_SAFE_ZONE = 60
const OFFSET = 20

const STATUS_LABEL = { normal: 'Normal', warning: 'Warning', critical: 'Critical' }
const STATUS_THEME = {
  normal: {
    badge: 'border-emerald-400/25 bg-emerald-400/12 text-emerald-50',
    glow: 'from-emerald-300/28 via-emerald-400/10 to-transparent',
    orb: 'bg-emerald-400/18',
    dot: 'bg-emerald-300',
    ring: 'ring-emerald-300/15',
  },
  warning: {
    badge: 'border-amber-400/25 bg-amber-400/12 text-amber-50',
    glow: 'from-amber-300/28 via-amber-400/10 to-transparent',
    orb: 'bg-amber-400/18',
    dot: 'bg-amber-300',
    ring: 'ring-amber-300/15',
  },
  critical: {
    badge: 'border-rose-400/25 bg-rose-400/12 text-rose-50',
    glow: 'from-rose-300/30 via-rose-400/10 to-transparent',
    orb: 'bg-rose-400/18',
    dot: 'bg-rose-300',
    ring: 'ring-rose-300/15',
  },
}

function relativeTime(iso) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60) return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  return `${Math.floor(secs / 3600)}h ago`
}

function computePos(sx, sy, cardWidth, cardHeight) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const safeWidth = Math.min(cardWidth, vw - VIEWPORT_PADDING * 2)
  const safeHeight = Math.min(cardHeight, vh - TOP_SAFE_ZONE - VIEWPORT_PADDING)

  let x = sx + OFFSET
  if (x + safeWidth > vw - VIEWPORT_PADDING) x = sx - safeWidth - OFFSET
  x = Math.max(VIEWPORT_PADDING, Math.min(x, vw - safeWidth - VIEWPORT_PADDING))

  let y = sy - safeHeight / 2
  y = Math.max(TOP_SAFE_ZONE, Math.min(y, vh - safeHeight - VIEWPORT_PADDING))

  return { x, y }
}

function formatTemp(celsius, unit) {
  if (celsius == null) return '--'
  if (unit === 'F') return `${((celsius * 9) / 5 + 32).toFixed(1)} deg F`
  return `${celsius.toFixed(1)} deg C`
}

function formatCoordinate(value, positiveLabel, negativeLabel) {
  const direction = value >= 0 ? positiveLabel : negativeLabel
  return `${Math.abs(value).toFixed(4)} deg ${direction}`
}

function formatMetric(value, suffix = '') {
  if (value == null || Number.isNaN(value)) return '--'
  return `${typeof value === 'number' ? value.toLocaleString() : value}${suffix}`
}

function MetricCard({ label, value, unit, offline = false }) {
  return (
    <div className="min-w-0 rounded-[20px] border border-white/8 bg-white/[0.045] px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <p className="text-[0.62rem] font-medium uppercase tracking-[0.22em] text-white/34">
        {label}
      </p>
      {offline ? (
        <p className="mt-3 text-sm text-white/40">Sensor offline</p>
      ) : (
        <div className="mt-3 flex min-w-0 items-end gap-1.5">
          <p className="truncate text-[1.35rem] font-semibold leading-none tracking-[-0.05em] text-white/92 tabular-nums">
            {value}
          </p>
          {unit && value !== '--' ? (
            <span className="mb-0.5 shrink-0 text-[0.7rem] uppercase tracking-[0.16em] text-white/40">
              {unit}
            </span>
          ) : null}
        </div>
      )}
    </div>
  )
}

function MetaChip({ label, value }) {
  return (
    <div className="min-w-0 rounded-[18px] border border-white/8 bg-black/25 px-3 py-2">
      <p className="text-[0.56rem] uppercase tracking-[0.22em] text-white/28">{label}</p>
      <p className="mt-1 break-words text-[0.8rem] font-medium leading-snug text-white/78">{value}</p>
    </div>
  )
}

export default function HikerCard() {
  const selectedPoint = useGlobeStore((s) => s.selectedPoint)
  const dots = useGlobeStore((s) => s.dots)
  const screenPos = useGlobeStore((s) => s.selectedPointScreenPos)
  const setSelectedPoint = useGlobeStore((s) => s.setSelectedPoint)
  const liveHikerId = useGlobeStore((s) => s.liveHikerId)
  const liveDataStale = useGlobeStore((s) => s.liveDataStale)
  const temperatureUnit = useSettingsStore((s) => s.temperatureUnit)

  const liveHiker = selectedPoint
    ? dots.find((d) => d.id === selectedPoint.id) ?? selectedPoint
    : null

  const cardRef = useRef(null)
  const [cardSize, setCardSize] = useState(DEFAULT_CARD_SIZE)

  useEffect(() => {
    if (!selectedPoint) return
    const onKey = (e) => {
      if (e.key === 'Escape') setSelectedPoint(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedPoint, setSelectedPoint])

  useLayoutEffect(() => {
    if (!selectedPoint || !cardRef.current) return undefined

    const element = cardRef.current
    const updateSize = () => {
      const nextWidth = element.offsetWidth || DEFAULT_CARD_SIZE.width
      const nextHeight = element.offsetHeight || DEFAULT_CARD_SIZE.height
      setCardSize((prev) =>
        prev.width === nextWidth && prev.height === nextHeight
          ? prev
          : { width: nextWidth, height: nextHeight }
      )
    }

    updateSize()

    const observer = new ResizeObserver(updateSize)
    observer.observe(element)
    window.addEventListener('resize', updateSize)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateSize)
    }
  }, [selectedPoint])

  if (!selectedPoint || !screenPos) return null

  const { x, y } = computePos(screenPos.x, screenPos.y, cardSize.width, cardSize.height)
  const h = liveHiker ?? selectedPoint
  const s = h.sensors ?? {}
  const isLive = h.id === liveHikerId
  const hrOffline = s.heartRateValid === false
  const theme = STATUS_THEME[h.status] ?? STATUS_THEME.normal
  const initials = h.name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div
      className="pointer-events-auto fixed z-50"
      style={{
        left: x,
        top: y,
        width: 'min(22rem, calc(100vw - 1.5rem))',
      }}
    >
      <div
        ref={cardRef}
        className={`relative overflow-hidden rounded-[26px] border border-white/12 bg-[linear-gradient(180deg,rgba(18,18,20,0.96),rgba(8,8,10,0.92))] shadow-[0_28px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl ring-1 ${theme.ring}`}
      >
        <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${theme.glow}`} />
        <div className={`pointer-events-none absolute -right-12 top-0 h-32 w-32 rounded-full blur-3xl ${theme.orb}`} />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_26%,transparent_70%,rgba(255,255,255,0.02))]" />

        <div className="relative flex max-h-[calc(100vh-5rem)] flex-col">
          <div className="flex items-start gap-3 border-b border-white/8 px-4 pt-4 pb-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-sm font-semibold tracking-[0.12em] text-white/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[0.62rem] font-medium uppercase tracking-[0.26em] text-white/34">
                Focus telemetry
              </p>
              <p className="mt-1 truncate text-[1.15rem] font-semibold tracking-[-0.045em] text-white/94">
                {h.name}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.62rem] font-medium uppercase tracking-[0.16em] ${theme.badge}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
                  {STATUS_LABEL[h.status]}
                </span>
                {isLive ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/25 bg-sky-400/10 px-2.5 py-1 text-[0.62rem] font-medium uppercase tracking-[0.16em] text-sky-100">
                    <span
                      className={`h-1.5 w-1.5 rounded-full bg-sky-300 ${liveDataStale ? 'opacity-45' : 'animate-pulse'}`}
                    />
                    {liveDataStale ? 'Live stale' : 'Live'}
                  </span>
                ) : null}
              </div>
            </div>

            <button
              onClick={() => setSelectedPoint(null)}
              className="mt-0.5 shrink-0 rounded-xl border border-white/10 bg-white/[0.03] p-2 text-white/42 transition-colors hover:bg-white/[0.08] hover:text-white/82"
              aria-label="Close"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M1 1l10 10M11 1L1 11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <div className="min-h-0 overflow-y-auto px-4 py-4">
            <div className="grid grid-cols-2 gap-2.5">
              <MetaChip label="Station" value={h.groundStation} />
              <MetaChip label="Last sync" value={relativeTime(h.lastSeen)} />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <MetricCard
                label="Heart rate"
                value={formatMetric(s.heartRate)}
                unit="bpm"
                offline={hrOffline}
              />
              <MetricCard label="SpO2" value={formatMetric(s.spO2)} unit="%" />
              <MetricCard label="Temperature" value={formatTemp(s.temperature, temperatureUnit)} />
              <MetricCard label="Humidity" value={formatMetric(s.humidity)} unit="%" />
              <MetricCard label="Light" value={formatMetric(s.light)} unit="lux" />
              <MetricCard
                label="Battery"
                value={h.battPct != null ? formatMetric(Math.round(h.battPct)) : '--'}
                unit="%"
              />
            </div>

            <div className="mt-3 rounded-[22px] border border-white/8 bg-white/[0.035] px-3.5 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[0.62rem] font-medium uppercase tracking-[0.24em] text-white/34">
                  Position
                </p>
                <p className="text-[0.72rem] text-white/36">Pinned to selected node</p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <MetaChip label="Latitude" value={formatCoordinate(h.lat, 'N', 'S')} />
                <MetaChip label="Longitude" value={formatCoordinate(h.lon, 'E', 'W')} />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-white/8 px-4 py-3">
            <div className="min-w-0">
              <p className="text-[0.58rem] uppercase tracking-[0.22em] text-white/28">Node</p>
              <p className="mt-1 truncate font-mono text-[0.78rem] text-white/56">
                HIKER-{String(h.id).padStart(2, '0')}
              </p>
            </div>

            <div className="text-right">
              <p className="text-[0.58rem] uppercase tracking-[0.22em] text-white/28">Dismiss</p>
              <p className="mt-1 text-[0.75rem] text-white/48">Press Esc</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
