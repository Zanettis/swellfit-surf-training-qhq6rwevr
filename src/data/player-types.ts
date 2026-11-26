// Player exercise data model (Stage 2) + Stage 1 settings types, in one place.
// Stage 3 ("Coach de Verdade") adds the weekly cycle: day ids, per-block
// phases and the adaptation state the check-in engine writes.

export type ExerciseType = 'time' | 'reps'
export type DayMode = 'flat' | 'surf'
export type TimeOption = 'full' | 'express'
export type EquipmentOption = 'bodyweight' | 'bands' | 'kettlebell' | 'gym'
export type JointOption = 'shoulders' | 'lowerBack'

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
export type JointCheck = 'all_good' | 'shoulder' | 'lower_back'

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
  stress: { shoulders?: boolean; lowerBack?: boolean }
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
