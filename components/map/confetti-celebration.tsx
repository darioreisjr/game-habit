'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface ConfettiCelebrationProps {
  trigger: boolean
  onComplete?: () => void
}

const CONFETTI_COLORS = ['#E52521', '#049CD8', '#FBD000', '#43B047', '#FF6B6B', '#4ECDC4']
const PARTICLE_COUNT = 30

interface Particle {
  id: number
  x: number
  color: string
  rotation: number
  scale: number
  delay: number
}

export function ConfettiCelebration({ trigger, onComplete }: ConfettiCelebrationProps) {
  const [particles, setParticles] = useState<Particle[]>([])
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (trigger && !isAnimating) {
      setIsAnimating(true)

      const newParticles: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: i,
        x: Math.random() * 100 - 50,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.5,
        delay: Math.random() * 0.2,
      }))

      setParticles(newParticles)

      const timer = setTimeout(() => {
        setParticles([])
        setIsAnimating(false)
        onComplete?.()
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [trigger, isAnimating, onComplete])

  return (
    <AnimatePresence>
      {particles.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{
                opacity: 1,
                x: '50%',
                y: '50%',
                scale: 0,
                rotate: 0,
              }}
              animate={{
                opacity: [1, 1, 0],
                x: `calc(50% + ${particle.x}vw)`,
                y: ['50%', '30%', '120%'],
                scale: [0, particle.scale, particle.scale],
                rotate: particle.rotation,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1.2,
                delay: particle.delay,
                ease: [0.1, 0.8, 0.2, 1],
              }}
              className="absolute w-3 h-3"
              style={{
                backgroundColor: particle.color,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              }}
            />
          ))}

          {/* Estrelas especiais */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={`star-${i}`}
              initial={{ opacity: 0, scale: 0, x: '50%', y: '50%' }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0.5],
                x: `calc(50% + ${(i - 1) * 30}vw)`,
                y: ['50%', '20%'],
              }}
              transition={{
                duration: 0.8,
                delay: 0.1 + i * 0.1,
              }}
              className="absolute text-4xl"
            >
              ⭐
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}
