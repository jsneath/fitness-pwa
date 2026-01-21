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
            <Card>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{activeProgramme.name}</h3>
                  <p className="text-sm text-gray-500">
                    Week {activeProgramme.currentWeek || 1} of {activeProgramme.durationWeeks}
                  </p>
                </div>
                <Link
                  to={`/programmes/${activeProgramme.id}`}
                  className="text-sm text-blue-600 font-medium"
                >
                  View
                </Link>
              </div>
              <div className="space-y-2">
                {programmeTemplates.map((template, index) => (
                  <button
                    key={template.id}
                    onClick={() => handleStartFromTemplate(template)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <span className="font-medium text-gray-900">{template.name}</span>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Empty Workout Option */}
          <div className="text-center py-8">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="text-gray-500 mb-4">
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
            className="text-red-600 font-medium"
          >
            Cancel
          </button>
        }
      />

      <div className="space-y-4 pt-4 pb-32">
        {/* Week indicator for programme workouts */}
        {templateInfo && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              Week {templateInfo.weekNumber}
            </span>
            <span>Progressive overload suggestions enabled</span>
          </div>
        )}

        {/* Workout Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center py-3">
            <div className="text-2xl font-bold text-gray-900">{exercises.length}</div>
            <div className="text-xs text-gray-500">Exercises</div>
          </Card>
          <Card className="text-center py-3">
            <div className="text-2xl font-bold text-gray-900">{totalSets}</div>
            <div className="text-xs text-gray-500">Sets</div>
          </Card>
          <Card className="text-center py-3">
            <div className="text-2xl font-bold text-gray-900">
              {totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume}
            </div>
            <div className="text-xs text-gray-500">Volume ({weightUnit})</div>
          </Card>
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
          className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:border-blue-400 hover:text-blue-600 transition-colors"
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
                className="w-full text-left p-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 border border-gray-200"
              >
                <div className="font-medium text-gray-900">{exercise.name}</div>
                <div className="text-sm text-gray-500">
                  {exercise.equipment} • {exercise.muscleGroups.join(', ')}
                </div>
              </button>
            ))}
            {filteredExercises.length === 0 && (
              <p className="text-center text-gray-500 py-4">No exercises found</p>
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
            <div className="text-4xl mb-2">&#128170;</div>
            <p className="text-gray-600">
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
