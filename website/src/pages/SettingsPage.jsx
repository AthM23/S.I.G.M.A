import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/apiFetch'
import { useSettingsStore } from '../store/settingsStore'

function Card({ children, className = '' }) {
  return (
    <section
      className={[
        'relative rounded-none border border-[#2a2119] bg-gradient-to-b from-[#181310] to-[#110c08] p-7 shadow-[0_1px_0_rgba(255,224,180,0.04)_inset,0_8px_24px_-14px_rgba(0,0,0,0.7)] sm:p-8',
        className,
      ].join(' ')}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/15 to-transparent"
      />
      {children}
    </section>
  )
}

function SectionHeader({ eyebrow, title, description }) {
  return (
    <div className="mb-6">
      {eyebrow && (
        <p className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-amber-200/70">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-2 text-[18px] font-medium tracking-[-0.01em] text-stone-100">{title}</h2>
      {description && (
        <p className="mt-1.5 text-[13px] leading-relaxed text-stone-400">{description}</p>
      )}
    </div>
  )
}

function SummaryTile({ label, value, detail, tone = 'neutral' }) {
  const tones = {
    neutral: 'border-[#2a2119] bg-gradient-to-b from-[#17110d] to-[#110c08]',
    success: 'border-emerald-500/25 bg-gradient-to-b from-emerald-500/10 to-[#110c08]',
    warning: 'border-amber-500/25 bg-gradient-to-b from-amber-500/10 to-[#110c08]',
    danger: 'border-rose-500/25 bg-gradient-to-b from-rose-500/10 to-[#110c08]',
  }

  return (
    <div className={`rounded-none border p-5 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.8)] ${tones[tone]}`}>
      <p className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-stone-500">{label}</p>
      <p className="mt-3 text-[22px] font-medium tracking-[-0.02em] text-stone-100">{value}</p>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-stone-400">{detail}</p>
    </div>
  )
}

function Row({ label, description, children }) {
  return (
    <div className="grid gap-4 py-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:gap-8">
      <div className="min-w-0">
        <p className="text-[14px] font-medium text-stone-200">{label}</p>
        {description && (
          <p className="mt-1 text-[12.5px] leading-[1.6] text-stone-500">{description}</p>
        )}
      </div>
      <div className="min-w-0 lg:justify-self-end">{children}</div>
    </div>
  )
}

function Switch({ value, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={[
        'relative h-[22px] w-[40px] rounded-full transition-colors',
        disabled ? 'cursor-not-allowed opacity-40' : '',
        value
          ? 'bg-gradient-to-r from-amber-300 to-amber-400 shadow-[0_0_0_1px_rgba(251,191,36,0.4)_inset]'
          : 'bg-stone-800 ring-1 ring-inset ring-stone-700/60 hover:bg-stone-700',
      ].join(' ')}
    >
      <span
        className={[
          'absolute top-[2px] h-[18px] w-[18px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.6)] transition-transform',
          value ? 'translate-x-[20px]' : 'translate-x-[2px]',
        ].join(' ')}
      />
    </button>
  )
}

function Segment({ options, value, onChange, disabled }) {
  return (
    <div
      className={[
        'inline-flex flex-wrap items-center rounded-xl border border-[#2a2119] bg-[#0c0806] p-1',
        disabled ? 'opacity-40' : '',
      ].join(' ')}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={[
            'rounded-lg px-3.5 py-2 text-[13px] font-medium transition-all',
            value === option.value
              ? 'bg-gradient-to-b from-[#2a2118] to-[#1a130d] text-amber-100 shadow-[0_1px_0_rgba(255,224,180,0.08)_inset,0_1px_2px_rgba(0,0,0,0.5)]'
              : 'text-stone-500 hover:text-stone-200',
          ].join(' ')}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function Slider({ value, min, max, step, format, onChange }) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className="flex w-full max-w-[18rem] items-center gap-3">
      <span className="w-14 text-right text-[13px] font-medium tabular-nums text-amber-100/90">
        {format(value)}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ '--pct': `${pct}%` }}
        className="slider-track min-w-0 flex-1"
      />
    </div>
  )
}

function NumberInput({ value, min, max, step, onChange }) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => {
        const v = Number(e.target.value)
        if (!Number.isNaN(v)) onChange(v)
      }}
      className="h-10 w-24 rounded-xl border border-[#2a2119] bg-[#0c0806] px-3 text-right text-[13px] tabular-nums text-stone-100 outline-none transition-colors focus:border-amber-300/40 focus:ring-2 focus:ring-amber-400/10"
    />
  )
}

function TextInput({ value, placeholder, onChange }) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 w-full min-w-0 rounded-xl border border-[#2a2119] bg-[#0c0806] px-4 text-[13px] text-stone-100 placeholder:text-stone-500 outline-none transition-colors focus:border-amber-300/40 focus:ring-2 focus:ring-amber-400/10 sm:min-w-[22rem]"
    />
  )
}

function ThresholdRow({ label, unit, sensor, level, value }) {
  const setThresholdValue = useSettingsStore((s) => s.setThresholdValue)

  return (
    <div className="grid gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <span className="text-[13px] text-stone-300">{label}</span>
      <div className="flex items-center gap-2 sm:justify-self-end">
        <NumberInput
          value={value}
          step={sensor === 'spO2' ? 1 : sensor === 'temperature' ? 0.5 : 5}
          onChange={(v) => setThresholdValue(sensor, level, v)}
        />
        <span className="w-8 text-[12px] text-stone-500">{unit}</span>
      </div>
    </div>
  )
}

function ThresholdGroup({ title, description, children }) {
  return (
    <div className="rounded-none border border-[#2a2119]/80 bg-[#0c0806]/60 p-5 sm:p-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-amber-200/70">{title}</p>
      {description && (
        <p className="mt-2 text-[12.5px] leading-relaxed text-stone-500">{description}</p>
      )}
      <div className="mt-4 divide-y divide-[#2a2119]/70">{children}</div>
    </div>
  )
}

function useConnectionStatus(endpoint) {
  const [status, setStatus] = useState(null)

  useEffect(() => {
    if (!endpoint) return undefined

    let cancelled = false

    async function check() {
      try {
        const res = await apiFetch(`${endpoint}/health`, { signal: AbortSignal.timeout(4000) })
        if (!cancelled) setStatus(res.ok ? 'ok' : 'error')
      } catch {
        if (!cancelled) setStatus('error')
      }
    }

    check()
    const id = setInterval(check, 15_000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [endpoint])

  return endpoint ? status : null
}

function ConnectionIndicator({ configured, status }) {
  if (!configured) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-[#2a2119]/80 bg-[#0c0806]/60 px-3.5 py-2">
        <span className="h-2 w-2 rounded-full bg-stone-500" />
        <span className="text-[12px] text-stone-400">Awaiting endpoint</span>
      </div>
    )
  }

  const color =
    status === 'ok' ? 'bg-emerald-400' :
    status === 'error' ? 'bg-rose-400' :
    'bg-amber-300'

  const text =
    status === 'ok' ? 'Health check passed' :
    status === 'error' ? 'Health check failed' :
    'Checking…'

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#2a2119]/80 bg-[#0c0806]/60 px-3.5 py-2">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span className="text-[12px] text-stone-400">{text}</span>
    </div>
  )
}

function sourceSummary(status, endpoint) {
  if (!endpoint) return { label: 'Unconfigured', detail: 'No endpoint supplied.', tone: 'neutral' }
  if (status === 'ok') return { label: 'Online', detail: 'Health endpoint is responding.', tone: 'success' }
  if (status === 'error') return { label: 'Offline', detail: 'Cannot reach the health endpoint.', tone: 'danger' }
  return { label: 'Checking', detail: 'Polling the health endpoint now.', tone: 'warning' }
}

export default function SettingsPage() {
  const {
    autoRotate,
    rotationSpeed,
    temperatureUnit,
    thresholds,
    gsApiEndpoint,
    toastOnCritical,
    soundOnCritical,
    setSetting,
  } = useSettingsStore()

  const { heartRate, spO2, temperature } = thresholds
  const connStatus = useConnectionStatus(gsApiEndpoint)
  const endpointState = sourceSummary(connStatus, gsApiEndpoint)
  const alertsEnabled = toastOnCritical || soundOnCritical

  return (
    <div className="page-scroll-warm fixed inset-x-0 bottom-0 top-12 overflow-x-hidden overflow-y-auto">
      <div className="mx-auto w-full max-w-[1600px] px-6 pb-16 pt-16 sm:px-10 sm:pt-20 xl:px-14">

        {/* Page header */}
        <div className="mb-10 border-b border-[#2a2119]/80 pb-8">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-amber-200/60">
            Control surface
          </p>
          <h1 className="mt-2 font-serif text-[38px] leading-[1.02] tracking-[-0.02em] text-stone-50">
            Settings
          </h1>
          <p className="mt-2 text-[14px] text-stone-400">
            Configure motion, alerts, and the ground-station endpoint.
          </p>
        </div>

        {/* Summary tiles */}
        <div className="mb-10 grid gap-5 sm:grid-cols-3">
          <SummaryTile
            label="Globe motion"
            value={autoRotate ? 'Auto' : 'Manual'}
            detail={`Speed ${(rotationSpeed * 1000).toFixed(1)}x`}
          />
          <SummaryTile
            label="Critical alerts"
            value={alertsEnabled ? 'Armed' : 'Muted'}
            detail={alertsEnabled ? 'One or more channels active.' : 'No channels enabled.'}
            tone={alertsEnabled ? 'warning' : 'neutral'}
          />
          <SummaryTile
            label="Data source"
            value={endpointState.label}
            detail={endpointState.detail}
            tone={endpointState.tone}
          />
        </div>

        {/* Two-column settings */}
        <div className="grid gap-6 xl:grid-cols-2">

          {/* Left column */}
          <div className="space-y-6">
            <Card>
              <SectionHeader eyebrow="Display" title="Globe behavior" />
              <div className="divide-y divide-[#2a2119]/70">
                <Row label="Auto-rotate" description="Drift the globe while the dashboard is idle.">
                  <Switch value={autoRotate} onChange={(v) => setSetting('autoRotate', v)} />
                </Row>
                <Row label="Rotation speed" description="Speed of idle globe rotation.">
                  <Slider
                    value={rotationSpeed}
                    min={0}
                    max={0.01}
                    step={0.0005}
                    format={(v) => `${(v * 1000).toFixed(1)}x`}
                    onChange={(v) => setSetting('rotationSpeed', v)}
                  />
                </Row>
              </div>
            </Card>

            <Card>
              <SectionHeader eyebrow="Alerting" title="Alert thresholds" description="Thresholds re-score hikers in real time." />
              <div className="grid gap-5 lg:grid-cols-2">
                <ThresholdGroup title="Heart rate" description="Escalate above limit.">
                  <ThresholdRow label="Warning above" unit="bpm" sensor="heartRate" level="warning" value={heartRate.warning} />
                  <ThresholdRow label="Critical above" unit="bpm" sensor="heartRate" level="critical" value={heartRate.critical} />
                </ThresholdGroup>

                <ThresholdGroup title="Oxygen saturation" description="Escalate below target.">
                  <ThresholdRow label="Warning below" unit="%" sensor="spO2" level="warning" value={spO2.warning} />
                  <ThresholdRow label="Critical below" unit="%" sensor="spO2" level="critical" value={spO2.critical} />
                </ThresholdGroup>

                <div className="lg:col-span-2">
                  <ThresholdGroup title="Temperature" description="High and low body temperature limits.">
                    <div className="grid gap-x-6 sm:grid-cols-2">
                      <ThresholdRow label="Warning high" unit="C" sensor="temperature" level="warningHigh" value={temperature.warningHigh} />
                      <ThresholdRow label="Critical high" unit="C" sensor="temperature" level="criticalHigh" value={temperature.criticalHigh} />
                      <ThresholdRow label="Warning low" unit="C" sensor="temperature" level="warningLow" value={temperature.warningLow} />
                      <ThresholdRow label="Critical low" unit="C" sensor="temperature" level="criticalLow" value={temperature.criticalLow} />
                    </div>
                  </ThresholdGroup>
                </div>
              </div>
            </Card>

            <Card>
              <SectionHeader eyebrow="Network" title="Ground-station endpoint" description="Polled every 5 s. Must expose /health and /api/live." />
              <div className="space-y-5">
                <Row label="Endpoint URL">
                  <TextInput
                    value={gsApiEndpoint}
                    placeholder="http://localhost:3001"
                    onChange={(v) => setSetting('gsApiEndpoint', v)}
                  />
                </Row>
                <div className="rounded-none border border-[#2a2119]/80 bg-[#0c0806]/60 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-stone-500">
                        Current target
                      </p>
                      <p className="mt-2 text-[13.5px] text-stone-200 [overflow-wrap:anywhere]">
                        {gsApiEndpoint || 'No endpoint configured'}
                      </p>
                    </div>
                    <ConnectionIndicator configured={Boolean(gsApiEndpoint)} status={connStatus} />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <Card>
              <SectionHeader eyebrow="Interface" title="Units and appearance" description="Display format for sensor readouts." />
              <div className="divide-y divide-[#2a2119]/70">
                <Row label="Temperature unit" description="Applied across all cards and detail views.">
                  <Segment
                    options={[
                      { value: 'C', label: 'Celsius' },
                      { value: 'F', label: 'Fahrenheit' },
                    ]}
                    value={temperatureUnit}
                    onChange={(v) => setSetting('temperatureUnit', v)}
                  />
                </Row>
                <Row label="Color scheme" description="Light theme coming soon.">
                  <Segment
                    options={[
                      { value: 'dark', label: 'Dark' },
                      { value: 'light', label: 'Light' },
                    ]}
                    value="dark"
                    onChange={() => undefined}
                    disabled
                  />
                </Row>
              </div>
            </Card>

            <Card>
              <SectionHeader eyebrow="Escalation" title="Critical alerts" description="Response when a hiker reaches critical status." />
              <div className="divide-y divide-[#2a2119]/70">
                <Row label="Toast alerts" description="In-app banner on critical escalation.">
                  <Switch value={toastOnCritical} onChange={(v) => setSetting('toastOnCritical', v)} />
                </Row>
                <Row label="Sound cue" description="Audio alert for critical escalations.">
                  <Switch value={soundOnCritical} onChange={(v) => setSetting('soundOnCritical', v)} />
                </Row>
              </div>
            </Card>

            <Card>
              <SectionHeader eyebrow="Note" title="Live changes" />
              <div className="rounded-none border border-[#2a2119]/80 bg-[#0c0806]/60 p-5">
                <p className="text-[13px] leading-relaxed text-stone-400">
                  All settings apply immediately — no page reload required. Threshold changes re-score hikers in real time; endpoint changes take effect on the next poll cycle.
                </p>
              </div>
            </Card>
          </div>
        </div>

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-2 border-t border-[#2a2119]/80 pt-6 text-[11.5px] text-stone-500">
          <span>SIGMA — Spatial Interactive Geospatial Model Application</span>
          <span>Mission control v1</span>
        </footer>
      </div>
    </div>
  )
}
