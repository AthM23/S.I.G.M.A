import { useEffect, useRef } from 'react'
import { apiFetch } from '@/lib/apiFetch'
import { useSettingsStore } from '../store/settingsStore'
import { useGlobeStore } from '../store/globeStore'

const POLL_MS = 5_000

export function useLiveData() {
  const gsApiEndpoint = useSettingsStore((s) => s.gsApiEndpoint)
  const lastSosAtRef = useRef(null)

  useEffect(() => {
    if (!gsApiEndpoint) return

    let cancelled = false

    async function poll() {
      if (!gsApiEndpoint) {
        console.log('[useLiveData] no endpoint configured — skipping poll')
        return
      }
      try {
        const res = await apiFetch(`${gsApiEndpoint}/api/live`)
        if (!res.ok) {
          console.warn('[useLiveData] non-OK response', res.status)
          return
        }
        if (cancelled) return
        const json = await res.json()
        if (cancelled) return

        if (json.sosAt && lastSosAtRef.current === null) {
          // First poll after page load — seed with whatever the server already has
          // so we only fire on SOS events that happen *after* this point.
          lastSosAtRef.current = json.sosAt
          console.log('[useLiveData] seeding existing sosAt on mount, not firing:', json.sosAt)
        } else if (json.sosAt && json.sosAt !== lastSosAtRef.current) {
          lastSosAtRef.current = json.sosAt
          const sosHikerId = json.data?.id ?? useGlobeStore.getState().liveHikerId
          console.log('[useLiveData] SOS event at', json.sosAt, 'hiker', sosHikerId)
          useGlobeStore.getState().triggerSos(sosHikerId)
        }

        if (!json.data) {
          console.log('[useLiveData] null data from server — keeping last known reading')
          return
        }

        const { data, stale } = json
        console.log('[useLiveData] applying reading for id', data.id, data.sensors)
        const { hikers, setHikers, setLiveHikerId } = useGlobeStore.getState()

        setLiveHikerId(data.id)
        useGlobeStore.setState({ liveDataStale: stale ?? false })

        const updated = hikers.map((h) =>
          h.id !== data.id ? h : {
            ...h,
            sensors: { ...h.sensors, ...data.sensors },
            ...(data.lat != null && data.lon != null ? { lat: data.lat, lon: data.lon } : {}),
            lastSeen: data.lastSeen,
            battPct: data.battPct ?? h.battPct,
          }
        )
        setHikers(updated)
      } catch (err) {
        console.warn('[useLiveData] poll failed', err?.message || err)
      }
    }

    poll()
    const id = setInterval(poll, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [gsApiEndpoint])
}
