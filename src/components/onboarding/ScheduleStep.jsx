import { motion } from 'framer-motion'

const schedules = [
  {
    id: '2-3',
    emoji: '🎯',
    title: '2-3 days per week',
    description: 'Great for maintaining fitness with a busy schedule'
  },
  {
    id: '3-4',
    emoji: '💪',
    title: '3-4 days per week',
    description: 'Ideal balance for most goals'
  },
  {
    id: '5-6',
    emoji: '🔥',
    title: '5-6 days per week',
    description: 'Serious training for dedicated athletes'
  },
  {
    id: 'flexible',
    emoji: '🌊',
    title: 'Flexible',
    description: "I'll train when I can"
  }
]

export default function ScheduleStep({ selected, onSelect }) {
  return (
    <div className="px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          How often do you train?
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Set your weekly training frequency
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        {schedules.map((schedule, index) => {
          const isSelected = selected === schedule.id
          return (
            <motion.button
              key={schedule.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onSelect(schedule.id)}
              className={`p-4 rounded-2xl border-2 transition-all text-center ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface hover:border-slate-300 dark:hover:border-dark-border-subtle'
              }`}
            >
              <motion.span
                className="text-4xl block mb-2"
                animate={isSelected ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {schedule.emoji}
              </motion.span>
              <h3 className={`font-semibold text-sm ${
                isSelected
                  ? 'text-indigo-700 dark:text-indigo-300'
                  : 'text-slate-900 dark:text-white'
              }`}>
                {schedule.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {schedule.description}
              </p>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
