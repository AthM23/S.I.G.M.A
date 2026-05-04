import GlobeScene from '../globe/GlobeScene'
import { useGlobeStore } from '../../store/globeStore'
import Legend from './Legend'
import StatCards from './StatCards'
import { cn } from '@/lib/utils'

const STATUS_META = {
  '#22c55e': {
    label: 'Nominal',
    badgeClassName:
      'border-emerald-400/20 bg-emerald-400/10 text-emerald-100/80',
  },
  '#b8960a': {
    label: 'Warning',
    badgeClassName:
      'border-amber-400/20 bg-amber-400/10 text-amber-100/80',
  },
  '#ef4444': {
    label: 'Critical',
    badgeClassName: 'border-red-400/20 bg-red-400/10 text-red-100/80',
  },
}

function formatCoordinate(value, positiveLabel, negativeLabel) {
  const direction = value >= 0 ? positiveLabel : negativeLabel
  return `${Math.abs(value).toFixed(2)} deg ${direction}`
}

export default function DashboardView({ showLegend, showFocusPanel }) {
  const selectedPoint = useGlobeStore((state) => state.selectedPoint)
  const hasUtilityRail = showLegend || showFocusPanel
  const statusMeta = selectedPoint ? STATUS_META[selectedPoint.color] : null

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 pb-2">
      <div className="flex flex-col gap-2 px-1 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[0.68rem] font-medium uppercase tracking-[0.28em] text-white/34">
            Dashboard
          </p>
          <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em] text-white/92 sm:text-[1.9rem]">
            Global responder overview
          </h2>
        </div>

        <p className="max-w-xl text-sm leading-6 text-white/52">
          Monitor live field nodes, keep critical activity in view, and review
          telemetry without stacking utility cards on top of the globe.
        </p>
      </div>

      <StatCards />

      <div
        className={cn(
          'grid min-h-0 flex-1 gap-4',
          hasUtilityRail && 'xl:grid-cols-[minmax(0,1fr)_320px]'
        )}
      >
        <section className="flex min-h-[480px] min-w-0 flex-col overflow-hidden rounded-[28px] border border-white/8 bg-[#080808] shadow-[0_24px_90px_rgba(0,0,0,0.4)]">
          <div className="flex flex-col gap-3 border-b border-white/8 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-[0.66rem] font-medium uppercase tracking-[0.24em] text-white/34">
                Live Globe
              </p>
              <p className="mt-1 text-lg font-medium tracking-[-0.03em] text-white/88">
                Field coverage
              </p>
            </div>

            <p className="max-w-sm text-sm leading-6 text-white/46 sm:text-right">
              Drag to orbit, scroll to zoom, and click a node to pin its
              telemetry in the side rail.
            </p>
          </div>

          <div className="relative min-h-[420px] flex-1">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.06),transparent_30%),radial-gradient(circle_at_bottom,rgba(56,189,248,0.06),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_28%)]" />
            <div className="absolute inset-0">
              <GlobeScene />
            </div>
          </div>
        </section>

        {hasUtilityRail ? (
          <aside className="grid content-start gap-4">
            {showFocusPanel ? (
              <section className="rounded-[24px] border border-white/8 bg-white/[0.025] px-5 py-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[0.68rem] font-medium uppercase tracking-[0.26em] text-white/34">
                      Current Focus
                    </p>
                    <p className="mt-3 truncate text-xl font-medium tracking-[-0.03em] text-white/92">
                      {selectedPoint?.label ?? 'No node selected'}
                    </p>
                  </div>

                  {statusMeta ? (
                    <span
                      className={cn(
                        'shrink-0 rounded-full border px-3 py-1 text-[0.62rem] font-medium uppercase tracking-[0.22em]',
                        statusMeta.badgeClassName
                      )}
                    >
                      {statusMeta.label}
                    </span>
                  ) : null}
                </div>

                <p className="mt-3 text-sm leading-6 text-white/54">
                  {selectedPoint
                    ? 'Focused telemetry remains pinned until you click empty space on the globe.'
                    : 'Select any active node on the globe to inspect its location and current status.'}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                    <p className="text-[0.62rem] uppercase tracking-[0.24em] text-white/34">
                      Latitude
                    </p>
                    <p className="mt-1 text-sm font-medium text-white/88">
                      {selectedPoint
                        ? formatCoordinate(selectedPoint.lat, 'N', 'S')
                        : '--'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                    <p className="text-[0.62rem] uppercase tracking-[0.24em] text-white/34">
                      Longitude
                    </p>
                    <p className="mt-1 text-sm font-medium text-white/88">
                      {selectedPoint
                        ? formatCoordinate(selectedPoint.lon, 'E', 'W')
                        : '--'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.02] px-3 py-3">
                  <p className="text-[0.62rem] uppercase tracking-[0.24em] text-white/34">
                    Node ID
                  </p>
                  <p className="mt-1 text-sm font-medium text-white/82">
                    {selectedPoint ? String(selectedPoint.id).padStart(2, '0') : '--'}
                  </p>
                </div>
              </section>
            ) : null}

            {showLegend ? (
              <section className="rounded-[24px] border border-white/8 bg-white/[0.025] px-5 py-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
                <Legend className="border-0 bg-transparent p-0 shadow-none backdrop-blur-0" />
              </section>
            ) : null}
          </aside>
        ) : null}
      </div>
    </div>
  )
}
