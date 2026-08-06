// RP-style set progression: how many sets to add for a muscle next week.
//
// This is the mechanical heart of the autoregulation. Pump tells you whether
// the stimulus was sufficient; soreness and fatigue tell you whether you
// recovered from it. Ratings are the 1-5 scales the app already collects via
// EmojiSlider.
//
// Kept free of database imports so it can be unit tested directly.

export const SET_PROGRESSION_RULES = {
  MRV_SIGNAL: 'mrv-signal',
  STILL_SORE: 'still-sore',
  HIGH_FATIGUE: 'high-fatigue',
  NEEDS_STIMULUS: 'needs-stimulus',
  STIMULUS_SUFFICIENT: 'stimulus-sufficient',
  STANDARD: 'standard',
  NO_FEEDBACK: 'no-feedback',
}

/**
 * @param {object|null} feedback  { pumpRating, sorenessRating, fatigueRating }, 1-5 each
 * @param {number} currentSets    weighted sets performed for this muscle last week
 * @param {object|null} landmarks { mv, mev, mav, mrv }
 * @returns {{ delta:number, reason:string, rule:string, atCeiling:boolean, deload:boolean }}
 */
export function getSetProgression(feedback, currentSets, landmarks) {
  const pump = feedback?.pumpRating ?? null
  const soreness = feedback?.sorenessRating ?? null
  const fatigue = feedback?.fatigueRating ?? null

  let delta
  let reason
  let rule
  let deload = false

  if (pump === null && soreness === null && fatigue === null) {
    delta = 1
    rule = SET_PROGRESSION_RULES.NO_FEEDBACK
    reason = 'No feedback logged — standard progression'
  } else if (soreness >= 4 && fatigue >= 4) {
    // Still sore AND wiped out. This is the MRV signal: back off.
    delta = -Math.max(1, Math.round(currentSets / 3))
    rule = SET_PROGRESSION_RULES.MRV_SIGNAL
    reason = 'Still sore and highly fatigued — recovery ceiling reached'
    deload = true
  } else if (soreness >= 4) {
    delta = 0
    rule = SET_PROGRESSION_RULES.STILL_SORE
    reason = 'Still sore from last session — hold volume'
  } else if (fatigue >= 4) {
    delta = 0
    rule = SET_PROGRESSION_RULES.HIGH_FATIGUE
    reason = 'High fatigue — hold volume this week'
  } else if (pump !== null && pump <= 2 && (soreness === null || soreness <= 2)) {
    delta = 2
    rule = SET_PROGRESSION_RULES.NEEDS_STIMULUS
    reason = 'Low pump and well recovered — needs more stimulus'
  } else if (pump !== null && pump >= 5 && soreness !== null && soreness >= 3) {
    delta = 0
    rule = SET_PROGRESSION_RULES.STIMULUS_SUFFICIENT
    reason = 'Strong stimulus already, recovering just in time — hold'
  } else {
    delta = 1
    rule = SET_PROGRESSION_RULES.STANDARD
    reason = 'Recovering well — add a set'
  }

  // Never programme past the recovery ceiling.
  let atCeiling = false
  if (landmarks && delta > 0 && currentSets + delta > landmarks.mrv) {
    delta = Math.max(0, Math.round((landmarks.mrv - currentSets) * 10) / 10)
    atCeiling = true
    reason = delta <= 0
      ? `Already at MRV (${landmarks.mrv} sets) — deload rather than add`
      : `Capped at MRV (${landmarks.mrv} sets)`
  }

  return { delta, reason, rule, atCeiling, deload }
}
