import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getVolumeLandmarks, updateVolumeLandmark, resetVolumeLandmarks } from '../../db/volume'

const FIELDS = [
  { key: 'mv', label: 'MV', hint: 'Maintenance' },
  { key: 'mev', label: 'MEV', hint: 'Minimum effective' },
  { key: 'mav', label: 'MAV', hint: 'Max adaptive' },
  { key: 'mrv', label: 'MRV', hint: 'Max recoverable' },
]

export default function VolumeLandmarksEditor() {
  const landmarks = useLiveQuery(() => getVolumeLandmarks(), [])
  const [expanded, setExpanded] = useState(null)

  const handleChange = async (muscleGroup, key, rawValue) => {
    const value = Math.max(0, parseInt(rawValue, 10) || 0)
    await updateVolumeLandmark(muscleGroup, { [key]: value })
  }

  const handleReset = async () => {
    if (confirm('Reset all volume landmarks to the default starting values?')) {
      await resetVolumeLandmarks()
    }
  }

  if (!landmarks) return null

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Weekly set targets per muscle. These start from published population
        averages — they vary a lot between people, so tune them to your own
        recovery as you learn where your ceiling actually is.
      </p>

      <div className="divide-y divide-slate-100 dark:divide-dark-border">
        {landmarks.map((landmark) => {
          const isOpen = expanded === landmark.muscleGroup
          return (
            <div key={landmark.muscleGroup} className="py-1">
              <button
                onClick={() => setExpanded(isOpen ? null : landmark.muscleGroup)}
                className="w-full flex items-center justify-between py-2 text-left"
              >
                <span className="font-medium text-sm text-slate-800 dark:text-slate-100">
                  {landmark.muscleGroup}
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    {landmark.mev}–{landmark.mrv} sets
                  </span>
                  <svg
                    className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>

              {isOpen && (
                <div className="grid grid-cols-4 gap-2 pb-3 pt-1">
                  {FIELDS.map(({ key, label, hint }) => (
                    <label key={key} className="block">
                      <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        {label}
                      </span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        value={landmark[key]}
                        onChange={(e) => handleChange(landmark.muscleGroup, key, e.target.value)}
                        className="w-full text-center py-2 rounded-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface text-slate-900 dark:text-white text-sm font-semibold focus:border-indigo-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="block text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 text-center leading-tight">
                        {hint}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <button
        onClick={handleReset}
        className="text-xs font-semibold text-indigo-500 hover:text-indigo-600 transition-colors pt-1"
      >
        Reset to defaults
      </button>
    </div>
  )
}
