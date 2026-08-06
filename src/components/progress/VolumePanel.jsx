import { useLiveQuery } from 'dexie-react-hooks'
import { Card } from '../common'
import VolumeLandmarkBar from './VolumeLandmarkBar'
import { getVolumeBreakdown } from '../../db/volume'
import { getActiveProgramme } from '../../db/database'
import { VOLUME_STATUS } from '../../data/volumeLandmarks'

export default function VolumePanel() {
  const activeProgramme = useLiveQuery(() => getActiveProgramme(), [])

  // Programme weeks are the meaningful unit when one is running; otherwise
  // fall back to a rolling 7 days so the panel still says something useful.
  const weekNumber = activeProgramme?.currentWeek || null
  const programmeId = activeProgramme?.id || null

  const breakdown = useLiveQuery(
    () => getVolumeBreakdown({ programmeId, weekNumber }),
    [programmeId, weekNumber]
  )

  if (!breakdown) {
    return (
      <Card>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
          Loading volume…
        </p>
      </Card>
    )
  }

  const trained = breakdown.filter((m) => m.sets > 0)
  const untrained = breakdown.filter((m) => m.sets === 0)
  const overreaching = trained.filter(
    (m) => m.status === VOLUME_STATUS.OVER_MRV || m.status === VOLUME_STATUS.APPROACHING_MRV
  )

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">
              Weekly Volume
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {activeProgramme
                ? `${activeProgramme.name} — week ${weekNumber}`
                : 'Last 7 days'}
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
          Hard sets per muscle, weighted by how much each exercise trains it.
          A bench press counts as one set for chest but half for triceps.
        </p>
      </Card>

      {trained.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
            No sets logged {activeProgramme ? 'this week' : 'in the last 7 days'} yet.
          </p>
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-slate-100 dark:divide-dark-border">
            {trained.map((muscle) => (
              <VolumeLandmarkBar key={muscle.muscleGroup} {...muscle} />
            ))}
          </div>
        </Card>
      )}

      {overreaching.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800">
          <h4 className="font-semibold text-amber-700 dark:text-amber-400 text-sm mb-1">
            Approaching your ceiling
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {overreaching.map((m) => m.muscleGroup).join(', ')}{' '}
            {overreaching.length === 1 ? 'is' : 'are'} at or near maximum
            recoverable volume. Plan a deload rather than adding more sets.
          </p>
        </Card>
      )}

      {untrained.length > 0 && (
        <Card>
          <h4 className="font-semibold text-slate-700 dark:text-slate-200 text-sm mb-2">
            Not trained {activeProgramme ? 'this week' : 'recently'}
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {untrained.map((m) => (
              <span
                key={m.muscleGroup}
                className="text-[11px] px-2 py-1 rounded-lg bg-slate-100 dark:bg-dark-surface-elevated text-slate-500 dark:text-slate-400"
              >
                {m.muscleGroup}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
