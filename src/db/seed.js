import { db } from './database'
import { defaultExercises } from '../data/defaultExercises'
import { DEFAULT_VOLUME_LANDMARKS } from '../data/volumeLandmarks'

export async function seedDatabase() {
  const exerciseCount = await db.exercises.count()

  if (exerciseCount === 0) {
    // Fresh database - add all exercises
    console.log('Seeding database with default exercises...')
    await db.exercises.bulkAdd(defaultExercises)
    console.log(`Added ${defaultExercises.length} default exercises`)
  } else {
    // Existing database - add any new exercises that don't exist yet
    const existingExercises = await db.exercises.toArray()
    const existingNames = new Set(existingExercises.map(e => e.name.toLowerCase()))

    const newExercises = defaultExercises.filter(e => !existingNames.has(e.name.toLowerCase()))

    if (newExercises.length > 0) {
      console.log(`Adding ${newExercises.length} new exercises to existing database...`)
      await db.exercises.bulkAdd(newExercises)
      console.log(`Added ${newExercises.length} new exercises`)
    }
  }

  // Seed any volume landmarks the user doesn't have yet. Uses add-if-missing
  // rather than a bulk put so we never overwrite values they've tuned.
  const existingLandmarks = await db.volumeLandmarks.toArray()
  const haveLandmark = new Set(existingLandmarks.map((l) => l.muscleGroup))
  const missingLandmarks = DEFAULT_VOLUME_LANDMARKS.filter(
    (l) => !haveLandmark.has(l.muscleGroup)
  )
  if (missingLandmarks.length > 0) {
    await db.volumeLandmarks.bulkAdd(missingLandmarks)
  }

  // Set default settings if not already set
  const weightUnit = await db.settings.get('weightUnit')
  if (!weightUnit) {
    await db.settings.put({ key: 'weightUnit', value: 'kg' })
  }
}
