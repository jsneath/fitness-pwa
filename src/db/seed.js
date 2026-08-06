import { db } from './database'
import { defaultExercises } from '../data/defaultExercises'
import { DEFAULT_VOLUME_LANDMARKS } from '../data/volumeLandmarks'

// Seeding used to read the exercise count, then write, without holding a
// transaction across the two. React StrictMode invokes App's effect twice in
// development, so both calls saw an empty table and both inserted the full
// library — leaving every exercise duplicated. Everything below now runs
// inside a single transaction, and concurrent callers share one in-flight run.
let seedInFlight = null

export async function seedDatabase() {
  if (seedInFlight) return seedInFlight
  seedInFlight = runSeed().finally(() => { seedInFlight = null })
  return seedInFlight
}

async function runSeed() {
  await db.transaction('rw', db.exercises, db.volumeLandmarks, db.settings, async () => {
    // Add any default exercises that aren't already present, matched on name.
    // Works for both a fresh database and one missing newly-added exercises.
    const existing = await db.exercises.toArray()
    const existingNames = new Set(existing.map((e) => e.name.toLowerCase()))
    const missing = defaultExercises.filter(
      (e) => !existingNames.has(e.name.toLowerCase())
    )
    if (missing.length > 0) {
      await db.exercises.bulkAdd(missing)
    }

    // Add-if-missing rather than a bulk put, so tuned landmarks aren't clobbered.
    const existingLandmarks = await db.volumeLandmarks.toArray()
    const haveLandmark = new Set(existingLandmarks.map((l) => l.muscleGroup))
    const missingLandmarks = DEFAULT_VOLUME_LANDMARKS.filter(
      (l) => !haveLandmark.has(l.muscleGroup)
    )
    if (missingLandmarks.length > 0) {
      await db.volumeLandmarks.bulkAdd(missingLandmarks)
    }

    const weightUnit = await db.settings.get('weightUnit')
    if (!weightUnit) {
      await db.settings.put({ key: 'weightUnit', value: 'kg' })
    }
  })

  await repairDuplicateExercises()
}

/**
 * Repairs libraries duplicated by the old seeding race.
 *
 * For each repeated name the lowest id wins. Anything referencing a losing id
 * is repointed at the winner before it's deleted, so logged sets, templates,
 * PRs and feedback all survive the cleanup.
 */
export async function repairDuplicateExercises() {
  return db.transaction(
    'rw',
    db.exercises,
    db.setLogs,
    db.templateExercises,
    db.personalRecords,
    db.exerciseFeedback,
    async () => {
      const exercises = await db.exercises.toArray()

      const byName = new Map()
      for (const exercise of exercises) {
        const key = exercise.name.toLowerCase()
        if (!byName.has(key)) byName.set(key, [])
        byName.get(key).push(exercise)
      }

      // losing id -> winning id
      const remap = new Map()
      for (const group of byName.values()) {
        if (group.length < 2) continue
        const sorted = [...group].sort((a, b) => a.id - b.id)
        const winner = sorted[0]
        for (const loser of sorted.slice(1)) {
          remap.set(loser.id, winner.id)
        }
      }

      if (remap.size === 0) return 0

      for (const table of [db.setLogs, db.templateExercises, db.personalRecords, db.exerciseFeedback]) {
        await table.toCollection().modify((row) => {
          const winner = remap.get(row.exerciseId)
          if (winner !== undefined) row.exerciseId = winner
        })
      }

      await db.exercises.bulkDelete([...remap.keys()])
      console.warn(`Removed ${remap.size} duplicate exercises left by an earlier seeding bug`)
      return remap.size
    }
  )
}
