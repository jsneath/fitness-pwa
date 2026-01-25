import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/database'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import BentoCard from './BentoCard'

export default function WeeklyVolumeCard() {
  const workoutLogs = useLiveQuery(() =>
    db.workoutLogs.orderBy('date').reverse().limit(50).toArray()
  , [])

  const setLogs = useLiveQuery(() => db.setLogs.toArray(), [])

  const weeklyData = useMemo(() => {
    if (!workoutLogs || !setLogs) return []

    // Get last 7 days
    const days = []
    const today = new Date()

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      days.push({
        date: dateStr,
        day: date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
        volume: 0
      })
    }

    // Map workouts to days
    const workoutIds = new Set(
      workoutLogs
        .filter(w => days.some(d => d.date === w.date))
        .map(w => w.id)
    )

    // Calculate volume per day
    setLogs.forEach(set => {
      if (workoutIds.has(set.workoutLogId) && !set.isWarmup) {
        const workout = workoutLogs.find(w => w.id === set.workoutLogId)
        if (workout) {
          const dayIndex = days.findIndex(d => d.date === workout.date)
          if (dayIndex !== -1) {
            days[dayIndex].volume += (set.weight || 0) * (set.reps || 0)
          }
        }
      }
    })

    return days
  }, [workoutLogs, setLogs])

  const totalVolume = useMemo(() =>
    weeklyData.reduce((sum, d) => sum + d.volume, 0)
  , [weeklyData])

  const maxVolume = useMemo(() =>
    Math.max(...weeklyData.map(d => d.volume), 1)
  , [weeklyData])

  return (
    <BentoCard size="1x1">
      <div className="flex flex-col h-full min-h-[100px]">
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
          This Week
        </p>
        <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {(totalVolume / 1000).toFixed(1)}
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 ml-1">tonnes</span>
        </p>

        <div className="flex-1 mt-2" style={{ minHeight: 40, height: 40 }}>
          <ResponsiveContainer width="100%" height={40}>
            <AreaChart data={weeklyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="volume"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#volumeGradient)"
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </BentoCard>
  )
}
