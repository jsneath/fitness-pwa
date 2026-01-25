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
  const [editingExercise, setEditingExercise] = useState(null)

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

  const handleUpdateExercise = async (templateExerciseId, updates) => {
    await db.templateExercises.update(templateExerciseId, updates)
    setEditingExercise(null)
  }

  const isComplete = programme && programme.currentWeek > programme.durationWeeks

  if (!programme) {
    return (
      <>
        <Header title="Programme" showBack />
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse-soft text-slate-400">Loading...</div>
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
          <Card className="animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                  isComplete
                    ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-500/30'
                    : 'bg-gradient-to-br from-indigo-400 to-purple-500 shadow-indigo-500/30'
                }`}>
                  {isComplete ? (
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    <span className="text-white font-bold text-lg">{programme.currentWeek || 1}</span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">
                    {isComplete ? 'Programme Complete!' : `Week ${programme.currentWeek || 1} of ${programme.durationWeeks}`}
                  </h3>
                  {!isComplete && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {programme.daysPerWeek} training days
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-dark-border rounded-full overflow-hidden mb-4">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isComplete
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                }`}
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
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
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
                onEditExercise={(exercise) => setEditingExercise(exercise)}
              />
            ))
          ) : (
            <Card className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-dark-border flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <p className="text-slate-600 dark:text-slate-300 font-medium">No workout days yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Add {programme.daysPerWeek} training days for your week
              </p>
            </Card>
          )}
        </div>

        {/* Add Template Button */}
        {(!templates || templates.length < programme.daysPerWeek) && (
          <button
            onClick={() => setShowAddTemplate(true)}
            className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-dark-border rounded-2xl text-slate-500 dark:text-slate-400 font-semibold hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20/50 transition-all duration-300"
          >
            + Add Day {(templates?.length || 0) + 1}
          </button>
        )}

        {/* End Programme Button */}
        {programme.isActive === 1 && (
          <button
            onClick={() => setShowEndProgramme(true)}
            className="w-full py-3 text-red-500 font-medium text-sm hover:text-red-600 transition-colors"
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
                className="w-full text-left p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-surface dark:bg-dark-surface-elevated active:bg-slate-100 dark:bg-dark-border border border-slate-200 dark:border-dark-border transition-colors"
              >
                <div className="font-medium text-slate-800 dark:text-slate-100">{exercise.name}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
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
          <div className="text-center py-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/30">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-center">
            Mark Week {programme.currentWeek} as complete and advance to Week {programme.currentWeek + 1}?
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
            Your weights and reps will be used for progressive overload suggestions.
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
          <div className="text-center py-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-red-500/30">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-center">
            Are you sure you want to end this programme early?
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
            Week {programme.currentWeek} of {programme.durationWeeks}. Your workout history will be saved.
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

      {/* Edit Exercise Modal - rendered at root level for proper scrolling */}
      {editingExercise && (
        <EditExerciseModal
          exercise={editingExercise}
          onClose={() => setEditingExercise(null)}
          onSave={(updates) => handleUpdateExercise(editingExercise.id, updates)}
        />
      )}
    </>
  )
}

function TemplateCard({ template, dayNumber, programme, onDelete, onAddExercise, onStartWorkout, onEditExercise }) {
  const [isExpanded, setIsExpanded] = useState(false)
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

  return (
    <Card className="p-0 overflow-hidden animate-scale-in">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-dark-surface dark:bg-dark-surface-elevated/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold shadow-lg ${
            isCompleted
              ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-500/30'
              : 'bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 dark:text-indigo-400'
          }`}>
            {isCompleted ? (
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : dayNumber}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">{template.name}</h3>
              {isCompleted && (
                <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                  Done
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {exercises.length} exercises
              {isCompleted && currentWeekWorkout?.date && (
                <span> • {new Date(currentWeekWorkout.date).toLocaleDateString()}</span>
              )}
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </div>

      {isExpanded && (
        <div className="border-t border-slate-100 dark:border-dark-border">
          {/* Show completed workout sets if done */}
          {isCompleted && completedWorkoutData?.setsByExercise && (
            <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border-b border-emerald-100 dark:border-emerald-800">
              <h4 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-3">Completed Sets</h4>
              <div className="space-y-3">
                {exercises.map((item) => {
                  const setsForExercise = completedWorkoutData.setsByExercise[item.exerciseId] || []
                  const workingSets = setsForExercise.filter(s => !s.isWarmup)
                  return (
                    <div key={item.id} className="bg-white/80 dark:bg-dark-surface/80 rounded-xl p-3">
                      <div className="font-medium text-slate-800 dark:text-slate-100 mb-2">
                        {item.exercise?.name}
                      </div>
                      {workingSets.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {workingSets.map((set, idx) => (
                            <span key={idx} className="text-sm bg-slate-100 dark:bg-dark-border px-2.5 py-1 rounded-lg font-medium">
                              {set.weight}kg × {set.reps}
                              {set.rpe && <span className="text-slate-500 dark:text-slate-400 font-normal"> @{set.rpe}</span>}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">No sets logged</span>
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
                  className="flex items-center justify-between py-2.5 px-3 bg-slate-50 dark:bg-dark-surface-elevated rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-dark-border dark:bg-dark-border"
                >
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => onEditExercise(item)}
                  >
                    <div className="font-medium text-slate-800 dark:text-slate-100">
                      {item.exercise?.name || 'Unknown Exercise'}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {item.targetSets} sets × {item.minReps || 8}-{item.maxReps || 12} reps
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveExercise(item.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {!isCompleted && exercises.length === 0 && (
            <div className="p-6 text-center text-slate-400 text-sm">
              No exercises added yet
            </div>
          )}

          <div className="flex border-t border-slate-100 dark:border-dark-border">
            {!isCompleted && (
              <button
                onClick={onAddExercise}
                className="flex-1 py-3 text-sm font-semibold text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
              >
                Add Exercise
              </button>
            )}
            {exercises.length > 0 && programme.isActive === 1 && (
              <button
                onClick={onStartWorkout}
                className={`flex-1 py-3 text-sm font-semibold border-l border-slate-100 dark:border-dark-border transition-colors ${
                  isCompleted
                    ? 'text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-surface dark:bg-dark-surface-elevated'
                    : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                }`}
              >
                {isCompleted ? 'Redo Workout' : 'Start Workout'}
              </button>
            )}
            {!isCompleted && (
              <button
                onClick={onDelete}
                className="flex-1 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border-l border-slate-100 dark:border-dark-border transition-colors"
              >
                Delete
              </button>
            )}
          </div>

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
      <div className="space-y-5">
        <div className="font-semibold text-slate-800 dark:text-slate-100 text-lg">
          {exercise.exercise?.name}
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-300 block mb-3">
            Target Sets
          </label>
          <div className="flex items-center gap-4 justify-center">
            <button
              onClick={() => setTargetSets(Math.max(1, targetSets - 1))}
              className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-dark-border text-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 active:scale-95 transition-all"
            >
              -
            </button>
            <span className="text-3xl font-bold w-14 text-center text-slate-800 dark:text-slate-100">{targetSets}</span>
            <button
              onClick={() => setTargetSets(targetSets + 1)}
              className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-dark-border text-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 active:scale-95 transition-all"
            >
              +
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-300 block mb-3">
            Rep Range
          </label>
          <div className="flex items-center gap-3 justify-center">
            <input
              type="number"
              value={minReps}
              onChange={(e) => setMinReps(parseInt(e.target.value) || 1)}
              className="w-20 px-3 py-3 border-2 border-slate-200 dark:border-dark-border rounded-xl text-center text-lg font-bold focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              min="1"
            />
            <span className="text-slate-400 font-medium">to</span>
            <input
              type="number"
              value={maxReps}
              onChange={(e) => setMaxReps(parseInt(e.target.value) || 1)}
              className="w-20 px-3 py-3 border-2 border-slate-200 dark:border-dark-border rounded-xl text-center text-lg font-bold focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              min="1"
            />
            <span className="text-slate-500 dark:text-slate-400 font-medium">reps</span>
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
