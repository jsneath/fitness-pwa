import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { db, addWorkoutLog, addSetLog, getSetting, addExerciseFeedback } from '../db/database'

const WorkoutContext = createContext(null)

export function WorkoutProvider({ children }) {
  const [activeWorkout, setActiveWorkout] = useState(null)
  const [exercises, setExercises] = useState([])
  const [restTimer, setRestTimer] = useState({
    isRunning: false,
    duration: 90,
    remaining: 0
  })
  const [autoStartTimer, setAutoStartTimer] = useState(true)

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      const duration = await getSetting('restTimerDuration')
      const autoStart = await getSetting('autoStartRestTimer')
      if (duration) setRestTimer((prev) => ({ ...prev, duration }))
      if (autoStart !== undefined) setAutoStartTimer(autoStart)
    }
    loadSettings()
  }, [])

  const startWorkout = useCallback((templateId = null, programmeId = null, weekNumber = null) => {
    const now = new Date()
    setActiveWorkout({
      templateId,
      programmeId,
      weekNumber,
      date: now.toISOString().split('T')[0],
      startTime: now.toISOString(),
      notes: ''
    })
    setExercises([])
  }, [])

  const addExerciseToWorkout = useCallback((exercise) => {
    setExercises((prev) => [
      ...prev,
      {
        ...exercise,
        sets: []
      }
    ])
  }, [])

  const removeExerciseFromWorkout = useCallback((exerciseIndex) => {
    setExercises((prev) => prev.filter((_, index) => index !== exerciseIndex))
  }, [])

  const addSet = useCallback((exerciseIndex, setData) => {
    setExercises((prev) => {
      const updated = [...prev]
      updated[exerciseIndex] = {
        ...updated[exerciseIndex],
        sets: [...updated[exerciseIndex].sets, { ...setData, timestamp: new Date().toISOString() }]
      }
      return updated
    })
  }, [])

  const updateSet = useCallback((exerciseIndex, setIndex, setData) => {
    setExercises((prev) => {
      const updated = [...prev]
      updated[exerciseIndex].sets[setIndex] = {
        ...updated[exerciseIndex].sets[setIndex],
        ...setData
      }
      return updated
    })
  }, [])

  const deleteSet = useCallback((exerciseIndex, setIndex) => {
    setExercises((prev) => {
      const updated = [...prev]
      updated[exerciseIndex].sets = updated[exerciseIndex].sets.filter(
        (_, index) => index !== setIndex
      )
      return updated
    })
  }, [])

  const startRestTimer = useCallback((customDuration = null) => {
    const duration = customDuration || restTimer.duration
    setRestTimer({
      isRunning: true,
      duration: restTimer.duration,
      remaining: duration
    })
  }, [restTimer.duration])

  const stopRestTimer = useCallback(() => {
    setRestTimer((prev) => ({ ...prev, isRunning: false, remaining: 0 }))
  }, [])

  const adjustRestTimer = useCallback((seconds) => {
    setRestTimer((prev) => ({
      ...prev,
      remaining: Math.max(0, prev.remaining + seconds)
    }))
  }, [])

  // Rest timer countdown
  useEffect(() => {
    if (!restTimer.isRunning || restTimer.remaining <= 0) return

    const interval = setInterval(() => {
      setRestTimer((prev) => {
        if (prev.remaining <= 1) {
          // Timer complete - vibrate if supported
          if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200])
          }
          return { ...prev, isRunning: false, remaining: 0 }
        }
        return { ...prev, remaining: prev.remaining - 1 }
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [restTimer.isRunning, restTimer.remaining])

  const finishWorkout = useCallback(async (notes = '') => {
    if (!activeWorkout) return null

    const workoutLog = {
      ...activeWorkout,
      endTime: new Date().toISOString(),
      notes
    }

    const workoutLogId = await addWorkoutLog(workoutLog)

    // Save all sets and collect feedback for each exercise
    for (const exercise of exercises) {
      let exercisePumpRating = null
      let exerciseSorenessRating = null
      let exerciseFatigueRating = null

      for (let i = 0; i < exercise.sets.length; i++) {
        const set = exercise.sets[i]
        await addSetLog({
          workoutLogId,
          exerciseId: exercise.id,
          setNumber: i + 1,
          weight: set.weight,
          reps: set.reps,
          rpe: set.rpe || null,
          rir: set.rir !== undefined ? set.rir : null,
          e1rm: set.e1rm || null,
          isWarmup: set.isWarmup || false,
          timestamp: set.timestamp,
          pumpRating: set.pumpRating || null,
          sorenessRating: set.sorenessRating || null,
          fatigueRating: set.fatigueRating || null
        })

        // Collect feedback from sets (use the last non-null value for exercise-level feedback)
        if (set.pumpRating) exercisePumpRating = set.pumpRating
        if (set.sorenessRating) exerciseSorenessRating = set.sorenessRating
        if (set.fatigueRating) exerciseFatigueRating = set.fatigueRating
      }

      // Save exercise-level feedback if any was provided
      if (exercisePumpRating || exerciseSorenessRating || exerciseFatigueRating) {
        await addExerciseFeedback({
          workoutLogId,
          exerciseId: exercise.id,
          pumpRating: exercisePumpRating,
          sorenessRating: exerciseSorenessRating,
          fatigueRating: exerciseFatigueRating
        })
      }
    }

    setActiveWorkout(null)
    setExercises([])
    return workoutLogId
  }, [activeWorkout, exercises])

  const cancelWorkout = useCallback(() => {
    setActiveWorkout(null)
    setExercises([])
  }, [])

  return (
    <WorkoutContext.Provider
      value={{
        activeWorkout,
        exercises,
        restTimer,
        startWorkout,
        addExerciseToWorkout,
        removeExerciseFromWorkout,
        addSet,
        updateSet,
        deleteSet,
        startRestTimer,
        stopRestTimer,
        adjustRestTimer,
        finishWorkout,
        cancelWorkout
      }}
    >
      {children}
    </WorkoutContext.Provider>
  )
}

export function useWorkout() {
  const context = useContext(WorkoutContext)
  if (!context) {
    throw new Error('useWorkout must be used within a WorkoutProvider')
  }
  return context
}
