import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Header } from '../components/layout'
import { Card, Button, Modal, Input } from '../components/common'
import { db, getWorkoutTemplates, getTemplateExercises, getAllExercises, advanceWeek, getCompletedWorkoutForWeek, endProgrammeEarly } from '../db/database'

export default function ProgrammeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [programme, setProgramme] = useState(null)
  const [showAddTemplate, setShowAddTemplate] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCompleteWeek, setShowCompleteWeek] = useState(false)
  const [showEndProgramme, setShowEndProgramme] = useState(false)

  const templates = useLiveQuery(
    () => (programme ? getWorkoutTemplates(programme.id) : []),
    [programme]
  )

  const allExercises = useLiveQuery(() => getAllExercises(), [])

  useEffect(() => {
    const loadProgramme = async () => {
      const prog = await db.programmes.get(parseInt(id))
      if (!prog) {
        navigate('/programmes')
        return
      }
      setProgramme(prog)
    }
    loadProgramme()
  }, [id, navigate])

  const handleAddTemplate = async () => {
    if (!newTemplateName.trim() || !programme) return

    const order = templates?.length || 0
    await db.workoutTemplates.add({
      programmeId: programme.id,
      name: newTemplateName.trim(),
      dayNumber: order + 1,
      order
    })

    setNewTemplateName('')
    setShowAddTemplate(false)
  }

  const handleDeleteTemplate = async (templateId) => {
    if (confirm('Delete this workout template?')) {
      await db.templateExercises.where('templateId').equals(templateId).delete()
      await db.workoutTemplates.delete(templateId)
    }
  }

  const handleAddExerciseToTemplate = async (exercise) => {
    if (!editingTemplate) return

    const existing = await getTemplateExercises(editingTemplate.id)
    await db.templateExercises.add({
      templateId: editingTemplate.id,
      exerciseId: exercise.id,
      order: existing.length,
      targetSets: 3,
      minReps: 8,
      maxReps: 12,
      notes: ''
    })

    setShowExercisePicker(false)
    setSearchQuery('')
  }

  const handleStartWorkout = (template) => {
    // Navigate to workout page with template info
    navigate('/workout', {
      state: {
        templateId: template.id,
        programmeId: programme.id,
        weekNumber: programme.currentWeek || 1,
        templateName: template.name
      }
    })
  }

  const handleCompleteWeek = async () => {
    if (!programme) return

    const updated = await advanceWeek(programme.id)
    setProgramme(updated)
    setShowCompleteWeek(false)

    if (updated.currentWeek > updated.durationWeeks) {
      alert('Congratulations! You have completed this mesocycle!')
    }
  }

  const handleEndProgramme = async () => {
    if (!programme) return

    await endProgrammeEarly(programme.id)
    setShowEndProgramme(false)
    navigate('/programmes')
  }

  const filteredExercises = allExercises?.filter((ex) =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const isComplete = programme && programme.currentWeek > programme.durationWeeks

  if (!programme) {
    return (
      <>
        <Header title="Programme" showBack />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header title={programme.name} showBack />

      <div className="space-y-4 pt-4">
        {/* Week Progress */}
        {programme.isActive === 1 && (
          <Card>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">
                {isComplete ? 'Programme Complete!' : `Week ${programme.currentWeek || 1} of ${programme.durationWeeks}`}
              </h3>
              {!isComplete && (
                <span className="text-sm text-gray-500">
                  {programme.daysPerWeek} training days
                </span>
              )}
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full rounded-full transition-all ${isComplete ? 'bg-green-500' : 'bg-blue-600'}`}
                style={{
                  width: `${Math.min(100, ((programme.currentWeek || 1) / programme.durationWeeks) * 100)}%`
                }}
              />
            </div>
            {!isComplete && (
              <Button
                fullWidth
                variant="success"
                onClick={() => setShowCompleteWeek(true)}
              >
                Complete Week {programme.currentWeek || 1}
              </Button>
            )}
          </Card>
        )}

        {/* Training Days */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            Training Days
          </h2>
          {templates && templates.length > 0 ? (
            templates.map((template, index) => (
              <TemplateCard
                key={template.id}
                template={template}
                dayNumber={index + 1}
                programme={programme}
                onDelete={() => handleDeleteTemplate(template.id)}
                onAddExercise={() => {
                  setEditingTemplate(template)
                  setShowExercisePicker(true)
                }}
                onStartWorkout={() => handleStartWorkout(template)}
              />
            ))
          ) : (
            <Card className="text-center py-8">
              <p className="text-gray-500">No workout days yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Add {programme.daysPerWeek} training days for your week
              </p>
            </Card>
          )}
        </div>

        {/* Add Template Button */}
        {(!templates || templates.length < programme.daysPerWeek) && (
          <button
            onClick={() => setShowAddTemplate(true)}
            className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            + Add Day {(templates?.length || 0) + 1}
          </button>
        )}

        {/* End Programme Button */}
        {programme.isActive === 1 && (
          <button
            onClick={() => setShowEndProgramme(true)}
            className="w-full py-3 text-red-600 font-medium text-sm"
          >
            End Programme Early
          </button>
        )}
      </div>

      {/* Add Template Modal */}
      <Modal
        isOpen={showAddTemplate}
        onClose={() => {
          setShowAddTemplate(false)
          setNewTemplateName('')
        }}
        title={`Add Day ${(templates?.length || 0) + 1}`}
      >
        <div className="space-y-4">
          <Input
            label="Workout Name"
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            placeholder="e.g., Push Day, Upper Body A"
            autoFocus
          />
          <Button
            fullWidth
            onClick={handleAddTemplate}
            disabled={!newTemplateName.trim()}
          >
            Add Training Day
          </Button>
        </div>
      </Modal>

      {/* Exercise Picker Modal */}
      <Modal
        isOpen={showExercisePicker}
        onClose={() => {
          setShowExercisePicker(false)
          setSearchQuery('')
          setEditingTemplate(null)
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
                onClick={() => handleAddExerciseToTemplate(exercise)}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 border border-gray-200"
              >
                <div className="font-medium text-gray-900">{exercise.name}</div>
                <div className="text-sm text-gray-500">
                  {exercise.equipment} • {exercise.muscleGroups.join(', ')}
                </div>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Complete Week Modal */}
      <Modal
        isOpen={showCompleteWeek}
        onClose={() => setShowCompleteWeek(false)}
        title="Complete Week"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Mark Week {programme.currentWeek} as complete and advance to Week {programme.currentWeek + 1}?
          </p>
          <p className="text-sm text-gray-500">
            Your weights and reps will be used to calculate progressive overload suggestions for next week.
          </p>
          <div className="flex gap-3">
            <Button
              fullWidth
              variant="secondary"
              onClick={() => setShowCompleteWeek(false)}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              variant="success"
              onClick={handleCompleteWeek}
            >
              Complete Week
            </Button>
          </div>
        </div>
      </Modal>

      {/* End Programme Modal */}
      <Modal
        isOpen={showEndProgramme}
        onClose={() => setShowEndProgramme(false)}
        title="End Programme"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to end this programme early?
          </p>
          <p className="text-sm text-gray-500">
            You're currently on Week {programme.currentWeek} of {programme.durationWeeks}.
            Your workout history will be saved, but this programme will be marked as inactive.
          </p>
          <div className="flex gap-3">
            <Button
              fullWidth
              variant="secondary"
              onClick={() => setShowEndProgramme(false)}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              variant="danger"
              onClick={handleEndProgramme}
            >
              End Programme
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

function TemplateCard({ template, dayNumber, programme, onDelete, onAddExercise, onStartWorkout }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [editingExercise, setEditingExercise] = useState(null)
  const currentWeek = programme.currentWeek || 1

  // Use live query to auto-refresh when exercises are added/removed
  const exercises = useLiveQuery(
    async () => {
      const templateExercises = await getTemplateExercises(template.id)
      const exercisesWithDetails = await Promise.all(
        templateExercises.map(async (te) => {
          const exercise = await db.exercises.get(te.exerciseId)
          return { ...te, exercise }
        })
      )
      return exercisesWithDetails
    },
    [template.id],
    []
  )

  // Watch workoutLogs table directly for better live query support
  const workoutLogs = useLiveQuery(
    () => db.workoutLogs.where('templateId').equals(template.id).toArray(),
    [template.id]
  )

  // Find the workout for current week
  const currentWeekWorkout = workoutLogs?.find(log => log.weekNumber === currentWeek)
  const isCompleted = !!currentWeekWorkout

  // Load full workout data including sets when expanded and completed
  const [completedWorkoutData, setCompletedWorkoutData] = useState(null)

  useEffect(() => {
    if (isCompleted && isExpanded && currentWeekWorkout) {
      getCompletedWorkoutForWeek(template.id, currentWeek).then(setCompletedWorkoutData)
    }
  }, [isCompleted, isExpanded, currentWeekWorkout, template.id, currentWeek])

  const handleRemoveExercise = async (templateExerciseId) => {
    await db.templateExercises.delete(templateExerciseId)
  }

  const handleUpdateExercise = async (templateExerciseId, updates) => {
    await db.templateExercises.update(templateExerciseId, updates)
    setEditingExercise(null)
  }

  return (
    <Card className="p-0 overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
            isCompleted ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
          }`}>
            {isCompleted ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : dayNumber}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{template.name}</h3>
              {isCompleted && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  Done
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {exercises.length} exercises
              {isCompleted && currentWeekWorkout?.date && (
                <span> • {new Date(currentWeekWorkout.date).toLocaleDateString()}</span>
              )}
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-100">
          {/* Show completed workout sets if done */}
          {isCompleted && completedWorkoutData?.setsByExercise && (
            <div className="p-4 bg-green-50 border-b border-green-100">
              <h4 className="text-sm font-medium text-green-800 mb-3">Completed Sets</h4>
              <div className="space-y-3">
                {exercises.map((item) => {
                  const setsForExercise = completedWorkoutData.setsByExercise[item.exerciseId] || []
                  const workingSets = setsForExercise.filter(s => !s.isWarmup)
                  return (
                    <div key={item.id} className="bg-white rounded-lg p-3">
                      <div className="font-medium text-gray-900 mb-2">
                        {item.exercise?.name}
                      </div>
                      {workingSets.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {workingSets.map((set, idx) => (
                            <span key={idx} className="text-sm bg-gray-100 px-2 py-1 rounded">
                              {set.weight}kg × {set.reps}
                              {set.rpe && <span className="text-gray-500"> @{set.rpe}</span>}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No sets logged</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Template exercises (for editing) */}
          {!isCompleted && exercises.length > 0 && (
            <div className="p-4 space-y-2">
              {exercises.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                >
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => setEditingExercise(item)}
                  >
                    <div className="font-medium text-gray-900">
                      {item.exercise?.name || 'Unknown Exercise'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {item.targetSets} sets × {item.minReps || 8}-{item.maxReps || 12} reps
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveExercise(item.id)}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {!isCompleted && exercises.length === 0 && (
            <div className="p-4 text-center text-gray-500 text-sm">
              No exercises added yet
            </div>
          )}

          <div className="flex border-t border-gray-100">
            {!isCompleted && (
              <button
                onClick={onAddExercise}
                className="flex-1 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50"
              >
                Add Exercise
              </button>
            )}
            {exercises.length > 0 && programme.isActive === 1 && (
              <button
                onClick={onStartWorkout}
                className={`flex-1 py-3 text-sm font-medium hover:bg-green-50 border-l border-gray-100 ${
                  isCompleted ? 'text-gray-500' : 'text-green-600'
                }`}
              >
                {isCompleted ? 'Redo Workout' : 'Start Workout'}
              </button>
            )}
            {!isCompleted && (
              <button
                onClick={onDelete}
                className="flex-1 py-3 text-sm font-medium text-red-600 hover:bg-red-50 border-l border-gray-100"
              >
                Delete
              </button>
            )}
          </div>

          {/* Edit Exercise Modal */}
          {editingExercise && (
            <EditExerciseModal
              exercise={editingExercise}
              onClose={() => setEditingExercise(null)}
              onSave={(updates) => handleUpdateExercise(editingExercise.id, updates)}
            />
          )}
        </div>
      )}
    </Card>
  )
}

function EditExerciseModal({ exercise, onClose, onSave }) {
  const [targetSets, setTargetSets] = useState(exercise.targetSets || 3)
  const [minReps, setMinReps] = useState(exercise.minReps || 8)
  const [maxReps, setMaxReps] = useState(exercise.maxReps || 12)

  return (
    <Modal isOpen={true} onClose={onClose} title="Edit Exercise">
      <div className="space-y-4">
        <div className="font-medium text-gray-900 mb-4">
          {exercise.exercise?.name}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Target Sets
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTargetSets(Math.max(1, targetSets - 1))}
              className="w-12 h-12 rounded-lg bg-gray-100 text-xl font-bold"
            >
              -
            </button>
            <span className="text-2xl font-bold w-12 text-center">{targetSets}</span>
            <button
              onClick={() => setTargetSets(targetSets + 1)}
              className="w-12 h-12 rounded-lg bg-gray-100 text-xl font-bold"
            >
              +
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Rep Range
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={minReps}
              onChange={(e) => setMinReps(parseInt(e.target.value) || 1)}
              className="w-20 px-3 py-2 border rounded-lg text-center text-lg font-bold"
              min="1"
            />
            <span className="text-gray-400">to</span>
            <input
              type="number"
              value={maxReps}
              onChange={(e) => setMaxReps(parseInt(e.target.value) || 1)}
              className="w-20 px-3 py-2 border rounded-lg text-center text-lg font-bold"
              min="1"
            />
            <span className="text-gray-500">reps</span>
          </div>
        </div>

        <Button
          fullWidth
          onClick={() => onSave({ targetSets, minReps, maxReps })}
        >
          Save Changes
        </Button>
      </div>
    </Modal>
  )
}
