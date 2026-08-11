// Local-time date handling.
//
// Workouts are filed under a calendar day, and that day has to be the user's
// local one. The app previously derived it with `toISOString().split('T')[0]`,
// which converts to UTC first — so in British Summer Time a session logged at
// 00:30 was filed under the previous day, and any code that took local
// midnight before converting (the streak calculations) was a full day out for
// the seven months of the year the UK is on BST.
//
// Everything here works from the local-time getters instead, and day
// arithmetic goes through the Date constructor's own rollover so it stays
// correct across DST boundaries and month ends.

export const LOCALE = 'en-GB'

/** Local calendar day as 'YYYY-MM-DD'. Never converts to UTC. */
export function toDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Today's local calendar day. */
export function todayKey() {
  return toDateKey(new Date())
}

/**
 * A date key back to a Date at local midday.
 *
 * Midday rather than midnight deliberately: on a spring-forward day local
 * midnight may not exist, and anything doing hour arithmetic from midnight can
 * slip into the previous day. Midday is safely inside every real local day.
 */
export function parseDateKey(key) {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day, 12, 0, 0, 0)
}

/** Shift a date key by whole days. Handles month, year and DST rollover. */
export function shiftDateKey(key, days) {
  const [year, month, day] = key.split('-').map(Number)
  return toDateKey(new Date(year, month - 1, day + days, 12, 0, 0, 0))
}

/** Whole days from `fromKey` to `toKey`; negative when `toKey` is earlier. */
export function daysBetween(fromKey, toKey) {
  const ms = parseDateKey(toKey) - parseDateKey(fromKey)
  // Both anchored at midday, so a DST shift can never push this off a whole day
  return Math.round(ms / 86400000)
}

/**
 * Consecutive-day streak ending today, or yesterday if today isn't trained yet
 * — so the streak doesn't appear broken before you've been to the gym.
 *
 * @param {Iterable<string>} dateKeys  workout dates as 'YYYY-MM-DD'
 * @param {string} [today]             override for testing
 */
export function calculateStreak(dateKeys, today = todayKey()) {
  const trained = new Set(dateKeys)
  if (trained.size === 0) return 0

  let cursor = today
  if (!trained.has(cursor)) {
    cursor = shiftDateKey(today, -1)
    if (!trained.has(cursor)) return 0
  }

  let streak = 0
  while (trained.has(cursor)) {
    streak += 1
    cursor = shiftDateKey(cursor, -1)
  }
  return streak
}

/** The last `count` date keys ending today, oldest first. */
export function recentDateKeys(count, today = todayKey()) {
  const keys = []
  for (let i = count - 1; i >= 0; i--) {
    keys.push(shiftDateKey(today, -i))
  }
  return keys
}

/** 'Today', 'Yesterday', or a weekday-and-date label. */
export function formatRelativeDay(key, today = todayKey()) {
  if (key === today) return 'Today'
  if (key === shiftDateKey(today, -1)) return 'Yesterday'

  const date = parseDateKey(key)
  const sameYear = date.getFullYear() === parseDateKey(today).getFullYear()
  return date.toLocaleDateString(LOCALE, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
}

/** 'August 2026', for grouping history. */
export function formatMonthYear(key) {
  return parseDateKey(key).toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' })
}

/** 'Tue 11 Aug 2026'. */
export function formatLongDate(key) {
  return parseDateKey(key).toLocaleDateString(LOCALE, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** '11 Aug'. */
export function formatShortDate(key) {
  return parseDateKey(key).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' })
}

/**
 * Elapsed time between two ISO timestamps: '45m', '1h 20m', or '<1m'.
 * Returns null when either end is missing, or the range is nonsensical.
 */
export function formatDuration(startIso, endIso) {
  if (!startIso || !endIso) return null

  const ms = new Date(endIso) - new Date(startIso)
  if (!Number.isFinite(ms) || ms < 0) return null
  if (ms < 60000) return '<1m'

  const totalMinutes = Math.round(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}
