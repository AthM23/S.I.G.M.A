# S.I.G.M.A Web Dashboard

This directory contains the responder-facing web app for S.I.G.M.A: a React + Vite
dashboard with a 3D globe, people list, hiker detail view, threshold-based alerts, and a
polling client for live data coming from the ingest server.

## Stack

- React 19
- Vite 8
- Three.js
- Zustand
- Tailwind CSS v4
- shadcn/ui primitives

## Scripts

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Docs

- [../README.md](../README.md) - project-wide architecture and setup
- [context/GLOBE.md](./context/GLOBE.md) - globe rendering notes
- [context/GROUNDSTATION-HOTSPOT-LAN.md](./context/GROUNDSTATION-HOTSPOT-LAN.md) - LAN demo wiring and hotspot setup
- [sigma-architecture.mmd](./sigma-architecture.mmd) - Mermaid system diagram
