import { useState } from 'react'
import { motion } from 'framer-motion'

export default function NotificationStep({ enabled, onToggle }) {
  const [permissionState, setPermissionState] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  )

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') {
      onToggle(false)
      return
    }

    try {
      const permission = await Notification.requestPermission()
      setPermissionState(permission)
      onToggle(permission === 'granted')
    } catch (error) {
      console.error('Notification permission error:', error)
      onToggle(false)
    }
  }

  const isGranted = permissionState === 'granted'
  const isDenied = permissionState === 'denied'

  return (
    <div className="px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="text-6xl mb-4"
        >
          🔔
        </motion.div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Stay on Track
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Get reminders to keep your streak going
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-dark-surface rounded-2xl p-6 border border-slate-200 dark:border-dark-border"
      >
        {isDenied ? (
          <div className="text-center">
            <div className="text-4xl mb-3">🚫</div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Notifications are blocked. You can enable them in your browser settings.
            </p>
          </div>
        ) : isGranted ? (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-4xl mb-3"
            >
              ✅
            </motion.div>
            <p className="text-emerald-600 dark:text-emerald-400 font-medium">
              Notifications enabled!
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              We'll remind you to stay consistent
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⏰</span>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Workout Reminders</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Daily nudge at your preferred time</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔥</span>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Streak Alerts</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Don't break your streak</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏆</span>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Achievement Updates</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Celebrate your wins</p>
                </div>
              </div>
            </div>

            <button
              onClick={requestPermission}
              className="w-full py-3 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-colors"
            >
              Enable Notifications
            </button>
          </>
        )}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-sm text-slate-400 dark:text-slate-500 mt-6"
      >
        You can change this anytime in Settings
      </motion.p>
    </div>
  )
}
