import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { motion, AnimatePresence } from 'framer-motion'

const DURATION = 3000

export default function PRCelebration({ show, exerciseName, value, type = 'weight', unit = 'kg', onComplete }) {
  // Held in a ref so a caller re-rendering (and passing a fresh callback) can't
  // re-trigger the effect and fire a second burst of confetti.
  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    if (!show) return

    const dismiss = setTimeout(() => onCompleteRef.current?.(), DURATION + 500)

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return () => clearTimeout(dismiss)
    }

    const animationEnd = Date.now() + DURATION
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 }
    const colors = ['#6366f1', '#8b5cf6', '#a855f7', '#10b981', '#f59e0b']
    const randomInRange = (min, max) => Math.random() * (max - min) + min

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()
      if (timeLeft <= 0) return clearInterval(interval)

      const particleCount = 50 * (timeLeft / DURATION)
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors })
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors })
    }, 250)

    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100, 50, 200])
    }

    // Stop both if the card is dismissed early
    return () => {
      clearInterval(interval)
      clearTimeout(dismiss)
    }
  }, [show])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
            onClick={onComplete}
          />

          {/* PR Card */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="relative bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 rounded-3xl p-8 shadow-2xl shadow-orange-500/50 pointer-events-auto max-w-sm mx-4"
          >
            {/* Decorative elements */}
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-yellow-300 rounded-full opacity-50 blur-xl" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-red-400 rounded-full opacity-50 blur-xl" />

            {/* Content */}
            <div className="relative text-center">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                className="text-6xl mb-4"
              >
                🏆
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-black text-white mb-2"
              >
                NEW PR!
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-white/90 font-medium mb-4"
              >
                {exerciseName}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="inline-flex items-baseline gap-1 bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-3"
              >
                <span className="text-4xl font-black text-white">{value}</span>
                <span className="text-lg font-bold text-white/80">
                  {type === 'reps' ? 'reps' : unit}
                </span>
              </motion.div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                onClick={onComplete}
                className="mt-6 w-full py-3 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl transition-colors"
              >
                Keep Crushing It!
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
