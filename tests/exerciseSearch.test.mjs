import { defaultExercises } from '../src/data/defaultExercises.js'
import {
  exerciseMatchesQuery,
  rankExercises,
  scoreExercise,
  filterExercisesForPicker,
  groupByEquipmentCategory,
} from '../src/utils/exerciseSearch.js'

let pass = 0
let fail = 0

const eq = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (ok) {
    pass += 1
  } else {
    fail += 1
    console.log(`  FAIL ${label}\n    expected ${JSON.stringify(expected)}\n    actual   ${JSON.stringify(actual)}`)
  }
}

const names = (list) => list.map((e) => e.name)
const top = (query) => rankExercises(defaultExercises, query)[0]?.name
const has = (query, name) =>
  rankExercises(defaultExercises, query).some((e) => e.name === name)

console.log('\n== nicknames and shorthand ==')
eq('lat raise -> Lateral Raises', top('lat raise'), 'Lateral Raises')
eq('side raise finds laterals', has('side raise', 'Lateral Raises'), true)
eq('ohp -> Overhead Press', top('ohp'), 'Overhead Press')
eq('military press -> Overhead Press', top('military press'), 'Overhead Press')
eq('rdl -> Romanian Deadlift', top('rdl'), 'Romanian Deadlift')
eq('db bench -> Dumbbell Bench Press', top('db bench'), 'Dumbbell Bench Press')
eq('bb bench is a bench press', has('bb bench', 'Barbell Bench Press'), true)
eq('pec deck', has('pec deck', 'Pec Deck'), true)
eq('pec dec typo', has('pec dec', 'Pec Deck'), true)
eq('chest fly -> Dumbbell Flyes', has('chest fly', 'Dumbbell Flyes'), true)
eq('hex bar -> Trap Bar Deadlift', top('hex bar'), 'Trap Bar Deadlift')
eq('hyperextension -> Back Extension', has('hyperextension', 'Back Extension'), true)
eq('face pull', has('face pull', 'Face Pulls'), true)
eq('pushdowns', has('pushdown', 'Tricep Pushdown'), true)
eq('bulgarian', has('bulgarian', 'Bulgarian Split Squat'), true)
eq('v bar pulldown', has('v bar pulldown', 'Close Grip Lat Pulldown'), true)
eq('abductor machine', has('abductor', 'Hip Abduction Machine'), true)
eq('pushups matches Push-ups', has('pushups', 'Push-ups'), true)

console.log('\n== ranking prefers the thing people meant ==')
eq('bench ranks a bench press first', rankExercises(defaultExercises, 'bench')[0].name.includes('Bench'), true)
eq('lat raise ranks laterals above pulldowns', scoreExercise({ name: 'Lateral Raises', muscleGroups: ['Shoulders'], equipment: 'Dumbbells' }, 'lat raise') > scoreExercise({ name: 'Lat Pulldown', muscleGroups: ['Back'], equipment: 'Cable' }, 'lat raise'), true)

console.log('\n== muscle + equipment browse ==')
const chestMachines = filterExercisesForPicker(defaultExercises, {
  muscle: 'Chest',
  equipment: 'machine',
})
eq('chest + machines includes pec deck', chestMachines.some((e) => e.name === 'Pec Deck'), true)
eq('chest + machines excludes dumbbell flyes', chestMachines.some((e) => e.name === 'Dumbbell Flyes'), false)

const chestFree = filterExercisesForPicker(defaultExercises, {
  muscle: 'Chest',
  equipment: 'free-weights',
})
eq('chest + free weights includes barbell bench', chestFree.some((e) => e.name === 'Barbell Bench Press'), true)
eq('chest + free weights excludes pec deck', chestFree.some((e) => e.name === 'Pec Deck'), false)

const latOnChest = filterExercisesForPicker(defaultExercises, {
  query: 'lat raise',
  muscle: 'Chest',
  requireMuscle: true,
})
eq('lat raise + chest hard-filter is empty', latOnChest.length, 0)
eq('lat raise still finds laterals without the muscle lock', filterExercisesForPicker(defaultExercises, {
  query: 'lat raise',
  muscle: 'Chest',
  requireMuscle: false,
}).some((e) => e.name === 'Lateral Raises'), true)

const grouped = groupByEquipmentCategory(
  filterExercisesForPicker(defaultExercises, { muscle: 'Chest' })
)
eq('chest groups include free weights, cables, machines, bodyweight', grouped.map((g) => g.id).sort(), ['bodyweight', 'cable', 'free-weights', 'machine'])

console.log('\n== token matching still works ==')
eq('raise lateral still finds laterals', exerciseMatchesQuery(
  { name: 'Lateral Raises', muscleGroups: ['Shoulders'], equipment: 'Dumbbells' },
  'raise lateral'
), true)
eq('cable lat finds cable laterals', has('cable lat', 'Cable Lateral Raise'), true)

console.log(`\n${pass} passed, ${fail} failed\n`)
process.exit(fail > 0 ? 1 : 0)
