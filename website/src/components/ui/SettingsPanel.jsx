import { LayoutGrid, PanelsTopLeft, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from './button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './card'

const PREFERENCES = [
  {
    key: 'showLegend',
    label: 'Legend overlay',
    description: 'Keep status colors visible in the lower right of the dashboard canvas.',
    icon: LayoutGrid,
  },
  {
    key: 'showFocusPanel',
    label: 'Focus panel',
    description: 'Show the current selection summary above the globe for quicker triage.',
    icon: PanelsTopLeft,
  },
  {
    key: 'showStatusBadge',
    label: 'Live status badge',
    description: 'Display the live telemetry indicator in the top navigation.',
    icon: ShieldCheck,
  },
]

function PreferenceRow({ icon, label, description, value, onChange }) {
  const Icon = icon

  return (
    <div className="flex flex-col gap-3 rounded-[22px] border border-white/8 bg-black/28 p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
          <Icon className="size-4 text-white/72" strokeWidth={1.7} />
        </div>
        <div>
          <p className="text-sm font-medium text-white/88">{label}</p>
          <p className="mt-1 max-w-xl text-sm leading-6 text-white/56">
            {description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end lg:self-auto">
        <Button
          type="button"
          variant={value ? 'default' : 'ghost'}
          size="sm"
          className={
            value
              ? 'bg-white text-black hover:bg-white/90'
              : 'border border-white/10 bg-white/[0.03] text-white/62 hover:bg-white/[0.06] hover:text-white'
          }
          onClick={() => onChange(true)}
        >
          On
        </Button>
        <Button
          type="button"
          variant={!value ? 'default' : 'ghost'}
          size="sm"
          className={
            !value
              ? 'bg-white text-black hover:bg-white/90'
              : 'border border-white/10 bg-white/[0.03] text-white/62 hover:bg-white/[0.06] hover:text-white'
          }
          onClick={() => onChange(false)}
        >
          Off
        </Button>
      </div>
    </div>
  )
}

export default function SettingsPanel({ preferences, onPreferenceChange }) {
  return (
    <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
      <Card className="border border-white/10 bg-white/[0.03] shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
        <CardHeader className="border-b border-white/8 pb-5">
          <CardDescription className="text-[0.68rem] font-medium uppercase tracking-[0.26em] text-white/34">
            Settings
          </CardDescription>
          <CardTitle className="text-2xl tracking-[-0.03em] text-white/92">
            Workspace preferences
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3 py-2">
          {PREFERENCES.map((preference) => (
            <PreferenceRow
              key={preference.key}
              icon={preference.icon}
              label={preference.label}
              description={preference.description}
              value={preferences[preference.key]}
              onChange={(value) => onPreferenceChange(preference.key, value)}
            />
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card className="border border-white/10 bg-white/[0.03] shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
          <CardHeader className="border-b border-white/8 pb-5">
            <CardDescription className="text-[0.68rem] font-medium uppercase tracking-[0.26em] text-white/34">
              Shell
            </CardDescription>
            <CardTitle className="text-xl tracking-[-0.03em] text-white/92">
              Layout guidance
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="rounded-[22px] border border-white/8 bg-black/28 p-4">
              <p className="text-sm leading-6 text-white/70">
                The dashboard now uses a fixed top navigation so the globe keeps
                a stable canvas width. This removes the hover-driven left rail
                that caused the scene to shift.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-white/10 bg-white/[0.03] shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
          <CardHeader className="border-b border-white/8 pb-5">
            <CardDescription className="text-[0.68rem] font-medium uppercase tracking-[0.26em] text-white/34">
              Surface
            </CardDescription>
            <CardTitle className="text-xl tracking-[-0.03em] text-white/92">
              Design direction
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="flex items-start gap-3 rounded-[22px] border border-white/8 bg-black/28 p-4">
              <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                <Sparkles className="size-4 text-white/72" strokeWidth={1.7} />
              </div>
              <p className="text-sm leading-6 text-white/70">
                Professional, modern, and minimal means stable structure, muted
                chrome, crisp information hierarchy, and the globe remaining the
                center of attention.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
