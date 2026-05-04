import { debounce } from 'lodash-es'
import { useGlobeStore } from './globeStore'
import { useSettingsStore, DEFAULT_SETTINGS } from './settingsStore'

const saveGlobe = debounce((state) => {
  localStorage.setItem('globe-session', JSON.stringify({
    rotation: state.rotation,
    zoom: state.zoom,
  }))
}, 1000)

const saveSettings = debounce((state) => {
  const data = { ...state }
  delete data.setSetting
  delete data.setThresholds
  delete data.setThresholdValue
  localStorage.setItem('sigma-settings', JSON.stringify(data))
}, 500)

export function initPersistence() {
  try {
    const saved = JSON.parse(localStorage.getItem('globe-session'))
    if (saved) {
      useGlobeStore.setState({
        rotation: saved.rotation ?? { x: 0, y: 0 },
        zoom: saved.zoom ?? 1,
      })
    }
  } catch { /* ignore corrupted storage */ }

  try {
    const saved = JSON.parse(localStorage.getItem('sigma-settings'))
    if (saved) {
      // Merge deeply for thresholds so missing keys get defaults
      const merged = {
        ...DEFAULT_SETTINGS,
        ...saved,
        thresholds: {
          ...DEFAULT_SETTINGS.thresholds,
          ...(saved.thresholds ?? {}),
          temperature: {
            ...DEFAULT_SETTINGS.thresholds.temperature,
            ...(saved.thresholds?.temperature ?? {}),
          },
        },
      }
      useSettingsStore.setState(merged)
    }
  } catch { /* ignore corrupted storage */ }

  const envGs = import.meta.env.VITE_GS_API_URL
  if (envGs) {
    useSettingsStore.setState({ gsApiEndpoint: envGs })
  }

  useGlobeStore.subscribe((state) => state, saveGlobe)
  useSettingsStore.subscribe((state) => state, saveSettings)

  // Sync settings thresholds → globe store so dots re-derive reactively
  useSettingsStore.subscribe(
    (state) => state.thresholds,
    (thresholds) => useGlobeStore.getState().setThresholds(thresholds)
  )

  // Initial sync
  useGlobeStore.getState().setThresholds(useSettingsStore.getState().thresholds)
}
