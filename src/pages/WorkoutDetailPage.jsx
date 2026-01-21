import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Header } from '../components/layout'
import { Card, Button } from '../components/common'
import { db, getSetLogsForWorkout, getExerciseById } from '../db/database'

export default function WorkoutDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [workout, setWorkout] = useState(null)
  const [setLogs, setSetLogs] = useState([])
  const [exerciseMap, setExerciseMap] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadWorkout = async () => {
      const workoutData = await db.workoutLogs.get(parseInt(id))
      if (!workoutData) {
        navigate('/history')
        return
      }
      setWorkout(workoutData)

      const logs = await getSetLogsForWorkout(parseInt(id))
      setSetLogs(logs)

      // Get unique exercise IDs and fetch exercise info
      const exerciseIds = [...new Set(logs.map((log) => log.exerciseId))]
      const exercises = {}
      for (const exId of exerciseIds) {
        exercises[exId] = await getExerciseById(exId)
      }
      setExerciseMap(exercises)
      setLoading(false)
    }

    loadWorkout()
  }, [id, navigate])

  const groupedSets = useMemo(() => {
    const groups = {}
    setLogs.forEach((log) => {
      if (!groups[log.exerciseId]) {
        groups[log.exerciseId] = []
      }
      groups[log.exerciseId].push(log)
    })
    return groups
  }, [setLogs])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return null
    const start = new Date(startTime)
    const end = new Date(endTime)
    const minutes = Math.round((end - start) / 60000)
    if (minutes < 60) return `${minutes} minutes`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const totalVolume = setLogs
    .filter((log) => !log.isWarmup)
    .reduce((sum, log) => sum + log.weight * log.reps, 0)

  const totalSets = setLogs.filter((log) => !log.isWarmup).length

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this workout? This cannot be undone.')) {
      // Delete all set logs
      await db.setLogs.where('workoutLogId').equals(parseInt(id)).delete()
      // Delete the workout log
      await db.workoutLogs.delete(parseInt(id))
      navigate('/history')
    }
  }

  if (loading) {
    return (
      <>
        <Header title="Workout" showBack />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </>
    )
  }

  if (!workout) return null

  return (
    <>
      <Header
        title={workout.notes || 'Workout'}
        showBack
        rightAction={
          <button
            onClick={handleDelete}
            className="p-2 rounded-full hover:bg-gray-100 text-red-500"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        }
      />

      <div className="space-y-4 pt-4">
        {/* Workout Info */}
        <Card>
          <div className="text-sm text-gray-500 mb-1">{formatDate(workout.date)}</div>
          {workout.startTime && workout.endTime && (
            <div className="text-sm text-gray-500">
              Duration: {formatDuration(workout.startTime, workout.endTime)}
            </div>
          )}
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center py-3">
            <div className="text-2xl font-bold text-gray-900">
              {Object.keys(groupedSets).length}
            </div>
            <div className="text-xs text-gray-500">Exercises</div>
          </Card>
          <Card className="text-center py-3">
            <div className="text-2xl font-bold text-gray-900">{totalSets}</div>
            <div className="text-xs text-gray-500">Work Sets</div>
          </Card>
          <Card className="text-center py-3">
            <div className="text-2xl font-bold text-gray-900">
              {totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume}
            </div>
            <div className="text-xs text-gray-500">Volume</div>
          </Card>
        </div>

        {/* Exercises */}
        <div className="space-y-4">
          {Object.entries(groupedSets).map(([exerciseId, sets]) => {
            const exercise = exerciseMap[exerciseId]
            if (!exercise) return null

            const workSets = sets.filter((s) => !s.isWarmup)
            const exerciseVolume = workSets.reduce((sum, s) => sum + s.weight * s.reps, 0)

            return (
              <Card key={exerciseId}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{exercise.name}</h3>
                    <p className="text-sm text-gray-500">
                      {workSets.length} sets • {exerciseVolume.toLocaleString()} kg
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    <div className="col-span-2">Set</div>
                    <div className="col-span-4">Weight</div>
                    <div className="col-span-3">Reps</div>
                    <div className="col-span-3">RPE</div>
                  </div>
                  {sets.map((set, index) => (
                    <div
                      key={set.id}
                      className={`grid grid-cols-12 gap-2 py-2 rounded-lg ${
                        set.isWarmup ? 'bg-yellow-50 text-gray-500' : ''
                      }`}
                    >
                      <div className="col-span-2 font-medium">
                        {set.isWarmup ? 'W' : index + 1 - sets.filter((s, i) => i < index && s.isWarmup).length}
                      </div>
                      <div className="col-span-4">{set.weight} kg</div>
                      <div className="col-span-3">{set.reps}</div>
                      <div className="col-span-3">{set.rpe || '-'}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </>
  )
}
