import { useState, useEffect } from 'react'
import { Card } from '../common'
import SetInput from './SetInput'
import { useWorkout } from '../../context/WorkoutContext'
import { getProgressionSuggestion } from '../../db/database'

export default function ExerciseCard({ exercise, exerciseIndex, weightUnit = 'kg', templateInfo = null }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [suggestion, setSuggestion] = useState(null)
  const { addSet, deleteSet, removeExerciseFromWorkout, activeWorkout } = useWorkout()

  // Get template info from activeWorkout if not provided via props
  const effectiveTemplateInfo = templateInfo || (activeWorkout ? {
    templateId: activeWorkout.templateId,
    programmeId: activeWorkout.programmeId,
    weekNumber: activeWorkout.weekNumber
  } : null)

  // Load progressive overload suggestion
  useEffect(() => {
    const loadSuggestion = async () => {
      if (effectiveTemplateInfo?.templateId && exercise.templateExerciseId) {
        const templateExercise = {
          minReps: exercise.minReps || 8,
          maxReps: exercise.maxReps || 12
        }
        const sug = await getProgressionSuggestion(
          effectiveTemplateInfo.programmeId,
          exercise.id,
          effectiveTemplateInfo.templateId,
          templateExercise
        )
        setSuggestion(sug)
      }
    }
    loadSuggestion()
  }, [effectiveTemplateInfo, exercise])

  const handleSaveSet = (setData) => {
    addSet(exerciseIndex, setData)
  }

  const previousSet = exercise.sets.length > 0
    ? exercise.sets[exercise.sets.length - 1]
    : null

  const totalVolume = exercise.sets
    .filter((s) => !s.isWarmup)
    .reduce((sum, set) => sum + set.weight * set.reps, 0)

  const targetSets = exercise.targetSets || 3
  const completedSets = exercise.sets.filter((s) => !s.isWarmup).length

  return (
    <Card className="p-0 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{exercise.name}</h3>
          <p className="text-sm text-gray-500">
            {completedSets}/{targetSets} sets
            {totalVolume > 0 && ` • ${totalVolume.toLocaleString()} ${weightUnit}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (confirm('Remove this exercise?')) {
                removeExerciseFromWorkout(exerciseIndex)
              }
            }}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-100">
          {/* Progressive Overload Suggestion */}
          {suggestion && suggestion.hasHistory && exercise.sets.length === 0 && (
            <div className="p-3 bg-blue-50 border-b border-blue-100">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    {suggestion.message}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Last week: {suggestion.lastWeight}{weightUnit} × {suggestion.lastReps} reps
                    {suggestion.lastRpe && ` @ RPE ${suggestion.lastRpe}`}
                  </p>
                </div>
              </div>
            </div>
          )}


          {/* Target info */}
          {exercise.minReps && exercise.maxReps && exercise.sets.length === 0 && (
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-sm text-gray-600">
              Target: {exercise.targetSets || 3} sets × {exercise.minReps}-{exercise.maxReps} reps
            </div>
          )}

          {/* Logged Sets */}
          {exercise.sets.length > 0 && (
            <div className="p-4 space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide px-2">
                <div className="col-span-2">Set</div>
                <div className="col-span-3">Weight</div>
                <div className="col-span-2">Reps</div>
                <div className="col-span-3">RPE</div>
                <div className="col-span-2"></div>
              </div>
              {exercise.sets.map((set, setIndex) => (
                <div
                  key={setIndex}
                  className={`grid grid-cols-12 gap-2 items-center py-2 px-2 rounded-lg ${
                    set.isWarmup ? 'bg-yellow-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="col-span-2 font-medium text-gray-700">
                    {set.isWarmup ? 'W' : setIndex + 1 - exercise.sets.filter((s, i) => i < setIndex && s.isWarmup).length}
                  </div>
                  <div className="col-span-3 font-semibold">
                    {set.weight} {weightUnit}
                  </div>
                  <div className="col-span-2 font-semibold">
                    {set.reps}
                  </div>
                  <div className="col-span-3 text-gray-600">
                    {set.rpe || '-'}
                  </div>
                  <div className="col-span-2 text-right">
                    <button
                      onClick={() => deleteSet(exerciseIndex, setIndex)}
                      className="p-1 rounded text-gray-400 hover:text-red-500"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Set Input */}
          <div className="p-4 bg-gray-50 border-t border-gray-100">
            <SetInput
              onSave={handleSaveSet}
              previousSet={previousSet}
              weightUnit={weightUnit}
              suggestion={suggestion}
            />
          </div>
        </div>
      )}
    </Card>
  )
}
