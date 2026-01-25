import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/database'
import BentoCard from './BentoCard'

export default function StreakCounter() {
  const workoutLogs = useLiveQuery(() =>
    db.workoutLogs.orderBy('date').reverse().limit(30).toArray()
  , [])

  const streak = useMemo(() => {
    if (!workoutLogs || workoutLogs.length === 0) return 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let currentStreak = 0
    let checkDate = new Date(today)

    // Check if we have a workout today or yesterday (to continue streak)
    const todayStr = today.toISOString().split('T')[0]
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const workoutDates = new Set(workoutLogs.map(w => w.date))

    // Start counting from today or yesterday
    if (!workoutDates.has(todayStr)) {
      if (!workoutDates.has(yesterdayStr)) {
        return 0 // Streak broken
      }
      checkDate = yesterday
    }

    // Count consecutive days
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0]
      if (workoutDates.has(dateStr)) {
        currentStreak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }

    return currentStreak
  }, [workoutLogs])

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
