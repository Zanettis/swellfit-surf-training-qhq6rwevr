import { useCallback, useMemo, useState } from 'react'
import { toast } from '@/hooks/use-toast'
import { cloneSession } from '@/data/sessions'
import type { CoachSession, DayId, SurfSubMode } from '@/data/player-types'
import { buildWeeklySession, pickTodaySlot, pickSurfSubMode } from '@/data/weekly-plan'
import type { SlotId } from '@/data/slot-id'
import { CoachHeader } from '@/components/coach/CoachHeader'
import { DaySwitch } from '@/components/coach/DaySwitch'
import { SurfRoutineSwitch } from '@/components/coach/SurfRoutineSwitch'
import { WeekSlotBar } from '@/components/coach/WeekSlotBar'
import { HeroCard } from '@/components/coach/HeroCard'
import { CoachNote } from '@/components/coach/CoachNote'
import { SessionBreakdown } from '@/components/coach/SessionBreakdown'
import { AdaptSheet } from '@/components/coach/AdaptSheet'
import { Player } from '@/pages/Player'
import { CheckIn, type CheckInResult } from '@/pages/CheckIn'
import {
  clearPersistentJointCare,
  coachJointSettings,
  currentStreak,
  loadAllRepHistory,
  loadCoachState,
  loadSettings,
  recordCheckIn,
  recordCompletion,
  recordWorkoutHistory,
  saveSettings,
  type WorkoutHistoryEntry,
} from '@/lib/storage'
import { primeAudio } from '@/lib/sound'

/** Journey block length — Surf Trip Prep runs on an 8-week cycle, 4x/week. */
const JOURNEY_WEEKS = 8
const JOURNEY_SESSIONS_PER_WEEK = 4
const daysLeftOf = (week: number) => Math.max(0, (JOURNEY_WEEKS - week) * JOURNEY_SESSIONS_PER_WEEK)

type Screen = 'coach' | 'player' | 'checkin'

/** Which of the three screens the player finished a workout from. */
interface Summary {
  elapsedSeconds: number
  exerciseCount: number
  slotId: SlotId
}

export default function Coach() {
  const [mode, setMode] = useState<'weekly' | 'surf'>('weekly')
  const [settings, setSettings] = useState(() => loadSettings())
  const [adaptOpen, setAdaptOpen] = useState(false)
  const [screen, setScreen] = useState<Screen>('coach')
  const [activeSession, setActiveSession] = useState<CoachSession | null>(null)
  const [activeSlotId, setActiveSlotId] = useState<SlotId | null>(null)
  const [startExercise, setStartExercise] = useState(0)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [streak, setStreak] = useState(() => currentStreak())
  const [coachState, setCoachState] = useState(() => loadCoachState())
  // Free slot pick: any S1–S4 card can be tapped; the suggestion stays highlighted.
  const [pickedSlot, setPickedSlot] = useState<DayId | null>(null)
  // Surf Day routine: Pre-Surf before noon, Post-Surf after (user can switch).
  const [surfMode, setSurfMode] = useState<SurfSubMode>(() => pickSurfSubMode())

  // Today's slot: the least-hit archetype, or the picked surf routine. The
  // session rebuilds when the coach state advances (check-in recorded).
  const suggestedSlot: DayId = useMemo(() => pickTodaySlot(coachState), [coachState])

  // Displayed slot: the user's free pick when set, otherwise the suggestion.
  // Switching to Surf Day (or back) keeps the weekly pick intact.
  const slotId: SlotId = useMemo(
    () =>
      mode === 'surf'
        ? surfMode === 'pre'
          ? 'SURF_PRE'
          : 'SURF_POST'
        : (pickedSlot ?? suggestedSlot),
    [mode, surfMode, pickedSlot, suggestedSlot],
  )

  // Effective settings = the adapt-sheet's manual picks + the coach state's
  // persistent joint care (set by the last check-in), so a flagged shoulder
  // is protected in every following session until it clears.
  const effectiveSettings = useMemo(
    () => coachJointSettings(coachState, settings),
    [coachState, settings],
  )

  const session = useMemo(
    () => buildWeeklySession({ slotId, settings: effectiveSettings, state: coachState }),
    [slotId, effectiveSettings, coachState],
  )

  // Re-keys the animated block whenever the session content changes, so the update is visible.
  const contentKey = `${slotId}-${settings.time}-${settings.equipment}-${settings.joints.join(',')}-${coachState.lastUpdated}`

  const completedToday = streak.lastCompleted === new Date().toISOString().slice(0, 10)

  const startPlayer = useCallback(
    (exerciseIndex: number) => {
      primeAudio() // unlock Web Audio inside the user gesture
      setActiveSession(cloneSession(session))
      setActiveSlotId(slotId)
      setStartExercise(exerciseIndex)
      setScreen('player')
    },
    [session, slotId],
  )

  const handlePlayerExit = useCallback(() => setScreen('coach'), [])

  const handlePlayerComplete = useCallback(
    (s: { elapsedSeconds: number; exerciseCount: number }) => {
      setSummary({ ...s, slotId: activeSlotId ?? slotId })
      setScreen('checkin')
    },
    [activeSlotId, slotId],
  )

  // Total reps logged in TODAY's Main-Conditioning sets — the history row's
  // volume (0 when nothing was logged, e.g. a decompression-only surf routine).
  const todaysVolume = useCallback((): number => {
    const today = new Date().toISOString().slice(0, 10)
    return loadAllRepHistory()
      .filter((log) => log.date === today)
      .reduce((sum, log) => sum + log.reps, 0)
  }, [])

  const handleCheckInDone = useCallback(
    (result: CheckInResult) => {
      const slot: SlotId = activeSlotId ?? slotId
      const isSurf = slot === 'SURF_PRE' || slot === 'SURF_POST'
      const slotIdForHistory: WorkoutHistoryEntry['slotId'] =
        slot === 'SURF_PRE' ? 'pre' : slot === 'SURF_POST' ? 'post' : slot

      // Streak counting is weekly-cycle only: a 10-min surf routine is not a
      // training session, so it neither counts the weekly goal nor the streak.
      if (!isSurf) {
        recordCompletion()
        recordCheckIn()
        setStreak(currentStreak())
      }

      // The state advance (week, slot counts, feel/joint adaptation) is saved
      // synchronously before the network call, so the coach screen can reload
      // it right away — the Supabase write finishes in the background.
      recordWorkoutHistory({
        date: new Date().toISOString().slice(0, 10),
        slotId: slotIdForHistory,
        durationSeconds: summary?.elapsedSeconds ?? 0,
        volume: todaysVolume(),
        feel: result.feel,
        joints: result.joints,
      })
        .then((persisted) => {
          if (!persisted) {
            toast({
              title: 'Saved offline',
              description: "We couldn't reach the cloud — your session is stored on this device.",
            })
          }
          setCoachState(loadCoachState()) // reload so the UI reflects level/week/joint care
        })
        .catch(() => {
          toast({
            title: 'Save failed',
            description: 'Something went wrong saving this session — try again next time.',
          })
        })

      setScreen('coach')
      setActiveSession(null)
      setSummary(null)
    },
    [activeSlotId, slotId, summary, todaysVolume],
  )

  if (screen === 'player' && activeSession) {
    return (
      <Player
        session={activeSession}
        startIndex={startExercise}
        onExit={handlePlayerExit}
        onComplete={handlePlayerComplete}
      />
    )
  }

  if (screen === 'checkin' && summary && activeSession) {
    const finishedSlot: SlotId = activeSlotId ?? slotId
    return (
      <CheckIn
        summary={summary}
        focusTags={activeSession.focusTags}
        exercises={activeSession.exercises}
        isSurfDay={finishedSlot === 'SURF_PRE' || finishedSlot === 'SURF_POST'}
        onDone={handleCheckInDone}
      />
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-8 px-5 pb-8 pt-6">
      <CoachHeader
        weekly={streak.weekly}
        weeklyGoal={streak.weeklyGoal}
        week={coachState.currentWeekNumber}
        daysLeft={daysLeftOf(coachState.currentWeekNumber)}
        coachLevel={coachState.coachLevel}
      />

      <DaySwitch
        value={mode}
        onChange={(next) => {
          setMode(next)
          if (next === 'surf') setSurfMode(pickSurfSubMode())
        }}
      />

      {mode === 'surf' && <SurfRoutineSwitch value={surfMode} onChange={setSurfMode} />}

      {mode === 'weekly' && (
        <WeekSlotBar
          counts={coachState.weeklyFocusCounts}
          todaySlot={suggestedSlot}
          selectedSlot={slotId as DayId}
          completedToday={completedToday}
          onSelectSlot={setPickedSlot}
        />
      )}

      <div key={contentKey} className="animate-coach-rise flex flex-col gap-8">
        <HeroCard
          session={session}
          completedToday={completedToday}
          onStart={() => startPlayer(0)}
          onAdapt={() => setAdaptOpen(true)}
        >
          <CoachNote state={coachState} completedToday={completedToday} />
        </HeroCard>
        <SessionBreakdown exercises={session.exercises} onSelect={(index) => startPlayer(index)} />
      </div>

      <AdaptSheet
        open={adaptOpen}
        onOpenChange={setAdaptOpen}
        settings={settings}
        coachState={coachState}
        onReleaseJoint={(joint) => {
          clearPersistentJointCare(loadCoachState(), joint)
          setCoachState(loadCoachState())
        }}
        onUpdate={(next) => {
          setSettings(next)
          saveSettings(next)
          setAdaptOpen(false)
          toast({ title: 'Session adapted' })
        }}
      />
    </div>
  )
}
