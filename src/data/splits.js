// Training splits by days per week.
//
// Each day lists the muscles it covers. Weekly set targets are then divided
// across whichever days train that muscle, so the split determines frequency
// and the landmarks determine volume.

export const PUSH = ['Chest', 'Shoulders', 'Triceps']
export const PULL = ['Back', 'Biceps', 'Traps']
export const LEGS = ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves']
export const UPPER = [...PUSH, ...PULL]
export const FULL = [...UPPER, ...LEGS]

// Core is appended separately so it lands on a couple of days rather than all
// of them — 6 days of direct ab work is nobody's priority.
export const CORE = 'Core'

const SPLITS = {
  2: [
    { name: 'Full Body A', muscles: FULL, core: true },
    { name: 'Full Body B', muscles: FULL, core: true },
  ],
  3: [
    { name: 'Push', muscles: PUSH, core: true },
    { name: 'Pull', muscles: PULL },
    { name: 'Legs', muscles: LEGS, core: true },
  ],
  4: [
    { name: 'Upper A', muscles: UPPER },
    { name: 'Lower A', muscles: LEGS, core: true },
    { name: 'Upper B', muscles: UPPER },
    { name: 'Lower B', muscles: LEGS, core: true },
  ],
  5: [
    { name: 'Upper', muscles: UPPER },
    { name: 'Lower', muscles: LEGS, core: true },
    { name: 'Push', muscles: PUSH },
    { name: 'Pull', muscles: PULL },
    { name: 'Legs', muscles: LEGS, core: true },
  ],
  6: [
    { name: 'Push A', muscles: PUSH, core: true },
    { name: 'Pull A', muscles: PULL },
    { name: 'Legs A', muscles: LEGS },
    { name: 'Push B', muscles: PUSH, core: true },
    { name: 'Pull B', muscles: PULL },
    { name: 'Legs B', muscles: LEGS },
  ],
}

// At 5 and 6 days there's enough room to buy a muscle group extra frequency,
// not just extra sets per session. Below that, emphasis is handled purely
// through volume allocation.
const EMPHASIS_SPLITS = {
  legs: {
    5: [
      { name: 'Legs A', muscles: LEGS, core: true },
      { name: 'Upper A', muscles: UPPER },
      { name: 'Legs B', muscles: LEGS },
      { name: 'Upper B', muscles: UPPER, core: true },
      { name: 'Legs C', muscles: LEGS },
    ],
    6: [
      { name: 'Legs A', muscles: LEGS, core: true },
      { name: 'Push', muscles: PUSH },
      { name: 'Legs B', muscles: LEGS },
      { name: 'Pull', muscles: PULL },
      { name: 'Legs C', muscles: LEGS, core: true },
      { name: 'Upper', muscles: UPPER },
    ],
  },
  upper: {
    5: [
      { name: 'Push A', muscles: PUSH },
      { name: 'Pull A', muscles: PULL },
      { name: 'Legs', muscles: LEGS, core: true },
      { name: 'Push B', muscles: PUSH, core: true },
      { name: 'Pull B', muscles: PULL },
    ],
    6: [
      { name: 'Push A', muscles: PUSH },
      { name: 'Pull A', muscles: PULL },
      { name: 'Legs', muscles: LEGS, core: true },
      { name: 'Push B', muscles: PUSH },
      { name: 'Pull B', muscles: PULL },
      { name: 'Arms & Delts', muscles: ['Biceps', 'Triceps', 'Shoulders'], core: true },
    ],
  },
}

export function getSplit(daysPerWeek, emphasis = 'balanced') {
  const emphasised = EMPHASIS_SPLITS[emphasis]?.[daysPerWeek]
  if (emphasised) return emphasised.map((d) => ({ ...d }))

  const split = SPLITS[daysPerWeek] || SPLITS[4]
  return split.map((d) => ({ ...d }))
}

export const EMPHASIS_OPTIONS = [
  {
    id: 'balanced',
    label: 'Balanced',
    description: 'Even development across the whole body',
    boost: [],
    maintain: [],
  },
  {
    id: 'legs',
    label: 'Legs',
    description: 'Quads, hams, glutes and calves prioritised',
    boost: LEGS,
    maintain: PUSH,
  },
  {
    id: 'upper',
    label: 'Upper body',
    description: 'Chest, back, delts and arms prioritised',
    boost: UPPER,
    maintain: ['Quadriceps', 'Hamstrings', 'Calves'],
  },
  {
    id: 'arms',
    label: 'Arms',
    description: 'Biceps and triceps prioritised',
    boost: ['Biceps', 'Triceps'],
    maintain: [],
  },
  {
    id: 'backDelts',
    label: 'Back & delts',
    description: 'Width and rear delts prioritised',
    boost: ['Back', 'Shoulders'],
    maintain: [],
  },
]

export const EXPERIENCE_OPTIONS = [
  {
    id: 'beginner',
    label: 'Beginner',
    description: 'Under a year of consistent lifting',
    volumeMultiplier: 0.8,
    maxExercisesPerMuscle: 1,
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    description: 'One to three years',
    volumeMultiplier: 1,
    maxExercisesPerMuscle: 2,
  },
  {
    id: 'advanced',
    label: 'Advanced',
    description: 'Three years or more',
    volumeMultiplier: 1.1,
    maxExercisesPerMuscle: 3,
  },
]
