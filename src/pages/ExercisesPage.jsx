import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Header } from '../components/layout'
import { Card, Input, Modal, Button } from '../components/common'
import { db, getAllExercises } from '../db/database'
import { muscleGroups, equipmentTypes } from '../data/defaultExercises'

export default function ExercisesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState('')
  const [selectedEquipment, setSelectedEquipment] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newExercise, setNewExercise] = useState({
    name: '',
    muscleGroups: [],
    equipment: ''
  })

  const exercises = useLiveQuery(() => getAllExercises(), [])

  const filteredExercises = useMemo(() => {
    if (!exercises) return []

    return exercises.filter((exercise) => {
      const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesMuscle = !selectedMuscle || exercise.muscleGroups.includes(selectedMuscle)
      const matchesEquipment = !selectedEquipment || exercise.equipment === selectedEquipment
      return matchesSearch && matchesMuscle && matchesEquipment
    })
  }, [exercises, searchQuery, selectedMuscle, selectedEquipment])

  const groupedExercises = useMemo(() => {
    const groups = {}
    filteredExercises.forEach((exercise) => {
      const primaryMuscle = exercise.muscleGroups[0] || 'Other'
      if (!groups[primaryMuscle]) {
        groups[primaryMuscle] = []
      }
      groups[primaryMuscle].push(exercise)
    })
    return groups
  }, [filteredExercises])

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
            className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        }
      />

      <div className="space-y-4 pt-4">
        {/* Search */}
        <Input
          type="search"
          placeholder="Search exercises..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          <select
            value={selectedMuscle}
            onChange={(e) => setSelectedMuscle(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
          >
            <option value="">All Muscles</option>
            {muscleGroups.map((muscle) => (
              <option key={muscle} value={muscle}>{muscle}</option>
            ))}
          </select>
          <select
            value={selectedEquipment}
            onChange={(e) => setSelectedEquipment(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
          >
            <option value="">All Equipment</option>
            {equipmentTypes.map((equip) => (
              <option key={equip} value={equip}>{equip}</option>
            ))}
          </select>
        </div>

        {/* Exercise List */}
        <div className="space-y-6">
          {Object.entries(groupedExercises).map(([muscle, muscleExercises]) => (
            <section key={muscle}>
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                {muscle} ({muscleExercises.length})
              </h2>
              <div className="space-y-2">
                {muscleExercises.map((exercise) => (
                  <Card key={exercise.id}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {exercise.name}
                          {exercise.isCustom && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              Custom
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {exercise.equipment}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {exercise.muscleGroups.map((muscle) => (
                            <span
                              key={muscle}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                            >
                              {muscle}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ))}

          {filteredExercises.length === 0 && (
            <Card className="text-center py-8">
              <p className="text-gray-500">No exercises found</p>
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
            <label className="text-sm font-medium text-gray-700 block mb-2">
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
                      : 'bg-white text-gray-700 border-gray-300'
                  }`}
                >
                  {muscle}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
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
                      : 'bg-white text-gray-700 border-gray-300'
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
