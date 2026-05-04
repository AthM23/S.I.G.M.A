import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <p className="text-7xl font-semibold tabular-nums text-white/[0.06]">404</p>
      <div className="text-center">
        <p className="text-sm text-white/60">Page not found</p>
        <p className="mt-1 text-xs text-white/30">The route you requested doesn't exist.</p>
      </div>
      <Link
        to="/"
        className="mt-3 rounded-lg border border-white/10 px-4 py-2 text-xs text-white/50 transition-colors hover:border-white/20 hover:text-white/80"
      >
        Back to Dashboard
      </Link>
    </div>
  )
}
