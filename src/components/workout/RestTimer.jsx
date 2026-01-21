import { useWorkout } from '../../context/WorkoutContext'

export default function RestTimer() {
  const { restTimer, stopRestTimer, adjustRestTimer, startRestTimer } = useWorkout()

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!restTimer.isRunning && restTimer.remaining === 0) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-40">
        <button
          onClick={() => startRestTimer()}
          className="w-full bg-gray-800 text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Start Rest Timer ({formatTime(restTimer.duration)})
        </button>
      </div>
    )
  }

  const progress = (restTimer.remaining / restTimer.duration) * 100

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40">
      <div className="bg-gray-800 text-white rounded-xl py-4 px-4 shadow-lg">
        {/* Progress bar */}
        <div className="h-1 bg-gray-600 rounded-full mb-3 overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          {/* Minus button */}
          <button
            onClick={() => adjustRestTimer(-30)}
            className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center active:bg-gray-600"
          >
            <span className="text-lg font-bold">-30</span>
          </button>

          {/* Timer display */}
          <div className="text-center">
            <div className="text-4xl font-bold tabular-nums">
              {formatTime(restTimer.remaining)}
            </div>
            <div className="text-sm text-gray-400">Rest Time</div>
          </div>

          {/* Plus button */}
          <button
            onClick={() => adjustRestTimer(30)}
            className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center active:bg-gray-600"
          >
            <span className="text-lg font-bold">+30</span>
          </button>
        </div>

        {/* Skip button */}
        <button
          onClick={stopRestTimer}
          className="w-full mt-3 py-2 text-gray-400 text-sm font-medium"
        >
          Skip Rest
        </button>
      </div>
    </div>
  )
}
