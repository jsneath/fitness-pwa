import { db } from './database'
import { defaultExercises } from '../data/defaultExercises'

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

  // Set default settings if not already set
  const restTimerDuration = await db.settings.get('restTimerDuration')
  if (!restTimerDuration) {
    await db.settings.put({ key: 'restTimerDuration', value: 90 })
  }

  const weightUnit = await db.settings.get('weightUnit')
  if (!weightUnit) {
    await db.settings.put({ key: 'weightUnit', value: 'kg' })
  }

  const autoStartRestTimer = await db.settings.get('autoStartRestTimer')
  if (!autoStartRestTimer) {
    await db.settings.put({ key: 'autoStartRestTimer', value: true })
  }
}
