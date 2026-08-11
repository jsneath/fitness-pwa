import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { saveWorkout } from '../db/database'
import { toDateKey } from '../utils/dates'

const WorkoutContext = createContext(null)

const STORAGE_KEY = 'activeWorkoutState'

// Helper to save workout state to localStorage
const saveWorkoutState = (activeWorkout, exercises) => {
  if (activeWorkout) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ activeWorkout, exercises }))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

// Helper to load workout state from localStorage
const loadWorkoutState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.error('Failed to load workout state:', e)
    localStorage.removeItem(STORAGE_KEY)
  }
  return null
}

export function WorkoutProvider({ children }) {
  // Initialize state from localStorage if available
  const savedState = loadWorkoutState()
  const [activeWorkout, setActiveWorkout] = useState(savedState?.activeWorkout || null)
  const [exercises, setExercises] = useState(savedState?.exercises || [])

  // Auto-save workout state whenever it changes
  useEffect(() => {
    saveWorkoutState(activeWorkout, exercises)
  }, [activeWorkout, exercises])

  const startWorkout = useCallback((templateId = null, programmeId = null, weekNumber = null, initialExercises = []) => {
    const now = new Date()
    setActiveWorkout({
      templateId,
      programmeId,
      weekNumber,
      // Local calendar day — toISOString() here filed late-night sessions
      // under the previous day whenever the clocks were ahead of UTC.
      date: toDateKey(now),
      startTime: now.toISOString(),
      notes: ''
    })
    // Set initial exercises with empty sets array
    setExercises(initialExercises.map(ex => ({ ...ex, sets: [] })))
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

  const finishWorkout = useCallback(async (notes = '') => {
    if (!activeWorkout) return null

    const workoutLog = {
      ...activeWorkout,
      endTime: new Date().toISOString(),
      notes
    }

    const { workoutLogId, newRecords } = await saveWorkout(workoutLog, exercises)

    setActiveWorkout(null)
    setExercises([])
    return { workoutLogId, newRecords }
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
        startWorkout,
        addExerciseToWorkout,
        removeExerciseFromWorkout,
        addSet,
        updateSet,
        deleteSet,
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
