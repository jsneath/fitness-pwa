import { useState, useEffect, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Header } from '../components/layout'
import { Card, Button, Modal, Input } from '../components/common'
import { db, getWorkoutLogs, getBodyMetrics, addBodyMetric, getAllExercises } from '../db/database'

export default function ProgressPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [showAddMetric, setShowAddMetric] = useState(false)
  const [newMetric, setNewMetric] = useState({ weight: '', bodyFat: '' })
  const [selectedExercise, setSelectedExercise] = useState(null)

  const workoutLogs = useLiveQuery(() => getWorkoutLogs(100), [])
  const bodyMetrics = useLiveQuery(() => getBodyMetrics(50), [])
  const exercises = useLiveQuery(() => getAllExercises(), [])

  // Calculate workout frequency data
  const workoutFrequencyData = useMemo(() => {
    if (!workoutLogs) return []

    const last30Days = []
    const today = new Date()

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const count = workoutLogs.filter((w) => w.date === dateStr).length
      last30Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        workouts: count
      })
    }

    return last30Days
  }, [workoutLogs])

  // Calculate weekly volume
  const weeklyVolume = useMemo(() => {
    if (!workoutLogs) return []

    const weeks = {}
    workoutLogs.forEach((workout) => {
      const date = new Date(workout.date)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      const weekKey = weekStart.toISOString().split('T')[0]

      if (!weeks[weekKey]) {
        weeks[weekKey] = { week: weekKey, volume: 0 }
      }
    })

    return Object.values(weeks)
      .sort((a, b) => new Date(a.week) - new Date(b.week))
      .slice(-8)
      .map((w) => ({
        ...w,
        week: new Date(w.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }))
  }, [workoutLogs])

  // Body weight data
  const bodyWeightData = useMemo(() => {
    if (!bodyMetrics) return []

    return bodyMetrics
      .slice()
      .reverse()
      .map((m) => ({
        date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weight: m.weight,
        bodyFat: m.bodyFat
      }))
  }, [bodyMetrics])

  // Exercise progress data
  const exerciseProgressData = useMemo(() => {
    if (!selectedExercise) return []

    // This would need actual set log data - simplified for now
    return []
  }, [selectedExercise])

  const handleAddMetric = async () => {
    const weight = parseFloat(newMetric.weight)
    const bodyFat = newMetric.bodyFat ? parseFloat(newMetric.bodyFat) : null

    if (!weight) return

    await addBodyMetric({
      date: new Date().toISOString().split('T')[0],
      weight,
      bodyFat,
      notes: ''
    })

    setNewMetric({ weight: '', bodyFat: '' })
    setShowAddMetric(false)
  }

  const stats = useMemo(() => {
    if (!workoutLogs) return { total: 0, thisWeek: 0, thisMonth: 0 }

    const now = new Date()
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const monthAgo = new Date(now)
    monthAgo.setMonth(monthAgo.getMonth() - 1)

    return {
      total: workoutLogs.length,
      thisWeek: workoutLogs.filter((w) => new Date(w.date) >= weekAgo).length,
      thisMonth: workoutLogs.filter((w) => new Date(w.date) >= monthAgo).length
    }
  }, [workoutLogs])

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'body', label: 'Body' },
    { id: 'exercises', label: 'Exercises' }
  ]

  return (
    <>
      <Header title="Progress" />

      <div className="space-y-4 pt-4">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="text-center py-3">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-xs text-gray-500">Total</div>
              </Card>
              <Card className="text-center py-3">
                <div className="text-2xl font-bold text-blue-600">{stats.thisWeek}</div>
                <div className="text-xs text-gray-500">This Week</div>
              </Card>
              <Card className="text-center py-3">
                <div className="text-2xl font-bold text-green-600">{stats.thisMonth}</div>
                <div className="text-xs text-gray-500">This Month</div>
              </Card>
            </div>

            {/* Workout Frequency Chart */}
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Workout Frequency (30 days)</h3>
              {workoutFrequencyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={workoutFrequencyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      interval={6}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="workouts" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No workout data yet
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Body Tab */}
        {activeTab === 'body' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Body Metrics</h3>
              <Button size="sm" onClick={() => setShowAddMetric(true)}>
                Log Weight
              </Button>
            </div>

            {/* Latest Metrics */}
            {bodyMetrics && bodyMetrics.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <Card className="text-center py-3">
                  <div className="text-2xl font-bold text-gray-900">
                    {bodyMetrics[0].weight} kg
                  </div>
                  <div className="text-xs text-gray-500">Current Weight</div>
                </Card>
                {bodyMetrics[0].bodyFat && (
                  <Card className="text-center py-3">
                    <div className="text-2xl font-bold text-gray-900">
                      {bodyMetrics[0].bodyFat}%
                    </div>
                    <div className="text-xs text-gray-500">Body Fat</div>
                  </Card>
                )}
              </div>
            )}

            {/* Weight Chart */}
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Weight History</h3>
              {bodyWeightData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={bodyWeightData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis
                      domain={['dataMin - 2', 'dataMax + 2']}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No weight data yet. Log your first weigh-in!
                </div>
              )}
            </Card>

            {/* Metrics History */}
            {bodyMetrics && bodyMetrics.length > 0 && (
              <Card>
                <h3 className="font-semibold text-gray-900 mb-3">Recent Entries</h3>
                <div className="space-y-2">
                  {bodyMetrics.slice(0, 10).map((metric) => (
                    <div
                      key={metric.id}
                      className="flex justify-between py-2 border-b border-gray-100 last:border-0"
                    >
                      <span className="text-gray-500">
                        {new Date(metric.date).toLocaleDateString()}
                      </span>
                      <span className="font-medium">
                        {metric.weight} kg
                        {metric.bodyFat && ` • ${metric.bodyFat}%`}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Exercises Tab */}
        {activeTab === 'exercises' && (
          <div className="space-y-4">
            <Card>
              <h3 className="font-semibold text-gray-900 mb-3">Exercise Progress</h3>
              <p className="text-gray-500 text-sm">
                Select an exercise to view your progress over time.
              </p>
              <select
                value={selectedExercise?.id || ''}
                onChange={(e) => {
                  const ex = exercises?.find((x) => x.id === parseInt(e.target.value))
                  setSelectedExercise(ex || null)
                }}
                className="w-full mt-3 px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select an exercise...</option>
                {exercises?.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>
            </Card>

            {selectedExercise && (
              <Card className="text-center py-8 text-gray-500">
                Exercise progress tracking coming soon!
              </Card>
            )}
          </div>
        )}
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
            onChange={(e) => setNewMetric({ ...newMetric, weight: e.target.value })}
            placeholder="e.g., 75.5"
          />
          <Input
            label="Body Fat % (optional)"
            type="number"
            step="0.1"
            value={newMetric.bodyFat}
            onChange={(e) => setNewMetric({ ...newMetric, bodyFat: e.target.value })}
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
