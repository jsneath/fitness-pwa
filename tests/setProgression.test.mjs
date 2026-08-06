import { getSetProgression } from '../src/data/setProgression.js'
import { getVolumeStatus, VOLUME_STATUS } from '../src/data/volumeLandmarks.js'

let pass = 0, fail = 0
const eq = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (ok) { pass++ } else { fail++; console.log(`  FAIL ${label}\n    expected ${JSON.stringify(expected)}\n    actual   ${JSON.stringify(actual)}`) }
}

const chest = { muscleGroup: 'Chest', mv: 4, mev: 8, mav: 18, mrv: 22 }

console.log('\n== set progression ==')
const cases = [
  ['no feedback at all',            null,                                        10, 1,  false],
  ['low pump, fully recovered',     { pumpRating: 1, sorenessRating: 1, fatigueRating: 1 }, 10, 2, false],
  ['low pump, mild soreness',       { pumpRating: 2, sorenessRating: 2, fatigueRating: 2 }, 10, 2, false],
  ['moderate everything',           { pumpRating: 3, sorenessRating: 2, fatigueRating: 2 }, 10, 1, false],
  ['great pump, on-time recovery',  { pumpRating: 5, sorenessRating: 3, fatigueRating: 2 }, 10, 0, false],
  ['still sore',                    { pumpRating: 3, sorenessRating: 4, fatigueRating: 2 }, 10, 0, false],
  ['high fatigue only',             { pumpRating: 3, sorenessRating: 2, fatigueRating: 5 }, 10, 0, false],
  ['sore AND fatigued -> MRV',      { pumpRating: 3, sorenessRating: 5, fatigueRating: 5 }, 12, -4, true],
]
for (const [label, fb, sets, expectedDelta, expectedDeload] of cases) {
  const r = getSetProgression(fb, sets, chest)
  eq(label + ' (delta)', r.delta, expectedDelta)
  eq(label + ' (deload)', r.deload, expectedDeload)
  console.log(`  ${String(r.delta).padStart(3)} sets  ${label.padEnd(30)} ${r.reason}`)
}

console.log('\n== MRV ceiling ==')
const nearCeiling = getSetProgression({ pumpRating: 1, sorenessRating: 1 }, 21, chest)
eq('caps at MRV instead of overshooting', nearCeiling.delta, 1)
eq('flags atCeiling', nearCeiling.atCeiling, true)
console.log(`  21 sets + low pump -> +${nearCeiling.delta} (${nearCeiling.reason})`)

const atCeiling = getSetProgression({ pumpRating: 1, sorenessRating: 1 }, 22, chest)
eq('no increase when already at MRV', atCeiling.delta, 0)
console.log(`  22 sets + low pump -> +${atCeiling.delta} (${atCeiling.reason})`)

const overCeiling = getSetProgression({ pumpRating: 1, sorenessRating: 1 }, 25, chest)
eq('never negative from the cap alone', overCeiling.delta, 0)
console.log(`  25 sets + low pump -> +${overCeiling.delta} (${overCeiling.reason})`)

console.log('\n== deload magnitude scales with volume ==')
for (const sets of [6, 12, 21]) {
  const r = getSetProgression({ sorenessRating: 5, fatigueRating: 5 }, sets, chest)
  console.log(`  ${String(sets).padStart(2)} sets -> ${r.delta} (down to ${sets + r.delta})`)
}
eq('small volume still drops at least 1', getSetProgression({ sorenessRating: 5, fatigueRating: 5 }, 2, chest).delta, -1)

console.log('\n== volume status bands ==')
const statuses = [
  [2,  VOLUME_STATUS.UNDER_MV],
  [4,  VOLUME_STATUS.MAINTENANCE],
  [7,  VOLUME_STATUS.MAINTENANCE],
  [8,  VOLUME_STATUS.ADAPTIVE],
  [18, VOLUME_STATUS.ADAPTIVE],
  [19, VOLUME_STATUS.APPROACHING_MRV],
  [22, VOLUME_STATUS.APPROACHING_MRV],
  [23, VOLUME_STATUS.OVER_MRV],
]
for (const [sets, expected] of statuses) {
  const actual = getVolumeStatus(sets, chest)
  eq(`${sets} sets`, actual, expected)
  console.log(`  ${String(sets).padStart(2)} sets -> ${actual}`)
}

console.log(`\n${pass} passed, ${fail} failed\n`)
process.exit(fail > 0 ? 1 : 0)
