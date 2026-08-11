// Weekly volume tracking and RP-style set progression.
//
// The unit of account here is the "hard set per muscle per week", weighted by
// how much each exercise actually contributes to each muscle (see
// data/muscleVolume.js). Load and rep progression live in database.js; this
// module is only concerned with how many sets to do.

import { db } from './database'
import { tallyMuscleVolume, getMuscleVolume } from '../data/muscleVolume'
import {
  DEFAULT_VOLUME_LANDMARKS,
  getVolumeStatus,
  VOLUME_STATUS,
} from '../data/volumeLandmarks'
import { getSetProgression } from '../data/setProgression'
import { todayKey, shiftDateKey } from '../utils/dates'

export { getSetProgression }

// ============================================
// Landmarks
// ============================================

export async function getVolumeLandmarks() {
  const rows = await db.volumeLandmarks.toArray()
  return rows.length > 0 ? rows : DEFAULT_VOLUME_LANDMARKS
}

export async function getVolumeLandmarksMap() {
  const rows = await getVolumeLandmarks()
  return Object.fromEntries(rows.map((r) => [r.muscleGroup, r]))
}

export async function updateVolumeLandmark(muscleGroup, changes) {
  return db.volumeLandmarks.update(muscleGroup, changes)
}

export async function resetVolumeLandmarks() {
  await db.volumeLandmarks.clear()
  await db.volumeLandmarks.bulkAdd(DEFAULT_VOLUME_LANDMARKS)
}

// ============================================
// Counting sets
// ============================================

// Shared tail of the volume queries: given workout logs, weight their working
// sets across muscle groups.
async function tallyForWorkoutLogs(workoutLogs) {
  if (!workoutLogs || workoutLogs.length === 0) return {}

  const setLogs = await db.setLogs
    .where('workoutLogId')
    .anyOf(workoutLogs.map((l) => l.id))
    .toArray()

  const workingSets = setLogs.filter((s) => !s.isWarmup)
  if (workingSets.length === 0) return {}

  const exercises = await db.exercises.toArray()
  const byId = new Map(exercises.map((e) => [e.id, e]))

  return tallyMuscleVolume(workingSets, byId)
}

/** Weighted sets per muscle for one week of a programme. */
export async function getWeeklySetVolume(programmeId, weekNumber) {
  if (!programmeId) return {}
  const logs = await db.workoutLogs.where('programmeId').equals(programmeId).toArray()
  return tallyForWorkoutLogs(logs.filter((l) => l.weekNumber === weekNumber))
}

/** Weighted sets per muscle over the last N days — for users not on a programme. */
export async function getRecentSetVolume(days = 7) {
  // Local calendar day, not UTC: the rolling window has to line up with the
  // days workouts are actually filed under.
  const cutoffDate = shiftDateKey(todayKey(), -(days - 1))

  const logs = await db.workoutLogs.where('date').aboveOrEqual(cutoffDate).toArray()
  return tallyForWorkoutLogs(logs)
}

/**
 * Full per-muscle picture: sets done, landmarks, and where that sits.
 * Falls back to a rolling 7-day window when no programme is active.
 */
export async function getVolumeBreakdown({ programmeId = null, weekNumber = null, days = 7 } = {}) {
  const volume = programmeId && weekNumber
    ? await getWeeklySetVolume(programmeId, weekNumber)
    : await getRecentSetVolume(days)

  const landmarks = await getVolumeLandmarks()

  return landmarks
    .map((landmark) => {
      const sets = volume[landmark.muscleGroup] || 0
      return {
        ...landmark,
        sets,
        status: getVolumeStatus(sets, landmark),
      }
    })
    .sort((a, b) => b.sets - a.sets)
}

// ============================================
// Set progression
// ============================================

// Per-muscle feedback, aggregated from the per-exercise ratings logged during a
// week. An exercise's ratings count toward a muscle in proportion to how much
// that exercise trains it, so an isolation movement speaks louder about its
// target muscle than a compound does about its secondary movers.
export async function getMuscleFeedback(programmeId, weekNumber) {
  const logs = await db.workoutLogs.where('programmeId').equals(programmeId).toArray()
  const weekLogs = logs.filter((l) => l.weekNumber === weekNumber)
  if (weekLogs.length === 0) return {}

  const feedback = await db.exerciseFeedback
    .where('workoutLogId')
    .anyOf(weekLogs.map((l) => l.id))
    .toArray()
  if (feedback.length === 0) return {}

  const exercises = await db.exercises.toArray()
  const byId = new Map(exercises.map((e) => [e.id, e]))

  // { muscle: { pump: {sum, weight}, ... } }
  const acc = {}

  for (const entry of feedback) {
    const exercise = byId.get(entry.exerciseId)
    if (!exercise) continue

    for (const [muscle, fraction] of Object.entries(getMuscleVolume(exercise))) {
      acc[muscle] = acc[muscle] || {}
      for (const metric of ['pumpRating', 'sorenessRating', 'fatigueRating']) {
        const value = entry[metric]
        if (value == null) continue
        acc[muscle][metric] = acc[muscle][metric] || { sum: 0, weight: 0 }
        acc[muscle][metric].sum += value * fraction
        acc[muscle][metric].weight += fraction
      }
    }
  }

  const result = {}
  for (const [muscle, metrics] of Object.entries(acc)) {
    const averaged = {}
    for (const [metric, { sum, weight }] of Object.entries(metrics)) {
      if (weight > 0) averaged[metric] = sum / weight
    }
    if (Object.keys(averaged).length > 0) result[muscle] = averaged
  }

  return result
}

/**
 * Set recommendations for every muscle you trained in a given week.
 * This is what gets shown when advancing to the next week.
 */
export async function getWeeklySetRecommendations(programmeId, weekNumber) {
  const [volume, feedback, landmarkMap] = await Promise.all([
    getWeeklySetVolume(programmeId, weekNumber),
    getMuscleFeedback(programmeId, weekNumber),
    getVolumeLandmarksMap(),
  ])

  return Object.entries(volume)
    .filter(([, sets]) => sets > 0)
    .map(([muscleGroup, sets]) => {
      const landmarks = landmarkMap[muscleGroup]
      const progression = getSetProgression(feedback[muscleGroup], sets, landmarks)
      return {
        muscleGroup,
        currentSets: sets,
        nextSets: Math.max(0, sets + progression.delta),
        landmarks,
        status: getVolumeStatus(sets, landmarks),
        ...progression,
      }
    })
    .sort((a, b) => b.currentSets - a.currentSets)
}

/** True when enough muscles are past MRV that the whole week should be a deload. */
export function shouldDeload(recommendations) {
  if (!recommendations || recommendations.length === 0) return false
  const overreached = recommendations.filter(
    (r) => r.deload || r.status === VOLUME_STATUS.OVER_MRV
  )
  return overreached.length >= Math.ceil(recommendations.length / 3)
}
