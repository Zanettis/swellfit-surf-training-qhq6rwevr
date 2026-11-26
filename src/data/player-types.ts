// Player exercise data model (Stage 2) + Stage 1 settings types, in one place.

export type ExerciseType = 'time' | 'reps'
export type DayMode = 'flat' | 'surf'
export type TimeOption = 'full' | 'express'
export type EquipmentOption = 'bodyweight' | 'bands' | 'kettlebell' | 'gym'
export type JointOption = 'shoulders' | 'lowerBack'

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
}

export interface CoachSession {
  title: string
  description: string
  durationMin: number
  equipmentTag: string
  focusTags: string[]
  exercises: PlayerExercise[]
}

/** Snapshot handed to the player and the completion screen. */
export interface PlayerSession {
  title: string
  description: string
  durationMin: number
  focusTags: string[]
  exercises: PlayerExercise[]
}
