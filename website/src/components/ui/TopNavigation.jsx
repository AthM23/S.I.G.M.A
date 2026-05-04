import { Globe2, Settings2, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: Globe2 },
  { id: 'person', label: 'Person', icon: UserRound },
  { id: 'settings', label: 'Settings', icon: Settings2 },
]

export default function TopNavigation({
  activeTab,
  onTabChange,
  showStatusBadge,
}) {
  return (
    <header className="shrink-0 border-b border-white/8 bg-black/35 backdrop-blur-2xl">
      <div className="mx-auto flex h-[72px] w-full max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
              <Globe2 className="size-5 text-white/88" strokeWidth={1.7} />
            </div>

            <div className="min-w-0">
              <p className="text-[0.64rem] font-medium uppercase tracking-[0.28em] text-white/35">
                First Responder Console
              </p>
              <p className="text-sm font-medium tracking-[0.2em] text-white/88">
                S.I.G.M.A
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1 md:flex">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = item.id === activeTab

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors duration-150',
                    isActive
                      ? 'bg-white text-black shadow-[0_8px_24px_rgba(255,255,255,0.12)]'
                      : 'text-white/58 hover:bg-white/[0.05] hover:text-white/82'
                  )}
                >
                  <Icon className="size-4" strokeWidth={1.8} />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <nav className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1 md:hidden">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = item.id === activeTab

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    'inline-flex size-9 items-center justify-center rounded-full transition-colors duration-150',
                    isActive
                      ? 'bg-white text-black'
                      : 'text-white/58 hover:bg-white/[0.05] hover:text-white/82'
                  )}
                  aria-label={item.label}
                >
                  <Icon className="size-4" strokeWidth={1.8} />
                </button>
              )
            })}
          </nav>

          {showStatusBadge ? (
            <div className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/8 px-3.5 py-2 sm:flex">
              <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(74,222,128,0.75)]" />
              <span className="text-[0.68rem] font-medium uppercase tracking-[0.22em] text-emerald-100/78">
                Live Telemetry
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
