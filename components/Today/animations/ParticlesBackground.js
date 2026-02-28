import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function Particles({ count, color, intensity }) {
  const meshRef = useRef()

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10
    }
    return positions
  }, [count])

  const speed = intensity === 'low' ? 0.0005 : intensity === 'medium' ? 0.001 : 0.002

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += speed
      meshRef.current.rotation.x += speed * 0.5
    }
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length / 3}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color={color}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  )
}

export default function ParticlesBackground({ intensity = 'medium', color = '#7494de' }) {
  const countMap = {
    low: 500,
    medium: 1000,
    high: 2000
  }

  const count = countMap[intensity] || countMap.medium

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <Particles count={count} color={color} intensity={intensity} />
      </Canvas>
    </div>
  )
}
