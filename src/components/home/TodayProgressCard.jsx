import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/database'
import BentoCard from './BentoCard'

export default function TodayProgressCard() {
  const today = new Date().toISOString().split('T')[0]

  const todayWorkouts = useLiveQuery(() =>
    db.workoutLogs.where('date').equals(today).toArray()
  , [today])

  const todaySets = useLiveQuery(async () => {
    if (!todayWorkouts || todayWorkouts.length === 0) return []
    const workoutIds = todayWorkouts.map(w => w.id)
    const allSets = await db.setLogs.toArray()
    return allSets.filter(s => workoutIds.includes(s.workoutLogId) && !s.isWarmup)
  }, [todayWorkouts])

  const stats = useMemo(() => {
    if (!todaySets || todaySets.length === 0) {
      return { sets: 0, volume: 0, exercises: 0 }
    }

    const uniqueExercises = new Set(todaySets.map(s => s.exerciseId))
    const totalVolume = todaySets.reduce((sum, s) => sum + (s.weight * s.reps), 0)

    return {
      sets: todaySets.length,
      volume: Math.round(totalVolume),
      exercises: uniqueExercises.size
    }
  }, [todaySets])

  const hasWorkout = todayWorkouts && todayWorkouts.length > 0

  return (
    <BentoCard size="2x1">
      <div className="flex items-center justify-between h-full">
        <div className="flex-1">
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
            Today
          </p>
          {hasWorkout ? (
            <>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {todayWorkouts.length} workout{todayWorkouts.length > 1 ? 's' : ''}
              </p>
              <div className="flex gap-3 mt-2">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">{stats.sets} sets</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">{stats.volume.toLocaleString()}kg</span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No workouts yet today
            </p>
          )}
        </div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
            hasWorkout
              ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-500/30'
              : 'bg-slate-100 dark:bg-dark-surface-elevated'
          }`}
        >
          {hasWorkout ? (
            <motion.svg
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="w-7 h-7 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </motion.svg>
          ) : (
            <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </motion.div>
      </div>
    </BentoCard>
  )
}
