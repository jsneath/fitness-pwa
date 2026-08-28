// Browse metadata for the exercise picker.
// Muscle first, then kit type — the way people actually hunt for a movement
// on the gym floor ("I want a chest machine", "a cable for laterals").

export const MUSCLE_TILES = [
  { id: 'Chest', label: 'Chest', hint: 'Presses & flyes', tint: 'from-rose-500 to-orange-400' },
  { id: 'Back', label: 'Back', hint: 'Rows & pulldowns', tint: 'from-sky-500 to-indigo-500' },
  { id: 'Shoulders', label: 'Shoulders', hint: 'Presses & raises', tint: 'from-amber-400 to-orange-500' },
  { id: 'Biceps', label: 'Biceps', hint: 'Curls', tint: 'from-fuchsia-500 to-pink-500' },
  { id: 'Triceps', label: 'Triceps', hint: 'Pushdowns & extensions', tint: 'from-violet-500 to-purple-500' },
  { id: 'Quadriceps', label: 'Quads', hint: 'Squats & leg press', tint: 'from-blue-500 to-cyan-500' },
  { id: 'Hamstrings', label: 'Hamstrings', hint: 'Hinges & curls', tint: 'from-teal-500 to-emerald-500' },
  { id: 'Glutes', label: 'Glutes', hint: 'Thrusts & kickbacks', tint: 'from-pink-500 to-rose-500' },
  { id: 'Calves', label: 'Calves', hint: 'Raises', tint: 'from-lime-500 to-green-600' },
  { id: 'Core', label: 'Core', hint: 'Abs & anti-rotation', tint: 'from-emerald-400 to-teal-500' },
  { id: 'Traps', label: 'Traps', hint: 'Shrugs', tint: 'from-slate-500 to-slate-700' },
  { id: 'Forearms', label: 'Forearms', hint: 'Grips & curls', tint: 'from-stone-500 to-neutral-600' },
  { id: 'Adductors', label: 'Adductors', hint: 'Inner thigh', tint: 'from-cyan-500 to-blue-600' },
]

export const EQUIPMENT_CATEGORIES = [
  { id: 'all', label: 'All', types: null },
  { id: 'free-weights', label: 'Free weights', types: ['Barbell', 'Dumbbells', 'Kettlebell'] },
  { id: 'cable', label: 'Cables', types: ['Cable'] },
  { id: 'machine', label: 'Machines', types: ['Machine'] },
  { id: 'bodyweight', label: 'Bodyweight', types: ['Bodyweight'] },
  { id: 'bands', label: 'Bands', types: ['Bands'] },
]

export function equipmentCategoryFor(equipment) {
  return EQUIPMENT_CATEGORIES.find(
    (cat) => cat.types && cat.types.includes(equipment)
  ) || { id: 'other', label: 'Other', types: [] }
}

export function matchesEquipmentCategory(exercise, categoryId) {
  if (!categoryId || categoryId === 'all') return true
  const cat = EQUIPMENT_CATEGORIES.find((c) => c.id === categoryId)
  if (!cat?.types) return true
  return cat.types.includes(exercise.equipment)
}
