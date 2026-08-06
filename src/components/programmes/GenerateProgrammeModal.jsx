import { useState, useEffect } from 'react'
import { Modal, Button, Input } from '../common'
import { EMPHASIS_OPTIONS, EXPERIENCE_OPTIONS } from '../../data/splits'
import {
  buildMesocyclePlan,
  createGeneratedProgramme,
  suggestProgrammeName,
} from '../../db/programmeBuilder'

const DAY_OPTIONS = [2, 3, 4, 5, 6]
const DURATION_OPTIONS = [4, 5, 6]

function ChoiceRow({ label, options, value, onChange, columns = 3 }) {
  return (
    <div>
      <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
        {label}
      </span>
      <div className={`grid gap-2 grid-cols-${columns}`} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {options.map((option) => {
          const id = option.id ?? option
          const text = option.label ?? option
          const selected = value === id
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`py-2.5 px-2 rounded-xl text-sm font-semibold transition-all ${
                selected
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-slate-100 dark:bg-dark-surface-elevated text-slate-600 dark:text-slate-300'
              }`}
            >
              {text}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function GenerateProgrammeModal({ isOpen, onClose, onCreated }) {
  const [daysPerWeek, setDaysPerWeek] = useState(4)
  const [emphasis, setEmphasis] = useState('balanced')
  const [experience, setExperience] = useState('intermediate')
  const [durationWeeks, setDurationWeeks] = useState(5)
  const [name, setName] = useState('')
  const [nameTouched, setNameTouched] = useState(false)
  const [plan, setPlan] = useState(null)
  const [saving, setSaving] = useState(false)

  // Rebuild the preview whenever the inputs change
  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    buildMesocyclePlan({ daysPerWeek, emphasis, experience, durationWeeks }).then((result) => {
      if (!cancelled) setPlan(result)
    })
    return () => { cancelled = true }
  }, [isOpen, daysPerWeek, emphasis, experience, durationWeeks])

  // Keep the name in step with the settings until the user types their own
  useEffect(() => {
    if (!nameTouched) setName(suggestProgrammeName({ durationWeeks, emphasis }))
  }, [durationWeeks, emphasis, nameTouched])

  const handleCreate = async () => {
    if (!plan || saving) return
    setSaving(true)
    try {
      const programmeId = await createGeneratedProgramme(
        name.trim() || suggestProgrammeName({ durationWeeks, emphasis }),
        plan
      )
      onCreated?.(programmeId)
      handleClose()
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setNameTouched(false)
    setPlan(null)
    onClose()
  }

  const emphasisDescription = EMPHASIS_OPTIONS.find((e) => e.id === emphasis)?.description
  const totalSets = plan
    ? plan.days.reduce((sum, d) => sum + d.exercises.reduce((s, e) => s + e.targetSets, 0), 0)
    : 0

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Build me a programme">
      <div className="space-y-5">
        <ChoiceRow
          label="Training days per week"
          options={DAY_OPTIONS}
          value={daysPerWeek}
          onChange={setDaysPerWeek}
          columns={5}
        />

        <div>
          <ChoiceRow
            label="Focus"
            options={EMPHASIS_OPTIONS}
            value={emphasis}
            onChange={setEmphasis}
            columns={2}
          />
          {emphasisDescription && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              {emphasisDescription}
            </p>
          )}
        </div>

        <ChoiceRow
          label="Experience"
          options={EXPERIENCE_OPTIONS}
          value={experience}
          onChange={setExperience}
          columns={3}
        />

        <ChoiceRow
          label="Length (final week is a deload)"
          options={DURATION_OPTIONS.map((w) => ({ id: w, label: `${w} weeks` }))}
          value={durationWeeks}
          onChange={setDurationWeeks}
          columns={3}
        />

        <Input
          label="Programme name"
          value={name}
          onChange={(e) => { setName(e.target.value); setNameTouched(true) }}
          placeholder="My mesocycle"
        />

        {/* Preview */}
        {plan && (
          <div className="rounded-xl bg-slate-50 dark:bg-dark-surface-elevated p-3">
            <div className="flex items-baseline justify-between mb-2">
              <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                Week 1 preview
              </h4>
              <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {totalSets} sets
              </span>
            </div>
            <div className="max-h-[32vh] overflow-y-auto space-y-3">
              {plan.days.map((day) => (
                <div key={day.dayNumber}>
                  <p className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wide">
                    {day.name}
                  </p>
                  <ul className="mt-0.5 space-y-0.5">
                    {day.exercises.map((exercise) => (
                      <li
                        key={`${day.dayNumber}-${exercise.order}`}
                        className="flex justify-between gap-2 text-xs text-slate-600 dark:text-slate-300"
                      >
                        <span className="truncate">{exercise.exerciseName}</span>
                        <span className="flex-shrink-0 tabular-nums text-slate-400 dark:text-slate-500">
                          {exercise.targetSets}×{exercise.minReps}-{exercise.maxReps}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
              Every muscle starts near its minimum effective volume. Sets grow
              each week based on the feedback you log.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button fullWidth variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button fullWidth onClick={handleCreate} disabled={!plan || saving}>
            {saving ? 'Creating…' : 'Create Programme'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
