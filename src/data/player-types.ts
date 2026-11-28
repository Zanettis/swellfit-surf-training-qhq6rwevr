// Player exercise data model (Stage 2) + Stage 1 settings types, in one place.
// Stage 3 ("Coach de Verdade") adds the weekly cycle: day ids, per-block
// phases and the adaptation state the check-in engine writes.

export type ExerciseType = 'time' | 'reps'
export type DayMode = 'flat' | 'surf'
export type TimeOption = 'full' | 'express'
export type EquipmentOption = 'bodyweight' | 'bands' | 'kettlebell' | 'gym'
export type JointOption = 'shoulders' | 'lowerBack' | 'knees'

/** The three phases every weekly session is structured into. */
export type PhaseName = 'warmup' | 'main' | 'decompression'

export const PHASE_LABELS: Record<PhaseName, string> = {
  warmup: 'Warmup',
  main: 'Main Conditioning',
  decompression: 'Decompression',
}

/** S1..S4 — the four weekly session templates of the progressive cycle. */
export type DayId = 'S1' | 'S2' | 'S3' | 'S4'

export const DAY_LABELS: Record<DayId, string> = {
  S1: 'S1 · Paddle Endurance',
  S2: 'S2 · Cuff Prehab & Pop-Up',
  S3: 'S3 · Back & Hips',
  S4: 'S4 · Full-Body Capacity',
}

/** How the Coach screen should next adjust the dose, per check-in feel. */
export type FeelOption = 'too_easy' | 'just_right' | 'brutal'
export type JointCheck = 'all_good' | 'shoulder' | 'lower_back' | 'knees'

/**
 * Persisted adaptation state: what the Coach learned from the last check-ins.
 * `loadFactor` scales reps/durations (1 = neutral, 1.1 = +10%, 0.85 = −15%),
 * clamped between MIN and MAX LOAD FACTOR.
 */
export interface AdaptationState {
  loadFactor: number
  /** Joint protection flags — stressed exercises get substituted out. */
  protectShoulders: boolean
  protectLowerBack: boolean
  protectKnees: boolean
  lastFeel: FeelOption | null
  lastJoint: JointCheck | null
}

export const MIN_LOAD_FACTOR = 0.75
export const MAX_LOAD_FACTOR = 1.35

/** The adapt-session settings the Coach screen persists and builds a session from. */
export interface CoachSettings {
  time: TimeOption
  equipment: EquipmentOption
  joints: JointOption[]
}

export interface ExerciseBase {
  id: string
  name: string
  dose: string
  rank: number
  stress: { shoulders?: boolean; lowerBack?: boolean; knees?: boolean }
}

/** What the Coach screen renders (Stage 1 summary) and what buildSession emits. */
export interface Exercise extends ExerciseBase {
  type: ExerciseType
  sets: number
  reps?: number
  perSide?: boolean
  durationSeconds?: number
  restSeconds: number
}

/** What the player renders: Stage 1 fields + video, cue, tips, alternatives. */
export interface PlayerExercise extends Exercise {
  videoUrl?: string
  posterUrl?: string
  surfCue: string
  formTips: string[]
  alternativeTags: string[]
  alternatives: PlayerExercise[]
  /** Session phase this block belongs to (weekly cycle sessions). */
  phase?: PhaseName
  /** Rep logging is offered ONLY on Main Conditioning blocks (Coach rule). */
  canLogReps?: boolean
}

export interface CoachSession {
  title: string
  description: string
  durationMin: number
  equipmentTag: string
  focusTags: string[]
  exercises: PlayerExercise[]
  /** Present on weekly-cycle sessions (S1..S4). */
  dayId?: DayId
}

/** Snapshot handed to the player and the completion screen. */
export interface PlayerSession {
  title: string
  description: string
  durationMin: number
  focusTags: string[]
  exercises: PlayerExercise[]
}

// ── Stage 3 ("Coach de Verdade"): weekly cycle types ────────────────────────

/** The three blocks every weekly-cycle session is structured into. */
export interface SessionBlock {
  phase: PhaseName
  label: string
  /** Target duration range, in minutes. */
  targetMinutes: [number, number]
}

export const SESSION_BLOCKS: SessionBlock[] = [
  { phase: 'warmup', label: 'Warmup', targetMinutes: [2, 3] },
  { phase: 'main', label: 'Main Conditioning', targetMinutes: [14, 22] },
  { phase: 'decompression', label: 'Decompression', targetMinutes: [4, 8] },
]

/** Surf Day routines (Pre / Post) — extra sessions that consume NO weekly slot. */
export type SurfSubMode = 'pre' | 'post'

export const SURF_SUBMODE_LABELS: Record<SurfSubMode, string> = {
  pre: 'Pre-Surf Activation',
  post: 'Post-Surf Decompression',
}

/** Every slot a session can fill: the four weekly archetypes or a surf routine. */
export type SessionSlotId = DayId | 'SURF_PRE' | 'SURF_POST'

/** Order the week's slots are filled in when counts are tied. */
export const WEEKLY_SLOT_ORDER: DayId[] = ['S1', 'S2', 'S3', 'S4']

/** Coach intensity level — Level 2 is the base; check-ins move it ±1 (1..5). */
export type CoachLevel = 1 | 2 | 3 | 4 | 5

export const MIN_COACH_LEVEL: CoachLevel = 1
export const MAX_COACH_LEVEL: CoachLevel = 5
export const BASE_COACH_LEVEL: CoachLevel = 2

export const COACH_LEVEL_LABELS: Record<CoachLevel, string> = {
  1: 'Level 1 · Rebuild',
  2: 'Level 2 · Build',
  3: 'Level 3 · Push',
  4: 'Level 4 · Surge',
  5: 'Level 5 · Power',
}

/**
 * Dose scaling per level: reps/durations multiplier, rest multiplier and —
 * from Level 4 on — extra SETS on the Main Conditioning block (visible in the
 * dose label: "4 × 12" instead of "3 × 12"). Level 5 also raises the dose
 * multiplier further (+1 dose extra on top of the extra set).
 */
export const LEVEL_LOAD: Record<CoachLevel, { dose: number; rest: number; extraMainSets: number }> =
  {
    1: { dose: 0.85, rest: 1.25, extraMainSets: 0 },
    2: { dose: 1, rest: 1, extraMainSets: 0 },
    3: { dose: 1.15, rest: 0.9, extraMainSets: 0 },
    4: { dose: 1.2, rest: 0.85, extraMainSets: 1 },
    5: { dose: 1.35, rest: 0.8, extraMainSets: 1 },
  }
