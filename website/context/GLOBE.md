# S.I.G.M.A Globe Notes

## Overview

The dashboard globe is rendered with imperative **Three.js** inside
[`src/components/globe/GlobeScene.jsx`](../src/components/globe/GlobeScene.jsx). It uses
GeoJSON land outlines, animated status dots, click selection, and a shared Zustand store
for telemetry and UI state.

## Main files

- `src/components/globe/GlobeScene.jsx` - renderer, camera, controls, hit testing, and dot animation
- `src/store/globeStore.js` - hikers, thresholds, selection, live-feed state, and SOS state
- `src/hooks/useUrlState.js` - keeps globe orientation and zoom in the URL
- `public/continents.json` - continent outline/fill geometry

## Current behavior

- The globe is managed manually with Three.js, not React Three Fiber.
- Hiker dots are derived from store state and colored by status.
- Clicking a dot projects its screen position so the telemetry card can anchor beside it.
- The app starts with seeded demo hikers, then overlays live ingest data when a server
  endpoint is configured in settings or via `VITE_GS_API_URL`.
- SOS state and critical-threshold alerts are computed outside the renderer and reflected on
  the globe through the shared store.

## Coordinate mapping

Latitude and longitude are converted to 3D sphere coordinates in `lonLatToVec3()`. That
keeps dots physically locked to the globe surface while the globe group rotates.
