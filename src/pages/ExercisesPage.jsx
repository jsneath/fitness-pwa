import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Header } from '../components/layout'
import { Card, Input, Modal, Button } from '../components/common'
import { db, getAllExercises } from '../db/database'
import { muscleGroups, equipmentTypes } from '../data/defaultExercises'
import { MUSCLE_TILES, EQUIPMENT_CATEGORIES } from '../data/exerciseBrowse'
import {
  filterExercisesForPicker,
  groupByEquipmentCategory,
  groupByMuscle,
} from '../utils/exerciseSearch'

export default function ExercisesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState('')
  const [selectedEquipment, setSelectedEquipment] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newExercise, setNewExercise] = useState({
    name: '',
    muscleGroups: [],
    equipment: ''
  })

  const exercises = useLiveQuery(() => getAllExercises(), [])

  const filteredExercises = useMemo(
    () => filterExercisesForPicker(exercises, {
      query: searchQuery,
      muscle: selectedMuscle,
      equipment: selectedEquipment,
    }),
    [exercises, searchQuery, selectedMuscle, selectedEquipment]
  )

  const groupedExercises = useMemo(() => {
    if (selectedMuscle) return null
    return groupByMuscle(filteredExercises)
  }, [filteredExercises, selectedMuscle])

  const equipmentGroups = useMemo(() => {
    if (!selectedMuscle) return null
    return groupByEquipmentCategory(filteredExercises)
  }, [filteredExercises, selectedMuscle])

  const handleAddExercise = async () => {
    if (!newExercise.name || newExercise.muscleGroups.length === 0 || !newExercise.equipment) {
      return
    }

    await db.exercises.add({
      ...newExercise,
      isCustom: true
    })

    setNewExercise({ name: '', muscleGroups: [], equipment: '' })
    setShowAddModal(false)
  }

  const toggleMuscleGroup = (muscle) => {
    setNewExercise((prev) => ({
      ...prev,
      muscleGroups: prev.muscleGroups.includes(muscle)
        ? prev.muscleGroups.filter((m) => m !== muscle)
        : [...prev.muscleGroups, muscle]
    }))
  }

  return (
    <>
      <Header
        title="Exercises"
        rightAction={
          <button
            onClick={() => setShowAddModal(true)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-border active:bg-gray-200"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        }
      />

      <div className="space-y-4 pt-4">
        <Input
          type="search"
          placeholder="Search any name — lat raise, OHP, RDL…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
            <FilterChip
              active={!selectedMuscle}
              onClick={() => setSelectedMuscle('')}
            >
              All muscles
            </FilterChip>
            {MUSCLE_TILES.map((tile) => (
              <FilterChip
                key={tile.id}
                active={selectedMuscle === tile.id}
                onClick={() => setSelectedMuscle(selectedMuscle === tile.id ? '' : tile.id)}
              >
                {tile.label}
              </FilterChip>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
            {EQUIPMENT_CATEGORIES.map((cat) => (
              <FilterChip
                key={cat.id}
                active={selectedEquipment === cat.id}
                onClick={() => setSelectedEquipment(cat.id)}
              >
                {cat.label}
              </FilterChip>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {selectedMuscle
            ? equipmentGroups?.map((group) => (
                <section key={group.id}>
                  <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    {group.label} ({group.exercises.length})
                  </h2>
                  <div className="space-y-2">
                    {group.exercises.map((exercise) => (
                      <ExerciseLibraryCard key={exercise.id} exercise={exercise} />
                    ))}
                  </div>
                </section>
              ))
            : Object.entries(groupedExercises || {}).map(([muscle, muscleExercises]) => (
                <section key={muscle}>
                  <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    {muscle} ({muscleExercises.length})
                  </h2>
                  <div className="space-y-2">
                    {muscleExercises.map((exercise) => (
                      <ExerciseLibraryCard key={exercise.id} exercise={exercise} />
                    ))}
                  </div>
                </section>
              ))}

          {filteredExercises.length === 0 && (
            <Card className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No exercises found</p>
              <button
                onClick={() => {
                  setNewExercise((prev) => ({ ...prev, name: searchQuery }))
                  setShowAddModal(true)
                }}
                className="mt-3 text-sm font-semibold text-indigo-500"
              >
                {searchQuery.trim() ? `Create “${searchQuery.trim()}”` : 'Add a custom exercise'}
              </button>
            </Card>
          )}
        </div>
      </div>

      {/* Add Exercise Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Custom Exercise"
      >
        <div className="space-y-4">
          <Input
            label="Exercise Name"
            value={newExercise.name}
            onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
            placeholder="e.g., Cable Lateral Raise"
          />

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200 block mb-2">
              Muscle Groups
            </label>
            <div className="flex flex-wrap gap-2">
              {muscleGroups.map((muscle) => (
                <button
                  key={muscle}
                  onClick={() => toggleMuscleGroup(muscle)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    newExercise.muscleGroups.includes(muscle)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 border-gray-300 dark:border-dark-border'
                  }`}
                >
                  {muscle}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200 block mb-2">
              Equipment
            </label>
            <div className="flex flex-wrap gap-2">
              {equipmentTypes.map((equip) => (
                <button
                  key={equip}
                  onClick={() => setNewExercise({ ...newExercise, equipment: equip })}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    newExercise.equipment === equip
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 border-gray-300 dark:border-dark-border'
                  }`}
                >
                  {equip}
                </button>
              ))}
            </div>
          </div>

          <Button
            fullWidth
            onClick={handleAddExercise}
            disabled={!newExercise.name || newExercise.muscleGroups.length === 0 || !newExercise.equipment}
          >
            Add Exercise
          </Button>
        </div>
      </Modal>
    </>
  )
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
        active
          ? 'bg-indigo-600 text-white border-indigo-600'
          : 'bg-white dark:bg-dark-surface text-slate-600 dark:text-slate-300 border-slate-200 dark:border-dark-border'
      }`}
    >
      {children}
    </button>
  )
}

function ExerciseLibraryCard({ exercise }) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white">
            {exercise.name}
            {exercise.isCustom && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                Custom
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {exercise.equipment}
          </p>
          <div className="flex flex-wrap gap-1 mt-2">
            {exercise.muscleGroups.map((muscle) => (
              <span
                key={muscle}
                className="text-xs bg-gray-100 dark:bg-dark-surface-elevated text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full"
              >
                {muscle}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
