import { useMemo } from 'react'
import * as THREE from 'three'

function latLngToVec3(lat, lng, r = 1.001) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  )
}

function createGraticule(step = 10) {
  const points = []
  // latitude lines
  for (let lat = -80; lat <= 80; lat += step) {
    for (let lng = -180; lng < 180; lng += 2) {
      points.push(latLngToVec3(lat, lng, 1.001))
      points.push(latLngToVec3(lat, lng + 2, 1.001))
    }
  }
  // longitude lines
  for (let lng = -180; lng < 180; lng += step) {
    for (let lat = -80; lat < 80; lat += 2) {
      points.push(latLngToVec3(lat, lng, 1.001))
      points.push(latLngToVec3(lat + 2, lng, 1.001))
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setFromPoints(points)
  return geo
}

export default function GraticuleLines() {
  const geometry = useMemo(() => createGraticule(10), [])

  return (
    <lineSegments geometry={geometry} renderOrder={3}>
      <lineBasicMaterial color="#ffffff" opacity={0.07} transparent />
    </lineSegments>
  )
}
