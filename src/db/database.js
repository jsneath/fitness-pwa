import Dexie from 'dexie'

export const db = new Dexie('FitnessDB')

db.version(1).stores({
  exercises: '++id, name, *muscleGroups, equipment, isCustom',
  programmes: '++id, name, createdAt, isActive',
  workoutTemplates: '++id, programmeId, name, dayOfWeek, order',
  templateExercises: '++id, templateId, exerciseId, order, targetSets, targetReps, notes',
  workoutLogs: '++id, date, templateId, programmeId, startTime, endTime, notes',
  setLogs: '++id, workoutLogId, exerciseId, setNumber, weight, reps, rpe, isWarmup, timestamp',
  personalRecords: '++id, exerciseId, type, value, date, workoutLogId',
  bodyMetrics: '++id, date, weight, bodyFat, notes',
  settings: 'key, value'
})

// Version 2: Mesocycle support
db.version(2).stores({
  // Exercise library
  exercises: '++id, name, *muscleGroups, equipment, isCustom',

  // Programmes (mesocycles)
  programmes: '++id, name, createdAt, isActive, durationWeeks, daysPerWeek, currentWeek, startDate',

  // Workout templates (training days within a programme)
  workoutTemplates: '++id, programmeId, name, dayNumber, order',

  // Template exercises with rep ranges for progression
  templateExercises: '++id, templateId, exerciseId, order, targetSets, minReps, maxReps, notes',

  // Actual workout logs - now tracks week number
  workoutLogs: '++id, date, templateId, programmeId, weekNumber, startTime, endTime, notes',

  // Individual set logs
  setLogs: '++id, workoutLogId, exerciseId, setNumber, weight, reps, rpe, isWarmup, timestamp',

  // Week completion logs
  weekLogs: '++id, programmeId, weekNumber, completedAt',

  // Personal records
  personalRecords: '++id, exerciseId, type, value, date, workoutLogId',

  // Body metrics
  bodyMetrics: '++id, date, weight, bodyFat, notes',

  // Settings
  settings: 'key, value'
}).upgrade(tx => {
  // Migrate existing programmes to have mesocycle fields
  return tx.table('programmes').toCollection().modify(programme => {
    programme.durationWeeks = programme.durationWeeks || 6
    programme.daysPerWeek = programme.daysPerWeek || 4
    programme.currentWeek = programme.currentWeek || 1
    programme.startDate = programme.startDate || programme.createdAt
  })
})

// Version 3: RP Strength-style autoregulation with RIR and e1RM
db.version(3).stores({
  // Exercise library
  exercises: '++id, name, *muscleGroups, equipment, isCustom',

  // Programmes (mesocycles) - now with RIR targets
  programmes: '++id, name, createdAt, isActive, durationWeeks, daysPerWeek, currentWeek, startDate',

  // Workout templates (training days within a programme)
  workoutTemplates: '++id, programmeId, name, dayNumber, order',

  // Template exercises with rep ranges for progression
  templateExercises: '++id, templateId, exerciseId, order, targetSets, minReps, maxReps, notes',

  // Actual workout logs - now tracks week number
  workoutLogs: '++id, date, templateId, programmeId, weekNumber, startTime, endTime, notes',

  // Individual set logs - now with rir, e1rm, and feedback fields
  setLogs: '++id, workoutLogId, exerciseId, setNumber, weight, reps, rpe, rir, e1rm, isWarmup, timestamp, pumpRating, sorenessRating, fatigueRating',

  // Exercise-level feedback per workout
  exerciseFeedback: '++id, workoutLogId, exerciseId, pumpRating, sorenessRating, fatigueRating, notes',

  // Week completion logs
  weekLogs: '++id, programmeId, weekNumber, completedAt',

  // Personal records
  personalRecords: '++id, exerciseId, type, value, date, workoutLogId',

  // Body metrics
  bodyMetrics: '++id, date, weight, bodyFat, notes',

  // Settings
  settings: 'key, value'
}).upgrade(tx => {
  // Migrate existing set logs: convert RPE to RIR
  return tx.table('setLogs').toCollection().modify(setLog => {
    // RIR = 10 - RPE (e.g., RPE 8 = 2 RIR)
    if (setLog.rpe && !setLog.rir) {
      setLog.rir = Math.max(0, 10 - setLog.rpe)
    }
    // Calculate e1RM if weight and reps exist
    if (setLog.weight && setLog.reps && !setLog.e1rm) {
      setLog.e1rm = calculateE1RM(setLog.weight, setLog.reps)
    }
  })
})

// ============================================
// RP Strength-Style Utility Functions
// ============================================

// Calculate estimated 1RM using Epley formula
export function calculateE1RM(weight, reps) {
  if (!weight || !reps || reps <= 0) return 0
  if (reps === 1) return weight
  // Epley formula: weight × (1 + reps/30)
  return Math.round(weight * (1 + reps / 30) * 10) / 10
}

// Get default RIR target for a given week in a mesocycle
// Pattern: 3→2→1 cycle, final week is 4 (deload)
export function getDefaultRirTarget(weekNumber, totalWeeks) {
  // Last week is always deload (4 RIR)
  if (weekNumber === totalWeeks) return 4

  // Cycle through 3→2→1 pattern
  const cyclePosition = (weekNumber - 1) % 3
  return 3 - cyclePosition // Week 1: 3, Week 2: 2, Week 3: 1, Week 4: 3, etc.
}

// Calculate feedback-based weight adjustment
// Returns adjustment in kg (positive = add weight, negative = reduce)
export function calculateFeedbackAdjustment(feedback, baseIncrement = 2.5) {
  if (!feedback) return 0

  let adjustment = 0

  // Low pump (1-2): suggests not enough stimulus, add weight
  if (feedback.pumpRating && feedback.pumpRating <= 2) {
    adjustment += baseIncrement * 0.5 // Half increment
  }

  // High pump (5): good stimulus, maintain
  // (no adjustment needed)

  // High fatigue (4-5): suggests too much, reduce or hold
  if (feedback.fatigueRating && feedback.fatigueRating >= 4) {
    adjustment -= baseIncrement * 0.5
  }

  // High soreness (4-5): suggests recovery issues, reduce volume not weight
  // (this is handled in rep/set recommendations, not weight)

  return adjustment
}

// Enhanced progression suggestion using RP-style autoregulation
export async function getEnhancedProgressionSuggestion(programmeId, exerciseId, templateId, templateExercise, programme = null) {
  try {
    const lastPerformance = await getLastPerformance(programmeId, exerciseId, templateId)

  // Get programme if not provided
  if (!programme && programmeId) {
    programme = await db.programmes.get(programmeId)
  }

  // Determine current week's RIR target
  const currentWeek = programme?.currentWeek || 1
  const totalWeeks = programme?.durationWeeks || 6
  const rirTargets = programme?.rirTargets || {}
  const targetRir = rirTargets[currentWeek] ?? getDefaultRirTarget(currentWeek, totalWeeks)

  if (!lastPerformance || lastPerformance.sets.length === 0) {
    return {
      hasHistory: false,
      suggestedWeight: 0,
      suggestedReps: templateExercise.minReps || 8,
      targetRir,
      message: `First time - start light, aim for ${targetRir} RIR`
    }
  }

  const lastSets = lastPerformance.sets
  const avgWeight = lastSets.reduce((sum, s) => sum + s.weight, 0) / lastSets.length
  const avgReps = lastSets.reduce((sum, s) => sum + s.reps, 0) / lastSets.length

  // Use RIR if available, otherwise convert from RPE
  const setsWithRir = lastSets.filter(s => s.rir !== undefined && s.rir !== null)
  const setsWithRpe = lastSets.filter(s => s.rpe !== undefined && s.rpe !== null)

  let avgRir = null
  if (setsWithRir.length > 0) {
    avgRir = setsWithRir.reduce((sum, s) => sum + s.rir, 0) / setsWithRir.length
  } else if (setsWithRpe.length > 0) {
    // Convert RPE to RIR
    const avgRpe = setsWithRpe.reduce((sum, s) => sum + s.rpe, 0) / setsWithRpe.length
    avgRir = Math.max(0, 10 - avgRpe)
  }

  // Calculate average e1RM from last session
  const setsWithE1rm = lastSets.filter(s => s.e1rm)
  const avgE1rm = setsWithE1rm.length > 0
    ? setsWithE1rm.reduce((sum, s) => sum + s.e1rm, 0) / setsWithE1rm.length
    : calculateE1RM(avgWeight, avgReps)

  // Get exercise to determine weight increment
  const exercise = await getExerciseById(exerciseId)
  const isLowerBody = exercise?.muscleGroups?.some(mg =>
    ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves'].includes(mg)
  )
  const weightIncrement = isLowerBody ? 5 : 2.5

  // Get last session's feedback for adjustment
  const lastWorkoutId = lastPerformance.workoutLog.id
  let lastFeedback = null
  try {
    // Query feedback using filter since we don't have a compound index
    const feedbacks = await db.exerciseFeedback
      .where('workoutLogId')
      .equals(lastWorkoutId)
      .toArray()
    lastFeedback = feedbacks.find(f => f.exerciseId === exerciseId || f.exerciseId === Number(exerciseId)) || null
  } catch (e) {
    // Feedback is optional, continue without it
    console.warn('Could not load exercise feedback:', e)
  }

  const feedbackAdjustment = calculateFeedbackAdjustment(lastFeedback, weightIncrement)

  const minReps = templateExercise.minReps || 8
  const maxReps = templateExercise.maxReps || 12

  let suggestedWeight = avgWeight
  let suggestedReps = Math.round(avgReps)
  let message = ''

  // RP-Style Progression Logic
  if (avgRir !== null) {
    const rirDiff = avgRir - targetRir // Positive = too easy, Negative = too hard

    if (avgReps >= maxReps && avgRir <= targetRir) {
      // Hit max reps at or below target RIR - increase weight
      let increase = weightIncrement
      // Cap increase at 10% of current weight
      const maxIncrease = avgWeight * 0.1
      if (increase > maxIncrease && avgWeight > 0) {
        // Suggest adding reps instead
        suggestedWeight = avgWeight
        suggestedReps = Math.min(avgReps + 1, maxReps + 2) // Allow slight overshoot
        message = `Great progress! Weight jump would be >10%, so add a rep: ${suggestedReps} reps at ${avgWeight}kg`
      } else {
        suggestedWeight = Math.round((avgWeight + increase + feedbackAdjustment) * 10) / 10
        suggestedReps = minReps
        message = `Increase weight to ${suggestedWeight}kg, aim for ${minReps}-${maxReps} reps @ ${targetRir} RIR`
      }
    } else if (avgRir > targetRir + 1) {
      // Too easy (RIR too high) - small weight bump
      suggestedWeight = Math.round((avgWeight + weightIncrement * 0.5 + feedbackAdjustment) * 10) / 10
      suggestedReps = Math.round(avgReps)
      message = `Too easy (${Math.round(avgRir)} RIR). Add weight: ${suggestedWeight}kg @ ${targetRir} RIR`
    } else if (avgRir < targetRir - 1 && lastFeedback?.fatigueRating >= 4) {
      // Too hard + high fatigue - hold or reduce
      suggestedWeight = Math.round((avgWeight + feedbackAdjustment) * 10) / 10
      suggestedReps = Math.max(minReps, Math.round(avgReps) - 1)
      message = `High fatigue detected. Maintain ${suggestedWeight}kg, aim for ${targetRir} RIR`
    } else if (avgReps < minReps) {
      // Didn't hit minimum reps
      suggestedWeight = avgWeight
      suggestedReps = minReps
      message = `Missed target reps. Stay at ${avgWeight}kg, focus on ${minReps}+ reps @ ${targetRir} RIR`
    } else {
      // On track - add 1 rep
      suggestedWeight = avgWeight
      suggestedReps = Math.min(Math.round(avgReps) + 1, maxReps)
      message = `On track! Aim for ${suggestedReps} reps at ${avgWeight}kg @ ${targetRir} RIR`
    }
  } else {
    // No RIR data - fall back to simple progression
    if (avgReps >= maxReps) {
      suggestedWeight = avgWeight + weightIncrement
      suggestedReps = minReps
      message = `Increase weight to ${suggestedWeight}kg, aim for ${minReps}-${maxReps} reps @ ${targetRir} RIR`
    } else {
      suggestedWeight = avgWeight
      suggestedReps = Math.min(Math.round(avgReps) + 1, maxReps)
      message = `Add a rep: ${suggestedReps} reps at ${avgWeight}kg @ ${targetRir} RIR`
    }
  }

  return {
    hasHistory: true,
    lastWeight: avgWeight,
    lastReps: Math.round(avgReps),
    lastRir: avgRir !== null ? Math.round(avgRir * 10) / 10 : null,
    lastE1rm: Math.round(avgE1rm * 10) / 10,
    suggestedWeight: Math.round(suggestedWeight * 10) / 10,
    suggestedReps,
    targetRir,
    message,
    weekNumber: lastPerformance.workoutLog.weekNumber,
    feedbackAdjustment: Math.round(feedbackAdjustment * 10) / 10
  }
  } catch (error) {
    console.error('Error getting enhanced progression suggestion:', error)
    // Fall back to basic suggestion
    const currentWeek = programme?.currentWeek || 1
    const totalWeeks = programme?.durationWeeks || 6
    const rirTargets = programme?.rirTargets || {}
    const targetRir = rirTargets[currentWeek] ?? getDefaultRirTarget(currentWeek, totalWeeks)

    return {
      hasHistory: false,
      suggestedWeight: 0,
      suggestedReps: templateExercise.minReps || 8,
      targetRir,
      message: `Start light, aim for ${targetRir} RIR`
    }
  }
}

// Helper functions
export async function getExerciseById(id) {
  return db.exercises.get(id)
}

export async function getAllExercises() {
  return db.exercises.toArray()
}

export async function searchExercises(query) {
  const lowerQuery = query.toLowerCase()
  return db.exercises
    .filter(ex => ex.name.toLowerCase().includes(lowerQuery))
    .toArray()
}

export async function getExercisesByMuscleGroup(muscleGroup) {
  return db.exercises
    .where('muscleGroups')
    .equals(muscleGroup)
    .toArray()
}

export async function addWorkoutLog(log) {
  return db.workoutLogs.add(log)
}

export async function getWorkoutLogs(limit = 50) {
  return db.workoutLogs
    .orderBy('date')
    .reverse()
    .limit(limit)
    .toArray()
}

export async function getSetLogsForWorkout(workoutLogId) {
  return db.setLogs
    .where('workoutLogId')
    .equals(workoutLogId)
    .toArray()
}

export async function addSetLog(setLog) {
  return db.setLogs.add(setLog)
}

export async function updateSetLog(id, changes) {
  return db.setLogs.update(id, changes)
}

export async function deleteSetLog(id) {
  return db.setLogs.delete(id)
}

export async function getLastSetsForExercise(exerciseId, limit = 10) {
  return db.setLogs
    .where('exerciseId')
    .equals(exerciseId)
    .reverse()
    .limit(limit)
    .toArray()
}

export async function getProgrammes() {
  return db.programmes.toArray()
}

export async function getActiveProgramme() {
  return db.programmes.where('isActive').equals(1).first()
}

export async function getWorkoutTemplates(programmeId) {
  return db.workoutTemplates
    .where('programmeId')
    .equals(programmeId)
    .sortBy('order')
}

export async function getTemplateExercises(templateId) {
  return db.templateExercises
    .where('templateId')
    .equals(templateId)
    .sortBy('order')
}

export async function getSetting(key) {
  const setting = await db.settings.get(key)
  return setting?.value
}

export async function setSetting(key, value) {
  return db.settings.put({ key, value })
}

export async function getPersonalRecords(exerciseId) {
  return db.personalRecords
    .where('exerciseId')
    .equals(exerciseId)
    .toArray()
}

export async function addPersonalRecord(record) {
  return db.personalRecords.add(record)
}

export async function getBodyMetrics(limit = 100) {
  return db.bodyMetrics
    .orderBy('date')
    .reverse()
    .limit(limit)
    .toArray()
}

export async function addBodyMetric(metric) {
  return db.bodyMetrics.add(metric)
}

export async function addExerciseFeedback(feedback) {
  return db.exerciseFeedback.add(feedback)
}

export async function getExerciseFeedback(workoutLogId, exerciseId) {
  const feedbacks = await db.exerciseFeedback
    .where('workoutLogId')
    .equals(workoutLogId)
    .toArray()
  return feedbacks.find(f => f.exerciseId === exerciseId || f.exerciseId === Number(exerciseId)) || null
}

// ============================================
// Mesocycle / Programme Functions
// ============================================

export async function createProgramme(programme) {
  return db.programmes.add({
    ...programme,
    createdAt: new Date().toISOString(),
    isActive: 0,
    currentWeek: 1,
    startDate: null
  })
}

export async function startProgramme(programmeId) {
  // Deactivate all other programmes
  await db.programmes.toCollection().modify({ isActive: 0 })
  // Activate and start this programme
  await db.programmes.update(programmeId, {
    isActive: 1,
    currentWeek: 1,
    startDate: new Date().toISOString()
  })
}

export async function advanceWeek(programmeId) {
  const programme = await db.programmes.get(programmeId)
  if (programme && programme.currentWeek < programme.durationWeeks) {
    await db.programmes.update(programmeId, {
      currentWeek: programme.currentWeek + 1
    })
    // Log the completed week
    await db.weekLogs.add({
      programmeId,
      weekNumber: programme.currentWeek,
      completedAt: new Date().toISOString()
    })
  }
  return db.programmes.get(programmeId)
}

export async function endProgrammeEarly(programmeId) {
  const programme = await db.programmes.get(programmeId)
  if (programme) {
    await db.programmes.update(programmeId, {
      isActive: 0,
      endedEarly: true,
      endDate: new Date().toISOString()
    })
  }
  return db.programmes.get(programmeId)
}

export async function getWeekLogs(programmeId) {
  return db.weekLogs
    .where('programmeId')
    .equals(programmeId)
    .toArray()
}

export async function getWorkoutsForWeek(programmeId, weekNumber) {
  return db.workoutLogs
    .where(['programmeId', 'weekNumber'])
    .equals([programmeId, weekNumber])
    .toArray()
}

// Get workout log for a specific template in a specific week
export async function getWorkoutForTemplateWeek(templateId, weekNumber) {
  // Get all workout logs for this template and filter by week
  const logs = await db.workoutLogs
    .where('templateId')
    .equals(templateId)
    .toArray()

  return logs.find(log => log.weekNumber === weekNumber) || null
}

// Get workout log with all sets for a template in a week
export async function getCompletedWorkoutForWeek(templateId, weekNumber) {
  // Direct query for better live query support
  const allLogs = await db.workoutLogs
    .where('templateId')
    .equals(templateId)
    .toArray()

  const workoutLog = allLogs.find(log => log.weekNumber === weekNumber)

  if (!workoutLog) return null

  const setLogs = await db.setLogs
    .where('workoutLogId')
    .equals(workoutLog.id)
    .toArray()

  // Sort and group sets by exercise
  setLogs.sort((a, b) => a.setNumber - b.setNumber)

  const setsByExercise = {}
  for (const set of setLogs) {
    if (!setsByExercise[set.exerciseId]) {
      setsByExercise[set.exerciseId] = []
    }
    setsByExercise[set.exerciseId].push(set)
  }

  return {
    workoutLog,
    setsByExercise
  }
}

// ============================================
// Progressive Overload Functions
// ============================================

// Get the last performance for an exercise in a specific programme
export async function getLastPerformance(programmeId, exerciseId, templateId) {
  // Find all workout logs for this template
  const workoutLogs = await db.workoutLogs
    .where('templateId')
    .equals(templateId)
    .toArray()

  // Sort by ID descending (most recent first) to ensure correct order
  workoutLogs.sort((a, b) => b.id - a.id)

  // Normalize exerciseId for comparison (handle string vs number)
  const targetExerciseId = Number(exerciseId)

  // Find the most recent workout that has sets for this exercise
  for (const log of workoutLogs) {
    const sets = await db.setLogs
      .where('workoutLogId')
      .equals(log.id)
      .toArray()

    // Filter to just this exercise's working sets (handle type coercion)
    const exerciseSets = sets.filter(s =>
      (s.exerciseId === exerciseId || Number(s.exerciseId) === targetExerciseId) && !s.isWarmup
    )

    if (exerciseSets.length > 0) {
      return {
        workoutLog: log,
        sets: exerciseSets.sort((a, b) => a.setNumber - b.setNumber)
      }
    }
  }
  return null
}

// Calculate progressive overload suggestion
export async function getProgressionSuggestion(programmeId, exerciseId, templateId, templateExercise) {
  const lastPerformance = await getLastPerformance(programmeId, exerciseId, templateId)

  if (!lastPerformance || lastPerformance.sets.length === 0) {
    // No previous data - return defaults
    return {
      hasHistory: false,
      suggestedWeight: 0,
      suggestedReps: templateExercise.minReps || 8,
      message: 'First time - start light and find your working weight'
    }
  }

  const lastSets = lastPerformance.sets
  const avgWeight = lastSets.reduce((sum, s) => sum + s.weight, 0) / lastSets.length
  const avgReps = lastSets.reduce((sum, s) => sum + s.reps, 0) / lastSets.length
  const avgRpe = lastSets.filter(s => s.rpe).reduce((sum, s) => sum + s.rpe, 0) / lastSets.filter(s => s.rpe).length || 8

  const minReps = templateExercise.minReps || 8
  const maxReps = templateExercise.maxReps || 12

  // Get exercise to determine weight increment
  const exercise = await getExerciseById(exerciseId)
  const isLowerBody = exercise?.muscleGroups?.some(mg =>
    ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves'].includes(mg)
  )
  const weightIncrement = isLowerBody ? 5 : 2.5

  let suggestedWeight = avgWeight
  let suggestedReps = Math.round(avgReps)
  let message = ''

  // Progressive overload logic (RP Strength style)
  if (avgReps >= maxReps && avgRpe <= 8) {
    // Hit top of rep range with manageable RPE - increase weight
    suggestedWeight = avgWeight + weightIncrement
    suggestedReps = minReps
    message = `Great progress! Increase weight to ${suggestedWeight}kg, aim for ${minReps}-${maxReps} reps`
  } else if (avgReps >= maxReps && avgRpe > 8) {
    // Hit top of rep range but RPE was high - same weight, consolidate
    suggestedWeight = avgWeight
    suggestedReps = maxReps
    message = `RPE was high last time. Stay at ${avgWeight}kg, aim for ${maxReps} reps with better form`
  } else if (avgReps < minReps) {
    // Didn't hit minimum reps - might need to reduce or stay same
    suggestedWeight = avgWeight
    suggestedReps = minReps
    message = `Missed target reps. Stay at ${avgWeight}kg, focus on hitting ${minReps}+ reps`
  } else {
    // In the middle of rep range - add 1 rep
    suggestedWeight = avgWeight
    suggestedReps = Math.min(Math.round(avgReps) + 1, maxReps)
    message = `Add a rep! Aim for ${suggestedReps} reps at ${avgWeight}kg`
  }

  return {
    hasHistory: true,
    lastWeight: avgWeight,
    lastReps: Math.round(avgReps),
    lastRpe: avgRpe ? Math.round(avgRpe * 10) / 10 : null,
    suggestedWeight: Math.round(suggestedWeight * 10) / 10,
    suggestedReps,
    message,
    weekNumber: lastPerformance.workoutLog.weekNumber
  }
}

// Export all data for backup
export async function exportAllData() {
  const data = {
    exercises: await db.exercises.toArray(),
    programmes: await db.programmes.toArray(),
    workoutTemplates: await db.workoutTemplates.toArray(),
    templateExercises: await db.templateExercises.toArray(),
    workoutLogs: await db.workoutLogs.toArray(),
    setLogs: await db.setLogs.toArray(),
    exerciseFeedback: await db.exerciseFeedback.toArray(),
    weekLogs: await db.weekLogs.toArray(),
    personalRecords: await db.personalRecords.toArray(),
    bodyMetrics: await db.bodyMetrics.toArray(),
    settings: await db.settings.toArray(),
    exportDate: new Date().toISOString(),
    version: 3
  }
  return data
}

// Import data from backup
export async function importAllData(data) {
  await db.transaction('rw',
    db.exercises,
    db.programmes,
    db.workoutTemplates,
    db.templateExercises,
    db.workoutLogs,
    db.setLogs,
    db.exerciseFeedback,
    db.weekLogs,
    db.personalRecords,
    db.bodyMetrics,
    db.settings,
    async () => {
      // Clear existing data
      await db.exercises.clear()
      await db.programmes.clear()
      await db.workoutTemplates.clear()
      await db.templateExercises.clear()
      await db.workoutLogs.clear()
      await db.setLogs.clear()
      await db.exerciseFeedback.clear()
      await db.weekLogs.clear()
      await db.personalRecords.clear()
      await db.bodyMetrics.clear()
      await db.settings.clear()

      // Import new data
      if (data.exercises) await db.exercises.bulkAdd(data.exercises)
      if (data.programmes) await db.programmes.bulkAdd(data.programmes)
      if (data.workoutTemplates) await db.workoutTemplates.bulkAdd(data.workoutTemplates)
      if (data.templateExercises) await db.templateExercises.bulkAdd(data.templateExercises)
      if (data.workoutLogs) await db.workoutLogs.bulkAdd(data.workoutLogs)
      if (data.setLogs) await db.setLogs.bulkAdd(data.setLogs)
      if (data.exerciseFeedback) await db.exerciseFeedback.bulkAdd(data.exerciseFeedback)
      if (data.weekLogs) await db.weekLogs.bulkAdd(data.weekLogs)
      if (data.personalRecords) await db.personalRecords.bulkAdd(data.personalRecords)
      if (data.bodyMetrics) await db.bodyMetrics.bulkAdd(data.bodyMetrics)
      if (data.settings) await db.settings.bulkAdd(data.settings)
    }
  )
}
