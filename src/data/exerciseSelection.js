// Curated exercise selection for the programme generator.
//
// A purely structural heuristic (compound first, barbell first) picks awful
// movements: it will happily make "Clean" your main back exercise and
// "Reverse Curl" your main biceps exercise, because both are technically
// compound barbell lifts. Auto-generated programmes need actual judgement
// about which movements are good hypertrophy choices, so the good ones are
// ranked explicitly here.
//
// Order matters: the first entry for a muscle is its anchor movement, and
// later entries are the accessories layered on as volume grows. Lists mix
// equipment deliberately so an exercise remains available when the user
// filters to a subset of kit.

export const PREFERRED_EXERCISES = {
  Chest: [
    'Barbell Bench Press',
    'Incline Dumbbell Press',
    'Machine Chest Press',
    'Incline Barbell Bench Press',
    'Dumbbell Bench Press',
    'Pec Deck',
    'Cable Crossover',
    'Machine Incline Press',
    'Chest Dips',
    'Dumbbell Flyes',
    'Push-ups',
  ],
  Back: [
    'Barbell Row',
    'Lat Pulldown',
    'Chest Supported Row',
    'Seated Cable Row',
    'Pull-ups',
    'Hammer Strength Row',
    'T-Bar Row',
    'Dumbbell Row',
    'Wide Grip Lat Pulldown',
    'Machine Row',
    'Chin-ups',
    'Straight Arm Pulldown',
  ],
  Shoulders: [
    'Lateral Raises',
    'Seated Dumbbell Press',
    'Overhead Press',
    'Cable Lateral Raise',
    'Machine Shoulder Press',
    'Rear Delt Flyes',
    'Reverse Pec Deck',
    'Machine Lateral Raise',
    'Dumbbell Shoulder Press',
    'Cable Rear Delt Fly',
  ],
  Biceps: [
    'Barbell Curl',
    'Incline Dumbbell Curl',
    'Cable Curl',
    'EZ Bar Curl',
    'Hammer Curl',
    'Preacher Curl',
    'Dumbbell Curl',
    'Machine Curl',
    'Spider Curl',
    'Cable Hammer Curl',
  ],
  Triceps: [
    'Tricep Rope Pushdown',
    'Overhead Tricep Extension',
    'Close Grip Bench Press',
    'Skull Crushers',
    'Tricep Pushdown',
    'Overhead Dumbbell Extension',
    'Machine Tricep Extension',
    'EZ Bar Skull Crushers',
    'Overhead Rope Extension',
    'Tricep Dips',
  ],
  Quadriceps: [
    'Barbell Squat',
    'Leg Press',
    'Hack Squat',
    'Leg Extension',
    'Bulgarian Split Squat',
    'Front Squat',
    'Pendulum Squat',
    'Walking Lunges',
    'Goblet Squat',
    'Smith Machine Squat',
  ],
  Hamstrings: [
    'Romanian Deadlift',
    'Lying Leg Curl',
    'Seated Leg Curl',
    'Dumbbell Romanian Deadlift',
    'Stiff Leg Deadlift',
    'Standing Leg Curl',
    'Glute Ham Raise',
    'Cable Pull Through',
  ],
  Glutes: [
    'Hip Thrust',
    'Hip Thrust Machine',
    'Dumbbell Hip Thrust',
    'Cable Glute Kickback',
    'Glute Kickback Machine',
    'Hip Abduction Machine',
    'Cable Hip Abduction',
    'Glute Bridge',
  ],
  Calves: [
    'Standing Calf Raise',
    'Seated Calf Raise',
    'Leg Press Calf Raise',
    'Smith Machine Calf Raise',
    'Dumbbell Calf Raise',
    'Single Leg Calf Raise',
  ],
  Traps: [
    'Barbell Shrugs',
    'Dumbbell Shrugs',
    'Cable Shrugs',
    'Machine Shrugs',
  ],
  Core: [
    'Cable Crunch',
    'Hanging Leg Raise',
    'Ab Crunch Machine',
    'Weighted Sit-up',
    'Hanging Knee Raise',
    'Ab Wheel Rollout',
    'Crunches',
    'Reverse Crunches',
  ],
}

// Never auto-programmed, even though they're in the library and users may well
// want to log them manually.
//
//  - Olympic lifts and their derivatives: high skill, coached movements, and
//    poor stimulus-to-fatigue for hypertrophy.
//  - Behind-the-neck and upright-row patterns: avoidable shoulder risk when
//    nobody is watching your form.
//  - Stability, carry and conditioning work: real training, but not countable
//    hypertrophy sets, and awkward to prescribe as "3 x 8".
export const EXCLUDED_FROM_GENERATION = new Set([
  'Clean', 'Power Clean', 'Hang Clean', 'Clean and Press', 'Clean and Jerk',
  'Snatch', 'Power Snatch', 'Hang Snatch', 'Thruster', 'Dumbbell Thruster',
  'Behind Neck Press', 'Behind Neck Lat Pulldown', 'Bradford Press',
  'Upright Row', 'Dumbbell Upright Row', 'Cable Upright Row',
  'Good Mornings', 'Cheat Curl', 'Kroc Row', 'Rack Pulls',
  'Plank', 'Side Plank', 'RKC Plank', 'Hollow Body Hold', 'L-Sit',
  'Dead Bug', 'Bird Dog', 'Bear Crawl', 'Mountain Climbers', 'Burpees',
  'Man Maker', 'Turkish Get Up', 'Suitcase Carry', 'Farmers Walk',
  'Box Jump', 'Jump Squat', 'Wall Sit', 'Dragon Flag', 'Pistol Squat',
  'Scapular Pull-ups', 'Sissy Squat', 'Nordic Curl',
  'Toe Touch', 'Heel Touch', 'Flutter Kicks', 'Scissor Kicks',
])

// Movements that shouldn't share a session — two maximally fatiguing hinges in
// one day is a bad idea however the volume maths works out.
export const CONFLICTING_PAIRS = [
  ['Deadlift', 'Romanian Deadlift'],
  ['Deadlift', 'Stiff Leg Deadlift'],
  ['Deadlift', 'Sumo Deadlift'],
  ['Sumo Deadlift', 'Romanian Deadlift'],
  ['Sumo Deadlift', 'Stiff Leg Deadlift'],
  ['Barbell Squat', 'Front Squat'],
]

/** True when `name` cannot be programmed alongside anything in `chosenNames`. */
export function conflictsWith(name, chosenNames) {
  return CONFLICTING_PAIRS.some(
    ([a, b]) =>
      (a === name && chosenNames.includes(b)) ||
      (b === name && chosenNames.includes(a))
  )
}

/**
 * Rank for an exercise within its muscle. Lower is better.
 * Anything not on the preferred list sorts after everything that is.
 */
export function preferenceRank(muscle, exerciseName) {
  const list = PREFERRED_EXERCISES[muscle]
  if (!list) return Number.MAX_SAFE_INTEGER
  const index = list.indexOf(exerciseName)
  return index === -1 ? Number.MAX_SAFE_INTEGER : index
}
