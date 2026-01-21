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

  // Find the most recent workout that has sets for this exercise
  for (const log of workoutLogs) {
    const sets = await db.setLogs
      .where('workoutLogId')
      .equals(log.id)
      .toArray()

    // Filter to just this exercise's working sets
    const exerciseSets = sets.filter(s => s.exerciseId === exerciseId && !s.isWarmup)

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
    weekLogs: await db.weekLogs.toArray(),
    personalRecords: await db.personalRecords.toArray(),
    bodyMetrics: await db.bodyMetrics.toArray(),
    settings: await db.settings.toArray(),
    exportDate: new Date().toISOString(),
    version: 2
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
      if (data.weekLogs) await db.weekLogs.bulkAdd(data.weekLogs)
      if (data.personalRecords) await db.personalRecords.bulkAdd(data.personalRecords)
      if (data.bodyMetrics) await db.bodyMetrics.bulkAdd(data.bodyMetrics)
      if (data.settings) await db.settings.bulkAdd(data.settings)
    }
  )
}
