// localStorage persistence for SwellFit: settings, streak, completed-today state.
// No database backend exists — this is the only persistence layer.

import { DEFAULT_SETTINGS } from '@/data/sessions'
import type { CoachSettings } from '@/data/player-types'

const KEY_SETTINGS = 'swellfit:settings'
const KEY_STREAK = 'swellfit:streak'

const todayKey = (): string => new Date().toISOString().slice(0, 10)

export function loadSettings(): CoachSettings {
  try {
    const raw = localStorage.getItem(KEY_SETTINGS)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<CoachSettings>
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(s: CoachSettings): void {
  try {
    localStorage.setItem(KEY_SETTINGS, JSON.stringify(s))
  } catch {
    /* storage unavailable — settings just don't persist */
  }
}

export interface StreakState {
  /** Week starts Monday. 0 = none yet, 1..7 sessions this ISO week. */
  weekly: number
  weeklyGoal: number
  /** ISO date of the last completed session. */
  lastCompleted: string | null
  /** ISO date of the last session the user rated at check-in. */
  lastCheckIn: string | null
}

const DEFAULT_STREAK: StreakState = {
  weekly: 0,
  weeklyGoal: 4,
  lastCompleted: null,
  lastCheckIn: null,
}

export function loadStreak(): StreakState {
  try {
    const raw = localStorage.getItem(KEY_STREAK)
    if (!raw) return { ...DEFAULT_STREAK }
    return { ...DEFAULT_STREAK, ...(JSON.parse(raw) as Partial<StreakState>) }
  } catch {
    return { ...DEFAULT_STREAK }
  }
}

/** Record a completed session: +1 toward the weekly goal when it's the first today. */
export function recordCompletion(): StreakState {
  const s = loadStreak()
  const today = todayKey()
  const next: StreakState =
    s.lastCompleted === today
      ? { ...s, lastCompleted: today }
      : { ...s, weekly: Math.min(s.weeklyGoal, s.weekly + 1), lastCompleted: today }
  persist(next)
  return next
}

export function recordCheckIn(): void {
  persist({ ...loadStreak(), lastCheckIn: todayKey() })
}

/** Same ISO week (Monday start) as a given ISO date string. */
function sameWeek(iso: string | null): boolean {
  if (!iso) return false
  const then = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(then.getTime())) return false
  const now = new Date()
  const day = (d: Date) => (d.getDay() + 6) % 7 // Mon=0..Sun=6
  const mondayOf = (d: Date) => {
    const m = new Date(d)
    m.setDate(d.getDate() - day(d))
    m.setHours(0, 0, 0, 0)
    return m.getTime()
  }
  return mondayOf(now) === mondayOf(then)
}

function persist(s: StreakState): void {
  try {
    localStorage.setItem(KEY_STREAK, JSON.stringify(s))
  } catch {
    /* storage unavailable */
  }
}

/** Weekly count reset to 0 when the stored one is from a previous week. */
export function currentStreak(): StreakState {
  const s = loadStreak()
  return sameWeek(s.lastCompleted) ? s : { ...s, weekly: 0 }
}
