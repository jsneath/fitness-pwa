import { motion } from 'framer-motion'

const goals = [
  {
    id: 'strength',
    emoji: '🏋️',
    title: 'Build Strength',
    description: 'Increase your lifts and get stronger'
  },
  {
    id: 'muscle',
    emoji: '💪',
    title: 'Build Muscle',
    description: 'Gain size and improve physique'
  },
  {
    id: 'endurance',
    emoji: '🏃',
    title: 'Improve Endurance',
    description: 'Better stamina and conditioning'
  },
  {
    id: 'weight-loss',
    emoji: '⚡',
    title: 'Lose Weight',
    description: 'Burn fat and improve body composition'
  }
]

export default function GoalsStep({ selectedGoals = [], onSelect }) {
  const toggleGoal = (goalId) => {
    if (selectedGoals.includes(goalId)) {
      onSelect(selectedGoals.filter(g => g !== goalId))
    } else {
      onSelect([...selectedGoals, goalId])
    }
  }

  return (
    <div className="px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          What are your goals?
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Select all that apply
        </p>
      </motion.div>

      <div className="space-y-3">
        {goals.map((goal, index) => {
          const isSelected = selectedGoals.includes(goal.id)
          return (
            <motion.button
              key={goal.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => toggleGoal(goal.id)}
              className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-4 ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface hover:border-slate-300 dark:hover:border-dark-border-subtle'
              }`}
            >
              <span className="text-3xl">{goal.emoji}</span>
              <div className="flex-1">
                <h3 className={`font-semibold ${
                  isSelected
                    ? 'text-indigo-700 dark:text-indigo-300'
                    : 'text-slate-900 dark:text-white'
                }`}>
                  {goal.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {goal.description}
                </p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-500'
                  : 'border-slate-300 dark:border-dark-border'
              }`}>
                {isSelected && (
                  <motion.svg
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-4 h-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </motion.svg>
                )}
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
