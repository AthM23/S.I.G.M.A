import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useGlobeStore } from '../../store/globeStore'
import { useSettingsStore } from '../../store/settingsStore'

const GLOBE_RADIUS = 1.3
const GRID_COLOR = '#333333'
const RESUME_DELAY = 3000
const DOT_RADIUS = 0.008
const PING_RADIUS = 0.03
const HEATMAP_RADIUS = 0.40
const HIT_RADIUS = 0.045
const ZOOM_DISTANCE = 2.1
const DEFAULT_DISTANCE = 3.5
const ZOOM_LERP_SPEED = 0.04

const loadGeoJsonData = async () => {
  try {
    const res = await fetch('/continents.json')
    return await res.json()
  } catch (err) {
    console.warn('Failed to load continent data:', err)
    return null
  }
}

const lonLatToVec3 = (lon, lat, radius) => {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (-lon + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

const latLonToVec3 = (lat, lon, radius) => lonLatToVec3(lon, lat, radius)

function makeGlowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const ctx = canvas.getContext('2d')
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.3, 'rgba(255,255,255,0.6)')
  g.addColorStop(0.7, 'rgba(255,255,255,0.1)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(canvas)
}

function makeHeatmapTexture() {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const half = size / 2
  const g = ctx.createRadialGradient(half, half, 0, half, half, half)
  g.addColorStop(0, 'rgba(255,255,255,0.2)')
  g.addColorStop(0.1, 'rgba(255,255,255,0.12)')
  g.addColorStop(0.25, 'rgba(255,255,255,0.06)')
  g.addColorStop(0.5, 'rgba(255,255,255,0.02)')
  g.addColorStop(0.75, 'rgba(255,255,255,0.005)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(canvas)
}

function drawContinents(geoJson, group, radius, outlineColor, fillColor, fillOpacity, outlineOpacity) {
  geoJson.features.forEach((feature) => {
    const geom = feature.geometry
    if (!geom) return
    const coordsList = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates

    coordsList.forEach((polygon) => {
      polygon.forEach((ring, ringIndex) => {
        if (ring.length < 3) return

        const vec3Points = ring.map(([lon, lat]) => lonLatToVec3(lon, lat, radius))
        const outlineGeom = new THREE.BufferGeometry().setFromPoints(vec3Points)
        group.add(
          new THREE.Line(
            outlineGeom,
            new THREE.LineBasicMaterial({ color: outlineColor, transparent: true, opacity: outlineOpacity })
          )
        )

        if (ringIndex === 0) {
          const shape2d = new THREE.Shape(
            ring.map(([lon, lat]) =>
              new THREE.Vector2((-lon + 180) / 360 * 2 * Math.PI, (90 - lat) / 180 * Math.PI)
            )
          )
          const shapeGeom = new THREE.ShapeGeometry(shape2d)
          const pos = shapeGeom.attributes.position.array
          for (let i = 0; i < pos.length; i += 3) {
            const lambda = pos[i]
            const phi = pos[i + 1]
            const r = radius - 0.01
            pos[i] = r * Math.sin(phi) * Math.cos(lambda)
            pos[i + 1] = r * Math.cos(phi)
            pos[i + 2] = r * Math.sin(phi) * Math.sin(lambda)
          }
          group.add(
            new THREE.Mesh(
              shapeGeom,
              new THREE.MeshBasicMaterial({
                color: fillColor,
                transparent: true,
                opacity: fillOpacity,
                depthWrite: false,
                side: THREE.DoubleSide,
              })
            )
          )
        }
      })
    })
  })
}

function createLatitudeLines(globeRadius) {
  const lines = []
  for (let deg = -80; deg <= 80; deg += 20) {
    const phi = (90 - deg) * (Math.PI / 180)
    const r = Math.sin(phi) * globeRadius
    const y = Math.cos(phi) * globeRadius
    const curve = new THREE.EllipseCurve(0, 0, r, r, 0, 2 * Math.PI, false, 0)
    const pts = curve.getPoints(64)
    const geo = new THREE.BufferGeometry().setFromPoints(pts)
    const arr = geo.attributes.position.array
    for (let j = 0; j < arr.length; j += 3) {
      const x = arr[j]
      const z = arr[j + 1]
      arr[j] = x
      arr[j + 1] = y
      arr[j + 2] = z
    }
    lines.push(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: GRID_COLOR, transparent: true, opacity: 0.1 })))
  }
  return lines
}

function createLongitudeLines(globeRadius) {
  const lines = []
  for (let deg = 0; deg < 180; deg += 20) {
    const curve = new THREE.EllipseCurve(0, 0, globeRadius, globeRadius, 0, Math.PI, false, 0)
    const pts = curve.getPoints(32)
    const geo = new THREE.BufferGeometry().setFromPoints(pts)
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: GRID_COLOR, transparent: true, opacity: 0.1 }))
    line.rotation.y = (deg * Math.PI) / 180
    lines.push(line)
  }
  return lines
}

export default function GlobeScene() {
  const wrapperRef = useRef(null)
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const globeRef = useRef(null)
  const controlsRef = useRef(null)
  const animationIdRef = useRef(null)
  const autoRotateRef = useRef(true)
  const initializedRef = useRef(false)
  const resumeTimerRef = useRef(null)

  const autoRotateSetting = useSettingsStore((s) => s.autoRotate)
  const rotationSpeedSetting = useSettingsStore((s) => s.rotationSpeed)
  const settingsAutoRotateRef = useRef(autoRotateSetting)
  const rotationSpeedRef = useRef(rotationSpeedSetting)

  useEffect(() => {
    rotationSpeedRef.current = rotationSpeedSetting
  }, [rotationSpeedSetting])

  useEffect(() => {
    settingsAutoRotateRef.current = autoRotateSetting
    if (!autoRotateSetting) {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
      autoRotateRef.current = false
    } else {
      autoRotateRef.current = true
    }
  }, [autoRotateSetting])
  const raycasterRef = useRef(new THREE.Raycaster())
  const mouseRef = useRef(new THREE.Vector2())

  // Each entry: { core: THREE.Mesh, ping: THREE.Sprite, heatmap: THREE.Sprite, dot: data }
  const dotObjectsRef = useRef([])

  const dots = useGlobeStore((s) => s.dots)
  const setSelectedPoint = useGlobeStore((s) => s.setSelectedPoint)
  const selectedPoint = useGlobeStore((s) => s.selectedPoint)
  const setSelectedPointScreenPos = useGlobeStore((s) => s.setSelectedPointScreenPos)
  const setSelectedPointRef = useRef(setSelectedPoint)
  const setScreenPosRef = useRef(setSelectedPointScreenPos)
  const selectedDotObjectRef = useRef(null)
  const prevSelectedPointRef = useRef(null)

  const glowTextureRef = useRef(null)
  const heatmapTextureRef = useRef(null)
  const zoomAnimRef = useRef({ active: false, targetPos: null, returning: false })

  useEffect(() => {
    setSelectedPointRef.current = setSelectedPoint
  }, [setSelectedPoint])

  useEffect(() => {
    setScreenPosRef.current = setSelectedPointScreenPos
  }, [setSelectedPointScreenPos])

  // Handle external close (e.g. close button in HikerCard)
  useEffect(() => {
    if (prevSelectedPointRef.current !== null && selectedPoint === null) {
      selectedDotObjectRef.current = null
      if (cameraRef.current) {
        const dir = cameraRef.current.position.clone().normalize()
        zoomAnimRef.current = {
          active: true,
          targetPos: dir.multiplyScalar(DEFAULT_DISTANCE),
          returning: true,
        }
      }
    }
    prevSelectedPointRef.current = selectedPoint
  }, [selectedPoint])

  useEffect(() => {
    if (!mountRef.current || !wrapperRef.current || initializedRef.current) return

    const mountElement = mountRef.current
    const wrapper = wrapperRef.current

    while (mountElement.firstChild) {
      mountElement.removeChild(mountElement.firstChild)
    }

    const w = wrapper.clientWidth || 800
    const h = wrapper.clientHeight || 800

    glowTextureRef.current = makeGlowTexture()
    heatmapTextureRef.current = makeHeatmapTexture()

    const scene = new THREE.Scene()
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000)
    camera.position.z = 3.5
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setClearColor(0x000000, 0)
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.outline = 'none'
    renderer.domElement.style.userSelect = 'none'
    rendererRef.current = renderer
    mountElement.appendChild(renderer.domElement)

    const globeGroup = new THREE.Group()
    globeRef.current = globeGroup
    scene.add(globeGroup)

    const sphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 48, 48)
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: GRID_COLOR,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    })
    globeGroup.add(new THREE.Mesh(sphereGeo, wireframeMat))

    createLatitudeLines(GLOBE_RADIUS).forEach((l) => globeGroup.add(l))
    createLongitudeLines(GLOBE_RADIUS).forEach((l) => globeGroup.add(l))

    loadGeoJsonData().then((geoJson) => {
      if (geoJson && globeGroup.parent) {
        drawContinents(geoJson, globeGroup, GLOBE_RADIUS + 0.002, '#ffffff', '#2a2a2a', 0.9, 0.85)
      }
    })

    scene.add(new THREE.AmbientLight(0xffffff, 0.1))

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.enableZoom = true
    controls.enablePan = false
    controls.minDistance = 2
    controls.maxDistance = 6
    controlsRef.current = controls

    const onStart = () => {
      autoRotateRef.current = false
      renderer.domElement.style.cursor = 'grabbing'
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    }
    const onEnd = () => {
      renderer.domElement.style.cursor = 'grab'
      if (settingsAutoRotateRef.current) {
        resumeTimerRef.current = setTimeout(() => {
          autoRotateRef.current = true
        }, RESUME_DELAY)
      }
    }

    controls.addEventListener('start', onStart)
    controls.addEventListener('end', onEnd)

    const onClick = (event) => {
      const rect = renderer.domElement.getBoundingClientRect()
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycasterRef.current.setFromCamera(mouseRef.current, camera)
      const hitMeshes = dotObjectsRef.current.map((d) => d.hitArea)
      const hits = raycasterRef.current.intersectObjects(hitMeshes)
      if (hits.length > 0) {
        const dotData = hits[0].object.userData.dot
        if (dotData) {
          setSelectedPointRef.current(dotData)
          selectedDotObjectRef.current = hits[0].object

          const worldPos = new THREE.Vector3()
          hits[0].object.getWorldPosition(worldPos)
          const dir = worldPos.clone().normalize()
          zoomAnimRef.current = {
            active: true,
            targetPos: dir.multiplyScalar(ZOOM_DISTANCE),
            returning: false,
          }
          autoRotateRef.current = false
          if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
        }
      } else if (zoomAnimRef.current.active || camera.position.length() < DEFAULT_DISTANCE - 0.3) {
        setSelectedPointRef.current(null)
        selectedDotObjectRef.current = null
        setScreenPosRef.current(null)
        const dir = camera.position.clone().normalize()
        zoomAnimRef.current = {
          active: true,
          targetPos: dir.multiplyScalar(DEFAULT_DISTANCE),
          returning: true,
        }
      }
    }
    renderer.domElement.addEventListener('click', onClick)

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate)
      controls.update()
      if (globeRef.current && autoRotateRef.current) {
        globeRef.current.rotation.y += rotationSpeedRef.current
      }

      const anim = zoomAnimRef.current
      if (anim.active && anim.targetPos) {
        camera.position.lerp(anim.targetPos, ZOOM_LERP_SPEED)
        const dist = camera.position.distanceTo(anim.targetPos)
        if (dist < 0.02) {
          camera.position.copy(anim.targetPos)
          anim.active = false
          if (anim.returning && settingsAutoRotateRef.current) {
            resumeTimerRef.current = setTimeout(() => {
              autoRotateRef.current = true
            }, RESUME_DELAY)
          }
        }
      }

      if (selectedDotObjectRef.current) {
        const worldPos = new THREE.Vector3()
        selectedDotObjectRef.current.getWorldPosition(worldPos)
        const ndc = worldPos.clone().project(camera)
        const rect = renderer.domElement.getBoundingClientRect()
        setScreenPosRef.current({
          x: rect.left + (ndc.x + 1) / 2 * rect.width,
          y: rect.top + (1 - ndc.y) / 2 * rect.height,
        })
      }

      const t = performance.now() * 0.001
      dotObjectsRef.current.forEach(({ ping, heatmap }) => {
        const pulse = (Math.sin(t * 3) + 1) / 2
        const scale = PING_RADIUS * (1 + pulse * 1.2)
        ping.scale.set(scale, scale, 1)
        ping.material.opacity = 0.6 * (1 - pulse * 0.8)

        const heatPulse = (Math.sin(t * 1.5 + 0.5) + 1) / 2
        const heatScale = HEATMAP_RADIUS * (0.9 + heatPulse * 0.2)
        heatmap.scale.set(heatScale, heatScale, 1)
        heatmap.material.opacity = 0.25 + heatPulse * 0.1
      })

      renderer.render(scene, camera)
    }
    animate()

    const resizeObs = new ResizeObserver(() => {
      const rw = wrapper.clientWidth
      const rh = wrapper.clientHeight
      if (rw === 0 || rh === 0) return
      camera.aspect = rw / rh
      camera.updateProjectionMatrix()
      renderer.setSize(rw, rh)
    })
    resizeObs.observe(wrapper)

    initializedRef.current = true

    return () => {
      resizeObs.disconnect()
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current)
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
      controls.removeEventListener('start', onStart)
      controls.removeEventListener('end', onEnd)
      renderer.domElement.removeEventListener('click', onClick)
      controls.dispose()
      dotObjectsRef.current.forEach(({ core, ping, heatmap, hitArea }) => {
        core.geometry.dispose()
        core.material.dispose()
        ping.material.dispose()
        heatmap.material.dispose()
        hitArea.geometry.dispose()
        hitArea.material.dispose()
      })
      dotObjectsRef.current = []
      if (mountElement.contains(renderer.domElement)) {
        mountElement.removeChild(renderer.domElement)
      }
      renderer.dispose()
      if (glowTextureRef.current) glowTextureRef.current.dispose()
      if (heatmapTextureRef.current) heatmapTextureRef.current.dispose()
      initializedRef.current = false
    }
  }, [])

  // Rebuild dots whenever the data changes
  useEffect(() => {
    if (!globeRef.current || !glowTextureRef.current || !heatmapTextureRef.current) return

    dotObjectsRef.current.forEach(({ core, ping, heatmap, hitArea }) => {
      globeRef.current.remove(core)
      globeRef.current.remove(ping)
      globeRef.current.remove(heatmap)
      globeRef.current.remove(hitArea)
      core.geometry.dispose()
      core.material.dispose()
      ping.material.dispose()
      heatmap.material.dispose()
      hitArea.geometry.dispose()
      hitArea.material.dispose()
    })
    dotObjectsRef.current = []

    dots.forEach((dot) => {
      const pos = latLonToVec3(dot.lat, dot.lon, GLOBE_RADIUS + 0.005)

      const coreGeo = new THREE.SphereGeometry(DOT_RADIUS, 8, 8)
      const coreMat = new THREE.MeshBasicMaterial({ color: dot.color })
      const core = new THREE.Mesh(coreGeo, coreMat)
      core.position.copy(pos)
      core.userData = { dot }
      globeRef.current.add(core)

      const hitGeo = new THREE.SphereGeometry(HIT_RADIUS, 8, 8)
      const hitMat = new THREE.MeshBasicMaterial({ visible: false })
      const hitArea = new THREE.Mesh(hitGeo, hitMat)
      hitArea.position.copy(pos)
      hitArea.userData = { dot }
      globeRef.current.add(hitArea)

      const pingMat = new THREE.SpriteMaterial({
        map: glowTextureRef.current,
        color: dot.color,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
      const ping = new THREE.Sprite(pingMat)
      ping.position.copy(pos)
      ping.scale.set(PING_RADIUS, PING_RADIUS, 1)
      globeRef.current.add(ping)

      const heatmapMat = new THREE.SpriteMaterial({
        map: heatmapTextureRef.current,
        color: dot.color,
        transparent: true,
        opacity: 0.25,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
      const heatmap = new THREE.Sprite(heatmapMat)
      heatmap.position.copy(pos)
      heatmap.scale.set(HEATMAP_RADIUS, HEATMAP_RADIUS, 1)
      globeRef.current.add(heatmap)

      dotObjectsRef.current.push({ core, ping, heatmap, hitArea, dot })
    })
  }, [dots])

  return (
    <div
      ref={wrapperRef}
      style={{ width: '100%', height: '100%', position: 'relative', cursor: 'grab' }}
    >
      <div ref={mountRef} style={{ position: 'absolute', inset: 0 }} />
    </div>
  )
}
