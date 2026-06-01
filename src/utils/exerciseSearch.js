// Shared exercise search helpers.
//
// Goal: make searching forgiving so partial, multi-word, and out-of-order
// queries all work. Typing "lat", "lat raise", "raise lateral", "cable lat",
// or "pushups" should all surface the right exercises.

/**
 * Normalise a string for searching: lowercase, strip accents, and treat
 * hyphens / slashes / underscores as spaces so "Push-ups" matches "push ups"
 * and "pushups".
 */
export function normalizeForSearch(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents/diacritics
    .replace(/[-_/]/g, ' ') // hyphens & slashes become spaces
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Returns true if every word in `query` appears somewhere in the exercise's
 * name, muscle groups, or equipment. Word order doesn't matter.
 */
export function exerciseMatchesQuery(exercise, query) {
  const tokens = normalizeForSearch(query).split(' ').filter(Boolean)
  if (tokens.length === 0) return true

  const haystack = normalizeForSearch(
    [exercise.name, ...(exercise.muscleGroups || []), exercise.equipment]
      .filter(Boolean)
      .join(' ')
  )
  // Space-collapsed copy so "pushups" matches "push ups".
  const compact = haystack.replace(/ /g, '')

  return tokens.every(
    (token) => haystack.includes(token) || compact.includes(token)
  )
}

/** Filter a list of exercises by a free-text query. */
export function filterExercises(exercises, query) {
  if (!exercises) return []
  return exercises.filter((exercise) => exerciseMatchesQuery(exercise, query))
}
