import { useMemo } from 'react'
import { motion } from 'framer-motion'

// Muscle group colors based on workout frequency
const getIntensityColor = (intensity) => {
  if (intensity === 0) return 'fill-slate-200 dark:fill-dark-border'
  if (intensity < 0.3) return 'fill-emerald-200 dark:fill-emerald-900'
  if (intensity < 0.6) return 'fill-emerald-400 dark:fill-emerald-600'
  return 'fill-emerald-500'
}

export default function MuscleMap({ muscleData = {}, view = 'front' }) {
  // Muscle paths for a simplified body diagram
  const musclePaths = {
    front: {
      chest: 'M45 65 Q60 60 75 65 Q80 75 75 85 Q60 90 45 85 Q40 75 45 65',
      shoulders: 'M30 55 Q38 50 45 55 L45 70 Q38 75 30 70 Z M75 55 Q82 50 90 55 L90 70 Q82 75 75 70 Z',
      biceps: 'M25 75 Q30 70 35 75 L35 100 Q30 105 25 100 Z M85 75 Q90 70 95 75 L95 100 Q90 105 85 100 Z',
      forearms: 'M22 105 Q28 102 32 105 L32 130 Q28 133 22 130 Z M88 105 Q92 102 98 105 L98 130 Q92 133 88 130 Z',
      abs: 'M48 90 Q60 88 72 90 Q75 110 72 130 Q60 135 48 130 Q45 110 48 90',
      obliques: 'M35 95 Q42 90 48 95 L48 125 Q42 130 35 125 Z M72 95 Q78 90 85 95 L85 125 Q78 130 72 125 Z',
      quads: 'M40 140 Q50 135 55 140 L55 185 Q50 190 40 185 Z M65 140 Q70 135 80 140 L80 185 Q70 190 65 185 Z',
      calves: 'M42 195 Q48 192 52 195 L52 230 Q48 235 42 230 Z M68 195 Q72 192 78 195 L78 230 Q72 235 68 230 Z'
    },
    back: {
      traps: 'M45 45 Q60 40 75 45 Q78 55 75 60 Q60 55 45 60 Q42 55 45 45',
      lats: 'M35 65 Q48 60 55 65 L55 105 Q48 115 35 105 Z M65 65 Q72 60 85 65 L85 105 Q72 115 65 105 Z',
      'lower back': 'M48 110 Q60 105 72 110 Q74 125 72 135 Q60 140 48 135 Q46 125 48 110',
      glutes: 'M40 140 Q60 135 80 140 Q82 160 80 175 Q60 180 40 175 Q38 160 40 140',
      hamstrings: 'M40 180 Q50 175 55 180 L55 215 Q50 220 40 215 Z M65 180 Q70 175 80 180 L80 215 Q70 220 65 215 Z',
      calves: 'M42 220 Q48 217 52 220 L52 250 Q48 255 42 250 Z M68 220 Q72 217 78 220 L78 250 Q72 255 68 250 Z'
    }
  }

  const currentPaths = musclePaths[view]

  // Calculate intensity based on workout data
  const muscleIntensities = useMemo(() => {
    const maxCount = Math.max(...Object.values(muscleData), 1)
    const intensities = {}

    Object.keys(currentPaths).forEach(muscle => {
      const count = muscleData[muscle] || muscleData[muscle.replace(' ', '')] || 0
      intensities[muscle] = count / maxCount
    })

    return intensities
  }, [muscleData, currentPaths])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white dark:bg-dark-surface rounded-2xl p-4 border border-slate-200 dark:border-dark-border"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">
          Muscle Activity
        </h3>
        <span className="text-xs text-slate-400 dark:text-slate-500 capitalize">
          {view} view
        </span>
      </div>

      <div className="flex justify-center">
        <svg
          viewBox="0 0 120 260"
          className="w-32 h-auto"
          style={{ maxHeight: '200px' }}
        >
          {/* Body outline */}
          <ellipse
            cx="60"
            cy="25"
            rx="18"
            ry="22"
            className="fill-slate-100 dark:fill-dark-surface-elevated stroke-slate-300 dark:stroke-dark-border"
            strokeWidth="1"
          />

          {/* Muscle groups */}
          {Object.entries(currentPaths).map(([muscle, path]) => (
            <motion.path
              key={muscle}
              d={path}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Object.keys(currentPaths).indexOf(muscle) * 0.1 }}
              className={`${getIntensityColor(muscleIntensities[muscle])} stroke-slate-400 dark:stroke-dark-border transition-all duration-300`}
              strokeWidth="0.5"
            />
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-1">
        {Object.entries(muscleIntensities)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([muscle, intensity]) => (
            <div key={muscle} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${getIntensityColor(intensity)}`} />
              <span className="text-xs text-slate-600 dark:text-slate-300 capitalize flex-1">
                {muscle}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {muscleData[muscle] || 0} sets
              </span>
            </div>
          ))}
      </div>
    </motion.div>
  )
}
