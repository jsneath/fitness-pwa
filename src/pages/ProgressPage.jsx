import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from '../components/layout'
import { Card, Button, Modal, Input } from '../components/common'
import {
  InteractiveChart,
  BadgeCard,
  BADGES,
  checkBadgeProgress,
  StreakCalendar,
  MuscleMap,
  InsightCard,
  generateInsights,
  VolumePanel
} from '../components/progress'
import { db, getWorkoutLogs, getBodyMetrics, addBodyMetric, getAllExercises } from '../db/database'
import { tallyMuscleVolume } from '../data/muscleVolume'
import {
  calculateStreak,
  todayKey,
  shiftDateKey,
  recentDateKeys,
  daysBetween,
  formatShortDate,
  formatLongDate,
} from '../utils/dates'

export default function ProgressPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [showAddMetric, setShowAddMetric] = useState(false)
  const [newMetric, setNewMetric] = useState({ weight: '', bodyFat: '' })
  const [selectedExercise, setSelectedExercise] = useState(null)

  const workoutLogs = useLiveQuery(() => getWorkoutLogs(100), [])
  const bodyMetrics = useLiveQuery(() => getBodyMetrics(50), [])
  const exercises = useLiveQuery(() => getAllExercises(), [])
  const setLogs = useLiveQuery(() => db.setLogs.toArray(), [])
  const personalRecords = useLiveQuery(() => db.personalRecords.toArray(), [])

  // Workout dates for streak calendar
  const workoutDates = useMemo(() => {
    if (!workoutLogs) return []
    return workoutLogs.map(w => w.date)
  }, [workoutLogs])

  // Calculate current streak
  const currentStreak = useMemo(
    () => calculateStreak((workoutLogs || []).map((w) => w.date)),
    [workoutLogs]
  )

  // Muscle group activity over the last 30 days.
  //
  // The cutoff used to be calculated and then never applied, so this counted
  // every set ever logged and the map only ever got more uniform over time.
  // Sets are weighted by how much each exercise trains each muscle, matching
  // the Volume tab rather than counting every listed muscle equally.
  const muscleData = useMemo(() => {
    if (!setLogs || !exercises || !workoutLogs) return {}

    const cutoff = shiftDateKey(todayKey(), -30)
    const recentWorkoutIds = new Set(
      workoutLogs.filter((w) => w.date >= cutoff).map((w) => w.id)
    )

    const byId = new Map(exercises.map((e) => [e.id, e]))
    const recentSets = setLogs.filter(
      (s) => recentWorkoutIds.has(s.workoutLogId) && !s.isWarmup
    )

    return tallyMuscleVolume(recentSets, byId)
  }, [setLogs, exercises, workoutLogs])

  // Calculate stats for badges and insights
  const stats = useMemo(() => {
    if (!workoutLogs) return {
      totalWorkouts: 0,
      currentStreak,
      totalPRs: personalRecords?.length || 0,
      totalVolume: 0,
      thisWeek: 0,
      thisMonth: 0
    }

    // Compared as 'YYYY-MM-DD' strings, which sort chronologically. Building
    // Dates from the keys would parse them as UTC midnight and then compare
    // against a local timestamp, dropping workouts on the boundary day.
    const weekAgo = shiftDateKey(todayKey(), -7)
    const monthAgo = shiftDateKey(todayKey(), -30)

    const totalVolume = setLogs?.reduce((sum, set) =>
      sum + ((set.weight || 0) * (set.reps || 0)), 0) || 0

    return {
      totalWorkouts: workoutLogs.length,
      currentStreak,
      totalPRs: personalRecords?.length || 0,
      totalVolume,
      thisWeek: workoutLogs.filter(w => w.date >= weekAgo).length,
      thisMonth: workoutLogs.filter(w => w.date >= monthAgo).length,
      recentPRs: personalRecords?.filter(p => p.date >= weekAgo).length || 0,
      missedDays: workoutLogs.length === 0
        ? 0
        : Math.max(0, daysBetween(workoutLogs[0].date, todayKey()))
    }
  }, [workoutLogs, setLogs, personalRecords, currentStreak])

  // Generate insights
  const insights = useMemo(() => generateInsights(stats), [stats])

  // Workout frequency data for chart
  const workoutFrequencyData = useMemo(() => {
    if (!workoutLogs) return []

    const countByDate = new Map()
    for (const workout of workoutLogs) {
      countByDate.set(workout.date, (countByDate.get(workout.date) || 0) + 1)
    }

    return recentDateKeys(30).map((key) => ({
      date: formatShortDate(key),
      value: countByDate.get(key) || 0,
    }))
  }, [workoutLogs])

  // Body weight data for chart
  const bodyWeightData = useMemo(() => {
    if (!bodyMetrics) return []

    return bodyMetrics
      .slice()
      .reverse()
      .map(m => ({
        date: formatShortDate(m.date),
        value: m.weight
      }))
  }, [bodyMetrics])

  const handleAddMetric = async () => {
    const weight = parseFloat(newMetric.weight)
    const bodyFat = newMetric.bodyFat ? parseFloat(newMetric.bodyFat) : null

    if (!weight) return

    await addBodyMetric({
      date: todayKey(),
      weight,
      bodyFat,
      notes: ''
    })

    setNewMetric({ weight: '', bodyFat: '' })
    setShowAddMetric(false)
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'volume', label: 'Volume' },
    { id: 'body', label: 'Body' },
    { id: 'badges', label: 'Badges' }
  ]

  return (
    <>
      <Header title="Progress" />

      <div className="space-y-4 pt-4">
        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 dark:bg-dark-surface p-1 rounded-xl">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-dark-surface-elevated text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                <Card className="text-center py-3">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalWorkouts}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Total</div>
                </Card>
                <Card className="text-center py-3">
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.thisWeek}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">This Week</div>
                </Card>
                <Card className="text-center py-3">
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{currentStreak}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Streak</div>
                </Card>
              </div>

              {/* Insights */}
              {insights.length > 0 && (
                <div className="space-y-3">
                  {insights.slice(0, 3).map((insight, index) => (
                    <InsightCard key={index} {...insight} />
                  ))}
                </div>
              )}

              {/* Streak Calendar */}
              <StreakCalendar workoutDates={workoutDates} weeks={12} />

              {/* Workout Frequency Chart */}
              <InteractiveChart
                data={workoutFrequencyData}
                dataKey="value"
                xAxisKey="date"
                title="Workout Frequency"
                subtitle="Last 30 days"
                color="#6366f1"
                unit=" workouts"
              />

              {/* Muscle Map */}
              <MuscleMap muscleData={muscleData} view="front" />
            </motion.div>
          )}

          {/* Volume Tab */}
          {activeTab === 'volume' && (
            <motion.div
              key="volume"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <VolumePanel />
            </motion.div>
          )}

          {/* Body Tab */}
          {activeTab === 'body' && (
            <motion.div
              key="body"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-slate-900 dark:text-white">Body Metrics</h3>
                <Button size="sm" onClick={() => setShowAddMetric(true)}>
                  Log Weight
                </Button>
              </div>

              {/* Latest Metrics */}
              {bodyMetrics && bodyMetrics.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  <Card className="text-center py-4">
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">
                      {bodyMetrics[0].weight}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">kg</div>
                  </Card>
                  {bodyMetrics[0].bodyFat && (
                    <Card className="text-center py-4">
                      <div className="text-3xl font-bold text-slate-900 dark:text-white">
                        {bodyMetrics[0].bodyFat}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">% body fat</div>
                    </Card>
                  )}
                </div>
              )}

              {/* Weight Chart */}
              <InteractiveChart
                data={bodyWeightData}
                dataKey="value"
                xAxisKey="date"
                title="Weight History"
                subtitle="Track your progress"
                color="#10b981"
                unit="kg"
                showBrush={bodyWeightData.length > 15}
              />

              {/* Metrics History */}
              {bodyMetrics && bodyMetrics.length > 0 && (
                <Card>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Recent Entries</h3>
                  <div className="space-y-2">
                    {bodyMetrics.slice(0, 10).map(metric => (
                      <div
                        key={metric.id}
                        className="flex justify-between py-2 border-b border-slate-100 dark:border-dark-border last:border-0"
                      >
                        <span className="text-slate-500 dark:text-slate-400">
                          {formatLongDate(metric.date)}
                        </span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {metric.weight} kg
                          {metric.bodyFat && ` • ${metric.bodyFat}%`}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </motion.div>
          )}

          {/* Badges Tab */}
          {activeTab === 'badges' && (
            <motion.div
              key="badges"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="text-center mb-6">
                <span className="text-4xl">🏆</span>
                <h3 className="font-semibold text-slate-900 dark:text-white mt-2">Your Achievements</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Keep training to unlock more badges!
                </p>
              </div>

              <div className="space-y-3">
                {Object.values(BADGES).map(badge => {
                  const progress = checkBadgeProgress(badge, stats)
                  const earned = progress >= badge.requirement

                  return (
                    <BadgeCard
                      key={badge.id}
                      badge={badge}
                      earned={earned}
                      progress={progress}
                    />
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Metric Modal */}
      <Modal
        isOpen={showAddMetric}
        onClose={() => {
          setShowAddMetric(false)
          setNewMetric({ weight: '', bodyFat: '' })
        }}
        title="Log Body Metrics"
      >
        <div className="space-y-4">
          <Input
            label="Weight (kg)"
            type="number"
            step="0.1"
            value={newMetric.weight}
            onChange={e => setNewMetric({ ...newMetric, weight: e.target.value })}
            placeholder="e.g., 75.5"
          />
          <Input
            label="Body Fat % (optional)"
            type="number"
            step="0.1"
            value={newMetric.bodyFat}
            onChange={e => setNewMetric({ ...newMetric, bodyFat: e.target.value })}
            placeholder="e.g., 15"
          />
          <Button
            fullWidth
            onClick={handleAddMetric}
            disabled={!newMetric.weight}
          >
            Save
          </Button>
        </div>
      </Modal>
    </>
  )
}
