import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Header } from '../components/layout'
import { Button, Modal, Card, Input } from '../components/common'
import { ExerciseCard } from '../components/workout'
import { useWorkout } from '../context/WorkoutContext'
import { getAllExercises, getSetting, getTemplateExercises, getExerciseById, getActiveProgramme, getWorkoutTemplates } from '../db/database'

export default function WorkoutPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    activeWorkout,
    exercises,
    startWorkout,
    addExerciseToWorkout,
    finishWorkout,
    cancelWorkout
  } = useWorkout()

  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [showFinishModal, setShowFinishModal] = useState(false)
  const [showStartOptions, setShowStartOptions] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [workoutNotes, setWorkoutNotes] = useState('')
  const [weightUnit, setWeightUnit] = useState('kg')
  const [templateInfo, setTemplateInfo] = useState(null)
  const isLoadingTemplateRef = useRef(false)

  const allExercises = useLiveQuery(() => getAllExercises(), [])
  const activeProgramme = useLiveQuery(() => getActiveProgramme(), [])
  const programmeTemplates = useLiveQuery(
    () => activeProgramme ? getWorkoutTemplates(activeProgramme.id) : [],
    [activeProgramme]
  )

  useEffect(() => {
    getSetting('weightUnit').then((unit) => {
      if (unit) setWeightUnit(unit)
    })
  }, [])

  // Handle starting workout from programme template
  useEffect(() => {
    const state = location.state
    if (state?.templateId && !activeWorkout && !isLoadingTemplateRef.current) {
      startWorkoutFromTemplate(state)
    }
  }, [location.state])

  const startWorkoutFromTemplate = async (state) => {
    // Prevent duplicate loading
    if (isLoadingTemplateRef.current) return
    isLoadingTemplateRef.current = true

    const { templateId, programmeId, weekNumber, templateName } = state

    // Start the workout with template info
    startWorkout(templateId, programmeId, weekNumber)

    // Set template info for UI
    setTemplateInfo({ templateId, programmeId, weekNumber, templateName })
    setWorkoutNotes(templateName)

    // Load exercises from template
    const templateExercises = await getTemplateExercises(templateId)
    for (const te of templateExercises) {
      const exercise = await getExerciseById(te.exerciseId)
      if (exercise) {
        addExerciseToWorkout({
          ...exercise,
          templateExerciseId: te.id,
          targetSets: te.targetSets,
          minReps: te.minReps,
          maxReps: te.maxReps
        })
      }
    }

    // Clear the location state
    navigate('/workout', { replace: true })

    // Reset the loading flag after a short delay
    setTimeout(() => {
      isLoadingTemplateRef.current = false
    }, 100)
  }

  const handleStartFromTemplate = async (template) => {
    if (!activeProgramme) return

    setShowStartOptions(false)
    await startWorkoutFromTemplate({
      templateId: template.id,
      programmeId: activeProgramme.id,
      weekNumber: activeProgramme.currentWeek || 1,
      templateName: template.name
    })
  }

  const filteredExercises = allExercises?.filter((ex) =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const handleSelectExercise = (exercise) => {
    addExerciseToWorkout(exercise)
    setShowExercisePicker(false)
    setSearchQuery('')
  }

  const handleFinishWorkout = async () => {
    // Capture programme info before finishing (activeWorkout gets cleared)
    const programmeId = activeWorkout?.programmeId

    const workoutId = await finishWorkout(workoutNotes)
    if (workoutId) {
      // Navigate back to programme page if this was a programme workout
      if (programmeId) {
        navigate(`/programmes/${programmeId}`)
      } else {
        navigate('/history')
      }
    }
    setTemplateInfo(null)
  }

  const handleCancelWorkout = () => {
    if (exercises.length > 0) {
      if (confirm('Are you sure you want to cancel? All progress will be lost.')) {
        cancelWorkout()
        setTemplateInfo(null)
      }
    } else {
      cancelWorkout()
      setTemplateInfo(null)
    }
  }

  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
  const totalVolume = exercises.reduce(
    (sum, ex) =>
      sum +
      ex.sets
        .filter((s) => !s.isWarmup)
        .reduce((setSum, set) => setSum + set.weight * set.reps, 0),
    0
  )

  // No active workout - show start screen
  if (!activeWorkout) {
    return (
      <>
        <Header title="Workout" />
        <div className="space-y-6 pt-4">
          {/* Active Programme Quick Start */}
          {activeProgramme && programmeTemplates && programmeTemplates.length > 0 && (
            <Card className="animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{activeProgramme.name}</h3>
                    <p className="text-sm text-slate-500">
                      Week {activeProgramme.currentWeek || 1} of {activeProgramme.durationWeeks}
                    </p>
                  </div>
                </div>
                <Link
                  to={`/programmes/${activeProgramme.id}`}
                  className="text-sm text-indigo-500 font-semibold hover:text-indigo-600 transition-colors"
                >
                  View
                </Link>
              </div>
              <div className="space-y-2">
                {programmeTemplates.map((template, index) => (
                  <button
                    key={template.id}
                    onClick={() => handleStartFromTemplate(template)}
                    className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 active:scale-[0.99] transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <span className="font-medium text-slate-800">{template.name}</span>
                    </div>
                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Empty Workout Option */}
          <div className="text-center py-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <p className="text-slate-500 mb-4">
              {activeProgramme ? 'Or start without a template' : 'Start a new workout and log your sets'}
            </p>
            <Button onClick={() => startWorkout()}>
              Start Empty Workout
            </Button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header
        title={templateInfo?.templateName || 'Workout'}
        rightAction={
          <button
            onClick={handleCancelWorkout}
            className="text-red-500 font-semibold hover:text-red-600 transition-colors"
          >
            Cancel
          </button>
        }
      />

      <div className="space-y-4 pt-4 pb-32">
        {/* Week indicator for programme workouts */}
        {templateInfo && (
          <div className="flex items-center gap-2 text-sm text-slate-500 animate-fade-in">
            <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-1 rounded-full font-semibold text-xs shadow-lg shadow-indigo-500/30">
              Week {templateInfo.weekNumber}
            </span>
            <span>Smart suggestions enabled</span>
          </div>
        )}

        {/* Workout Stats */}
        <div className="grid grid-cols-3 gap-3 animate-fade-in">
          <div className="stat-card gradient-primary text-center py-3">
            <div className="text-2xl font-bold text-white">{exercises.length}</div>
            <div className="text-xs text-white/80">Exercises</div>
          </div>
          <div className="stat-card gradient-success text-center py-3">
            <div className="text-2xl font-bold text-white">{totalSets}</div>
            <div className="text-xs text-white/80">Sets</div>
          </div>
          <div className="stat-card gradient-energy text-center py-3">
            <div className="text-2xl font-bold text-white">
              {totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume}
            </div>
            <div className="text-xs text-white/80">Volume ({weightUnit})</div>
          </div>
        </div>

        {/* Exercises */}
        <div className="space-y-4">
          {exercises.map((exercise, index) => (
            <ExerciseCard
              key={`${exercise.id}-${index}`}
              exercise={exercise}
              exerciseIndex={index}
              weightUnit={weightUnit}
              templateInfo={templateInfo}
            />
          ))}
        </div>

        {/* Add Exercise Button */}
        <button
          onClick={() => setShowExercisePicker(true)}
          className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 font-semibold hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all duration-300"
        >
          + Add Exercise
        </button>

        {/* Finish Button */}
        {exercises.length > 0 && totalSets > 0 && (
          <Button
            fullWidth
            size="lg"
            variant="success"
            onClick={() => setShowFinishModal(true)}
          >
            Finish Workout
          </Button>
        )}
      </div>


      {/* Exercise Picker Modal */}
      <Modal
        isOpen={showExercisePicker}
        onClose={() => {
          setShowExercisePicker(false)
          setSearchQuery('')
        }}
        title="Add Exercise"
      >
        <div className="space-y-4">
          <Input
            type="search"
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          <div className="max-h-[50vh] overflow-y-auto space-y-2">
            {filteredExercises.map((exercise) => (
              <button
                key={exercise.id}
                onClick={() => handleSelectExercise(exercise)}
                className="w-full text-left p-3 rounded-xl hover:bg-slate-50 active:bg-slate-100 border border-slate-200 transition-colors"
              >
                <div className="font-medium text-slate-800">{exercise.name}</div>
                <div className="text-sm text-slate-500">
                  {exercise.equipment} • {exercise.muscleGroups.join(', ')}
                </div>
              </button>
            ))}
            {filteredExercises.length === 0 && (
              <p className="text-center text-slate-500 py-4">No exercises found</p>
            )}
          </div>
        </div>
      </Modal>

      {/* Finish Workout Modal */}
      <Modal
        isOpen={showFinishModal}
        onClose={() => setShowFinishModal(false)}
        title="Finish Workout"
      >
        <div className="space-y-4">
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/30">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <p className="text-slate-600 font-medium">
              Great workout! You completed {totalSets} sets.
            </p>
          </div>
          <Input
            label="Workout Notes (optional)"
            value={workoutNotes}
            onChange={(e) => setWorkoutNotes(e.target.value)}
            placeholder="e.g., Push Day, Upper Body..."
          />
          <Button fullWidth size="lg" onClick={handleFinishWorkout}>
            Save Workout
          </Button>
        </div>
      </Modal>
    </>
  )
}
