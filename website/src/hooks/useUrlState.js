import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useGlobeStore } from '../store/globeStore'

export function useUrlState() {
  const [params, setParams] = useSearchParams()
  const rotation = useGlobeStore((s) => s.rotation)
  const zoom = useGlobeStore((s) => s.zoom)
  const setRotation = useGlobeStore((s) => s.setRotation)
  const setZoom = useGlobeStore((s) => s.setZoom)
  const restoredRef = useRef(false)

  // Restore on mount
  useEffect(() => {
    if (restoredRef.current) return
    restoredRef.current = true

    const lat = params.get('lat')
    const lng = params.get('lng')
    const z = params.get('zoom')
    if (lat != null || lng != null) {
      setRotation({
        x: parseFloat(lat ?? 0),
        y: parseFloat(lng ?? 0),
      })
    }
    if (z != null) {
      setZoom(parseFloat(z))
    }
  }, [params, setRotation, setZoom])

  // Write back on change (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      setParams({
        lat: rotation.x.toFixed(2),
        lng: rotation.y.toFixed(2),
        zoom: zoom.toFixed(2),
      }, { replace: true })
    }, 500)
    return () => clearTimeout(t)
  }, [rotation, setParams, zoom])
}
