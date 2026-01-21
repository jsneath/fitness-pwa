export const defaultExercises = [
  // Chest
  { name: 'Barbell Bench Press', muscleGroups: ['Chest', 'Triceps', 'Shoulders'], equipment: 'Barbell', isCustom: false },
  { name: 'Incline Barbell Bench Press', muscleGroups: ['Chest', 'Triceps', 'Shoulders'], equipment: 'Barbell', isCustom: false },
  { name: 'Decline Barbell Bench Press', muscleGroups: ['Chest', 'Triceps'], equipment: 'Barbell', isCustom: false },
  { name: 'Dumbbell Bench Press', muscleGroups: ['Chest', 'Triceps', 'Shoulders'], equipment: 'Dumbbells', isCustom: false },
  { name: 'Incline Dumbbell Press', muscleGroups: ['Chest', 'Triceps', 'Shoulders'], equipment: 'Dumbbells', isCustom: false },
  { name: 'Dumbbell Flyes', muscleGroups: ['Chest'], equipment: 'Dumbbells', isCustom: false },
  { name: 'Cable Crossover', muscleGroups: ['Chest'], equipment: 'Cable', isCustom: false },
  { name: 'Push-ups', muscleGroups: ['Chest', 'Triceps', 'Shoulders'], equipment: 'Bodyweight', isCustom: false },
  { name: 'Chest Dips', muscleGroups: ['Chest', 'Triceps'], equipment: 'Bodyweight', isCustom: false },
  { name: 'Machine Chest Press', muscleGroups: ['Chest', 'Triceps'], equipment: 'Machine', isCustom: false },
  { name: 'Pec Deck', muscleGroups: ['Chest'], equipment: 'Machine', isCustom: false },

  // Back
  { name: 'Deadlift', muscleGroups: ['Back', 'Hamstrings', 'Glutes'], equipment: 'Barbell', isCustom: false },
  { name: 'Barbell Row', muscleGroups: ['Back', 'Biceps'], equipment: 'Barbell', isCustom: false },
  { name: 'Pull-ups', muscleGroups: ['Back', 'Biceps'], equipment: 'Bodyweight', isCustom: false },
  { name: 'Chin-ups', muscleGroups: ['Back', 'Biceps'], equipment: 'Bodyweight', isCustom: false },
  { name: 'Lat Pulldown', muscleGroups: ['Back', 'Biceps'], equipment: 'Cable', isCustom: false },
  { name: 'Seated Cable Row', muscleGroups: ['Back', 'Biceps'], equipment: 'Cable', isCustom: false },
  { name: 'Dumbbell Row', muscleGroups: ['Back', 'Biceps'], equipment: 'Dumbbells', isCustom: false },
  { name: 'T-Bar Row', muscleGroups: ['Back', 'Biceps'], equipment: 'Barbell', isCustom: false },
  { name: 'Face Pulls', muscleGroups: ['Back', 'Shoulders'], equipment: 'Cable', isCustom: false },
  { name: 'Rack Pulls', muscleGroups: ['Back'], equipment: 'Barbell', isCustom: false },
  { name: 'Straight Arm Pulldown', muscleGroups: ['Back'], equipment: 'Cable', isCustom: false },

  // Shoulders
  { name: 'Overhead Press', muscleGroups: ['Shoulders', 'Triceps'], equipment: 'Barbell', isCustom: false },
  { name: 'Dumbbell Shoulder Press', muscleGroups: ['Shoulders', 'Triceps'], equipment: 'Dumbbells', isCustom: false },
  { name: 'Arnold Press', muscleGroups: ['Shoulders', 'Triceps'], equipment: 'Dumbbells', isCustom: false },
  { name: 'Lateral Raises', muscleGroups: ['Shoulders'], equipment: 'Dumbbells', isCustom: false },
  { name: 'Front Raises', muscleGroups: ['Shoulders'], equipment: 'Dumbbells', isCustom: false },
  { name: 'Rear Delt Flyes', muscleGroups: ['Shoulders', 'Back'], equipment: 'Dumbbells', isCustom: false },
  { name: 'Upright Row', muscleGroups: ['Shoulders', 'Traps'], equipment: 'Barbell', isCustom: false },
  { name: 'Shrugs', muscleGroups: ['Traps'], equipment: 'Dumbbells', isCustom: false },
  { name: 'Machine Shoulder Press', muscleGroups: ['Shoulders', 'Triceps'], equipment: 'Machine', isCustom: false },

  // Biceps
  { name: 'Barbell Curl', muscleGroups: ['Biceps'], equipment: 'Barbell', isCustom: false },
  { name: 'Dumbbell Curl', muscleGroups: ['Biceps'], equipment: 'Dumbbells', isCustom: false },
  { name: 'Hammer Curl', muscleGroups: ['Biceps', 'Forearms'], equipment: 'Dumbbells', isCustom: false },
  { name: 'Preacher Curl', muscleGroups: ['Biceps'], equipment: 'Barbell', isCustom: false },
  { name: 'Incline Dumbbell Curl', muscleGroups: ['Biceps'], equipment: 'Dumbbells', isCustom: false },
  { name: 'Cable Curl', muscleGroups: ['Biceps'], equipment: 'Cable', isCustom: false },
  { name: 'Concentration Curl', muscleGroups: ['Biceps'], equipment: 'Dumbbells', isCustom: false },
  { name: 'EZ Bar Curl', muscleGroups: ['Biceps'], equipment: 'Barbell', isCustom: false },

  // Triceps
  { name: 'Tricep Pushdown', muscleGroups: ['Triceps'], equipment: 'Cable', isCustom: false },
  { name: 'Overhead Tricep Extension', muscleGroups: ['Triceps'], equipment: 'Cable', isCustom: false },
  { name: 'Skull Crushers', muscleGroups: ['Triceps'], equipment: 'Barbell', isCustom: false },
  { name: 'Close Grip Bench Press', muscleGroups: ['Triceps', 'Chest'], equipment: 'Barbell', isCustom: false },
  { name: 'Tricep Dips', muscleGroups: ['Triceps', 'Chest'], equipment: 'Bodyweight', isCustom: false },
  { name: 'Diamond Push-ups', muscleGroups: ['Triceps', 'Chest'], equipment: 'Bodyweight', isCustom: false },
  { name: 'Dumbbell Tricep Extension', muscleGroups: ['Triceps'], equipment: 'Dumbbells', isCustom: false },
  { name: 'Tricep Kickback', muscleGroups: ['Triceps'], equipment: 'Dumbbells', isCustom: false },

  // Legs - Quadriceps
  { name: 'Barbell Squat', muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'], equipment: 'Barbell', isCustom: false },
  { name: 'Front Squat', muscleGroups: ['Quadriceps', 'Core'], equipment: 'Barbell', isCustom: false },
  { name: 'Leg Press', muscleGroups: ['Quadriceps', 'Glutes'], equipment: 'Machine', isCustom: false },
  { name: 'Hack Squat', muscleGroups: ['Quadriceps', 'Glutes'], equipment: 'Machine', isCustom: false },
  { name: 'Leg Extension', muscleGroups: ['Quadriceps'], equipment: 'Machine', isCustom: false },
  { name: 'Goblet Squat', muscleGroups: ['Quadriceps', 'Glutes'], equipment: 'Dumbbells', isCustom: false },
  { name: 'Bulgarian Split Squat', muscleGroups: ['Quadriceps', 'Glutes'], equipment: 'Dumbbells', isCustom: false },
  { name: 'Lunges', muscleGroups: ['Quadriceps', 'Glutes'], equipment: 'Dumbbells', isCustom: false },
  { name: 'Walking Lunges', muscleGroups: ['Quadriceps', 'Glutes'], equipment: 'Dumbbells', isCustom: false },
  { name: 'Step-ups', muscleGroups: ['Quadriceps', 'Glutes'], equipment: 'Dumbbells', isCustom: false },

  // Legs - Hamstrings
  { name: 'Romanian Deadlift', muscleGroups: ['Hamstrings', 'Glutes', 'Back'], equipment: 'Barbell', isCustom: false },
  { name: 'Leg Curl', muscleGroups: ['Hamstrings'], equipment: 'Machine', isCustom: false },
  { name: 'Seated Leg Curl', muscleGroups: ['Hamstrings'], equipment: 'Machine', isCustom: false },
  { name: 'Stiff Leg Deadlift', muscleGroups: ['Hamstrings', 'Glutes'], equipment: 'Barbell', isCustom: false },
  { name: 'Good Mornings', muscleGroups: ['Hamstrings', 'Back'], equipment: 'Barbell', isCustom: false },
  { name: 'Nordic Curl', muscleGroups: ['Hamstrings'], equipment: 'Bodyweight', isCustom: false },

  // Legs - Glutes
  { name: 'Hip Thrust', muscleGroups: ['Glutes', 'Hamstrings'], equipment: 'Barbell', isCustom: false },
  { name: 'Glute Bridge', muscleGroups: ['Glutes'], equipment: 'Bodyweight', isCustom: false },
  { name: 'Cable Kickback', muscleGroups: ['Glutes'], equipment: 'Cable', isCustom: false },
  { name: 'Sumo Deadlift', muscleGroups: ['Glutes', 'Hamstrings', 'Back'], equipment: 'Barbell', isCustom: false },

  // Calves
  { name: 'Standing Calf Raise', muscleGroups: ['Calves'], equipment: 'Machine', isCustom: false },
  { name: 'Seated Calf Raise', muscleGroups: ['Calves'], equipment: 'Machine', isCustom: false },
  { name: 'Donkey Calf Raise', muscleGroups: ['Calves'], equipment: 'Machine', isCustom: false },
  { name: 'Single Leg Calf Raise', muscleGroups: ['Calves'], equipment: 'Bodyweight', isCustom: false },

  // Core
  { name: 'Plank', muscleGroups: ['Core'], equipment: 'Bodyweight', isCustom: false },
  { name: 'Crunches', muscleGroups: ['Core'], equipment: 'Bodyweight', isCustom: false },
  { name: 'Hanging Leg Raise', muscleGroups: ['Core'], equipment: 'Bodyweight', isCustom: false },
  { name: 'Cable Crunch', muscleGroups: ['Core'], equipment: 'Cable', isCustom: false },
  { name: 'Ab Wheel Rollout', muscleGroups: ['Core'], equipment: 'Bodyweight', isCustom: false },
  { name: 'Russian Twist', muscleGroups: ['Core'], equipment: 'Bodyweight', isCustom: false },
  { name: 'Dead Bug', muscleGroups: ['Core'], equipment: 'Bodyweight', isCustom: false },
  { name: 'Mountain Climbers', muscleGroups: ['Core'], equipment: 'Bodyweight', isCustom: false },
  { name: 'Side Plank', muscleGroups: ['Core'], equipment: 'Bodyweight', isCustom: false },
  { name: 'Decline Sit-ups', muscleGroups: ['Core'], equipment: 'Bodyweight', isCustom: false },
]

export const muscleGroups = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Forearms',
  'Quadriceps',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Core',
  'Traps'
]

export const equipmentTypes = [
  'Barbell',
  'Dumbbells',
  'Cable',
  'Machine',
  'Bodyweight'
]
