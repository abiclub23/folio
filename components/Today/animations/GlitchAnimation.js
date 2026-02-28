import { motion } from 'framer-motion'

export default function GlitchAnimation({ children, intensity = 'medium', interactive = false }) {
  const glitchVariants = {
    low: {
      x: [0, -2, 2, 0],
      skew: [0, -1, 1, 0],
      transition: { duration: 3, repeat: Infinity, repeatDelay: 5 }
    },
    medium: {
      x: [0, -5, 5, -2, 2, 0],
      skew: [0, -2, 2, -1, 1, 0],
      transition: { duration: 0.5, repeat: Infinity, repeatDelay: 3 }
    },
    high: {
      x: [0, -10, 10, -5, 5, -2, 2, 0],
      skew: [0, -3, 3, -2, 2, -1, 1, 0],
      transition: { duration: 0.3, repeat: Infinity, repeatDelay: 1 }
    }
  }

  return (
    <motion.div
      animate={glitchVariants[intensity] || glitchVariants.medium}
      whileHover={interactive ? {
        x: [-5, 5, -5, 5, 0],
        transition: { duration: 0.2 }
      } : {}}
      style={{
        position: 'relative',
        display: 'inline-block'
      }}
    >
      {children}
      {/* Glitch layers */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0.7,
          mixBlendMode: 'screen',
          color: '#ff0000',
          zIndex: -1
        }}
        animate={{
          x: [0, 2, -2, 0],
          opacity: [0, 0.7, 0]
        }}
        transition={{
          duration: intensity === 'high' ? 0.2 : intensity === 'medium' ? 0.4 : 0.6,
          repeat: Infinity,
          repeatDelay: intensity === 'high' ? 1 : intensity === 'medium' ? 2 : 4
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}
