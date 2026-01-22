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
      <Header showLogo />

      <div className="space-y-6 pt-6">
        {/* Quick Actions */}
        <section className="animate-fade-in">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/workout">
              <div className="stat-card gradient-primary flex flex-col items-center justify-center py-6 hover:scale-[1.02] transition-transform duration-300">
                <svg className="w-8 h-8 text-white mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
                <span className="font-semibold text-white">Start Workout</span>
              </div>
            </Link>
            <Link to="/programmes">
              <div className="stat-card gradient-success flex flex-col items-center justify-center py-6 hover:scale-[1.02] transition-transform duration-300">
                <svg className="w-8 h-8 text-white mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
                <span className="font-semibold text-white">Programmes</span>
              </div>
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 mt-3">
            <Link to="/exercises">
              <Card className="flex items-center justify-center py-4 gap-3 hover:scale-[1.01]">
                <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
                </svg>
                <span className="font-medium text-slate-700">Browse Exercises</span>
              </Card>
            </Link>
          </div>
        </section>

        {/* Today's Progress */}
        <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Today
          </h2>
          <Card>
            {todayWorkouts && todayWorkouts.length > 0 ? (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">
                    {todayWorkouts.length} workout{todayWorkouts.length > 1 ? 's' : ''} completed
                  </p>
                  <p className="text-sm text-slate-500">Great work today!</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-slate-500 mb-3">No workouts logged today</p>
                <Link to="/workout">
                  <Button size="sm">Start a Workout</Button>
                </Link>
              </div>
            )}
          </Card>
        </section>

        {/* Active Programme */}
        <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Active Programme
          </h2>
          {activeProgramme ? (
            <Link to={`/programmes/${activeProgramme.id}`}>
              <Card className="flex items-center gap-4 hover:scale-[1.01]">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800">{activeProgramme.name}</h3>
                  <p className="text-sm text-slate-500">
                    Week {activeProgramme.currentWeek || 1} of {activeProgramme.durationWeeks}
                  </p>
                </div>
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Card>
            </Link>
          ) : (
            <Link to="/programmes">
              <Card className="text-center py-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </div>
                <p className="text-slate-600 font-medium mb-1">No active programme</p>
                <p className="text-sm text-indigo-500">Create a mesocycle to track progressive overload</p>
              </Card>
            </Link>
          )}
        </section>

        {/* Recent Workouts */}
        <section className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Recent Workouts
            </h2>
            <Link to="/history" className="text-sm text-indigo-500 font-semibold hover:text-indigo-600 transition-colors">
              View All
            </Link>
          </div>
          <div className="space-y-2">
            {recentWorkouts && recentWorkouts.length > 0 ? (
              recentWorkouts.map((workout, index) => (
                <Link key={workout.id} to={`/history/${workout.id}`}>
                  <Card className="flex items-center gap-4 hover:scale-[1.01]" style={{ animationDelay: `${0.4 + index * 0.05}s` }}>
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-800">
                        {workout.notes || 'Workout'}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {formatDate(workout.date)}
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </Card>
                </Link>
              ))
            ) : (
              <Card className="text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <p className="text-slate-500">No workouts yet. Start your first workout!</p>
              </Card>
            )}
          </div>
        </section>
      </div>
    </>
  )
}
