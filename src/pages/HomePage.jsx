import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Header } from '../components/layout'
import { Card, Button } from '../components/common'
import { db, getActiveProgramme, getWorkoutLogs } from '../db/database'

export default function HomePage() {
  const [activeProgramme, setActiveProgramme] = useState(null)
  const recentWorkouts = useLiveQuery(() => getWorkoutLogs(5), [])
  const todayWorkouts = useLiveQuery(() => {
    const today = new Date().toISOString().split('T')[0]
    return db.workoutLogs.where('date').equals(today).toArray()
  }, [])

  useEffect(() => {
    getActiveProgramme().then(setActiveProgramme)
  }, [])

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

  return (
    <>
      <Header title="Fitness Tracker" />

      <div className="space-y-6 pt-4">
        {/* Quick Actions */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/workout">
              <Card className="flex flex-col items-center justify-center py-6 bg-blue-600 border-blue-600">
                <svg className="w-8 h-8 text-white mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="font-medium text-white">Start Workout</span>
              </Card>
            </Link>
            <Link to="/programmes">
              <Card className="flex flex-col items-center justify-center py-6 bg-green-600 border-green-600">
                <svg className="w-8 h-8 text-white mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <span className="font-medium text-white">Programmes</span>
              </Card>
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 mt-3">
            <Link to="/exercises">
              <Card className="flex items-center justify-center py-4 gap-3">
                <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="font-medium text-gray-700">Browse Exercises</span>
              </Card>
            </Link>
          </div>
        </section>

        {/* Today's Progress */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Today
          </h2>
          <Card>
            {todayWorkouts && todayWorkouts.length > 0 ? (
              <div>
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">
                    {todayWorkouts.length} workout{todayWorkouts.length > 1 ? 's' : ''} completed
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-3">No workouts logged today</p>
                <Link to="/workout">
                  <Button size="sm">Start a Workout</Button>
                </Link>
              </div>
            )}
          </Card>
        </section>

        {/* Active Programme */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Active Programme
          </h2>
          {activeProgramme ? (
            <Link to={`/programmes/${activeProgramme.id}`}>
              <Card className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{activeProgramme.name}</h3>
                  <p className="text-sm text-gray-500">
                    Week {activeProgramme.currentWeek || 1} of {activeProgramme.durationWeeks} • Tap to view
                  </p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Card>
            </Link>
          ) : (
            <Link to="/programmes">
              <Card className="text-center py-4">
                <p className="text-gray-500 mb-2">No active programme</p>
                <p className="text-sm text-blue-600 font-medium">Create a mesocycle to track progressive overload</p>
              </Card>
            </Link>
          )}
        </section>

        {/* Recent Workouts */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Recent Workouts
            </h2>
            <Link to="/history" className="text-sm text-blue-600 font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-2">
            {recentWorkouts && recentWorkouts.length > 0 ? (
              recentWorkouts.map((workout) => (
                <Link key={workout.id} to={`/history/${workout.id}`}>
                  <Card className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {workout.notes || 'Workout'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatDate(workout.date)}
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Card>
                </Link>
              ))
            ) : (
              <Card className="text-center py-8">
                <p className="text-gray-500">No workouts yet. Start your first workout!</p>
              </Card>
            )}
          </div>
        </section>
      </div>
    </>
  )
}
