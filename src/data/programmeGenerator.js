// Mesocycle generator.
//
// Given how often you can train, what you want to prioritise and how long
// you've been lifting, this builds a complete mesocycle: training days,
// exercises, starting set counts and rep ranges.
//
// The volume logic is the same one the rest of the app uses — every muscle
// starts at (or near) its MEV and the mesocycle grows into MAV week by week
// via feedback. The generator only sets the starting point.
//
// Kept free of database imports so it can be unit tested directly; callers
// pass in the exercise library and landmarks.

// Explicit .js extension so this module also resolves under plain node for the
// test suite; Vite handles either form.
import { getSplit, CORE, EMPHASIS_OPTIONS, EXPERIENCE_OPTIONS } from './splits.js'
import {
  EXCLUDED_FROM_GENERATION,
  preferenceRank,
  conflictsWith,
} from './exerciseSelection.js'

// Muscles the generator will programme directly. Forearms and adductors are
// excluded: they get plenty of indirect work and the library barely covers them.
const PROGRAMMABLE_MUSCLES = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
  'Quadriceps', 'Hamstrings', 'Glutes', 'Calves', 'Traps', 'Core',
]

// Below this, a session isn't worth the warm-up. If a muscle's weekly target
// can't give every day at least this many sets, it gets trained less often.
const MIN_SETS_PER_SESSION = 2

// Rep ranges by movement type. Compounds run heavier, isolation lighter, and
// calves/abs respond well to higher reps.
const REP_RANGES = {
  compound: { minReps: 6, maxReps: 10 },
  isolation: { minReps: 10, maxReps: 15 },
  highRep: { minReps: 12, maxReps: 20 },
}
const HIGH_REP_MUSCLES = new Set(['Calves', 'Core'])

// An exercise training more than one muscle is treated as a compound. That
// maps closely enough onto the library's data to be a useful signal.
function isCompound(exercise) {
  return (exercise.muscleGroups || []).length > 1
}

function repRangeFor(exercise, muscle) {
  if (HIGH_REP_MUSCLES.has(muscle)) return REP_RANGES.highRep
  return isCompound(exercise) ? REP_RANGES.compound : REP_RANGES.isolation
}

// Barbell and machine work makes better anchor movements; cables and dumbbells
// are better accessories. Bodyweight sits in between.
const EQUIPMENT_PRIORITY = {
  Barbell: 0,
  Machine: 1,
  Bodyweight: 2,
  Dumbbells: 3,
  Cable: 4,
  Kettlebell: 5,
  Bands: 6,
}

/**
 * Weekly set target per muscle, before it's split across days.
 * Emphasised muscles start higher up the MEV→MAV band; de-emphasised ones sit
 * near maintenance so they hold while your attention is elsewhere.
 */
export function allocateWeeklyVolume({ emphasis, experience }, landmarksByMuscle) {
  const emphasisConfig =
    EMPHASIS_OPTIONS.find((e) => e.id === emphasis) || EMPHASIS_OPTIONS[0]
  const experienceConfig =
    EXPERIENCE_OPTIONS.find((e) => e.id === experience) || EXPERIENCE_OPTIONS[1]

  const boost = new Set(emphasisConfig.boost)
  const maintain = new Set(emphasisConfig.maintain)

  const volume = {}

  for (const muscle of PROGRAMMABLE_MUSCLES) {
    const landmarks = landmarksByMuscle[muscle]
    if (!landmarks) continue

    let sets
    if (boost.has(muscle)) {
      // Start a third of the way into the productive band, leaving room to grow
      sets = landmarks.mev + (landmarks.mav - landmarks.mev) * 0.35
    } else if (maintain.has(muscle)) {
      sets = Math.max(landmarks.mv, landmarks.mev * 0.6)
    } else {
      sets = landmarks.mev
    }

    sets = Math.round(sets * experienceConfig.volumeMultiplier)

    // Never below maintenance, never above the adaptive ceiling to start with.
    sets = Math.max(landmarks.mv, Math.min(sets, landmarks.mav))
    volume[muscle] = sets
  }

  return volume
}

/**
 * Split a muscle's weekly sets across the days that train it, honouring the
 * minimum-per-session floor. Returns sets per day index.
 */
export function distributeSets(weeklySets, dayIndexes) {
  if (weeklySets <= 0 || dayIndexes.length === 0) return {}

  // Drop days until each remaining one clears the floor.
  let days = [...dayIndexes]
  while (days.length > 1 && weeklySets / days.length < MIN_SETS_PER_SESSION) {
    days = days.filter((_, i) => i % 2 === 0)
  }

  const base = Math.floor(weeklySets / days.length)
  let remainder = weeklySets - base * days.length

  const perDay = {}
  for (const dayIndex of days) {
    let sets = base
    if (remainder > 0) {
      sets += 1
      remainder -= 1
    }
    if (sets > 0) perDay[dayIndex] = sets
  }

  return perDay
}

// Candidate exercises for a muscle, best anchor movements first.
//
// The curated ranking in exerciseSelection.js drives this. The structural
// heuristic below it only breaks ties among movements nobody has ranked —
// typically custom exercises the user added themselves.
function candidatesFor(muscle, exercises, allowedEquipment) {
  const seenNames = new Set()
  return exercises
    .filter((e) => (e.muscleGroups || [])[0] === muscle)
    .filter((e) => !EXCLUDED_FROM_GENERATION.has(e.name))
    .filter((e) => !allowedEquipment || allowedEquipment.includes(e.equipment))
    // Collapse same-named entries so a duplicated library can't put the same
    // movement in a session twice under two different ids.
    .filter((e) => {
      const key = e.name.toLowerCase()
      if (seenNames.has(key)) return false
      seenNames.add(key)
      return true
    })
    .sort((a, b) => {
      const rankDiff = preferenceRank(muscle, a.name) - preferenceRank(muscle, b.name)
      if (rankDiff !== 0) return rankDiff

      // Unranked fallback: compounds first, then by equipment, then by name.
      const compoundDiff = Number(isCompound(b)) - Number(isCompound(a))
      if (compoundDiff !== 0) return compoundDiff
      const equipDiff =
        (EQUIPMENT_PRIORITY[a.equipment] ?? 9) - (EQUIPMENT_PRIORITY[b.equipment] ?? 9)
      if (equipDiff !== 0) return equipDiff
      return a.name.localeCompare(b.name)
    })
}

/**
 * Build a complete mesocycle plan.
 *
 * @param {object} options
 *   daysPerWeek   2-6
 *   emphasis      one of EMPHASIS_OPTIONS ids
 *   experience    one of EXPERIENCE_OPTIONS ids
 *   durationWeeks total weeks including the final deload
 *   equipment     array of allowed equipment, or null for everything
 * @param {object} library  { exercises, landmarks }
 */
export function generateMesocycle(options, { exercises, landmarks }) {
  const {
    daysPerWeek = 4,
    emphasis = 'balanced',
    experience = 'intermediate',
    durationWeeks = 5,
    equipment = null,
  } = options

  const landmarksByMuscle = Object.fromEntries(
    landmarks.map((l) => [l.muscleGroup, l])
  )
  const experienceConfig =
    EXPERIENCE_OPTIONS.find((e) => e.id === experience) || EXPERIENCE_OPTIONS[1]

  const split = getSplit(daysPerWeek, emphasis)
  const weeklyVolume = allocateWeeklyVolume({ emphasis, experience }, landmarksByMuscle)

  // Core only goes on the days flagged for it.
  const dayMuscles = split.map((day) => (day.core ? [...day.muscles, CORE] : day.muscles))

  // Which day indexes train each muscle
  const daysByMuscle = {}
  dayMuscles.forEach((muscles, dayIndex) => {
    for (const muscle of muscles) {
      ;(daysByMuscle[muscle] ||= []).push(dayIndex)
    }
  })

  // Sets per muscle per day
  const setsByDay = split.map(() => ({}))
  for (const [muscle, weeklySets] of Object.entries(weeklyVolume)) {
    const dayIndexes = daysByMuscle[muscle]
    if (!dayIndexes) continue
    const perDay = distributeSets(weeklySets, dayIndexes)
    for (const [dayIndex, sets] of Object.entries(perDay)) {
      setsByDay[dayIndex][muscle] = sets
    }
  }

  // Pick exercises, rotating through the candidate list so the same movement
  // doesn't appear on every day of the week.
  const usedByMuscle = {}
  const days = split.map((day, dayIndex) => {
    const chosen = []
    const namesThisDay = []

    for (const muscle of Object.keys(setsByDay[dayIndex])) {
      const setsForMuscle = setsByDay[dayIndex][muscle]
      const candidates = candidatesFor(muscle, exercises, equipment)
      if (candidates.length === 0) continue

      // Roughly one exercise per 4 sets, so a muscle never gets a lone
      // 5-setter, bounded by how much variety the experience level warrants.
      const wanted = Math.min(
        Math.max(1, Math.ceil(setsForMuscle / 4)),
        experienceConfig.maxExercisesPerMuscle,
        candidates.length
      )

      usedByMuscle[muscle] ||= new Set()
      const picks = []
      for (const candidate of candidates) {
        if (picks.length >= wanted) break
        // Don't repeat a movement across the week...
        if (usedByMuscle[muscle].has(candidate.id ?? candidate.name)) continue
        // ...and don't stack two maximally fatiguing lifts in one session.
        if (conflictsWith(candidate.name, namesThisDay)) continue
        picks.push(candidate)
        namesThisDay.push(candidate.name)
        usedByMuscle[muscle].add(candidate.id ?? candidate.name)
      }
      // Ran out of unused options — reuse from the top of the list.
      let fallback = 0
      while (picks.length < wanted && candidates.length > 0) {
        picks.push(candidates[fallback % candidates.length])
        fallback += 1
      }

      // Spread the muscle's sets across its chosen exercises.
      const basePerExercise = Math.floor(setsForMuscle / picks.length)
      let extra = setsForMuscle - basePerExercise * picks.length

      picks.forEach((exercise) => {
        let targetSets = basePerExercise
        if (extra > 0) {
          targetSets += 1
          extra -= 1
        }
        if (targetSets <= 0) return
        chosen.push({
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          muscleGroup: muscle,
          targetSets,
          isCompound: isCompound(exercise),
          ...repRangeFor(exercise, muscle),
        })
      })
    }

    // Heaviest work first: compounds before isolation within a session.
    chosen.sort((a, b) => Number(b.isCompound) - Number(a.isCompound))

    return {
      name: day.name,
      dayNumber: dayIndex + 1,
      exercises: chosen.map((e, order) => ({ ...e, order })),
    }
  })

  return {
    daysPerWeek,
    durationWeeks,
    emphasis,
    experience,
    weeklyVolume,
    days,
  }
}

/** Human-readable default name, e.g. "5-Week Legs Mesocycle". */
export function suggestProgrammeName({ durationWeeks, emphasis }) {
  const label = EMPHASIS_OPTIONS.find((e) => e.id === emphasis)?.label || 'Balanced'
  return `${durationWeeks}-Week ${label} Mesocycle`
}
