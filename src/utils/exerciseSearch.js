// Shared exercise search helpers.
//
// Goal: make searching forgiving so partial, multi-word, and out-of-order
// queries all work. Typing "lat", "lat raise", "raise lateral", "cable lat",
// "ohp", "rdl", or "pushups" should all surface the right exercises.

import { EXERCISE_ALIASES, QUERY_SYNONYMS } from '../data/exerciseAliases.js'
import { EQUIPMENT_CATEGORIES, matchesEquipmentCategory } from '../data/exerciseBrowse.js'

/**
 * Normalise a string for searching: lowercase, strip accents, and treat
 * hyphens / slashes / underscores as spaces so "Push-ups" matches "push ups"
 * and "pushups".
 */
export function normalizeForSearch(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents/diacritics
    .replace(/[-_/]/g, ' ') // hyphens & slashes become spaces
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Replace gym shorthand (db, bb, ohp, rdl…) with the words the library uses. */
export function expandSynonyms(query) {
  const tokens = normalizeForSearch(query).split(' ').filter(Boolean)
  if (tokens.length === 0) return ''
  return tokens
    .map((token) => QUERY_SYNONYMS[token] || token)
    .join(' ')
}

function aliasesFor(exercise) {
  if (!exercise?.name) return []
  return EXERCISE_ALIASES[exercise.name.toLowerCase()] || []
}

export function getSearchHaystack(exercise) {
  const aliases = aliasesFor(exercise)
  return normalizeForSearch(
    [exercise.name, ...(exercise.muscleGroups || []), exercise.equipment, ...aliases]
      .filter(Boolean)
      .join(' ')
  )
}

/**
 * Returns true if every word in `query` appears somewhere in the exercise's
 * name, aliases, muscle groups, or equipment. Word order doesn't matter.
 */
export function exerciseMatchesQuery(exercise, query) {
  const tokens = normalizeForSearch(expandSynonyms(query)).split(' ').filter(Boolean)
  if (tokens.length === 0) return true

  const haystack = getSearchHaystack(exercise)
  const compact = haystack.replace(/ /g, '')

  return tokens.every(
    (token) => haystack.includes(token) || compact.includes(token)
  )
}

function hasWord(haystack, phrase) {
  if (!phrase) return false
  return ` ${haystack} `.includes(` ${phrase} `)
}

export function scoreExercise(exercise, query) {
  const expanded = normalizeForSearch(expandSynonyms(query))
  if (!expanded) return 0

  const compactQuery = expanded.replace(/ /g, '')
  const name = normalizeForSearch(exercise.name)
  const nameCompact = name.replace(/ /g, '')
  const aliasList = aliasesFor(exercise).map((a) => normalizeForSearch(a))

  if (name === expanded || nameCompact === compactQuery) return 100
  if (aliasList.some((a) => a === expanded || a.replace(/ /g, '') === compactQuery)) return 92
  if (name.startsWith(expanded) || nameCompact.startsWith(compactQuery)) return 88
  if (hasWord(name, expanded)) return 80
  if (name.includes(expanded) || nameCompact.includes(compactQuery)) return 70
  if (aliasList.some((a) => a.startsWith(expanded) || hasWord(a, expanded))) return 62
  if (aliasList.some((a) => a.includes(expanded))) return 52
  return 24
}

/** Filter a list of exercises by a free-text query. */
export function filterExercises(exercises, query) {
  if (!exercises) return []
  return exercises.filter((exercise) => exerciseMatchesQuery(exercise, query))
}

/** Filter + rank so the movement people meant lands at the top. */
export function rankExercises(exercises, query) {
  const matches = filterExercises(exercises, query)
  if (!normalizeForSearch(query)) return matches
  return [...matches].sort((a, b) => {
    const delta = scoreExercise(b, query) - scoreExercise(a, query)
    if (delta !== 0) return delta
    return a.name.localeCompare(b.name)
  })
}

export function filterExercisesForPicker(exercises, { query = '', muscle = '', equipment = '', requireMuscle = true } = {}) {
  if (!exercises) return []
  return rankExercises(exercises, query).filter((exercise) => {
    const matchesMuscle = !muscle || !requireMuscle || (exercise.muscleGroups || []).includes(muscle)
    const matchesEquipment = matchesEquipmentCategory(exercise, equipment)
    return matchesMuscle && matchesEquipment
  })
}

/** Group a filtered list by kit type, skipping empty groups. */
export function groupByEquipmentCategory(exercises) {
  const groups = EQUIPMENT_CATEGORIES
    .filter((cat) => cat.id !== 'all')
    .map((cat) => ({
      id: cat.id,
      label: cat.label,
      exercises: exercises.filter((ex) => cat.types.includes(ex.equipment)),
    }))
    .filter((group) => group.exercises.length > 0)

  const known = new Set(EQUIPMENT_CATEGORIES.flatMap((cat) => cat.types || []))
  const other = exercises.filter((ex) => !known.has(ex.equipment))
  if (other.length > 0) {
    groups.push({ id: 'other', label: 'Other', exercises: other })
  }
  return groups
}

export function groupByMuscle(exercises) {
  const groups = {}
  exercises.forEach((exercise) => {
    const primary = exercise.muscleGroups?.[0] || 'Other'
    if (!groups[primary]) groups[primary] = []
    groups[primary].push(exercise)
  })
  return groups
}
