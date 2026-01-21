import { db } from './database'
import { defaultExercises } from '../data/defaultExercises'

export async function seedDatabase() {
  const exerciseCount = await db.exercises.count()

  if (exerciseCount === 0) {
    console.log('Seeding database with default exercises...')
    await db.exercises.bulkAdd(defaultExercises)
    console.log(`Added ${defaultExercises.length} default exercises`)
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
