import { useLiveQuery } from 'dexie-react-hooks'
import { getWeeklySetRecommendations, shouldDeload } from '../../db/volume'

function DeltaPill({ delta }) {
  if (delta === 0) {
    return (
      <span className="text-xs font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-dark-surface-elevated text-slate-500 dark:text-slate-400">
        hold
      </span>
    )
  }
  const positive = delta > 0
  return (
    <span
      className={`text-xs font-bold px-2 py-1 rounded-lg tabular-nums ${
        positive
          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
          : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
      }`}
    >
      {positive ? '+' : ''}{delta} sets
    </span>
  )
}

/**
 * Per-muscle set changes for next week, derived from the pump/soreness/fatigue
 * feedback logged during `weekNumber`. Shown when completing a week.
 */
export default function SetRecommendations({ programmeId, weekNumber }) {
  const recommendations = useLiveQuery(
    () => getWeeklySetRecommendations(programmeId, weekNumber),
    [programmeId, weekNumber]
  )

  if (!recommendations) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-3">
        Working out next week's volume…
      </p>
    )
  }

  if (recommendations.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-3">
        No sets logged this week, so there's nothing to progress from.
      </p>
    )
  }

  const deloadAdvised = shouldDeload(recommendations)

  return (
    <div className="space-y-3">
      {deloadAdvised && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            Deload recommended
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
            Several muscles are at their recovery ceiling. Next week, cut sets
            roughly in half and drop the load — you'll come back stronger.
          </p>
        </div>
      )}

      <div className="max-h-[45vh] overflow-y-auto -mx-1 px-1">
        <div className="divide-y divide-slate-100 dark:divide-dark-border">
          {recommendations.map((rec) => (
            <div key={rec.muscleGroup} className="py-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                    {rec.muscleGroup}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 ml-2 tabular-nums">
                    {rec.currentSets} → {rec.nextSets} sets
                  </span>
                </div>
                <DeltaPill delta={rec.delta} />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {rec.reason}
              </p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-slate-400 dark:text-slate-500">
        Weighted sets, based on the pump, soreness and fatigue you logged this
        week — a bench press counts fully for chest but half for triceps, which
        is why totals can land on a half set. Log feedback on more exercises to
        sharpen these.
      </p>
    </div>
  )
}
