'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { CoinIcon } from '@/components/ui/coin-icon'

interface AnimatedCoinsDisplayProps {
  coins: number
}

export function AnimatedCoinsDisplay({ coins }: AnimatedCoinsDisplayProps) {
  const [displayCoins, setDisplayCoins] = useState(coins)
  const [coinDiff, setCoinDiff] = useState(0)
  const [showAnimation, setShowAnimation] = useState(false)
  const prevCoinsRef = useRef(coins)

  useEffect(() => {
    const diff = coins - prevCoinsRef.current
    if (diff > 0) {
      setCoinDiff(diff)
      setShowAnimation(true)

      // Animação de contagem
      const duration = 500
      const steps = 20
      const increment = diff / steps
      let currentStep = 0

      const interval = setInterval(() => {
        currentStep++
        if (currentStep >= steps) {
          setDisplayCoins(coins)
          clearInterval(interval)
        } else {
          setDisplayCoins(Math.round(prevCoinsRef.current + increment * currentStep))
        }
      }, duration / steps)

      // Esconde a animação de +coins
      const timeout = setTimeout(() => {
        setShowAnimation(false)
      }, 1500)

      prevCoinsRef.current = coins

      return () => {
        clearInterval(interval)
        clearTimeout(timeout)
      }
    } else {
      setDisplayCoins(coins)
      prevCoinsRef.current = coins
    }
  }, [coins])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50"
    >
      <div className="relative">
        {/* Container principal */}
        <motion.div
          className="flex items-center gap-2 bg-gradient-to-r from-mario-yellow/90 to-yellow-500/90 backdrop-blur-sm px-4 py-2.5 rounded-full shadow-lg border-2 border-yellow-600"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Coin Icon com animação de rotação quando ganha coins */}
          <motion.div
            animate={
              showAnimation
                ? {
                    rotateY: [0, 360],
                    scale: [1, 1.3, 1],
                  }
                : {}
            }
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          >
            <CoinIcon size={28} className="shadow-md" />
          </motion.div>

          {/* Valor dos coins */}
          <motion.span
            key={displayCoins}
            initial={showAnimation ? { scale: 1.2 } : { scale: 1 }}
            animate={{ scale: 1 }}
            className="font-display font-bold text-lg text-yellow-900 min-w-[2.5rem] text-center"
          >
            {displayCoins}
          </motion.span>

          {/* Coins flutuantes quando ganha */}
          <AnimatePresence>
            {showAnimation && (
              <>
                {/* Coins pequenos subindo */}
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={`floating-coin-${i}`}
                    initial={{
                      opacity: 1,
                      y: 0,
                      x: 0,
                      scale: 0.5,
                    }}
                    animate={{
                      opacity: 0,
                      y: -50 - i * 15,
                      x: (i - 1) * 20,
                      scale: 0.3,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 0.8,
                      delay: i * 0.1,
                      ease: 'easeOut',
                    }}
                    className="absolute -top-2 left-1/2"
                  >
                    <CoinIcon size={20} />
                  </motion.div>
                ))}

                {/* Badge +X coins */}
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.5 }}
                  animate={{ opacity: 1, y: -45, scale: 1 }}
                  exit={{ opacity: 0, y: -60 }}
                  transition={{ duration: 0.3 }}
                  className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap"
                >
                  <span className="bg-mario-green text-white text-sm font-bold px-2 py-1 rounded-full shadow-lg">
                    +{coinDiff}
                  </span>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Brilho de fundo */}
        <motion.div
          animate={
            showAnimation
              ? {
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 0.8, 0],
                }
              : {}
          }
          transition={{ duration: 0.6 }}
          className="absolute inset-0 bg-mario-yellow rounded-full blur-xl -z-10"
        />
      </div>
    </motion.div>
  )
}
