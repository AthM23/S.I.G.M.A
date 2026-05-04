import { useMemo } from 'react'
import * as THREE from 'three'
import fresnelVertexShader from '../../shaders/fresnel.vert.glsl?raw'
import fresnelFragmentShader from '../../shaders/fresnel.frag.glsl?raw'

export default function AtmosphereRim() {
  const uniforms = useMemo(() => ({}), [])

  return (
    <mesh renderOrder={1}>
      <sphereGeometry args={[1.012, 96, 96]} />
      <shaderMaterial
        vertexShader={fresnelVertexShader}
        fragmentShader={fresnelFragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  )
}
