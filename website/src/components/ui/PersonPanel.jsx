import {
  Activity,
  AlertTriangle,
  Globe2,
  MapPinned,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { useGlobeStore } from '../../store/globeStore'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './card'

const STATUS_COLORS = {
  nominal: '#22c55e',
  warning: '#b8960a',
  critical: '#ef4444',
}

const OPERATOR_DETAILS = [
  {
    label: 'Assignment',
    value: 'Search & rescue coordination',
  },
  {
    label: 'Coverage',
    value: 'Global node oversight',
  },
  {
    label: 'Escalation',
    value: 'Priority incident triage',
  },
]

function countByColor(dots, color) {
  return dots.filter((dot) => dot.color === color).length
}

export default function PersonPanel() {
  const dots = useGlobeStore((state) => state.dots)
  const selectedPoint = useGlobeStore((state) => state.selectedPoint)

  const summary = [
    {
      label: 'Tracked Nodes',
      value: dots.length,
      icon: Activity,
    },
    {
      label: 'Nominal',
      value: countByColor(dots, STATUS_COLORS.nominal),
      icon: ShieldCheck,
    },
    {
      label: 'Critical',
      value: countByColor(dots, STATUS_COLORS.critical),
      icon: AlertTriangle,
    },
  ]

  return (
    <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
      <Card className="border border-white/10 bg-white/[0.03] shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
        <CardHeader className="border-b border-white/8 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
              <UserRound className="size-5 text-white/76" strokeWidth={1.7} />
            </div>
            <div>
              <CardDescription className="text-[0.68rem] font-medium uppercase tracking-[0.26em] text-white/34">
                Person
              </CardDescription>
              <CardTitle className="mt-2 text-2xl tracking-[-0.03em] text-white/92">
                Response operator profile
              </CardTitle>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-6 py-2 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="space-y-4">
            <div className="rounded-[24px] border border-white/8 bg-black/28 p-5">
              <p className="text-[0.68rem] font-medium uppercase tracking-[0.28em] text-white/34">
                Primary Role
              </p>
              <p className="mt-3 text-3xl font-medium tracking-[-0.04em] text-white/92">
                Incident Response Lead
              </p>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/58">
                Oversees fleet telemetry, monitors escalation thresholds, and
                keeps field activity synchronized across the responder console.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {summary.map((item) => {
                const Icon = item.icon

                return (
                  <div
                    key={item.label}
                    className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4"
                  >
                    <div className="flex items-center gap-2 text-white/48">
                      <Icon className="size-4" strokeWidth={1.7} />
                      <span className="text-[0.7rem] uppercase tracking-[0.22em]">
                        {item.label}
                      </span>
                    </div>
                    <p className="mt-3 text-2xl font-medium tracking-[-0.03em] text-white/92">
                      {item.value}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="space-y-3 rounded-[24px] border border-white/8 bg-black/28 p-5">
            {OPERATOR_DETAILS.map((detail) => (
              <div
                key={detail.label}
                className="flex items-center justify-between gap-4 border-b border-white/6 pb-3 last:border-b-0 last:pb-0"
              >
                <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-white/34">
                  {detail.label}
                </p>
                <p className="text-sm font-medium text-white/82">
                  {detail.value}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card className="border border-white/10 bg-white/[0.03] shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
          <CardHeader className="border-b border-white/8 pb-5">
            <CardDescription className="text-[0.68rem] font-medium uppercase tracking-[0.26em] text-white/34">
              Coverage
            </CardDescription>
            <CardTitle className="text-xl tracking-[-0.03em] text-white/92">
              Operational footprint
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 py-2">
            <div className="rounded-[22px] border border-white/8 bg-black/28 p-4">
              <div className="flex items-center gap-2 text-white/52">
                <Globe2 className="size-4" strokeWidth={1.7} />
                <span className="text-[0.68rem] uppercase tracking-[0.24em]">
                  View
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-white/78">
                Shared global overview with alert weighting tuned for rapid
                escalation review.
              </p>
            </div>
            <div className="rounded-[22px] border border-white/8 bg-black/28 p-4">
              <div className="flex items-center gap-2 text-white/52">
                <MapPinned className="size-4" strokeWidth={1.7} />
                <span className="text-[0.68rem] uppercase tracking-[0.24em]">
                  Focus Zone
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-white/78">
                {selectedPoint
                  ? `${selectedPoint.label} is currently pinned for closer monitoring.`
                  : 'No node is pinned right now. Return to Dashboard to select one.'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-white/10 bg-white/[0.03] shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
          <CardHeader className="border-b border-white/8 pb-5">
            <CardDescription className="text-[0.68rem] font-medium uppercase tracking-[0.26em] text-white/34">
              Status
            </CardDescription>
            <CardTitle className="text-xl tracking-[-0.03em] text-white/92">
              Active focus
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="rounded-[22px] border border-white/8 bg-black/28 p-4">
              <p className="text-lg font-medium tracking-[-0.02em] text-white/92">
                {selectedPoint?.label ?? 'Awaiting selection'}
              </p>
              <p className="mt-2 text-sm leading-6 text-white/58">
                {selectedPoint
                  ? 'Selected telemetry remains available here so the operator tab can keep context.'
                  : 'Choose a node on the dashboard to surface its context here.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
