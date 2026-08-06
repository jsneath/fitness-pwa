import { motion } from 'framer-motion'
import { VOLUME_STATUS, VOLUME_STATUS_META } from '../../data/volumeLandmarks'

// Tailwind can't see dynamically-built class names, so the palette is spelled out.
const STATUS_CLASSES = {
  [VOLUME_STATUS.UNDER_MV]: {
    bar: 'bg-slate-400 dark:bg-slate-600',
    pill: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
  },
  [VOLUME_STATUS.MAINTENANCE]: {
    bar: 'bg-sky-400',
    pill: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300',
  },
  [VOLUME_STATUS.ADAPTIVE]: {
    bar: 'bg-emerald-500',
    pill: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  },
  [VOLUME_STATUS.APPROACHING_MRV]: {
    bar: 'bg-amber-500',
    pill: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  },
  [VOLUME_STATUS.OVER_MRV]: {
    bar: 'bg-red-500',
    pill: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  },
}

/**
 * One muscle's weekly set volume, drawn against its MEV/MAV/MRV landmarks.
 * The track runs 0 -> MRV, with tick marks where the landmarks fall.
 */
export default function VolumeLandmarkBar({ muscleGroup, sets, mev, mav, mrv, status }) {
  const scaleMax = Math.max(mrv, sets) * 1.05
  const pct = (value) => `${Math.min(100, (value / scaleMax) * 100)}%`
  const classes = STATUS_CLASSES[status] || STATUS_CLASSES[VOLUME_STATUS.ADAPTIVE]
  const meta = VOLUME_STATUS_META[status]

  return (
    <div className="py-3">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
          {muscleGroup}
        </span>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${classes.pill}`}>
            {meta?.label}
          </span>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200 tabular-nums">
            {sets}
            <span className="text-xs font-normal text-slate-400 dark:text-slate-500"> sets</span>
          </span>
        </div>
      </div>

      <div className="relative h-2.5 rounded-full bg-slate-100 dark:bg-dark-surface-elevated overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: pct(sets) }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`absolute inset-y-0 left-0 rounded-full ${classes.bar}`}
        />
        {/* Landmark ticks sit above the fill */}
        {[mev, mav, mrv].map((value, i) => (
          <div
            key={i}
            className="absolute inset-y-0 w-px bg-slate-400/70 dark:bg-slate-300/40"
            style={{ left: pct(value) }}
          />
        ))}
      </div>

      <div className="relative h-3 mt-0.5 text-[9px] text-slate-400 dark:text-slate-500">
        {[
          { label: 'MEV', value: mev },
          { label: 'MAV', value: mav },
          { label: 'MRV', value: mrv },
        ].map(({ label, value }) => (
          <span
            key={label}
            className="absolute -translate-x-1/2 tabular-nums"
            style={{ left: pct(value) }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
