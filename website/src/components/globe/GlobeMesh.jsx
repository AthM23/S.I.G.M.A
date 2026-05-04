import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useLoader } from '@react-three/fiber'
import globeVertexShader from '../../shaders/globe.vert.glsl?raw'
import globeFragmentShader from '../../shaders/globe.frag.glsl?raw'
import earthWater from '../../textures/earth-water.png'
import earthTopology from '../../textures/earth-topology.png'

export default function GlobeMesh() {
  const meshRef = useRef()

  const [waterMask, topology] = useLoader(THREE.TextureLoader, [
    earthWater,
    earthTopology,
  ])

  const uniforms = useMemo(() => ({
    uWaterMask: { value: waterMask },
    uTopology: { value: topology },
  }), [waterMask, topology])

  return (
    <mesh ref={meshRef} renderOrder={2}>
      <sphereGeometry args={[1, 96, 96]} />
      <shaderMaterial
        vertexShader={globeVertexShader}
        fragmentShader={globeFragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  )
}
