// Run under several timezones — see the `test` script in package.json.
// The bugs these cover only appear away from UTC, so running this in UTC alone
// would have passed against the broken implementation.

import {
  toDateKey,
  parseDateKey,
  shiftDateKey,
  daysBetween,
  calculateStreak,
  recentDateKeys,
  formatRelativeDay,
  formatDuration,
} from '../src/utils/dates.js'

const TZ = process.env.TZ || 'system default'
let pass = 0, fail = 0
const eq = (label, actual, expected) => {
  if (Object.is(actual, expected)) { pass++ }
  else { fail++; console.log(`  FAIL [${TZ}] ${label}\n    expected ${JSON.stringify(expected)}\n    actual   ${JSON.stringify(actual)}`) }
}

console.log(`\n### timezone: ${TZ}`)

console.log('\n== toDateKey uses the local day, not UTC ==')
{
  // 00:30 local on the 11th. Under BST this is 23:30 UTC on the 10th, which is
  // what the old toISOString() approach filed it as.
  const justAfterMidnight = new Date(2026, 7, 11, 0, 30)
  eq('00:30 local is still the 11th', toDateKey(justAfterMidnight), '2026-08-11')

  const lateEvening = new Date(2026, 7, 11, 23, 30)
  eq('23:30 local is still the 11th', toDateKey(lateEvening), '2026-08-11')

  const localMidnight = new Date(2026, 7, 11, 0, 0, 0, 0)
  eq('exact local midnight is the 11th', toDateKey(localMidnight), '2026-08-11')

  // The specific regression: taking local midnight then serialising as UTC.
  const viaUtc = new Date(2026, 7, 11, 0, 0, 0, 0).toISOString().split('T')[0]
  if (viaUtc !== '2026-08-11') {
    console.log(`  (confirmed old approach was wrong here: gave ${viaUtc})`)
  }
}

console.log('\n== day arithmetic ==')
{
  eq('forward one day', shiftDateKey('2026-08-11', 1), '2026-08-12')
  eq('back one day', shiftDateKey('2026-08-11', -1), '2026-08-10')
  eq('across month end', shiftDateKey('2026-08-31', 1), '2026-09-01')
  eq('back across month start', shiftDateKey('2026-09-01', -1), '2026-08-31')
  eq('across year end', shiftDateKey('2026-12-31', 1), '2027-01-01')
  eq('leap day exists', shiftDateKey('2028-02-28', 1), '2028-02-29')
  eq('non-leap February', shiftDateKey('2027-02-28', 1), '2027-03-01')
  eq('zero shift is identity', shiftDateKey('2026-08-11', 0), '2026-08-11')
}

console.log('\n== DST transition days (UK: 29 Mar 2026 forward, 25 Oct 2026 back) ==')
{
  eq('across spring forward', shiftDateKey('2026-03-28', 1), '2026-03-29')
  eq('spring forward day + 1', shiftDateKey('2026-03-29', 1), '2026-03-30')
  eq('across autumn back', shiftDateKey('2026-10-24', 1), '2026-10-25')
  eq('autumn back day + 1', shiftDateKey('2026-10-25', 1), '2026-10-26')

  // A 23-hour and a 25-hour day must both still count as one day
  eq('spring-forward day is 1 day', daysBetween('2026-03-29', '2026-03-30'), 1)
  eq('autumn-back day is 1 day', daysBetween('2026-10-25', '2026-10-26'), 1)
  eq('a week spanning spring forward', daysBetween('2026-03-25', '2026-04-01'), 7)
  eq('a week spanning autumn back', daysBetween('2026-10-22', '2026-10-29'), 7)

  // Round-tripping a key through a Date must be lossless on transition days
  eq('spring forward round-trips', toDateKey(parseDateKey('2026-03-29')), '2026-03-29')
  eq('autumn back round-trips', toDateKey(parseDateKey('2026-10-25')), '2026-10-25')
}

console.log('\n== daysBetween ==')
{
  eq('same day is zero', daysBetween('2026-08-11', '2026-08-11'), 0)
  eq('negative when earlier', daysBetween('2026-08-11', '2026-08-08'), -3)
  eq('across a month', daysBetween('2026-08-28', '2026-09-03'), 6)
}

console.log('\n== streaks ==')
{
  const today = '2026-08-11'
  eq('no workouts', calculateStreak([], today), 0)
  eq('trained today only', calculateStreak([today], today), 1)

  // The headline regression: training today used to yield a streak of 0.
  eq('today counts toward the streak', calculateStreak(['2026-08-11'], today), 1)

  eq('three consecutive days ending today',
    calculateStreak(['2026-08-09', '2026-08-10', '2026-08-11'], today), 3)

  // Not trained today yet — yesterday still holds the streak open
  eq('yesterday keeps the streak alive',
    calculateStreak(['2026-08-09', '2026-08-10'], today), 2)

  eq('a two-day gap breaks it',
    calculateStreak(['2026-08-08', '2026-08-09'], today), 0)

  eq('only the run ending now counts',
    calculateStreak(['2026-08-01', '2026-08-02', '2026-08-10', '2026-08-11'], today), 2)

  eq('duplicate dates counted once',
    calculateStreak(['2026-08-11', '2026-08-11', '2026-08-10'], today), 2)

  eq('streak across a month boundary',
    calculateStreak(['2026-07-30', '2026-07-31', '2026-08-01'], '2026-08-01'), 3)

  eq('streak across spring forward',
    calculateStreak(['2026-03-28', '2026-03-29', '2026-03-30'], '2026-03-30'), 3)

  eq('streak across autumn back',
    calculateStreak(['2026-10-24', '2026-10-25', '2026-10-26'], '2026-10-26'), 3)

  eq('future dates do not inflate the streak',
    calculateStreak(['2026-08-11', '2026-08-12', '2026-08-13'], today), 1)
}

console.log('\n== recentDateKeys ==')
{
  const week = recentDateKeys(7, '2026-08-11')
  eq('returns the right count', week.length, 7)
  eq('oldest first', week[0], '2026-08-05')
  eq('ends today', week[6], '2026-08-11')
  const acrossMonth = recentDateKeys(4, '2026-09-02')
  eq('spans a month boundary', acrossMonth.join(','), '2026-08-30,2026-08-31,2026-09-01,2026-09-02')
}

console.log('\n== streak calendar grid always contains today ==')
{
  // Mirrors StreakCalendar's derivation. The grid used to be anchored on the
  // start of the window, which left the final column on the Saturday before
  // the current week — today was never rendered.
  const buildGrid = (today, weeks = 12) => {
    const endKey = shiftDateKey(today, 6 - parseDateKey(today).getDay())
    const startKey = shiftDateKey(endKey, -(weeks * 7) + 1)
    const cells = []
    for (let w = 0; w < weeks; w++) {
      for (let d = 0; d < 7; d++) cells.push(shiftDateKey(startKey, w * 7 + d))
    }
    return cells
  }

  // Every weekday, and dates around DST and year boundaries
  const probes = [
    '2026-08-11', '2026-08-09', '2026-08-15', // Tue, Sun, Sat
    '2026-03-29', '2026-10-25',               // DST transition days
    '2026-01-01', '2026-12-31', '2028-02-29', // boundaries and a leap day
  ]
  for (const today of probes) {
    const cells = buildGrid(today)
    eq(`${today}: grid contains today`, cells.includes(today), true)
    eq(`${today}: correct cell count`, cells.length, 84)
    eq(`${today}: starts on a Sunday`, parseDateKey(cells[0]).getDay(), 0)
    eq(`${today}: ends on a Saturday`, parseDateKey(cells[cells.length - 1]).getDay(), 6)
    eq(`${today}: no gaps`, daysBetween(cells[0], cells[cells.length - 1]), 83)
    // Yesterday and the rest of this week must be present too
    eq(`${today}: contains yesterday`, cells.includes(shiftDateKey(today, -1)), true)
  }
}

console.log('\n== relative day labels ==')
{
  const today = '2026-08-11'
  eq('today', formatRelativeDay('2026-08-11', today), 'Today')
  eq('yesterday', formatRelativeDay('2026-08-10', today), 'Yesterday')
  const older = formatRelativeDay('2026-08-04', today)
  eq('older days are not mislabelled', older === 'Today' || older === 'Yesterday', false)
}

console.log('\n== durations ==')
{
  eq('missing end', formatDuration('2026-08-11T10:00:00Z', null), null)
  eq('missing start', formatDuration(null, '2026-08-11T10:00:00Z'), null)
  eq('negative range rejected', formatDuration('2026-08-11T11:00:00Z', '2026-08-11T10:00:00Z'), null)
  eq('sub-minute', formatDuration('2026-08-11T10:00:00Z', '2026-08-11T10:00:30Z'), '<1m')
  eq('45 minutes', formatDuration('2026-08-11T10:00:00Z', '2026-08-11T10:45:00Z'), '45m')
  eq('exactly an hour', formatDuration('2026-08-11T10:00:00Z', '2026-08-11T11:00:00Z'), '1h 0m')
  eq('an hour and twenty', formatDuration('2026-08-11T10:00:00Z', '2026-08-11T11:20:00Z'), '1h 20m')
  // A session spanning the autumn clock change is still its real length
  eq('spans autumn clock change',
    formatDuration('2026-10-25T00:30:00Z', '2026-10-25T01:45:00Z'), '1h 15m')
}

console.log(`\n[${TZ}] ${pass} passed, ${fail} failed`)
process.exit(fail > 0 ? 1 : 0)
