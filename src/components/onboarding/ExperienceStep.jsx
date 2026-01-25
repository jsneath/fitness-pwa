import { motion } from 'framer-motion'

const levels = [
  {
    id: 'beginner',
    emoji: '🌱',
    title: 'Beginner',
    description: 'New to working out or returning after a long break',
    detail: 'Less than 6 months of consistent training'
  },
  {
    id: 'intermediate',
    emoji: '🌿',
    title: 'Intermediate',
    description: 'Comfortable with most exercises and gym equipment',
    detail: '6 months to 2 years of training'
  },
  {
    id: 'advanced',
    emoji: '🌳',
    title: 'Advanced',
    description: 'Experienced lifter with solid foundation',
    detail: '2+ years of consistent training'
  }
]

export default function ExperienceStep({ selected, onSelect }) {
  return (
    <div className="px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          What's your experience level?
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          This helps us personalize your experience
        </p>
      </motion.div>

      <div className="space-y-3">
        {levels.map((level, index) => {
          const isSelected = selected === level.id
          return (
            <motion.button
              key={level.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onSelect(level.id)}
              className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface hover:border-slate-300 dark:hover:border-dark-border-subtle'
              }`}
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl">{level.emoji}</span>
                <div className="flex-1">
                  <h3 className={`font-semibold ${
                    isSelected
                      ? 'text-indigo-700 dark:text-indigo-300'
                      : 'text-slate-900 dark:text-white'
                  }`}>
                    {level.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {level.description}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    {level.detail}
                  </p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all mt-1 ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-500'
                    : 'border-slate-300 dark:border-dark-border'
                }`}>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 rounded-full bg-white"
                    />
                  )}
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
