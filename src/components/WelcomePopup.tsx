'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

interface WelcomePopupProps {
  isOpen: boolean
  onComplete?: () => void
}

export default function WelcomePopup({ isOpen, onComplete }: WelcomePopupProps) {
  const [isVisible, setIsVisible] = useState(isOpen)

  useEffect(() => {
    if (!isOpen) return

    setIsVisible(true)

    const timer = setTimeout(() => {
      setIsVisible(false)
      onComplete?.()
    }, 2000)

    return () => clearTimeout(timer)
  }, [isOpen, onComplete])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
          style={{ perspective: '1200px' }}
        >
          <motion.div
            initial={{ 
              scale: 0.6, 
              opacity: 0, 
              rotateX: -30,
              rotateY: 10,
              z: -200
            }}
            animate={{ 
              scale: 1, 
              opacity: 1, 
              rotateX: 0,
              rotateY: 0,
              z: 0
            }}
            exit={{ 
              scale: 0.6, 
              opacity: 0, 
              rotateX: 30,
              rotateY: -10,
              z: -200
            }}
            transition={{ 
              duration: 0.7, 
              type: 'spring', 
              stiffness: 80,
              damping: 15
            }}
            className="w-full max-w-3xl rounded-4xl bg-gradient-to-br from-emerald-850 via-emerald-900 to-emerald-950 p-24 text-center shadow-2xl mx-4 border border-emerald-700/50 relative overflow-hidden"
            style={{
              transformStyle: 'preserve-3d',
              filter: 'drop-shadow(0 20px 60px rgba(0, 0, 0, 0.8))'
            }}
          >
            {/* Animated Lighting Lines */}
            <motion.div
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent opacity-0 pointer-events-none"
              style={{
                filter: 'blur(40px)',
              }}
            />

            <motion.div
              animate={{
                x: ['100%', '-100%'],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'linear',
                delay: 0.5,
              }}
              className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gradient-to-l from-emerald-300/30 to-transparent rounded-full opacity-0 pointer-events-none"
              style={{
                filter: 'blur(50px)',
              }}
            />

            {/* Floating particles effect */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={`particle-${i}`}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0, 0.3, 0],
                }}
                transition={{
                  duration: 3 + i,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.8,
                }}
                className="absolute w-2 h-2 bg-emerald-300 rounded-full pointer-events-none"
                style={{
                  left: `${30 + i * 20}%`,
                  bottom: '20%',
                  filter: 'blur(2px)',
                }}
              />
            ))}

            {/* Floating animation - subtle up and down movement */}
            <motion.div
              animate={{
                y: [0, -15, 0],
                rotateZ: [0, 1, -1, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute inset-0 pointer-events-none"
              style={{
                transformStyle: 'preserve-3d',
              }}
            />
            {/* Logo */}
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 150 }}
              className="mb-10 inline-block"
            >
              <div className="relative w-28 h-28 flex items-center justify-center">
                <Image
                  src="/images/Gymzi logo App.png"
                  alt="Gymzi Logo"
                  width={112}
                  height={112}
                  className="object-contain drop-shadow-lg"
                  priority
                />
              </div>
            </motion.div>

            {/* Welcome Text */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-6xl font-bold text-white mb-3 tracking-tight"
            >
              Welcome to Gymzi
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-emerald-200 text-2xl font-semibold mb-12"
            >
              Dashboard
            </motion.p>

            {/* Loading animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex justify-center gap-3"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ scaleY: [0.5, 1, 0.5] }}
                  transition={{
                    duration: 1.2,
                    delay: i * 0.15,
                    repeat: Infinity,
                  }}
                  className="h-3 w-3 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50"
                />
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
