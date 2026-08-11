import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Header } from '../components/layout'
import { Card } from '../components/common'
import { getWorkoutLogs } from '../db/database'
import { formatMonthYear, formatRelativeDay, formatDuration } from '../utils/dates'

export default function HistoryPage() {
  const workoutLogs = useLiveQuery(() => getWorkoutLogs(100), [])

  const groupedWorkouts = useMemo(() => {
    if (!workoutLogs) return {}

    const groups = {}
    workoutLogs.forEach((workout) => {
      const monthYear = formatMonthYear(workout.date)
      if (!groups[monthYear]) {
        groups[monthYear] = []
      }
      groups[monthYear].push(workout)
    })
    return groups
  }, [workoutLogs])

  return (
    <>
      <Header title="History" />

      <div className="space-y-6 pt-4">
        {workoutLogs && workoutLogs.length > 0 ? (
          Object.entries(groupedWorkouts).map(([monthYear, workouts]) => (
            <section key={monthYear}>
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                {monthYear}
              </h2>
              <div className="space-y-2">
                {workouts.map((workout) => (
                  <Link key={workout.id} to={`/history/${workout.id}`}>
                    <Card className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {workout.notes || 'Workout'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatRelativeDay(workout.date)}
                          {workout.startTime && workout.endTime && (
                            <span className="ml-2">
                              • {formatDuration(workout.startTime, workout.endTime)}
                            </span>
                          )}
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          ))
        ) : (
          <Card className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No workouts yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Start your first workout to see it here</p>
            <Link
              to="/workout"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
            >
              Start Workout
            </Link>
          </Card>
        )}
      </div>
    </>
  )
}
