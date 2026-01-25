import { motion } from 'framer-motion'

const insightTypes = {
  improvement: {
    icon: '📈',
    bgClass: 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
    textClass: 'text-emerald-800 dark:text-emerald-200'
  },
  warning: {
    icon: '⚠️',
    bgClass: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
    borderClass: 'border-amber-200 dark:border-amber-800',
    textClass: 'text-amber-800 dark:text-amber-200'
  },
  achievement: {
    icon: '🏆',
    bgClass: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
    borderClass: 'border-purple-200 dark:border-purple-800',
    textClass: 'text-purple-800 dark:text-purple-200'
  },
  tip: {
    icon: '💡',
    bgClass: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
    borderClass: 'border-blue-200 dark:border-blue-800',
    textClass: 'text-blue-800 dark:text-blue-200'
  },
  streak: {
    icon: '🔥',
    bgClass: 'bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20',
    borderClass: 'border-orange-200 dark:border-orange-800',
    textClass: 'text-orange-800 dark:text-orange-200'
  }
}

export default function InsightCard({ type = 'tip', title, description, metric, metricLabel }) {
  const style = insightTypes[type] || insightTypes.tip

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-4 rounded-2xl border ${style.bgClass} ${style.borderClass}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{style.icon}</span>
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold ${style.textClass}`}>
            {title}
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            {description}
          </p>

          {metric !== undefined && (
            <div className="mt-2 inline-flex items-baseline gap-1 bg-white/50 dark:bg-black/20 rounded-lg px-2 py-1">
              <span className={`text-lg font-bold ${style.textClass}`}>
                {typeof metric === 'number' ? metric.toLocaleString() : metric}
              </span>
              {metricLabel && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {metricLabel}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Generate insights from stats
export function generateInsights(stats) {
  const insights = []

  // Improvement insights
  if (stats.e1rmChange > 0) {
    insights.push({
      type: 'improvement',
      title: 'Strength Gains!',
      description: `Your estimated 1RM has improved by ${stats.e1rmChange}kg this month`,
      metric: `+${stats.e1rmChange}`,
      metricLabel: 'kg'
    })
  }

  // Streak insights
  if (stats.currentStreak >= 7) {
    insights.push({
      type: 'streak',
      title: 'On Fire!',
      description: `You've maintained a ${stats.currentStreak}-day workout streak`,
      metric: stats.currentStreak,
      metricLabel: 'days'
    })
  }

  // Volume insights
  if (stats.volumeChangePercent > 10) {
    insights.push({
      type: 'improvement',
      title: 'Volume Up',
      description: 'Your weekly training volume has increased significantly',
      metric: `+${stats.volumeChangePercent}%`,
      metricLabel: ''
    })
  }

  // Warning insights
  if (stats.missedDays >= 3) {
    insights.push({
      type: 'warning',
      title: 'Getting Rusty',
      description: `It's been ${stats.missedDays} days since your last workout`,
      metric: stats.missedDays,
      metricLabel: 'days'
    })
  }

  // Achievement insights
  if (stats.recentPRs > 0) {
    insights.push({
      type: 'achievement',
      title: 'New Personal Records!',
      description: `You set ${stats.recentPRs} new PR${stats.recentPRs > 1 ? 's' : ''} this week`,
      metric: stats.recentPRs,
      metricLabel: 'PRs'
    })
  }

  // Tip insights
  if (stats.averageRir > 3) {
    insights.push({
      type: 'tip',
      title: 'Push Harder',
      description: 'Your average RIR is high. Consider increasing intensity.',
      metric: stats.averageRir,
      metricLabel: 'avg RIR'
    })
  }

  return insights
}
