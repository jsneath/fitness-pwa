import {
  generateMesocycle,
  allocateWeeklyVolume,
  distributeSets,
} from '../src/data/programmeGenerator.js'
import { DEFAULT_VOLUME_LANDMARKS } from '../src/data/volumeLandmarks.js'
import { defaultExercises } from '../src/data/defaultExercises.js'
import { EMPHASIS_OPTIONS, EXPERIENCE_OPTIONS } from '../src/data/splits.js'

let pass = 0, fail = 0
const ok = (label, cond, detail = '') => {
  if (cond) pass++
  else { fail++; console.log(`  FAIL ${label}${detail ? '\n    ' + detail : ''}`) }
}

// Exercises arrive from Dexie with ids; the raw data file has none.
const exercises = defaultExercises.map((e, i) => ({ ...e, id: i + 1 }))
const landmarks = DEFAULT_VOLUME_LANDMARKS
const byMuscle = Object.fromEntries(landmarks.map((l) => [l.muscleGroup, l]))

console.log('\n== distributeSets ==')
ok('splits evenly', JSON.stringify(distributeSets(8, [0, 1])) === JSON.stringify({ 0: 4, 1: 4 }))
ok('spreads remainder', JSON.stringify(distributeSets(9, [0, 1])) === JSON.stringify({ 0: 5, 1: 4 }))
ok('single day takes all', JSON.stringify(distributeSets(6, [0])) === JSON.stringify({ 0: 6 }))
ok('zero sets -> nothing', Object.keys(distributeSets(0, [0, 1])).length === 0)
{
  // 3 sets over 3 days would be 1/session, below the floor — should use fewer days
  const d = distributeSets(3, [0, 1, 2])
  const perSession = Object.values(d)
  ok('respects min sets per session', perSession.every((s) => s >= 2), JSON.stringify(d))
  ok('preserves total', perSession.reduce((a, b) => a + b, 0) === 3, JSON.stringify(d))
}

console.log('\n== volume allocation stays within landmarks ==')
for (const emphasis of EMPHASIS_OPTIONS.map((e) => e.id)) {
  for (const experience of EXPERIENCE_OPTIONS.map((e) => e.id)) {
    const v = allocateWeeklyVolume({ emphasis, experience }, byMuscle)
    for (const [muscle, sets] of Object.entries(v)) {
      const l = byMuscle[muscle]
      ok(`${emphasis}/${experience} ${muscle} >= MV`, sets >= l.mv, `${sets} < mv ${l.mv}`)
      ok(`${emphasis}/${experience} ${muscle} <= MAV`, sets <= l.mav, `${sets} > mav ${l.mav}`)
    }
  }
}

console.log('\n== emphasis actually emphasises ==')
{
  const balanced = allocateWeeklyVolume({ emphasis: 'balanced', experience: 'intermediate' }, byMuscle)
  const legs = allocateWeeklyVolume({ emphasis: 'legs', experience: 'intermediate' }, byMuscle)
  const upper = allocateWeeklyVolume({ emphasis: 'upper', experience: 'intermediate' }, byMuscle)
  ok('legs emphasis raises quads', legs.Quadriceps > balanced.Quadriceps, `${legs.Quadriceps} vs ${balanced.Quadriceps}`)
  ok('legs emphasis raises hamstrings', legs.Hamstrings > balanced.Hamstrings)
  ok('legs emphasis lowers chest', legs.Chest < balanced.Chest, `${legs.Chest} vs ${balanced.Chest}`)
  ok('upper emphasis raises chest', upper.Chest > balanced.Chest)
  ok('upper emphasis lowers quads', upper.Quadriceps < balanced.Quadriceps)
  console.log(`  balanced quads ${balanced.Quadriceps}, legs-focus quads ${legs.Quadriceps}, upper-focus quads ${upper.Quadriceps}`)
  console.log(`  balanced chest ${balanced.Chest}, legs-focus chest ${legs.Chest}, upper-focus chest ${upper.Chest}`)
}

console.log('\n== full generation across every configuration ==')
let generated = 0
for (let daysPerWeek = 2; daysPerWeek <= 6; daysPerWeek++) {
  for (const emphasis of EMPHASIS_OPTIONS.map((e) => e.id)) {
    for (const experience of EXPERIENCE_OPTIONS.map((e) => e.id)) {
      const plan = generateMesocycle(
        { daysPerWeek, emphasis, experience, durationWeeks: 5 },
        { exercises, landmarks }
      )
      const tag = `${daysPerWeek}d/${emphasis}/${experience}`
      generated++

      ok(`${tag} right number of days`, plan.days.length === daysPerWeek)
      ok(`${tag} every day has exercises`, plan.days.every((d) => d.exercises.length > 0),
        plan.days.map((d) => `${d.name}:${d.exercises.length}`).join(' '))
      ok(`${tag} every exercise has >=1 set`, plan.days.every((d) => d.exercises.every((e) => e.targetSets >= 1)))
      ok(`${tag} every exercise resolves an id`, plan.days.every((d) => d.exercises.every((e) => typeof e.exerciseId === 'number')))
      ok(`${tag} rep ranges sane`, plan.days.every((d) => d.exercises.every((e) => e.minReps > 0 && e.maxReps > e.minReps)))
      ok(`${tag} order is contiguous`, plan.days.every((d) => d.exercises.every((e, i) => e.order === i)))

      // No duplicate exercise within a single session, by id *or* name — a
      // library duplicated by the old seeding race made these differ.
      for (const day of plan.days) {
        const ids = day.exercises.map((e) => e.exerciseId)
        const names = day.exercises.map((e) => e.exerciseName)
        ok(`${tag} ${day.name} no duplicate id within session`, new Set(ids).size === ids.length)
        ok(`${tag} ${day.name} no duplicate name within session`, new Set(names).size === names.length,
          names.join(', '))
      }

      // Programmed sets should match the weekly allocation for each muscle
      const programmed = {}
      for (const day of plan.days) {
        for (const e of day.exercises) {
          programmed[e.muscleGroup] = (programmed[e.muscleGroup] || 0) + e.targetSets
        }
      }
      for (const [muscle, target] of Object.entries(plan.weeklyVolume)) {
        const actual = programmed[muscle] || 0
        ok(`${tag} ${muscle} programmed matches target`, actual === target,
          `target ${target}, programmed ${actual}`)
      }
    }
  }
}
console.log(`  generated ${generated} configurations`)

console.log('\n== survives a duplicated exercise library ==')
{
  // Reproduces the seeding race: every exercise present twice under two ids.
  const duplicated = [
    ...exercises,
    ...exercises.map((e) => ({ ...e, id: e.id + 10000 })),
  ]
  const plan = generateMesocycle(
    { daysPerWeek: 4, emphasis: 'balanced', experience: 'advanced', durationWeeks: 5 },
    { exercises: duplicated, landmarks }
  )
  let clean = true
  for (const day of plan.days) {
    const names = day.exercises.map((e) => e.exerciseName)
    if (new Set(names).size !== names.length) {
      clean = false
      console.log(`  duplicate in ${day.name}: ${names.join(', ')}`)
    }
  }
  ok('no repeated movement despite duplicated library', clean)
}

console.log('\n== sample: 4 days, legs focus, intermediate ==')
{
  const plan = generateMesocycle(
    { daysPerWeek: 4, emphasis: 'legs', experience: 'intermediate', durationWeeks: 5 },
    { exercises, landmarks }
  )
  for (const day of plan.days) {
    console.log(`  ${day.name}`)
    for (const e of day.exercises) {
      console.log(`    ${String(e.targetSets)}x${e.minReps}-${e.maxReps}  ${e.exerciseName}  (${e.muscleGroup})`)
    }
  }
  const total = plan.days.reduce((s, d) => s + d.exercises.reduce((x, e) => x + e.targetSets, 0), 0)
  console.log(`  total weekly sets: ${total}`)
}

console.log(`\n${pass} passed, ${fail} failed\n`)
process.exit(fail > 0 ? 1 : 0)
