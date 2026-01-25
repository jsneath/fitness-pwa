import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const sliderConfigs = {
  pump: {
    label: 'Pump',
    emojis: ['', '', '', '', ''],
    lowLabel: 'No pump',
    highLabel: 'Maximum'
  },
  soreness: {
    label: 'Soreness',
    emojis: ['', '', '', '', ''],
    lowLabel: 'None',
    highLabel: 'Very sore'
  },
  fatigue: {
    label: 'Fatigue',
    emojis: ['', '', '', '', ''],
    lowLabel: 'Fresh',
    highLabel: 'Exhausted'
  }
}

export default function EmojiSlider({ type, value, onChange, compact = false }) {
  const config = sliderConfigs[type]
  const [isDragging, setIsDragging] = useState(false)
  const sliderRef = useRef(null)

  const handleSliderChange = (e) => {
    const newValue = parseInt(e.target.value)
    onChange(newValue)

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(5)
    }
  }

  const handleReset = () => {
    onChange(null)
  }

  const currentEmoji = value ? config.emojis[value - 1] : ''

  if (compact) {
    // Compact version - just emoji buttons
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {config.label}
          </span>
          {value && (
            <button
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex gap-1">
          {config.emojis.map((emoji, index) => (
            <motion.button
              key={index}
              onClick={() => onChange(value === index + 1 ? null : index + 1)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`flex-1 py-2 text-lg rounded-lg transition-all ${
                value === index + 1
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/30'
                  : 'bg-slate-100 dark:bg-dark-surface hover:bg-slate-200 dark:hover:bg-dark-surface-elevated'
              }`}
            >
              {emoji}
            </motion.button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {config.label}
        </span>
        <AnimatePresence mode="wait">
          {value && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2"
            >
              <motion.span
                key={value}
                initial={{ scale: 1.5, y: -10 }}
                animate={{ scale: 1, y: 0 }}
                className="text-2xl"
              >
                {currentEmoji}
              </motion.span>
              <button
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                Clear
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative" ref={sliderRef}>
        {/* Background track */}
        <div className="absolute inset-y-0 left-0 right-0 flex items-center">
          <div className="w-full h-2 bg-gradient-to-r from-slate-200 via-slate-200 to-slate-200 dark:from-dark-border dark:via-dark-border dark:to-dark-border rounded-full" />
        </div>

        {/* Filled track */}
        {value && (
          <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
            <motion.div
              className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((value - 1) / 4) * 100}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            />
          </div>
        )}

        {/* Emoji markers */}
        <div className="relative flex justify-between items-center py-4">
          {config.emojis.map((emoji, index) => (
            <motion.button
              key={index}
              onClick={() => onChange(index + 1)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              className={`relative z-10 w-8 h-8 flex items-center justify-center rounded-full transition-all ${
                value === index + 1
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/40 scale-125'
                  : value && value > index + 1
                    ? 'bg-indigo-100 dark:bg-indigo-900/30'
                    : 'bg-slate-100 dark:bg-dark-surface'
              }`}
            >
              <span className={`text-sm transition-transform ${value === index + 1 ? 'scale-110' : ''}`}>
                {emoji}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Hidden range input for accessibility */}
        <input
          type="range"
          min="1"
          max="5"
          value={value || 1}
          onChange={handleSliderChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500">
        <span>{config.lowLabel}</span>
        <span>{config.highLabel}</span>
      </div>
    </div>
  )
}
