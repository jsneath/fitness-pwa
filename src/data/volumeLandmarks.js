// Weekly volume landmarks, in hard sets per muscle per week.
//
//   MV   Maintenance Volume     - enough to hold what you have
//   MEV  Minimum Effective Vol. - where a mesocycle starts
//   MAV  Maximum Adaptive Vol.  - top of the productive band
//   MRV  Maximum Recoverable    - past here you accumulate more fatigue
//                                 than you can recover from; deload
//
// IMPORTANT: these are population-level starting estimates drawn from RP's
// published tables. They vary considerably between individuals and between
// sources, and RP itself treats them as a first guess you calibrate against
// your own recovery. They are stored in the database precisely so they can be
// edited — do not treat them as fixed truth.

export const DEFAULT_VOLUME_LANDMARKS = [
  { muscleGroup: 'Chest', mv: 4, mev: 8, mav: 18, mrv: 22 },
  { muscleGroup: 'Back', mv: 6, mev: 10, mav: 20, mrv: 25 },
  { muscleGroup: 'Shoulders', mv: 4, mev: 8, mav: 20, mrv: 26 },
  { muscleGroup: 'Biceps', mv: 4, mev: 8, mav: 20, mrv: 26 },
  { muscleGroup: 'Triceps', mv: 4, mev: 6, mav: 14, mrv: 18 },
  { muscleGroup: 'Quadriceps', mv: 6, mev: 8, mav: 18, mrv: 20 },
  { muscleGroup: 'Hamstrings', mv: 3, mev: 4, mav: 16, mrv: 20 },
  { muscleGroup: 'Glutes', mv: 0, mev: 4, mav: 12, mrv: 16 },
  { muscleGroup: 'Calves', mv: 6, mev: 8, mav: 16, mrv: 20 },
  { muscleGroup: 'Traps', mv: 0, mev: 4, mav: 20, mrv: 26 },
  { muscleGroup: 'Forearms', mv: 2, mev: 4, mav: 16, mrv: 20 },
  { muscleGroup: 'Core', mv: 0, mev: 4, mav: 16, mrv: 25 },
  { muscleGroup: 'Adductors', mv: 0, mev: 4, mav: 12, mrv: 16 },
]

// Where a muscle's current weekly volume sits relative to its landmarks.
export const VOLUME_STATUS = {
  UNDER_MV: 'under-mv',
  MAINTENANCE: 'maintenance',
  ADAPTIVE: 'adaptive',
  APPROACHING_MRV: 'approaching-mrv',
  OVER_MRV: 'over-mrv',
}

export const VOLUME_STATUS_META = {
  [VOLUME_STATUS.UNDER_MV]: {
    label: 'Below maintenance',
    hint: 'Not enough to hold current muscle',
    colour: 'slate',
  },
  [VOLUME_STATUS.MAINTENANCE]: {
    label: 'Maintenance',
    hint: 'Holding, but not growing — add sets to progress',
    colour: 'sky',
  },
  [VOLUME_STATUS.ADAPTIVE]: {
    label: 'Productive',
    hint: 'In the growth range',
    colour: 'emerald',
  },
  [VOLUME_STATUS.APPROACHING_MRV]: {
    label: 'Near MRV',
    hint: 'Close to your recovery ceiling — deload soon',
    colour: 'amber',
  },
  [VOLUME_STATUS.OVER_MRV]: {
    label: 'Over MRV',
    hint: 'Past what you can recover from — deload',
    colour: 'red',
  },
}

/** Classify weekly sets for one muscle against its landmarks. */
export function getVolumeStatus(sets, landmarks) {
  if (!landmarks) return VOLUME_STATUS.ADAPTIVE
  if (sets > landmarks.mrv) return VOLUME_STATUS.OVER_MRV
  if (sets > landmarks.mav) return VOLUME_STATUS.APPROACHING_MRV
  if (sets >= landmarks.mev) return VOLUME_STATUS.ADAPTIVE
  if (sets >= landmarks.mv) return VOLUME_STATUS.MAINTENANCE
  return VOLUME_STATUS.UNDER_MV
}
