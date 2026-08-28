import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Button, Input } from '../common'
import { MUSCLE_TILES, EQUIPMENT_CATEGORIES } from '../../data/exerciseBrowse'
import { muscleGroups, equipmentTypes } from '../../data/defaultExercises'
import {
  filterExercisesForPicker,
  groupByEquipmentCategory,
} from '../../utils/exerciseSearch'
import { addCustomExercise, getExerciseById, getRecentlyUsedExercises } from '../../db/database'

const defaultCustom = {
  name: '',
  muscleGroups: [],
  equipment: '',
}

export default function ExercisePicker({
  isOpen,
  onClose,
  onSelect,
  exercises = [],
  addedExerciseIds = [],
  title = 'Add exercise',
}) {
  const [query, setQuery] = useState('')
  const [muscle, setMuscle] = useState('')
  const [equipment, setEquipment] = useState('all')
  const [creating, setCreating] = useState(false)
  const [custom, setCustom] = useState(defaultCustom)
  const [createError, setCreateError] = useState('')
  const [saving, setSaving] = useState(false)
  const handleBackRef = useRef(() => {})

  const recents = useLiveQuery(
    () => (isOpen ? getRecentlyUsedExercises(8) : []),
    [isOpen]
  ) || []

  const added = useMemo(() => new Set(addedExerciseIds), [addedExerciseIds])

  useEffect(() => {
    if (!isOpen) return undefined

    setQuery('')
    setMuscle('')
    setEquipment('all')
    setCreating(false)
    setCustom(defaultCustom)
    setCreateError('')
    document.body.style.overflow = 'hidden'

    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        handleBackRef.current()
      }
    }
    window.addEventListener('keydown', onKey)

    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const searching = Boolean(query.trim())

  const ranked = useMemo(
    () => filterExercisesForPicker(exercises, {
      query,
      equipment,
      requireMuscle: false,
    }),
    [exercises, query, equipment]
  )

  const inMuscle = useMemo(
    () => (muscle ? ranked.filter((ex) => (ex.muscleGroups || []).includes(muscle)) : ranked),
    [ranked, muscle]
  )

  const otherMuscles = useMemo(
    () => (muscle && searching
      ? ranked.filter((ex) => !(ex.muscleGroups || []).includes(muscle))
      : []),
    [ranked, muscle, searching]
  )

  const filtered = searching ? ranked : inMuscle

  const equipmentOptions = useMemo(() => {
    const pool = filterExercisesForPicker(exercises, {
      query,
      muscle: searching ? '' : muscle,
      equipment: 'all',
      requireMuscle: !searching,
    })
    const present = new Set(pool.map((ex) => ex.equipment))
    return EQUIPMENT_CATEGORIES.filter(
      (cat) => cat.id === 'all' || cat.types?.some((type) => present.has(type))
    )
  }, [exercises, query, muscle, searching])

  useEffect(() => {
    if (equipment !== 'all' && !equipmentOptions.some((cat) => cat.id === equipment)) {
      setEquipment('all')
    }
  }, [equipment, equipmentOptions])

  const muscleCounts = useMemo(() => {
    const counts = {}
    for (const ex of exercises) {
      for (const group of ex.muscleGroups || []) {
        counts[group] = (counts[group] || 0) + 1
      }
    }
    return counts
  }, [exercises])

  const showingList = Boolean(query.trim() || muscle)
  const equipmentGroups = useMemo(
    () => groupByEquipmentCategory(filtered),
    [filtered]
  )

  const openCreate = (name = query) => {
    const fromCategory = EQUIPMENT_CATEGORIES.find((c) => c.id === equipment)
    const guessedEquipment = fromCategory?.types?.[0] || ''
    setCustom({
      name: name.trim(),
      muscleGroups: muscle ? [muscle] : [],
      equipment: guessedEquipment,
    })
    setCreateError('')
    setCreating(true)
  }

  const handleBack = () => {
    if (creating) {
      setCreating(false)
      setCreateError('')
      return
    }
    if (query) {
      setQuery('')
      return
    }
    if (muscle) {
      setMuscle('')
      setEquipment('all')
      return
    }
    onClose()
  }
  handleBackRef.current = handleBack

  const handleSelect = (exercise) => {
    onSelect(exercise)
  }

  const handleCreate = async () => {
    if (!custom.name.trim() || custom.muscleGroups.length === 0 || !custom.equipment) return
    setSaving(true)
    setCreateError('')
    try {
      const id = await addCustomExercise({
        name: custom.name.trim(),
        muscleGroups: custom.muscleGroups,
        equipment: custom.equipment,
      })
      const created = await getExerciseById(id)
      if (created) onSelect(created)
    } catch (err) {
      setCreateError(err.message || 'Could not save that exercise')
    } finally {
      setSaving(false)
    }
  }

  const toggleCustomMuscle = (group) => {
    setCustom((prev) => ({
      ...prev,
      muscleGroups: prev.muscleGroups.includes(group)
        ? prev.muscleGroups.filter((m) => m !== group)
        : [...prev.muscleGroups, group],
    }))
  }

  if (!isOpen) return null

  const muscleLabel = MUSCLE_TILES.find((m) => m.id === muscle)?.label || muscle
  const headerTitle = creating
    ? 'New exercise'
    : muscle
      ? muscleLabel
      : title

  const recentsToShow = recents.filter((ex) => {
    if (query.trim()) return false
    if (muscle && !(ex.muscleGroups || []).includes(muscle)) return false
    return true
  })

  return createPortal(
    <div className="fixed inset-0 z-[110] bg-slate-50 dark:bg-dark-bg flex flex-col animate-fade-in">
      <div className="safe-area-top bg-white/90 dark:bg-dark-surface/90 backdrop-blur-xl border-b border-slate-200/70 dark:border-dark-border/70">
        <div className="flex items-center h-16 px-3 max-w-lg mx-auto">
          <button
            onClick={handleBack}
            className="p-2 -ml-1 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-surface-elevated active:bg-slate-200 transition-colors"
            aria-label="Back"
          >
            <svg className="w-6 h-6 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h2 className="flex-1 text-center text-lg font-bold text-slate-800 dark:text-slate-100">
            {headerTitle}
          </h2>
          <button
            onClick={onClose}
            className="p-2 -mr-1 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-surface-elevated active:bg-slate-200 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {creating ? (
        <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full space-y-5 safe-area-bottom pb-8">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Can&apos;t find it under a gym name? Save it as you call it — it&apos;ll show up in search next time.
          </p>
          <Input
            label="Name"
            value={custom.name}
            onChange={(e) => setCustom({ ...custom, name: e.target.value })}
            placeholder="e.g. Seated chest press"
            autoFocus
          />

          <div>
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-300 block mb-2">
              Muscle
            </label>
            <div className="flex flex-wrap gap-2">
              {muscleGroups.map((group) => (
                <Chip
                  key={group}
                  active={custom.muscleGroups.includes(group)}
                  onClick={() => toggleCustomMuscle(group)}
                >
                  {group}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-300 block mb-2">
              Equipment
            </label>
            <div className="flex flex-wrap gap-2">
              {equipmentTypes.map((type) => (
                <Chip
                  key={type}
                  active={custom.equipment === type}
                  onClick={() => setCustom({ ...custom, equipment: type })}
                >
                  {type}
                </Chip>
              ))}
            </div>
          </div>

          {createError && (
            <p className="text-sm text-red-500 font-medium">{createError}</p>
          )}

          <Button
            fullWidth
            size="lg"
            onClick={handleCreate}
            disabled={saving || !custom.name.trim() || custom.muscleGroups.length === 0 || !custom.equipment}
          >
            {saving ? 'Saving…' : 'Save and add'}
          </Button>
        </div>
      ) : (
        <>
          <div className="bg-white/80 dark:bg-dark-surface/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-dark-border/60">
            <div className="max-w-lg mx-auto px-4 pt-3 pb-3 space-y-3">
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
                </svg>
                <input
                  data-testid="exercise-search"
                  type="text"
                  inputMode="search"
                  enterKeyHint="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search any name — lat raise, OHP, RDL…"
                  className="w-full pl-11 pr-10 py-3 bg-slate-50 dark:bg-dark-bg border-2 border-slate-200 dark:border-dark-border rounded-2xl focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-dark-surface-elevated focus:ring-4 focus:ring-indigo-500/10 font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-dark-border"
                    aria-label="Clear search"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {showingList && (
                <>
                  <ChipRow label="Muscle">
                    <Chip active={!muscle} onClick={() => { setMuscle(''); setEquipment('all') }}>
                      All
                    </Chip>
                    {MUSCLE_TILES.map((tile) => (
                      <Chip
                        key={tile.id}
                        active={muscle === tile.id}
                        onClick={() => setMuscle(muscle === tile.id ? '' : tile.id)}
                      >
                        {tile.label}
                      </Chip>
                    ))}
                  </ChipRow>
                  <ChipRow label="Equipment">
                    {equipmentOptions.map((cat) => (
                      <Chip
                        key={cat.id}
                        testId={`equip-${cat.id}`}
                        active={equipment === cat.id}
                        onClick={() => setEquipment(cat.id)}
                      >
                        {cat.label}
                      </Chip>
                    ))}
                  </ChipRow>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="max-w-lg mx-auto px-4 py-4 space-y-6 pb-28">
              {!showingList && recentsToShow.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                    Recent
                  </h3>
                  <div className="space-y-2">
                    {recentsToShow.map((exercise) => (
                      <ExerciseRow
                        key={`recent-${exercise.id}`}
                        exercise={exercise}
                        alreadyAdded={added.has(exercise.id)}
                        onSelect={handleSelect}
                      />
                    ))}
                  </div>
                </section>
              )}

              {!showingList && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                    Browse by muscle
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {MUSCLE_TILES.map((tile) => (
                      <button
                        key={tile.id}
                        data-testid={`muscle-${tile.id}`}
                        onClick={() => setMuscle(tile.id)}
                        className="relative overflow-hidden rounded-2xl text-left p-4 min-h-[88px] text-white shadow-lg active:scale-[0.98] transition-transform"
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${tile.tint}`} />
                        <div className="absolute inset-0 bg-black/10" />
                        <div className="relative">
                          <div className="font-bold text-lg leading-tight">{tile.label}</div>
                          <div className="text-xs text-white/85 mt-1">{tile.hint}</div>
                          <div className="text-[11px] text-white/70 mt-2 font-medium">
                            {muscleCounts[tile.id] || 0} exercise{(muscleCounts[tile.id] || 0) === 1 ? '' : 's'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {showingList && filtered.length > 0 && (
                searching ? (
                  <>
                    {muscle && inMuscle.length > 0 && (
                      <ResultSection title={`${muscleLabel} · ${inMuscle.length}`}>
                        {inMuscle.map((exercise) => (
                          <ExerciseRow
                            key={exercise.id}
                            exercise={exercise}
                            alreadyAdded={added.has(exercise.id)}
                            onSelect={handleSelect}
                          />
                        ))}
                      </ResultSection>
                    )}
                    {(!muscle || inMuscle.length === 0) && (
                      <ResultSection title={
                        muscle
                          ? `No ${muscleLabel} matches — ${filtered.length} elsewhere`
                          : `${filtered.length} match${filtered.length === 1 ? '' : 'es'}`
                      }>
                        {filtered.map((exercise) => (
                          <ExerciseRow
                            key={exercise.id}
                            exercise={exercise}
                            alreadyAdded={added.has(exercise.id)}
                            onSelect={handleSelect}
                          />
                        ))}
                      </ResultSection>
                    )}
                    {muscle && otherMuscles.length > 0 && inMuscle.length > 0 && (
                      <ResultSection title={`Other muscles · ${otherMuscles.length}`}>
                        {otherMuscles.map((exercise) => (
                          <ExerciseRow
                            key={exercise.id}
                            exercise={exercise}
                            alreadyAdded={added.has(exercise.id)}
                            onSelect={handleSelect}
                          />
                        ))}
                      </ResultSection>
                    )}
                  </>
                ) : (
                  equipmentGroups.map((group) => (
                    <section key={group.id}>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                        {group.label}
                      </h3>
                      <div className="space-y-2">
                        {group.exercises.map((exercise) => (
                          <ExerciseRow
                            key={exercise.id}
                            exercise={exercise}
                            alreadyAdded={added.has(exercise.id)}
                            onSelect={handleSelect}
                          />
                        ))}
                      </div>
                    </section>
                  ))
                )
              )}

              {showingList && filtered.length === 0 && (
                <div className="text-center py-10 px-4">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-100 dark:bg-dark-surface-elevated flex items-center justify-center">
                    <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
                    </svg>
                  </div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    Nothing named like that
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">
                    Gyms label machines differently. Save it under the name you use.
                  </p>
                  <Button onClick={() => openCreate(query)}>
                    {query.trim() ? `Create “${query.trim()}”` : 'Create custom exercise'}
                  </Button>
                </div>
              )}

              {showingList && filtered.length > 0 && (
                <button
                  onClick={() => openCreate(query)}
                  className="w-full py-3 text-sm font-semibold text-indigo-500 hover:text-indigo-600"
                >
                  {query.trim()
                    ? `Can’t find it? Create “${query.trim()}”`
                    : 'Can’t find it? Create a custom exercise'}
                </button>
              )}

              {!showingList && (
                <button
                  onClick={() => openCreate('')}
                  className="w-full py-3 text-sm font-semibold text-indigo-500 hover:text-indigo-600"
                >
                  Can’t find it? Create a custom exercise
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>,
    document.body
  )
}

function ResultSection({ title, children }) {
  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
        {title}
      </h3>
      <div className="space-y-2">
        {children}
      </div>
    </section>
  )
}

function ChipRow({ label, children }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
        {label}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {children}
      </div>
    </div>
  )
}

function Chip({ active, onClick, children, testId }) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
        active
          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/30'
          : 'bg-white dark:bg-dark-surface text-slate-600 dark:text-slate-300 border-slate-200 dark:border-dark-border'
      }`}
    >
      {children}
    </button>
  )
}

function ExerciseRow({ exercise, onSelect, alreadyAdded }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(exercise)}
      className="w-full text-left p-3.5 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200/80 dark:border-dark-border hover:border-indigo-300 dark:hover:border-indigo-500/40 active:scale-[0.99] transition-all shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-slate-800 dark:text-slate-100 leading-snug">
            {exercise.name}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {exercise.equipment}
            {exercise.muscleGroups?.length > 0 && (
              <span> · {exercise.muscleGroups.join(', ')}</span>
            )}
          </div>
        </div>
        {alreadyAdded && (
          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-full">
            Added
          </span>
        )}
      </div>
    </button>
  )
}
