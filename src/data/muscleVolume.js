// Fractional muscle contributions per exercise.
//
// RP-style volume tracking counts "hard sets per muscle per week", but a set of
// bench press is not one full set for your triceps. Every exercise therefore
// contributes a fraction of a set to each muscle it trains.
//
// Rather than hand-authoring 370+ maps, we derive them from the existing
// `muscleGroups` arrays, which are consistently authored primary-muscle-first
// (e.g. Close Grip Bench Press is ['Triceps', 'Chest'], not the reverse).

// The primary (first-listed) muscle gets a full set.
const PRIMARY_FRACTION = 1

// Other directly-worked muscles get half a set.
const SECONDARY_FRACTION = 0.5

// These are overwhelmingly stabilisers when they appear as a non-primary muscle
// — your core does not get half a set of direct work from a front squat.
const STABILISER_FRACTION = 0.25
const STABILISERS = new Set(['Core', 'Forearms', 'Traps'])

// Exercises where the derivation above is wrong. Values are full maps and
// replace the derived result entirely.
//
// Mostly heavy compounds, where the pattern under-or-over-credits a muscle:
// squats give hamstrings very little, deadlifts genuinely tax several muscles
// hard, and hip hinges hit glutes and hamstrings near-equally.
export const VOLUME_OVERRIDES = {
  'Barbell Squat': { Quadriceps: 1, Glutes: 0.5, Hamstrings: 0.25 },
  'Front Squat': { Quadriceps: 1, Glutes: 0.5, Core: 0.25 },
  'Hack Squat': { Quadriceps: 1, Glutes: 0.5, Hamstrings: 0.25 },
  'Leg Press': { Quadriceps: 1, Glutes: 0.5, Hamstrings: 0.25 },
  'Deadlift': { Back: 1, Glutes: 1, Hamstrings: 0.75, Traps: 0.5 },
  'Sumo Deadlift': { Glutes: 1, Quadriceps: 0.75, Back: 0.75, Hamstrings: 0.5 },
  'Romanian Deadlift': { Hamstrings: 1, Glutes: 0.75, Back: 0.25 },
  'Dumbbell Romanian Deadlift': { Hamstrings: 1, Glutes: 0.75, Back: 0.25 },
  'Single Leg Romanian Deadlift': { Hamstrings: 1, Glutes: 0.75, Back: 0.25 },
  'Stiff Leg Deadlift': { Hamstrings: 1, Glutes: 0.75, Back: 0.25 },
  'Dumbbell Stiff Leg Deadlift': { Hamstrings: 1, Glutes: 0.75, Back: 0.25 },
  'Good Mornings': { Hamstrings: 1, Glutes: 0.5, Back: 0.25 },
  'Hip Thrust': { Glutes: 1, Hamstrings: 0.25 },
  'Dumbbell Hip Thrust': { Glutes: 1, Hamstrings: 0.25 },
  'Hip Thrust Machine': { Glutes: 1, Hamstrings: 0.25 },
  'Bulgarian Split Squat': { Quadriceps: 1, Glutes: 0.75 },
  'Walking Lunges': { Quadriceps: 1, Glutes: 0.75 },
  'Lunges': { Quadriceps: 1, Glutes: 0.75 },
  'Reverse Lunges': { Quadriceps: 1, Glutes: 0.75 },
  'Pull-ups': { Back: 1, Biceps: 0.5, Forearms: 0.25 },
  'Wide Grip Pull-ups': { Back: 1, Biceps: 0.5, Forearms: 0.25 },
  'Chin-ups': { Back: 1, Biceps: 0.75, Forearms: 0.25 },
  'Chest Dips': { Chest: 1, Triceps: 0.75, Shoulders: 0.25 },
  'Overhead Press': { Shoulders: 1, Triceps: 0.5, Core: 0.25 },
  'Push Press': { Shoulders: 1, Triceps: 0.5, Core: 0.25 },
  'Farmers Walk': { Forearms: 1, Traps: 0.75 },
}

/**
 * Fractional set contributions for one exercise, as { muscleGroup: fraction }.
 * Falls back to the primary/secondary/stabiliser derivation when there's no
 * explicit override, so custom exercises work without any extra data.
 */
export function getMuscleVolume(exercise) {
  if (!exercise) return {}

  const override = VOLUME_OVERRIDES[exercise.name]
  if (override) return override

  const groups = exercise.muscleGroups || []
  const volume = {}

  groups.forEach((group, index) => {
    if (index === 0) {
      volume[group] = PRIMARY_FRACTION
    } else {
      volume[group] = STABILISERS.has(group) ? STABILISER_FRACTION : SECONDARY_FRACTION
    }
  })

  return volume
}

/**
 * Total weighted sets per muscle group across many logged sets.
 *
 * @param {Array} sets      set logs (warmups should already be filtered out)
 * @param {Map|Object} exercisesById  lookup from exerciseId to exercise
 * @returns {Object} { muscleGroup: totalSets }
 */
export function tallyMuscleVolume(sets, exercisesById) {
  const lookup = exercisesById instanceof Map
    ? (id) => exercisesById.get(id)
    : (id) => exercisesById[id]

  const totals = {}

  for (const set of sets) {
    const exercise = lookup(set.exerciseId)
    if (!exercise) continue

    const contributions = getMuscleVolume(exercise)
    for (const [group, fraction] of Object.entries(contributions)) {
      totals[group] = (totals[group] || 0) + fraction
    }
  }

  // Round to 1dp so we don't render 8.000000000000002 sets
  for (const group of Object.keys(totals)) {
    totals[group] = Math.round(totals[group] * 10) / 10
  }

  return totals
}
