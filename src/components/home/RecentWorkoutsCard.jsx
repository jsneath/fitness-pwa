import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { getWorkoutLogs } from '../../db/database'
import BentoCard from './BentoCard'

export default function RecentWorkoutsCard() {
  const recentWorkouts = useLiveQuery(() => getWorkoutLogs(3), [])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (dateString === today.toISOString().split('T')[0]) {
      return 'Today'
    } else if (dateString === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday'
    }
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  if (!recentWorkouts || recentWorkouts.length === 0) {
    return (
      <BentoCard size="2x1">
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
          Recent Workouts
        </p>
        <div className="flex items-center justify-center h-16">
          <p className="text-sm text-slate-500 dark:text-slate-400">No workouts yet</p>
        </div>
      </BentoCard>
    )
  }

  return (
    <BentoCard size="2x1">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Recent
        </p>
        <Link to="/history" className="text-xs text-indigo-500 font-semibold">
          View All
        </Link>
      </div>
      <div className="space-y-2">
        {recentWorkouts.slice(0, 2).map((workout, index) => (
          <Link key={workout.id} to={`/history/${workout.id}`}>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-surface-elevated transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-dark-border flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                  {workout.notes || 'Workout'}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {formatDate(workout.date)}
                </p>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </BentoCard>
  )
}
