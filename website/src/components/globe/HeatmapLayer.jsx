import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useGlobeStore } from '../../store/globeStore'

function latLngToVec3(lat, lng, r = 1.003) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  )
}

function makeGlowSprite() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const ctx = canvas.getContext('2d')
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, 'rgba(255,255,255,1.0)')
  g.addColorStop(0.15, 'rgba(240,240,240,0.8)')
  g.addColorStop(0.4, 'rgba(200,200,200,0.3)')
  g.addColorStop(1, 'rgba(180,180,180,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(canvas)
}

// Generate sample heatmap data
function generateSampleData(count = 200) {
  const points = []
  // Cluster around major cities and hotspots
  const clusters = [
    { lat: 40.7, lng: -74, spread: 15, weight: 0.3 },    // NYC area
    { lat: 51.5, lng: 0, spread: 12, weight: 0.25 },      // London
    { lat: 35.7, lng: 139.7, spread: 10, weight: 0.35 },  // Tokyo
    { lat: 22.3, lng: 114.2, spread: 8, weight: 0.4 },    // Hong Kong
    { lat: -33.9, lng: 151.2, spread: 10, weight: 0.2 },  // Sydney
    { lat: 37.8, lng: -122.4, spread: 12, weight: 0.3 },  // San Francisco
    { lat: 1.3, lng: 103.8, spread: 8, weight: 0.35 },    // Singapore
    { lat: 48.9, lng: 2.3, spread: 10, weight: 0.2 },     // Paris
    { lat: 55.8, lng: 37.6, spread: 12, weight: 0.15 },   // Moscow
    { lat: -23.5, lng: -46.6, spread: 10, weight: 0.2 },  // São Paulo
    { lat: 19.4, lng: -99.1, spread: 8, weight: 0.15 },   // Mexico City
    { lat: 28.6, lng: 77.2, spread: 12, weight: 0.3 },    // Delhi
  ]

  for (let i = 0; i < count; i++) {
    const cluster = clusters[Math.floor(Math.random() * clusters.length)]
    const lat = cluster.lat + (Math.random() - 0.5) * cluster.spread * 2
    const lng = cluster.lng + (Math.random() - 0.5) * cluster.spread * 2
    const intensity = Math.min(1, Math.max(0, cluster.weight + (Math.random() - 0.5) * 0.4))
    points.push({
      lat: Math.max(-85, Math.min(85, lat)),
      lng: ((lng + 180) % 360) - 180,
      intensity,
      label: `Node ${i + 1}`,
      value: Math.floor(Math.random() * 1000),
    })
  }
  return points
}

const dummy = new THREE.Object3D()
const color = new THREE.Color()

export default function HeatmapLayer() {
  const meshRef = useRef()
  const heatmapPoints = useGlobeStore((s) => s.heatmapPoints)
  const setHeatmapPoints = useGlobeStore((s) => s.setHeatmapPoints)

  const glowTexture = useMemo(() => makeGlowSprite(), [])

  // Seed sample data on mount if empty
  useEffect(() => {
    if (heatmapPoints.length === 0) {
      setHeatmapPoints(generateSampleData(200))
    }
  }, [heatmapPoints.length, setHeatmapPoints])

  // Update instance matrices and colors
  useEffect(() => {
    if (!meshRef.current || heatmapPoints.length === 0) return

    heatmapPoints.forEach((point, i) => {
      const pos = latLngToVec3(point.lat, point.lng, 1.003)
      const scale = 0.02 + point.intensity * 0.03
      dummy.position.copy(pos)
      dummy.lookAt(0, 0, 0)
      dummy.scale.set(scale, scale, scale)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      const brightness = 0.55 + point.intensity * 0.45
      color.setRGB(brightness, brightness, brightness)
      meshRef.current.setColorAt(i, color)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true
    }
  }, [heatmapPoints])

  if (heatmapPoints.length === 0) return null

  return (
    <instancedMesh
      ref={meshRef}
      args={[null, null, heatmapPoints.length]}
      renderOrder={4}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={glowTexture}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors
      />
    </instancedMesh>
  )
}
