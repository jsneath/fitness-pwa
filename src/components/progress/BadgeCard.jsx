import { motion } from 'framer-motion'

// Badge definitions
export const BADGES = {
  first_workout: {
    id: 'first_workout',
    name: 'First Workout',
    description: 'Complete your first workout',
    emoji: '🏋️',
    requirement: 1,
    type: 'workouts'
  },
  week_warrior: {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: '7-day workout streak',
    emoji: '🔥',
    requirement: 7,
    type: 'streak'
  },
  iron_will: {
    id: 'iron_will',
    name: 'Iron Will',
    description: '30-day workout streak',
    emoji: '💎',
    requirement: 30,
    type: 'streak'
  },
  pr_crusher: {
    id: 'pr_crusher',
    name: 'PR Crusher',
    description: 'Set 10 personal records',
    emoji: '🏆',
    requirement: 10,
    type: 'prs'
  },
  century_club: {
    id: 'century_club',
    name: 'Century Club',
    description: 'Complete 100 workouts',
    emoji: '💯',
    requirement: 100,
    type: 'workouts'
  },
  volume_king: {
    id: 'volume_king',
    name: 'Volume King',
    description: 'Lift 100,000kg total',
    emoji: '👑',
    requirement: 100000,
    type: 'volume'
  },
  consistency: {
    id: 'consistency',
    name: 'Consistent',
    description: 'Work out 4+ times per week for 4 weeks',
    emoji: '⭐',
    requirement: 16,
    type: 'consistency'
  },
  early_bird: {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Complete 10 workouts before 8am',
    emoji: '🌅',
    requirement: 10,
    type: 'early'
  }
}

export default function BadgeCard({ badge, earned = false, progress = 0, onClick }) {
  const progressPercent = Math.min((progress / badge.requirement) * 100, 100)

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full p-4 rounded-2xl border transition-all text-left ${
        earned
          ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800'
          : 'bg-white dark:bg-dark-surface border-slate-200 dark:border-dark-border'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Emoji/Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
            earned
              ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30'
              : 'bg-slate-100 dark:bg-dark-surface-elevated grayscale'
          }`}
        >
          {badge.emoji}
        </motion.div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold truncate ${
            earned
              ? 'text-amber-900 dark:text-amber-200'
              : 'text-slate-800 dark:text-slate-200'
          }`}>
            {badge.name}
          </h4>
          <p className={`text-xs truncate ${
            earned
              ? 'text-amber-700 dark:text-amber-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}>
            {badge.description}
          </p>

          {/* Progress bar */}
          {!earned && (
            <div className="mt-2">
              <div className="h-1.5 bg-slate-200 dark:bg-dark-border rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                />
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                {progress} / {badge.requirement}
              </p>
            </div>
          )}
        </div>

        {/* Earned indicator */}
        {earned && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </motion.div>
        )}
      </div>
    </motion.button>
  )
}

// Helper function to check badge progress
export function checkBadgeProgress(badge, stats) {
  switch (badge.type) {
    case 'workouts':
      return stats.totalWorkouts || 0
    case 'streak':
      return stats.currentStreak || 0
    case 'prs':
      return stats.totalPRs || 0
    case 'volume':
      return stats.totalVolume || 0
    case 'consistency':
      return stats.consistentWeeks || 0
    case 'early':
      return stats.earlyWorkouts || 0
    default:
      return 0
  }
}
