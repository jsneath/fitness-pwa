// Bridges the pure mesocycle generator to the database: loads the inputs it
// needs, and writes the resulting plan out as a real programme.

import { db, getDefaultRirTarget } from './database'
import { getVolumeLandmarks } from './volume'
import { generateMesocycle, suggestProgrammeName } from '../data/programmeGenerator'

export { suggestProgrammeName }

/**
 * Build a mesocycle plan from the user's exercise library and landmarks.
 * Returns the plan without saving anything, so it can be previewed first.
 */
export async function buildMesocyclePlan(options) {
  const [exercises, landmarks] = await Promise.all([
    db.exercises.toArray(),
    getVolumeLandmarks(),
  ])
  return generateMesocycle(options, { exercises, landmarks })
}

/**
 * Persist a generated plan as a programme with its training days and exercises.
 * One transaction, so a failure can't leave a programme with half its days.
 */
export async function createGeneratedProgramme(name, plan) {
  const rirTargets = {}
  for (let week = 1; week <= plan.durationWeeks; week++) {
    rirTargets[week] = getDefaultRirTarget(week, plan.durationWeeks)
  }

  return db.transaction(
    'rw',
    db.programmes,
    db.workoutTemplates,
    db.templateExercises,
    async () => {
      const programmeId = await db.programmes.add({
        name,
        durationWeeks: plan.durationWeeks,
        daysPerWeek: plan.daysPerWeek,
        rirTargets,
        createdAt: new Date().toISOString(),
        isActive: 0,
        currentWeek: 1,
        startDate: null,
        // Kept so the Volume tab and future mesocycles know what this was for
        generatedFrom: {
          emphasis: plan.emphasis,
          experience: plan.experience,
          weeklyVolume: plan.weeklyVolume,
        },
      })

      for (const day of plan.days) {
        const templateId = await db.workoutTemplates.add({
          programmeId,
          name: day.name,
          dayNumber: day.dayNumber,
          order: day.dayNumber - 1,
        })

        for (const exercise of day.exercises) {
          // Only the persisted shape — exerciseName/muscleGroup/isCompound are
          // preview conveniences and would go stale in the database.
          await db.templateExercises.add({
            templateId,
            exerciseId: exercise.exerciseId,
            order: exercise.order,
            targetSets: exercise.targetSets,
            minReps: exercise.minReps,
            maxReps: exercise.maxReps,
            notes: '',
          })
        }
      }

      return programmeId
    }
  )
}
