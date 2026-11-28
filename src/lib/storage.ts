// Persistence layer for SwellFit's "Coach de Verdade" weekly cycle.
//
// The plan asks for localStorage, but the user decided: the app persists to
// SUPABASE, keyed by an anonymous device id (no login), with localStorage as
// the offline fallback. The API names and shapes below are exactly the ones
// the plan defines — only the storage backing changed.
//
// Tables used (see supabase/migrations):
//   workout_history — one row per completed session (date, duration, volume,
//                     feel, joint). RLS: anon can read/write own device_id.

import { supabase } from '@/lib/supabase/client'
import { DEFAULT_SETTINGS } from '@/data/sessions'
import {
  MAX_COACH_LEVEL,
  MIN_COACH_LEVEL,
  type CoachLevel,
  type CoachSettings,
  type DayId,
  type FeelOption,
  type JointCheck,
  type JointOption,
  type SurfSubMode,
} from '@/data/player-types'

const KEY_SETTINGS = 'swellfit:settings'
const KEY_STREAK = 'swellfit:streak'
const KEY_REPS = 'swellfit:reps'
const KEY_COACH = 'swellfit:coach-state'
const KEY_DEVICE = 'swellfit:device-id'
const MAX_REP_LOGS = 400
const MAX_HISTORY = 200

const todayKey = (): string => new Date().toISOString().slice(0, 10)

// ── Anonymous device id (no login) ───────────────────────────────────────────

/** Stable per-browser uuid, created on first use and kept in localStorage. */
export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(KEY_DEVICE)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(KEY_DEVICE, id)
    }
    return id
  } catch {
    // No localStorage (private mode) — an ephemeral id still lets writes work.
    return crypto.randomUUID()
  }
}

// ── Stage 1 settings (unchanged API, localStorage only — it is a UI mirror) ──

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

// ── Streak (localStorage — cheap derived state, recomputed from history) ─────

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

// ── Rep history ──────────────────────────────────────────────────────────────
// One entry per logged set, keyed by exercise id + set index so "vs last time"
// comparisons work across sessions. Newest first. Rep Log is offered ONLY on
// Main Conditioning blocks — that rule is enforced where the sheet opens.

export interface RepLogEntry {
  /** ISO date the set was performed (YYYY-MM-DD). */
  date: string
  exerciseId: string
  /** 0-based set index inside the exercise. */
  setIndex: number
  reps: number
  /** Elapsed seconds of that set, from the count-up timer when available. */
  seconds?: number
  /** Which session slot the set belonged to (S1..S4 / surf routines). */
  slotId?: string
}

function readRepLogs(): RepLogEntry[] {
  try {
    const raw = localStorage.getItem(KEY_REPS)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as RepLogEntry[]) : []
  } catch {
    return []
  }
}

/** History for one exercise + set index, newest first. */
export function loadRepHistory(exerciseId: string, setIndex: number): RepLogEntry[] {
  return readRepLogs().filter((e) => e.exerciseId === exerciseId && e.setIndex === setIndex)
}

/** Every logged set, newest first — the progression summary's data source. */
export function loadAllRepHistory(): RepLogEntry[] {
  return readRepLogs()
}

/**
 * Best (max) reps per exercise+slot from the RECENT sessions, for the
 * weekly-plan builder's progression targets. Reads every logged set of the
 * last `withinDays` days and folds them into one entry per exercise id.
 */
export function loadBestRecentReps(
  withinDays = 21,
): Record<string, { reps: number; setIndex: number; date: string }> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - withinDays)
  const cutoffKey = cutoff.toISOString().slice(0, 10)
  const best: Record<string, { reps: number; setIndex: number; date: string }> = {}
  for (const log of readRepLogs()) {
    if (log.date < cutoffKey) continue
    const current = best[log.exerciseId]
    if (!current || log.reps > current.reps) {
      best[log.exerciseId] = { reps: log.reps, setIndex: log.setIndex, date: log.date }
    }
  }
  return best
}

/**
 * Save a logged set. Returns the most recent PREVIOUS entry for the same
 * exercise + set (null when this is the first time), so the player can show
 * "+2 vs last time" right after logging.
 */
export function recordRepLog(entry: {
  exerciseId: string
  setIndex: number
  reps: number
  seconds?: number
  slotId?: string
}): RepLogEntry | null {
  const logs = readRepLogs()
  const previous =
    logs.find((e) => e.exerciseId === entry.exerciseId && e.setIndex === entry.setIndex) ?? null
  const next: RepLogEntry[] = [{ date: todayKey(), ...entry }, ...logs].slice(0, MAX_REP_LOGS)
  try {
    localStorage.setItem(KEY_REPS, JSON.stringify(next))
  } catch {
    /* storage unavailable — history just doesn't persist */
  }
  return previous
}

// ── Coach state (the weekly cycle's brain) ───────────────────────────────────
// Key `swellfit:coach-state`. Mirrored to Supabase through workout_history —
// the history rows ARE the durable record; CoachState is the fast local copy.

export interface WeeklyFocusCounts {
  /** Completed sessions per archetype this week (Surf Day never counts). */
  S1: number
  S2: number
  S3: number
  S4: number
}

export interface CheckInTimes {
  /** ISO date of the last check-in that recorded each feel. */
  too_easy: string | null
  just_right: string | null
  brutal: string | null
}

export interface CoachState {
  /** Week number of the progressive cycle — NEVER resets on a Monday. */
  currentWeekNumber: number
  /** Coach intensity level. Level 2 is the base; check-ins move it ±1. */
  coachLevel: CoachLevel
  /** Sessions completed per archetype this ISO week (Surf Day excluded). */
  weeklyFocusCounts: WeeklyFocusCounts
  /** Last check-in date per feel, for weekly averaging. */
  checkInTimes: CheckInTimes
  /** Joint flags from the last check-in — pre-select protection next session. */
  persistentJointCare: {
    shoulders: boolean
    lowerBack: boolean
    knees: boolean
    /** ISO date the flags were set (for the UI's "from the last check-in"). */
    since: string | null
  }
  /** ISO date the last workout was completed. */
  lastCompleted: string | null
  lastUpdated: string
}

export const DEFAULT_COACH_STATE: CoachState = {
  currentWeekNumber: 1,
  coachLevel: 2,
  weeklyFocusCounts: { S1: 0, S2: 0, S3: 0, S4: 0 },
  checkInTimes: { too_easy: null, just_right: null, brutal: null },
  persistentJointCare: { shoulders: false, lowerBack: false, knees: false, since: null },
  lastCompleted: null,
  lastUpdated: todayKey(),
}

export function loadCoachState(): CoachState {
  try {
    const raw = localStorage.getItem(KEY_COACH)
    if (!raw) return { ...DEFAULT_COACH_STATE }
    const parsed = JSON.parse(raw) as Partial<CoachState>
    // The week does NOT reset on Mondays: counts carry over until the four
    // archetypes have each been completed once (Freeletics week rule).
    const weeklyFocusCounts = {
      ...DEFAULT_COACH_STATE.weeklyFocusCounts,
      ...parsed.weeklyFocusCounts,
    }
    return {
      ...DEFAULT_COACH_STATE,
      ...parsed,
      weeklyFocusCounts,
      checkInTimes: { ...DEFAULT_COACH_STATE.checkInTimes, ...parsed.checkInTimes },
      persistentJointCare: {
        ...DEFAULT_COACH_STATE.persistentJointCare,
        ...parsed.persistentJointCare,
      },
    }
  } catch {
    return { ...DEFAULT_COACH_STATE }
  }
}

function saveCoachState(state: CoachState): void {
  try {
    localStorage.setItem(KEY_COACH, JSON.stringify(state))
  } catch {
    /* storage unavailable — coach state just doesn't persist locally */
  }
}

// ── Workout history (Supabase write-through, localStorage fallback) ─────────

export interface WorkoutHistoryEntry {
  /** ISO date the workout happened (YYYY-MM-DD). */
  date: string
  /** Session archetype: S1..S4, or the surf routines. */
  slotId: DayId | SurfSubMode
  durationSeconds: number
  /** Total reps logged across the session's Main block (0 when none). */
  volume: number
  feel?: FeelOption | null
  /** Every joint flagged at check-in, stored comma-joined in the DB's single
   * text column ('shoulder,lower_back') — no schema change needed. */
  joints?: JointCheck[]
}

/**
 * Insert one row into Supabase; resolve false when offline/blocked. A failed
 * insert is NEVER silent: the PostgREST error is logged so the next failure
 * names itself instead of looking like a lost workout.
 */
async function insertHistoryRow(entry: WorkoutHistoryEntry): Promise<boolean> {
  try {
    const { error } = await supabase.from('workout_history').insert({
      device_id: getDeviceId(),
      date: entry.date,
      day_id: entry.slotId,
      duration_seconds: entry.durationSeconds,
      volume: entry.volume,
      feel: entry.feel,
      joint: entry.joints?.length ? entry.joints.join(',') : null,
    })
    if (error) {
      console.error('[SwellFit] workout_history insert failed:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.error('[SwellFit] workout_history insert threw:', err)
    return false
  }
}

/** Every history row for this device, newest first (Supabase first, fallback local). */
export async function loadWorkoutHistory(limit = 50): Promise<WorkoutHistoryEntry[]> {
  try {
    const { data, error } = await supabase
      .from('workout_history')
      .select('date, day_id, duration_seconds, volume, feel, joint')
      .eq('device_id', getDeviceId())
      .order('created_at', { ascending: false })
      .limit(limit)
    if (!error && data) {
      return data.map((row) => ({
        date: row.date,
        slotId: (row.day_id ?? 'S1') as DayId | SurfSubMode,
        durationSeconds: row.duration_seconds,
        volume: row.volume,
        feel: (row.feel as FeelOption | null) ?? null,
        joints: row.joint ? (row.joint.split(',') as JointCheck[]) : [],
      }))
    }
  } catch {
    /* fall through to the offline mirror */
  }
  try {
    const raw = localStorage.getItem(KEY_COACH)
    if (!raw) return []
    const parsed = JSON.parse(raw) as { offlineHistory?: WorkoutHistoryEntry[] }
    return parsed.offlineHistory ?? []
  } catch {
    return []
  }
}

/**
 * Record a completed workout: one Supabase row per device (date, duration,
 * volume, feel and joints), mirrored to localStorage when the write fails.
 * Freeletics week rule: the week number advances ONLY when the week fills
 * 4/4 — every archetype S1..S4 completed once — and then the slot counts
 * reset for the new cycle. There is no Monday reset. Surf routines ('pre' /
 * 'post') write history but never advance the week, never consume a slot and
 * never modulate level/joint care (a 10-min surf routine must not retune the
 * strength sessions). For S1..S4, feel/joint flow through
 * applyCheckInToCoachState, the single adaptation path, so the next session
 * is modulated exactly once.
 * Resolves true when the Supabase row landed, false when the offline mirror
 * was used instead (so the caller can be honest about what was saved).
 */
export async function recordWorkoutHistory(entry: WorkoutHistoryEntry): Promise<boolean> {
  const state = loadCoachState()

  state.lastCompleted = entry.date

  // Only S1..S4 consume weekly slots — SurfSubMode is 'pre' | 'post', so the
  // membership guard below is the correct check (the old comparison against
  // 'SURF_PRE'/'SURF_POST' could never be true and TS2367 flagged it).
  if (
    entry.slotId === 'S1' ||
    entry.slotId === 'S2' ||
    entry.slotId === 'S3' ||
    entry.slotId === 'S4'
  ) {
    state.weeklyFocusCounts[entry.slotId] = (state.weeklyFocusCounts[entry.slotId] ?? 0) + 1

    // Week N advances only when the week is complete (each archetype hit once);
    // the newly started week begins with fresh slot counts.
    if (
      state.weeklyFocusCounts.S1 > 0 &&
      state.weeklyFocusCounts.S2 > 0 &&
      state.weeklyFocusCounts.S3 > 0 &&
      state.weeklyFocusCounts.S4 > 0
    ) {
      state.currentWeekNumber += 1
      state.weeklyFocusCounts = { S1: 0, S2: 0, S3: 0, S4: 0 }
    }

    // Feel/joints flow through applyCheckInToCoachState — the single
    // adaptation path the plan defines, so level/joint-care are modulated
    // exactly once.
    applyCheckInToCoachState(state, entry.feel ?? null, entry.joints ?? null)
  }

  // Write-through to Supabase; keep an offline mirror when the write fails.
  const ok = await insertHistoryRow(entry)
  if (!ok) {
    try {
      const raw = localStorage.getItem(KEY_COACH)
      const parsed = raw ? (JSON.parse(raw) as { offlineHistory?: WorkoutHistoryEntry[] }) : {}
      const offline: WorkoutHistoryEntry[] = [entry, ...(parsed.offlineHistory ?? [])].slice(
        0,
        MAX_HISTORY,
      )
      localStorage.setItem(
        KEY_COACH,
        JSON.stringify({ ...JSON.parse(raw ?? '{}'), offlineHistory: offline }),
      )
    } catch {
      /* nothing more to do — the workout just isn't mirrored offline */
    }
  }
  return ok
}

function applyFeelToState(state: CoachState, feel: FeelOption): void {
  state.checkInTimes[feel] = todayKey()
  // Level ±1 from feel: Brutal down, Too Easy up, Just Right holds. Clamped
  // to the 1..5 scale at both extremes — the level never locks at 3 anymore.
  const stepped = feel === 'brutal' ? state.coachLevel - 1 : state.coachLevel
  const moved = feel === 'too_easy' ? state.coachLevel + 1 : stepped
  state.coachLevel = Math.min(MAX_COACH_LEVEL, Math.max(MIN_COACH_LEVEL, moved)) as CoachLevel
}

function applyJointToState(state: CoachState, joint: JointCheck): void {
  if (joint === 'all_good') {
    // "All Good" clears persistent joint care immediately — the user said the
    // joints are fine, so protection ends with the check-in that says so.
    state.persistentJointCare = {
      shoulders: false,
      lowerBack: false,
      knees: false,
      since: null,
    }
    return
  }
  if (joint === 'shoulder') state.persistentJointCare.shoulders = true
  if (joint === 'lower_back') state.persistentJointCare.lowerBack = true
  if (joint === 'knees') state.persistentJointCare.knees = true
  state.persistentJointCare.since = todayKey()
}

/**
 * Manually release one joint's persistent care (from the AdaptSheet): the
 * user's manual choice overrides the check-in flag for that joint.
 */
export function clearPersistentJointCare(state: CoachState, joint: JointOption): void {
  if (joint === 'shoulders') state.persistentJointCare.shoulders = false
  if (joint === 'lowerBack') state.persistentJointCare.lowerBack = false
  if (joint === 'knees') state.persistentJointCare.knees = false
  if (
    !state.persistentJointCare.shoulders &&
    !state.persistentJointCare.lowerBack &&
    !state.persistentJointCare.knees
  ) {
    state.persistentJointCare.since = null
  }
  saveCoachState(state)
}

/**
 * Fold a check-in result into the Coach state: feel moves the level ±1
 * (Brutal down, Just Right/Too Easy per plan); every flagged joint sets its
 * persistent protection flag, and 'all_good' clears all of them at once.
 */
export function applyCheckInToCoachState(
  state: CoachState,
  feel: FeelOption | null,
  joints: JointCheck[] | null,
): CoachState {
  if (feel) applyFeelToState(state, feel)
  for (const joint of joints ?? []) applyJointToState(state, joint)
  state.lastUpdated = todayKey()
  saveCoachState(state)
  return state
}

// ── Joint care → the CoachSettings the session builder reads ────────────────

/** Merge the persistent joint flags into the user's adapt-sheet settings. */
export function coachJointSettings(state: CoachState, settings: CoachSettings): CoachSettings {
  const joints = new Set(settings.joints)
  if (state.persistentJointCare.shoulders) joints.add('shoulders')
  if (state.persistentJointCare.lowerBack) joints.add('lowerBack')
  if (state.persistentJointCare.knees) joints.add('knees')
  return { ...settings, joints: [...joints] }
}
