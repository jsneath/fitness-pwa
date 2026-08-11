import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/database'
import { calculateStreak } from '../../utils/dates'
import BentoCard from './BentoCard'

export default function StreakCounter() {
  const workoutLogs = useLiveQuery(() =>
    db.workoutLogs.orderBy('date').reverse().limit(30).toArray()
  , [])

  const streak = useMemo(
    () => calculateStreak((workoutLogs || []).map((w) => w.date)),
    [workoutLogs]
  )

  const flameColors = streak > 7 ? 'from-orange-500 to-red-600' : 'from-orange-400 to-orange-500'

  return (
    <BentoCard size="1x1" gradient={streak > 0 ? 'energy' : null}>
      <div className="flex flex-col items-center justify-center h-full min-h-[100px]">
        <motion.div
          animate={streak > 0 ? {
            scale: [1, 1.1, 1],
            rotate: [-3, 3, -3],
          } : {}}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="mb-1"
        >
          <span className="text-3xl">{streak > 0 ? '🔥' : '💤'}</span>
        </motion.div>
        <span className={`text-2xl font-black ${streak > 0 ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
          {streak}
        </span>
        <span className={`text-xs font-semibold ${streak > 0 ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
          Day Streak
        </span>
      </div>
    </BentoCard>
  )
}
