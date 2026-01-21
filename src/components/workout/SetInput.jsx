import { useState, useEffect, useRef } from 'react'
import { Button } from '../common'

export default function SetInput({ onSave, previousSet = null, weightUnit = 'kg', suggestion = null }) {
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [rpe, setRpe] = useState(null)
  const [isWarmup, setIsWarmup] = useState(false)
  const [initialized, setInitialized] = useState(false)
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
      onSave({
        weight: weightNum,
        reps: repsNum,
        rpe,
        isWarmup
      })
      // Keep the weight for next set, just reset reps
      setReps('')
      setRpe(null)
      setIsWarmup(false)
    }
  }

  const weightNum = parseFloat(weight) || 0
  const repsNum = parseInt(reps) || 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      {/* Weight Input */}
      <div>
        <label className="text-sm font-medium text-gray-600 block mb-2">
          Weight ({weightUnit})
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => adjustWeight(-weightIncrement)}
            className="w-14 h-14 rounded-xl bg-gray-100 text-2xl font-bold text-gray-700 active:bg-gray-200 flex items-center justify-center"
          >
            -
          </button>
          <input
            ref={weightInputRef}
            type="number"
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            onFocus={handleFocus}
            className="flex-1 text-center text-3xl font-bold py-2 border-b-2 border-gray-200 focus:border-blue-500 focus:outline-none"
            placeholder="0"
          />
          <button
            onClick={() => adjustWeight(weightIncrement)}
            className="w-14 h-14 rounded-xl bg-gray-100 text-2xl font-bold text-gray-700 active:bg-gray-200 flex items-center justify-center"
          >
            +
          </button>
        </div>
      </div>

      {/* Reps Input */}
      <div>
        <label className="text-sm font-medium text-gray-600 block mb-2">
          Reps
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => adjustReps(-1)}
            className="w-14 h-14 rounded-xl bg-gray-100 text-2xl font-bold text-gray-700 active:bg-gray-200 flex items-center justify-center"
          >
            -
          </button>
          <input
            ref={repsInputRef}
            type="number"
            inputMode="numeric"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            onFocus={handleFocus}
            className="flex-1 text-center text-3xl font-bold py-2 border-b-2 border-gray-200 focus:border-blue-500 focus:outline-none"
            placeholder="0"
          />
          <button
            onClick={() => adjustReps(1)}
            className="w-14 h-14 rounded-xl bg-gray-100 text-2xl font-bold text-gray-700 active:bg-gray-200 flex items-center justify-center"
          >
            +
          </button>
        </div>
      </div>

      {/* RPE Selector (Optional) */}
      <div>
        <label className="text-sm font-medium text-gray-600 block mb-2">
          RPE (Optional)
        </label>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((value) => (
            <button
              key={value}
              onClick={() => setRpe(rpe === value ? null : value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                rpe === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="flex items-center gap-4 flex-wrap">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isWarmup}
            onChange={(e) => setIsWarmup(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Warmup Set</span>
        </label>

        {previousSet && (
          <button
            onClick={copyPrevious}
            className="text-sm text-blue-600 font-medium"
          >
            Copy Previous
          </button>
        )}

        {suggestion && suggestion.hasHistory && !previousSet && (
          <button
            onClick={useSuggestion}
            className="text-sm text-green-600 font-medium"
          >
            Use Suggestion
          </button>
        )}
      </div>

      {/* Save Button */}
      <Button
        fullWidth
        size="lg"
        onClick={handleSave}
        disabled={weightNum <= 0 || repsNum <= 0}
      >
        Log Set
      </Button>
    </div>
  )
}
