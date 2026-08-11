// Runs the date tests under several timezones.
//
// Spawning children with an explicit env avoids shells that mangle zone names
// containing a slash (Git Bash on Windows rewrites Europe/London as a path).
// The date bugs this suite guards against are invisible in UTC, so the
// non-UTC zones are the point.

import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const suite = join(here, 'dates.test.mjs')

const ZONES = [
  'Europe/London',    // the user's zone: BST for ~7 months of the year
  'UTC',              // where the old code happened to be correct
  'America/New_York', // behind UTC, so the bug flips the other way
  'Pacific/Auckland', // far ahead, and DST runs on the opposite schedule
  'Asia/Kolkata',     // half-hour offset
]

let failed = 0
for (const TZ of ZONES) {
  const result = spawnSync(process.execPath, [suite], {
    env: { ...process.env, TZ },
    stdio: 'inherit',
  })
  if (result.status !== 0) failed += 1
}

console.log(
  failed === 0
    ? `\nAll date tests passed in ${ZONES.length} timezones.\n`
    : `\n${failed} of ${ZONES.length} timezones failed.\n`
)
process.exit(failed > 0 ? 1 : 0)
