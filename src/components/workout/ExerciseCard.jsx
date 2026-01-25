import { useState, useEffect } from 'react'
import { Card } from '../common'
import SetInput from './SetInput'
import { useWorkout } from '../../context/WorkoutContext'
import { getEnhancedProgressionSuggestion, getDefaultRirTarget, db } from '../../db/database'

export default function ExerciseCard({ exercise, exerciseIndex, weightUnit = 'kg', templateInfo = null }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [suggestion, setSuggestion] = useState(null)
  const [targetRir, setTargetRir] = useState(null)
  const { addSet, deleteSet, removeExerciseFromWorkout, activeWorkout } = useWorkout()

  // Get template info from activeWorkout if not provided via props
  const effectiveTemplateInfo = templateInfo || (activeWorkout ? {
    templateId: activeWorkout.templateId,
    programmeId: activeWorkout.programmeId,
    weekNumber: activeWorkout.weekNumber
  } : null)

  // Load progressive overload suggestion with RIR-based logic
  useEffect(() => {
    const loadSuggestion = async () => {
      if (effectiveTemplateInfo?.templateId && exercise.templateExerciseId) {
        const templateExercise = {
          minReps: exercise.minReps || 8,
          maxReps: exercise.maxReps || 12
        }

        // Get programme for RIR targets
        let programme = null
        if (effectiveTemplateInfo.programmeId) {
          programme = await db.programmes.get(effectiveTemplateInfo.programmeId)
        }

        const sug = await getEnhancedProgressionSuggestion(
          effectiveTemplateInfo.programmeId,
          exercise.id,
          effectiveTemplateInfo.templateId,
          templateExercise,
          programme
        )
        setSuggestion(sug)

        // Set target RIR
        if (sug?.targetRir !== undefined) {
          setTargetRir(sug.targetRir)
        } else if (programme) {
          const currentWeek = programme.currentWeek || 1
          const totalWeeks = programme.durationWeeks || 6
          const rirTargets = programme.rirTargets || {}
          setTargetRir(rirTargets[currentWeek] ?? getDefaultRirTarget(currentWeek, totalWeeks))
        }
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

  // Helper to display RIR with color
  const getRirDisplay = (rir) => {
    if (rir === null || rir === undefined) return '-'
    const colors = {
      0: 'text-red-600 font-bold',
      1: 'text-red-500 font-bold',
      2: 'text-orange-500 font-semibold',
      3: 'text-green-600',
      4: 'text-green-500',
      5: 'text-green-400'
    }
    return <span className={colors[rir] || 'text-gray-600'}>{rir}</span>
  }

  return (
    <Card className="p-0 overflow-hidden animate-scale-in">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-dark-surface-elevated/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            completedSets >= targetSets
              ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/30'
              : 'bg-slate-100 dark:bg-dark-surface-elevated'
          }`}>
            {completedSets >= targetSets ? (
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <span className="font-bold text-slate-500 dark:text-slate-400">{completedSets}/{targetSets}</span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">{exercise.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {completedSets}/{targetSets} sets
              {totalVolume > 0 && ` • ${totalVolume.toLocaleString()} ${weightUnit}`}
              {targetRir !== null && (
                <span className="ml-1 text-indigo-600 dark:text-indigo-400">• Target RIR: {targetRir}</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (confirm('Remove this exercise?')) {
                removeExerciseFromWorkout(exerciseIndex)
              }
            }}
            className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
          <svg
            className={`w-5 h-5 text-slate-400 dark:text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-slate-100 dark:border-dark-border">
          {/* Progressive Overload Suggestion */}
          {suggestion && suggestion.hasHistory && exercise.sets.length === 0 && (
            <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border-b border-indigo-100 dark:border-indigo-800">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/30">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
                    {suggestion.message}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                    <span>
                      Last: {suggestion.lastWeight}{weightUnit} × {suggestion.lastReps} reps
                    </span>
                    {suggestion.lastRir !== null && (
                      <span>@ {suggestion.lastRir} RIR</span>
                    )}
                    {suggestion.lastE1rm && (
                      <span>e1RM: {suggestion.lastE1rm}{weightUnit}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Target info */}
          {exercise.minReps && exercise.maxReps && exercise.sets.length === 0 && (
            <div className="px-4 py-2 bg-slate-50 dark:bg-dark-surface-elevated border-b border-slate-100 dark:border-dark-border text-sm text-slate-600 dark:text-slate-300">
              <span className="font-medium">Target:</span> {exercise.targetSets || 3} sets × {exercise.minReps}-{exercise.maxReps} reps
              {targetRir !== null && (
                <span className="ml-2 text-indigo-600 dark:text-indigo-400 font-medium">@ {targetRir} RIR</span>
              )}
            </div>
          )}

          {/* Logged Sets */}
          {exercise.sets.length > 0 && (
            <div className="p-4 space-y-2">
              <div className="grid grid-cols-12 gap-1 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">
                <div className="col-span-1">Set</div>
                <div className="col-span-3">Weight</div>
                <div className="col-span-2">Reps</div>
                <div className="col-span-2">RIR</div>
                <div className="col-span-3">e1RM</div>
                <div className="col-span-1"></div>
              </div>
              {exercise.sets.map((set, setIndex) => (
                <div
                  key={setIndex}
                  className={`grid grid-cols-12 gap-1 items-center py-2.5 px-3 rounded-xl transition-colors ${
                    set.isWarmup ? 'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800' : 'bg-slate-50 dark:bg-dark-surface-elevated'
                  }`}
                >
                  <div className="col-span-1 font-bold text-slate-700 dark:text-slate-200">
                    {set.isWarmup ? 'W' : setIndex + 1 - exercise.sets.filter((s, i) => i < setIndex && s.isWarmup).length}
                  </div>
                  <div className="col-span-3 font-bold text-slate-800 dark:text-slate-100">
                    {set.weight} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">{weightUnit}</span>
                  </div>
                  <div className="col-span-2 font-bold text-slate-800 dark:text-slate-100">
                    {set.reps}
                  </div>
                  <div className="col-span-2">
                    {set.rir !== null && set.rir !== undefined ? getRirDisplay(set.rir) : (set.rpe ? getRirDisplay(10 - set.rpe) : '-')}
                  </div>
                  <div className="col-span-3 text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                    {set.e1rm ? `${set.e1rm}` : '-'}
                  </div>
                  <div className="col-span-1 text-right">
                    <button
                      onClick={() => deleteSet(exerciseIndex, setIndex)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Set Input */}
          <div className="p-4 bg-slate-50 dark:bg-dark-bg border-t border-slate-100 dark:border-dark-border">
            <SetInput
              onSave={handleSaveSet}
              previousSet={previousSet}
              weightUnit={weightUnit}
              suggestion={suggestion}
              targetRir={targetRir}
            />
          </div>
        </div>
      )}
    </Card>
  )
}
