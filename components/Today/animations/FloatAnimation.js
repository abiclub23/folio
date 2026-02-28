import { motion } from 'framer-motion'

export default function FloatAnimation({ children, intensity = 'medium', interactive = false }) {
  const intensityMap = {
    low: { y: [-5, 5], duration: 4 },
    medium: { y: [-10, 10], duration: 3 },
    high: { y: [-20, 20], duration: 2 }
  }

  const config = intensityMap[intensity] || intensityMap.medium

  return (
    <motion.div
      animate={{
        y: config.y,
      }}
      transition={{
        duration: config.duration,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut'
      }}
      whileHover={interactive ? { scale: 1.05, rotate: [0, -2, 2, 0] } : {}}
      style={{ willChange: 'transform' }}
    >
      {children}
    </motion.div>
  )
}
