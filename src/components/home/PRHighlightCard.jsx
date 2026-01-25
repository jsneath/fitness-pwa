import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/database'
import BentoCard from './BentoCard'

export default function PRHighlightCard() {
  const personalRecords = useLiveQuery(() =>
    db.personalRecords.orderBy('date').reverse().limit(10).toArray()
  , [])

  const exercises = useLiveQuery(() => db.exercises.toArray(), [])

  const recentPR = useMemo(() => {
    if (!personalRecords || personalRecords.length === 0) return null

    const latestPR = personalRecords[0]
    const exercise = exercises?.find(e => e.id === latestPR.exerciseId)

    return {
      ...latestPR,
      exerciseName: exercise?.name || 'Exercise'
    }
  }, [personalRecords, exercises])

  const totalPRs = personalRecords?.length || 0

  if (!recentPR) {
    return (
      <Link to="/progress" className="block">
        <BentoCard size="1x1" onClick={() => {}}>
          <div className="flex flex-col items-center justify-center h-full min-h-[100px]">
            <span className="text-2xl mb-1">🏆</span>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 text-center">
              No PRs yet
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              Keep training!
            </p>
          </div>
        </BentoCard>
      </Link>
    )
  }

  const isRecent = () => {
    const prDate = new Date(recentPR.date)
    const now = new Date()
    const diffDays = Math.floor((now - prDate) / (1000 * 60 * 60 * 24))
    return diffDays <= 7
  }

  return (
    <Link to="/progress" className="block">
      <BentoCard
        size="1x1"
        gradient={isRecent() ? 'warning' : null}
        onClick={() => {}}
      >
        <div className="flex flex-col h-full min-h-[100px]">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {isRecent() ? (
                <span className="text-white/80">New PR!</span>
              ) : (
                'Latest PR'
              )}
            </p>
            <motion.span
              animate={isRecent() ? {
                scale: [1, 1.2, 1],
                rotate: [-5, 5, -5]
              } : {}}
              transition={{
                duration: 1,
                repeat: isRecent() ? Infinity : 0
              }}
            >
              🏆
            </motion.span>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <p className={`text-lg font-bold ${isRecent() ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
              {recentPR.value}
              <span className={`text-xs font-medium ml-1 ${isRecent() ? 'text-white/80' : 'text-slate-400'}`}>
                {recentPR.type === 'weight' ? 'kg' : 'reps'}
              </span>
            </p>
            <p className={`text-xs truncate ${isRecent() ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
              {recentPR.exerciseName}
            </p>
          </div>

          <p className={`text-[10px] ${isRecent() ? 'text-white/60' : 'text-slate-400 dark:text-slate-500'}`}>
            {totalPRs} total PRs
          </p>
        </div>
      </BentoCard>
    </Link>
  )
}
