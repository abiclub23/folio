import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function WavePlane({ color, intensity }) {
  const meshRef = useRef()
  const speed = intensity === 'low' ? 0.5 : intensity === 'medium' ? 1 : 2

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime()
      const positions = meshRef.current.geometry.attributes.position.array

      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i]
        const y = positions[i + 1]
        positions[i + 2] = Math.sin(x * 0.5 + time * speed) * 0.3 + Math.cos(y * 0.5 + time * speed) * 0.3
      }

      meshRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 3, 0, 0]} position={[0, -2, 0]}>
      <planeGeometry args={[10, 10, 32, 32]} />
      <meshStandardMaterial
        color={color}
        wireframe={false}
        transparent
        opacity={0.3}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

export default function WavesBackground({ intensity = 'medium', color = '#7494de' }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
      <Canvas camera={{ position: [0, 2, 5], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <WavePlane color={color} intensity={intensity} />
      </Canvas>
    </div>
  )
}
