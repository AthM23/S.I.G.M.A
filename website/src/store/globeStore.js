import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { SEED_HIKERS, hikersToDots, DEFAULT_THRESHOLDS } from '../lib/hikers'

const initialDots = hikersToDots(SEED_HIKERS, DEFAULT_THRESHOLDS)

export const useGlobeStore = create(
  subscribeWithSelector((set) => ({
    rotation: { x: 0, y: 0 },
    zoom: 1,
    setRotation: (r) => set({ rotation: r }),
    setZoom: (z) => set({ zoom: z }),

    hikers: SEED_HIKERS,
    thresholds: DEFAULT_THRESHOLDS,
    dots: initialDots,

    setHikers: (hikers) =>
      set((state) => ({
        hikers,
        dots: hikersToDots(hikers, state.thresholds, state.sosHikerId, state.sosRecentHikerId, state.liveHikerId),
      })),
    setThresholds: (thresholds) =>
      set((state) => ({
        thresholds,
        dots: hikersToDots(state.hikers, thresholds, state.sosHikerId, state.sosRecentHikerId, state.liveHikerId),
      })),

    selectedPoint: null,
    setSelectedPoint: (pt) => set({ selectedPoint: pt }),

    selectedPointScreenPos: null,
    setSelectedPointScreenPos: (pos) => set({ selectedPointScreenPos: pos }),

    liveHikerId: null,
    liveDataStale: false,
    setLiveHikerId: (id) =>
      set((state) => ({
        liveHikerId: id,
        dots: hikersToDots(state.hikers, state.thresholds, state.sosHikerId, state.sosRecentHikerId, id),
      })),
    setLiveDataStale: (stale) => set({ liveDataStale: stale }),

    sosTriggeredAt: null,
    sosHikerId: null,
    sosRecentHikerId: null,
    triggerSos: (hikerId) =>
      set((state) => {
        const id = hikerId ?? state.sosHikerId
        return {
          sosTriggeredAt: Date.now(),
          sosHikerId: id,
          sosRecentHikerId: id ?? state.sosRecentHikerId,
          dots: hikersToDots(state.hikers, state.thresholds, id, id ?? state.sosRecentHikerId, state.liveHikerId),
        }
      }),
    clearSos: () =>
      set((state) => ({
        sosTriggeredAt: null,
        sosHikerId: null,
        dots: hikersToDots(state.hikers, state.thresholds, null, state.sosRecentHikerId, state.liveHikerId),
      })),
  }))
)
