// The weekly-cycle engine ("Coach de Verdade", Part 1).
//
// Four session archetypes (S1..S4), each with a complementary surf focus, are
// built into a CoachSession here — never in sessions.ts, whose flat-day /
// surf-day builder stays untouched (Stage 1 behavior is locked).
//
// Rules from the plan:
//  - Each session is structured in 3 blocks: Warmup / Main Conditioning /
//    Decompression (SESSION_BLOCKS in player-types).
//  - Difficulty scales per CoachLevel: Level 2 is the base, Level 1 trims
//    dose and lengthens rest, Level 3 adds dose and trims rest (LEVEL_LOAD).
//  - The adaptive build reads the CoachState: the load factor from the last
//    check-in feel (Too Easy → up, Brutal → down) and pre-selects joint
//    protection exercises when the joint check flagged shoulder / lower back
//    / knees. Surf Day routines (pre/post) never consume a weekly slot.
//  - "AI" never appears anywhere in the UI — this is the "Coach".

import { getCatalogueExercise } from './sessions'
import type {
  CoachLevel,
  CoachSession,
  CoachSettings,
  DayId,
  JointOption,
  LevelLoadMap,
  PhaseName,
  PlayerExercise,
  SessionSlotId,
  SurfSubMode,
} from './player-types'
import {
  LEVEL_LOAD,
  MAX_LOAD_FACTOR,
  MIN_LOAD_FACTOR,
  PHASE_LABELS,
  SESSION_BLOCKS,
  SURF_SUBMODE_LABELS,
} from './player-types'
import type { CoachState } from '@/lib/storage'

// ── Template definition ──────────────────────────────────────────────────────

/**
 * One template slot: a list of exercise ids in preference order. The builder
 * walks the list and picks the first catalogue entry that fits the current
 * equipment budget, joint-protection flags and (within a block) isn't already
 * chosen. An empty pick just drops the slot — templates stay resilient when
 * a bodyweight-only user rules out every kettlebell option in one slot.
 */
type TemplateSlot = string[]

interface TemplateDay {
  /** One complementary surf focus per archetype. */
  focus: string
  description: string
  /** Full (time: 'full') slot plan per phase. */
  full: Record<PhaseName, TemplateSlot[]>
  /** Express (time: 'express') keeps warmup + a trimmed main + decompression. */
  express: Record<PhaseName, TemplateSlot[]>
}

export const WEEKLY_TEMPLATES: Record<DayId, TemplateDay> = {
  S1: {
    focus: 'Paddle Endurance',
    description: 'Long paddle-output work: lats, mid-back and stroke-path endurance.',
    full: {
      warmup: [['cat-cow-flow'], ['thoracic-open-books'], ['band-dislocates']],
      main: [
        ['banded-paddle-pulls', 'prone-swimmers'],
        ['trx-rows', 'banded-paddle-pulls'],
        ['prone-swimmers', 'prone-ytw'],
        ['side-plank-hip-dips', 'hollow-body-holds'],
      ],
      decompression: [['child-pose-with-reach'], ['thread-the-needle-hold']],
    },
    express: {
      warmup: [['cat-cow-flow'], ['thoracic-open-books']],
      main: [
        ['banded-paddle-pulls', 'prone-swimmers'],
        ['trx-rows', 'banded-paddle-pulls'],
        ['side-plank-hip-dips', 'hollow-body-holds'],
      ],
      decompression: [['child-pose-with-reach']],
    },
  },
  S2: {
    focus: 'Cuff Prehab & Pop-Up',
    description: 'Rotator-cuff prehab plus pop-up speed, in one shoulder-smart session.',
    full: {
      warmup: [['band-dislocates'], ['thoracic-open-books'], ['wall-angels']],
      main: [
        ['banded-external-rotations', 'side-lying-external-rotation'],
        ['scapular-push-ups', 'wall-slides'],
        ['explosive-surf-pop-ups', 'slow-tempo-pop-ups'],
        ['glute-bridge-march', 'glute-bridge'],
      ],
      decompression: [['thread-the-needle-hold'], ['reverse-tabletop-hold']],
    },
    express: {
      warmup: [['band-dislocates'], ['thoracic-open-books']],
      main: [
        ['banded-external-rotations', 'side-lying-external-rotation'],
        ['explosive-surf-pop-ups', 'slow-tempo-pop-ups'],
        ['glute-bridge-march', 'glute-bridge'],
      ],
      decompression: [['reverse-tabletop-hold']],
    },
  },
  S3: {
    focus: 'Back & Hips',
    description: 'Posterior chain and hip mobility for the bottom turn and low-back care.',
    full: {
      warmup: [['world-greatest-stretch'], ['cat-cow-flow'], ['hip-flexor-release']],
      main: [
        ['kettlebell-swings', 'glute-bridge'],
        ['bird-dog-rows', 'bird-dog'],
        ['cossack-squats', 'lateral-bounds'],
        ['hollow-body-holds', 'dead-bug-extensions'],
        ['side-plank-hip-dips', 'dead-bug'],
      ],
      decompression: [['pigeon-pose-hold'], ['supine-spine-twist'], ['legs-up-the-wall']],
    },
    express: {
      warmup: [['world-greatest-stretch'], ['cat-cow-flow']],
      main: [
        ['kettlebell-swings', 'glute-bridge'],
        ['bird-dog-rows', 'bird-dog'],
        ['cossack-squats', 'lateral-bounds'],
        ['hollow-body-holds', 'dead-bug-extensions'],
      ],
      decompression: [['pigeon-pose-hold'], ['supine-spine-twist']],
    },
  },
  S4: {
    focus: 'Full-Body Capacity',
    description: 'Everything at once: paddle, pop-up, legs and core under fatigue.',
    full: {
      warmup: [['world-greatest-stretch'], ['band-dislocates'], ['thoracic-open-books']],
      main: [
        ['explosive-surf-pop-ups', 'slow-tempo-pop-ups'],
        ['kettlebell-swings', 'glute-bridge'],
        ['banded-paddle-pulls', 'prone-swimmers'],
        ['cossack-squats', 'lateral-bounds'],
        ['bird-dog-rows', 'side-plank-hip-dips'],
      ],
      decompression: [['child-pose-with-reach'], ['pigeon-pose-hold'], ['legs-up-the-wall']],
    },
    express: {
      warmup: [['world-greatest-stretch'], ['band-dislocates']],
      main: [
        ['explosive-surf-pop-ups', 'slow-tempo-pop-ups'],
        ['kettlebell-swings', 'glute-bridge'],
        ['banded-paddle-pulls', 'prone-swimmers'],
        ['cossack-squats', 'lateral-bounds'],
      ],
      decompression: [['pigeon-pose-hold'], ['legs-up-the-wall']],
    },
  },
}

// ── Surf Day routines (never consume a weekly slot) ──────────────────────────

const SURF_TEMPLATES: Record<SurfSubMode, TemplateDay> = {
  pre: {
    focus: 'Pre-Surf Activation',
    description: 'Wake the shoulders, spine and hips before you paddle out.',
    full: {
      warmup: [['cat-cow-flow'], ['band-dislocates'], ['world-greatest-stretch']],
      main: [
        ['banded-external-rotations', 'side-lying-external-rotation'],
        ['scapular-push-ups', 'wall-angels'],
        ['explosive-surf-pop-ups', 'slow-tempo-pop-ups'],
      ],
      decompression: [['thread-the-needle-hold'], ['supine-spine-twist']],
    },
    express: {
      warmup: [['cat-cow-flow'], ['band-dislocates']],
      main: [
        ['banded-external-rotations', 'side-lying-external-rotation'],
        ['explosive-surf-pop-ups', 'slow-tempo-pop-ups'],
      ],
      decompression: [['thread-the-needle-hold']],
    },
  },
  post: {
    focus: 'Post-Surf Decompression',
    description: 'Undo the paddle hunch and the short hip-flexor stance after the session.',
    full: {
      warmup: [['cat-cow-flow'], ['thoracic-open-books']],
      main: [
        ['child-pose-with-reach'],
        ['hip-flexor-release'],
        ['pigeon-pose-hold'],
        ['thread-the-needle-hold'],
      ],
      decompression: [['legs-up-the-wall'], ['supine-spine-twist']],
    },
    express: {
      warmup: [['cat-cow-flow']],
      main: [['child-pose-with-reach'], ['hip-flexor-release'], ['pigeon-pose-hold']],
      decompression: [['legs-up-the-wall']],
    },
  },
}

// ── Joint protection mapping ─────────────────────────────────────────────────

/** Exercises a flagged joint rules out, wherever they appear in a slot. */
const JOINT_FLAGS: Record<JointOption, (e: PlayerExercise) => boolean> = {
  shoulders: (e) => !!e.stress.shoulders,
  lowerBack: (e) => !!e.stress.lowerBack,
  knees: (e) => e.id === 'kettlebell-swings' || e.id === 'lateral-bounds',
}

// ── Level scaling ────────────────────────────────────────────────────────────

/** Round to a sane rep/duration count, always ≥ 1. */
function scaleDose(value: number, factor: number): number {
  return Math.max(1, Math.round(value * factor))
}

/**
 * Apply the level's dose/rest multipliers and rewrite the human dose label
 * (a scaled "3 × 12" becomes "3 × 14" so the player shows what's real).
 */
function applyLevel(ex: PlayerExercise, level: CoachLevel): PlayerExercise {
  const { dose, rest } = LEVEL_LOAD[level]
  if (dose === 1 && rest === 1) return ex
  const scaled: PlayerExercise = {
    ...ex,
    restSeconds: Math.max(5, Math.round(ex.restSeconds * rest)),
  }
  if (ex.type === 'reps' && ex.reps) {
    scaled.reps = scaleDose(ex.reps, dose)
    scaled.dose = `${scaled.sets} × ${scaled.reps}${ex.perSide ? ' per side' : ''}`
  } else if (ex.type === 'time' && ex.durationSeconds) {
    scaled.durationSeconds = scaleDose(ex.durationSeconds, dose)
    scaled.dose = `${scaled.sets} × ${scaled.durationSeconds}s`
  }
  return scaled
}

// ── Adaptive load factor ─────────────────────────────────────────────────────

/** Session-level load factor from CoachState: feel moves it, clamped. */
function stateLoadFactor(state: CoachState | null): number {
  if (!state) return 1
  switch (state.lastFeel) {
    case 'too_easy':
      return Math.min(MAX_LOAD_FACTOR, 1 + 0.1)
    case 'brutal':
      return Math.max(MIN_LOAD_FACTOR, 1 - 0.15)
    default:
      return 1
  }
}

// ── The builder ──────────────────────────────────────────────────────────────

export interface BuildWeeklySessionArgs {
  slotId: SessionSlotId
  settings: CoachSettings
  /** Live coach state — the adaptive half of the builder. */
  state: CoachState | null
}

/**
 * Build today's session:
 *  - weekly archetype (S1..S4) or a Surf Day routine (pre/post);
 *  - exercises chosen slot-by-slot from the catalogue, respecting equipment
 *    budget, joint protection (persistent flags from CoachState merged with
 *    the adapt-sheet's manual picks) and no duplicates within a block;
 *  - dose scaled by coach level × the check-in load factor.
 */
export function buildWeeklySession({
  slotId,
  settings,
  state,
}: BuildWeeklySessionArgs): CoachSession {
  const level: CoachLevel = state?.coachLevel ?? 2
  const template =
    slotId === 'SURF_PRE' || slotId === 'SURF_POST'
      ? SURF_TEMPLATES[slotId === 'SURF_PRE' ? 'pre' : 'post']
      : WEEKLY_TEMPLATES[slotId]

  // Effective joint flags: persistent care (from check-ins) + manual picks.
  const joints = new Set(settings.joints)
  if (state?.persistentJointCare.shoulders) joints.add('shoulders')
  if (state?.persistentJointCare.lowerBack) joints.add('lowerBack')
  if (state?.persistentJointCare.knees) joints.add('knees')

  const plan = settings.time === 'express' ? template.express : template.full
  const loadFactor = stateLoadFactor(state) * LEVEL_LOAD[level].dose

  const exercises: PlayerExercise[] = []
  const chosenIds = new Set<string>()

  for (const block of SESSION_BLOCKS) {
    const slots = plan[block.phase] ?? []
    for (const slot of slots) {
      const pick = slot
        .map((id) => getCatalogueExercise(id))
        .find(
          (e): e is PlayerExercise =>
            !!e &&
            !chosenIds.has(e.id) &&
            e.rank <= EQUIPMENT_RANK(settings.equipment) &&
            ![...joints].some((j) => JOINT_FLAGS[j](e)),
        )
      if (pick) {
        chosenIds.add(pick.id)
        exercises.push(applyLevel(pick, level))
      }
    }
  }

  // Apply the session-level load factor on top of the level scaling.
  const withLoad = exercises.map((ex) => {
    if (loadFactor === 1) return ex
    const adjusted = { ...ex }
    if (ex.type === 'reps' && ex.reps) {
      adjusted.reps = scaleDose(ex.reps, loadFactor)
      adjusted.dose = `${adjusted.sets} × ${adjusted.reps}${ex.perSide ? ' per side' : ''}`
    } else if (ex.type === 'time' && ex.durationSeconds) {
      adjusted.durationSeconds = scaleDose(ex.durationSeconds, loadFactor)
      adjusted.dose = `${adjusted.sets} × ${adjusted.durationSeconds}s`
    }
    return adjusted
  })

  const label =
    slotId === 'SURF_PRE' || slotId === 'SURF_POST'
      ? SURF_SUBMODE_LABELS[slotId === 'SURF_PRE' ? 'pre' : 'post']
      : `${slotId} · ${template.focus}`

  const focusTags = [...joints].length ? [template.focus, 'Joint Care'] : [template.focus]
  const description = state?.lastFeel
    ? `${template.description} Adapted from your last check-in.`
    : template.description

  return {
    title: label,
    description,
    durationMin: settings.time === 'express' ? 10 : 25,
    equipmentTag: EQUIPMENT_TAG(settings.equipment),
    focusTags,
    exercises: withLoad,
    dayId: slotId === 'SURF_PRE' || slotId === 'SURF_POST' ? undefined : slotId,
  }
}

// Helper so the builder can import EQUIPMENT_RANK without a circular import
// (sessions.ts re-exports player-types, not weekly-plan).
function EQUIPMENT_RANK(equipment: CoachSettings['equipment']): number {
  switch (equipment) {
    case 'bodyweight':
      return 0
    case 'bands':
      return 1
    case 'kettlebell':
      return 2
    case 'gym':
      return 3
  }
}

function EQUIPMENT_TAG(equipment: CoachSettings['equipment']): string {
  switch (equipment) {
    case 'bodyweight':
      return 'Bodyweight Only'
    case 'bands':
      return 'Bodyweight + Bands'
    case 'kettlebell':
      return 'Bodyweight + Kettlebell / TRX'
    case 'gym':
      return 'Full Gym'
  }
}

/**
 * Which slot should the Coach show today?
 * The week does NOT reset on Mondays: focus counts carry over until the four
 * archetypes have each been hit, then the cycle restarts at S1. Surf Day
 * routines never consume a slot.
 */
export function pickTodaySlot(state: CoachState | null): DayId {
  const counts = state?.weeklyFocusCounts ?? { S1: 0, S2: 0, S3: 0, S4: 0 }
  const fewest = Math.min(counts.S1, counts.S2, counts.S3, counts.S4)
  // Some archetype is behind: fill the least-hit one, in S1..S4 order when tied.
  return (WEEKLY_SLOT_ORDER.find((d) => counts[d] === fewest) ?? 'S1') as DayId
}
