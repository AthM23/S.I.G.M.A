import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export const DEFAULT_SETTINGS = {
  theme: 'dark',
  autoRotate: true,
  rotationSpeed: 0.003,
  temperatureUnit: 'C',
  thresholds: {
    heartRate: { warning: 140, critical: 170 },
    spO2: { warning: 94, critical: 90 },
    temperature: {
      warningHigh: 38.0,
      criticalHigh: 39.5,
      warningLow: 35.0,
      criticalLow: 34.0,
    },
  },
  gsApiEndpoint: '',
  toastOnCritical: true,
  soundOnCritical: false,
}

export const useSettingsStore = create(
  subscribeWithSelector((set) => ({
    ...DEFAULT_SETTINGS,
    setSetting: (key, value) => set({ [key]: value }),
    setThresholds: (thresholds) => set({ thresholds }),
    setThresholdValue: (sensor, level, value) =>
      set((state) => ({
        thresholds: {
          ...state.thresholds,
          [sensor]: { ...state.thresholds[sensor], [level]: value },
        },
      })),
  }))
)
