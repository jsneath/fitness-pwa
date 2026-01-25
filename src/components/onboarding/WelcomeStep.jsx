import { motion } from 'framer-motion'

export default function WelcomeStep() {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        className="text-8xl mb-8"
      >
        💪
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-3xl font-bold text-slate-900 dark:text-white mb-4"
      >
        Welcome to FitTrack
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-lg text-slate-600 dark:text-slate-400 max-w-sm"
      >
        Your personal fitness companion for tracking workouts, progress, and achieving your goals.
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-12 flex gap-3"
      >
        {['🏋️', '📊', '🏆', '🔥'].map((emoji, index) => (
          <motion.span
            key={emoji}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.9 + index * 0.1, type: 'spring' }}
            className="text-3xl"
          >
            {emoji}
          </motion.span>
        ))}
      </motion.div>
    </div>
  )
}
