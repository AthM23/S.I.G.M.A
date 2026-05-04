import { cn } from '@/lib/utils'

const levels = [
  { label: 'Normal', color: '#22c55e' },
  { label: 'Warning', color: '#b8960a' },
  { label: 'Critical', color: '#ef4444' },
]

export default function Legend({ className }) {
  return (
    <div
      className={cn(
        'w-full rounded-[22px] border border-white/[0.08] bg-black/28 px-4 py-3.5 backdrop-blur-xl',
        className
      )}
    >
      <p className="mb-2 text-[0.68rem] font-medium uppercase tracking-[0.24em] text-white/34">
        Status
      </p>
      <div className="flex flex-col gap-1.5">
        {levels.map((level) => (
          <div key={level.label} className="flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: level.color, boxShadow: `0 0 6px ${level.color}40` }}
            />
            <span className="text-[0.78rem] text-white/60">{level.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
