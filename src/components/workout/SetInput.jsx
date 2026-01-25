import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../common'
import { calculateE1RM } from '../../db/database'
import EmojiSlider from './EmojiSlider'

export default function SetInput({ onSave, previousSet = null, weightUnit = 'kg', suggestion = null, targetRir = null }) {
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [rir, setRir] = useState(null)
  const [isWarmup, setIsWarmup] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [pumpRating, setPumpRating] = useState(null)
  const [sorenessRating, setSorenessRating] = useState(null)
  const [fatigueRating, setFatigueRating] = useState(null)
  const weightInputRef = useRef(null)
  const repsInputRef = useRef(null)

  const weightIncrement = weightUnit === 'kg' ? 2.5 : 5

  // Initialize with suggestion or previous set - auto-fill for easy logging
  useEffect(() => {
    if (!initialized) {
      if (previousSet) {
        // Copy from previous set in this workout
        setWeight(previousSet.weight)
        setReps(previousSet.reps)
      } else if (suggestion && suggestion.hasHistory) {
        // Auto-fill with smart recommendation
        setWeight(suggestion.suggestedWeight)
        setReps(suggestion.suggestedReps)
      }
      setInitialized(true)
    }
  }, [previousSet, suggestion, initialized])

  // Select all text on focus for easy editing
  const handleFocus = (e) => {
    e.target.select()
  }

  const adjustWeight = (delta) => {
    setWeight((prev) => Math.max(0, (parseFloat(prev) || 0) + delta))
  }

  const adjustReps = (delta) => {
    setReps((prev) => Math.max(0, (parseInt(prev) || 0) + delta))
  }

  const copyPrevious = () => {
    if (previousSet) {
      setWeight(previousSet.weight)
      setReps(previousSet.reps)
    }
  }

  const useSuggestion = () => {
    if (suggestion && suggestion.hasHistory) {
      setWeight(suggestion.suggestedWeight)
      setReps(suggestion.suggestedReps)
    }
  }

  const handleSave = () => {
    const weightNum = parseFloat(weight) || 0
    const repsNum = parseInt(reps) || 0

    if (weightNum > 0 && repsNum > 0) {
      const e1rm = calculateE1RM(weightNum, repsNum)
      onSave({
        weight: weightNum,
        reps: repsNum,
        rir,
        rpe: rir !== null ? 10 - rir : null, // Convert RIR to RPE for backward compatibility
        e1rm,
        isWarmup,
        pumpRating,
        sorenessRating,
        fatigueRating
      })
      // Keep the weight for next set, just reset reps and feedback
      setReps('')
      setRir(null)
      setIsWarmup(false)
      setPumpRating(null)
      setSorenessRating(null)
      setFatigueRating(null)
      setShowFeedback(false)
    }
  }

  const weightNum = parseFloat(weight) || 0
  const repsNum = parseInt(reps) || 0
  const calculatedE1rm = weightNum > 0 && repsNum > 0 ? calculateE1RM(weightNum, repsNum) : null

  // RIR button styling based on value
  const getRirButtonStyle = (value) => {
    if (rir === value) {
      if (value <= 1) return 'bg-red-500 text-white shadow-lg shadow-red-500/30'
      if (value === 2) return 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
      return 'bg-green-500 text-white shadow-lg shadow-green-500/30'
    }
    // Unselected states with color hints
    if (value <= 1) return 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
    if (value === 2) return 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800'
    return 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
  }

  // Feedback button styling
  const getFeedbackButtonStyle = (currentValue, buttonValue, lowColor, highColor) => {
    if (currentValue === buttonValue) {
      return buttonValue <= 2 ? `${lowColor} text-white` : `${highColor} text-white`
    }
    return 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-dark-border p-4 space-y-4">
      {/* Weight Input */}
      <div>
        <label className="text-sm font-medium text-gray-600 dark:text-gray-300 block mb-2">
          Weight ({weightUnit})
        </label>
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => adjustWeight(-weightIncrement)}
            className="w-14 h-14 flex-shrink-0 rounded-xl bg-gray-100 dark:bg-dark-surface-elevated text-2xl font-bold text-gray-700 dark:text-gray-200 active:bg-gray-200 dark:active:bg-dark-border flex items-center justify-center"
          >
            -
          </motion.button>
          <div className="flex-1 min-w-0">
            <input
              ref={weightInputRef}
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              onFocus={handleFocus}
              className="w-full text-center text-3xl font-bold py-2 border-b-2 border-gray-200 dark:border-dark-border bg-transparent text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => adjustWeight(weightIncrement)}
            className="w-14 h-14 flex-shrink-0 rounded-xl bg-gray-100 dark:bg-dark-surface-elevated text-2xl font-bold text-gray-700 dark:text-gray-200 active:bg-gray-200 dark:active:bg-dark-border flex items-center justify-center"
          >
            +
          </motion.button>
        </div>
      </div>

      {/* Reps Input */}
      <div>
        <label className="text-sm font-medium text-gray-600 dark:text-gray-300 block mb-2">
          Reps
        </label>
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => adjustReps(-1)}
            className="w-14 h-14 flex-shrink-0 rounded-xl bg-gray-100 dark:bg-dark-surface-elevated text-2xl font-bold text-gray-700 dark:text-gray-200 active:bg-gray-200 dark:active:bg-dark-border flex items-center justify-center"
          >
            -
          </motion.button>
          <div className="flex-1 min-w-0">
            <input
              ref={repsInputRef}
              type="number"
              inputMode="numeric"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              onFocus={handleFocus}
              className="w-full text-center text-3xl font-bold py-2 border-b-2 border-gray-200 dark:border-dark-border bg-transparent text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => adjustReps(1)}
            className="w-14 h-14 flex-shrink-0 rounded-xl bg-gray-100 dark:bg-dark-surface-elevated text-2xl font-bold text-gray-700 dark:text-gray-200 active:bg-gray-200 dark:active:bg-dark-border flex items-center justify-center"
          >
            +
          </motion.button>
        </div>
      </div>

      {/* e1RM Display */}
      <AnimatePresence>
        {calculatedE1rm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-center gap-2 py-2 px-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg"
          >
            <svg className="w-4 h-4 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
              e1RM: {calculatedE1rm}{weightUnit}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RIR Selector */}
      <div>
        <label className="text-sm font-medium text-gray-600 dark:text-gray-300 block mb-2">
          RIR (Reps In Reserve) {targetRir !== null && <span className="text-indigo-600 dark:text-indigo-400">• Target: {targetRir}</span>}
        </label>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {[0, 1, 2, 3, 4, 5].map((value) => (
            <motion.button
              key={value}
              whileTap={{ scale: 0.95 }}
              onClick={() => setRir(rir === value ? null : value)}
              className={`flex-1 min-w-[48px] py-3 rounded-lg text-sm font-bold transition-colors ${getRirButtonStyle(value)}`}
            >
              {value}
            </motion.button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1 px-1">
          <span>Failure</span>
          <span>Easy</span>
        </div>
      </div>

      {/* Collapsible Feedback Section with Emoji Sliders */}
      <div>
        <button
          onClick={() => setShowFeedback(!showFeedback)}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors w-full"
        >
          <motion.svg
            animate={{ rotate: showFeedback ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </motion.svg>
          Feedback (Optional)
          {(pumpRating || sorenessRating || fatigueRating) && (
            <span className="ml-auto text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full flex items-center gap-1">
              {pumpRating && '💪'}
              {sorenessRating && '😖'}
              {fatigueRating && '😫'}
            </span>
          )}
        </button>

        <AnimatePresence>
          {showFeedback && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-4 p-4 bg-gray-50 dark:bg-dark-surface-elevated rounded-xl">
                <EmojiSlider
                  type="pump"
                  value={pumpRating}
                  onChange={setPumpRating}
                  compact
                />
                <EmojiSlider
                  type="soreness"
                  value={sorenessRating}
                  onChange={setSorenessRating}
                  compact
                />
                <EmojiSlider
                  type="fatigue"
                  value={fatigueRating}
                  onChange={setFatigueRating}
                  compact
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Options */}
      <div className="flex items-center gap-4 flex-wrap">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isWarmup}
            onChange={(e) => setIsWarmup(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 dark:border-dark-border text-indigo-600 focus:ring-indigo-500 dark:bg-dark-surface"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Warmup Set</span>
        </label>

        {previousSet && (
          <button
            onClick={copyPrevious}
            className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
          >
            Copy Previous
          </button>
        )}

        {suggestion && suggestion.hasHistory && !previousSet && (
          <button
            onClick={useSuggestion}
            className="text-sm text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
          >
            Use Suggestion
          </button>
        )}
      </div>

      {/* Save Button */}
      <motion.div whileTap={{ scale: 0.98 }}>
        <Button
          fullWidth
          size="lg"
          onClick={handleSave}
          disabled={weightNum <= 0 || repsNum <= 0}
        >
          Log Set
        </Button>
      </motion.div>
    </div>
  )
}
