// Module-level handoff between Coach → Player → CheckIn. No backend exists,
// so the active session travels through this singleton instead of a context.
// It only ever lives for one workout: read once, then cleared.

import type { PlayerSession } from '@/data/player-types'

export interface Handoff {
  session: PlayerSession
  /** Exercise the player should open on (0 = start of session). */
  startAt: number
}

export interface FinishSummary {
  elapsedSeconds: number
  exerciseCount: number
}

let handoff: Handoff | null = null
let summary: FinishSummary | null = null

export function setHandoff(h: Handoff): void {
  handoff = h
}

export function takeHandoff(): Handoff | null {
  const h = handoff
  return h
}

export function setFinishSummary(s: FinishSummary): void {
  summary = s
}

export function takeFinishSummary(): FinishSummary | null {
  const s = summary
  return s
}

export function clearSession(): void {
  handoff = null
  summary = null
}
