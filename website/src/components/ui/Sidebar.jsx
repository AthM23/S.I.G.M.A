import { useState } from 'react'
import { LayoutDashboard, BarChart3, Settings, Globe } from 'lucide-react'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: BarChart3, label: 'Analytics', active: false },
  { icon: Settings, label: 'Settings', active: false },
]

export default function Sidebar() {
  const [expanded, setExpanded] = useState(false)

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={`h-full bg-card/60 backdrop-blur-md border-r border-border/60 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
        expanded ? 'w-52' : 'w-[52px]'
      }`}
    >
      <div className="h-12 flex items-center gap-2.5 px-3.5 border-b border-border/60 shrink-0 overflow-hidden">
        <Globe className="size-[18px] text-white/90 shrink-0" />
        <span
          className={`text-[13px] font-semibold tracking-wide text-white/90 whitespace-nowrap transition-opacity duration-200 ${
            expanded ? 'opacity-100' : 'opacity-0'
          }`}
        >
          S.I.G.M.A
        </span>
      </div>

      <nav className="flex-1 flex flex-col gap-0.5 px-2 py-2.5">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.label}
              className={`group relative flex items-center gap-2.5 h-8 rounded-md transition-all duration-150 ${
                expanded ? 'px-2.5' : 'justify-center'
              } ${
                item.active
                  ? 'bg-white/[0.08] text-white'
                  : 'text-white/40 hover:text-white/80 hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="size-4 shrink-0" strokeWidth={1.75} />
              <span
                className={`text-[13px] whitespace-nowrap transition-opacity duration-200 ${
                  expanded ? 'opacity-100' : 'opacity-0 absolute'
                }`}
              >
                {item.label}
              </span>
              {!expanded && (
                <span className="absolute left-full ml-2.5 px-2 py-1 rounded-md bg-card border border-border/60 text-xs text-white/80 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 shadow-lg">
                  {item.label}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
