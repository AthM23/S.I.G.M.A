import { useEffect, useRef } from 'react'
import { useGlobeStore } from '../store/globeStore'
import { useSettingsStore } from '../store/settingsStore'
import { useToastStore } from '../store/toastStore'

function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const beep = (freq, startOffset) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.25, ctx.currentTime + startOffset)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + 0.18)
      osc.start(ctx.currentTime + startOffset)
      osc.stop(ctx.currentTime + startOffset + 0.22)
    }
    beep(880, 0)
    beep(660, 0.24)
    setTimeout(() => ctx.close(), 1200)
  } catch {
    return undefined
  }
}

export function useCriticalAlerts() {
  const dots = useGlobeStore((s) => s.dots)
  const addToast = useToastStore((s) => s.addToast)
  const prevCriticalIds = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    // Seed initial set without firing alerts on first render
    if (prevCriticalIds.current === null) {
      prevCriticalIds.current = new Set(
        dots.filter((d) => d.status === 'critical').map((d) => d.id)
      )
      return
    }

    clearTimeout(debounceRef.current)
    const snapshot = dots
    debounceRef.current = setTimeout(() => {
      const { toastOnCritical, soundOnCritical } = useSettingsStore.getState()

      const newlyCritical = snapshot.filter(
        (d) => d.status === 'critical' && !prevCriticalIds.current.has(d.id)
      )
      prevCriticalIds.current = new Set(
        snapshot.filter((d) => d.status === 'critical').map((d) => d.id)
      )

      if (newlyCritical.length === 0) return

      if (toastOnCritical) {
        newlyCritical.slice(0, 3).forEach((h) =>
          addToast({ name: h.name, groundStation: h.groundStation })
        )
      }
      if (soundOnCritical) playAlertSound()
    }, 300)

    return () => clearTimeout(debounceRef.current)
  }, [dots, addToast])
}
