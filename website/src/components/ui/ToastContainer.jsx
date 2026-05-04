import { useEffect } from 'react'
import { useToastStore } from '../../store/toastStore'

const DISMISS_MS = 5000

function Toast({ id, name, groundStation }) {
  const removeToast = useToastStore((s) => s.removeToast)

  useEffect(() => {
    const t = setTimeout(() => removeToast(id), DISMISS_MS)
    return () => clearTimeout(t)
  }, [id, removeToast])

  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-500/25 bg-black/90 px-4 py-3 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2 fade-in duration-200">
      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500 animate-pulse" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white/90">Critical Alert</p>
        <p className="mt-0.5 truncate text-xs text-white/50">
          {name} · {groundStation}
        </p>
      </div>
      <button
        onClick={() => removeToast(id)}
        aria-label="Dismiss alert"
        className="mt-0.5 shrink-0 rounded p-1 text-white/30 transition-colors hover:text-white/60"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  if (!toasts.length) return null

  return (
    <div className="pointer-events-none fixed bottom-6 right-4 z-[100] flex w-80 flex-col gap-2 sm:right-6">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <Toast {...t} />
        </div>
      ))}
    </div>
  )
}
