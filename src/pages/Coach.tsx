import { useCallback, useMemo, useState } from 'react'
import { toast } from '@/hooks/use-toast'
import { cloneSession } from '@/data/sessions'
import type { CoachSession } from '@/data/player-types'
import { buildWeeklySession, pickTodaySlot, pickSurfSubMode } from '@/data/weekly-plan'
import type { SlotId } from '@/data/slot-id'
import { CoachHeader } from '@/components/coach/CoachHeader'
import { DaySwitch } from '@/components/coach/DaySwitch'
import { HeroCard } from '@/components/coach/HeroCard'
import { SessionBreakdown } from '@/components/coach/SessionBreakdown'
import { AdaptSheet } from '@/components/coach/AdaptSheet'
import { Player } from '@/pages/Player'
import { CheckIn, type CheckInResult } from '@/pages/CheckIn'
import {
  currentStreak,
  loadCoachState,
  loadSettings,
  recordCheckIn,
  recordCompletion,
  recordWorkoutHistory,
  saveSettings,
  type WorkoutHistoryEntry,
} from '@/lib/storage'
import { primeAudio } from '@/lib/sound'

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

  // Today's slot: the least-hit archetype, or a pre/post-surf routine. The
  // session rebuilds when the coach state advances (check-in recorded).
  const slotId: SlotId = useMemo(
    () =>
      mode === 'surf'
        ? pickSurfSubMode() === 'pre'
          ? 'SURF_PRE'
          : 'SURF_POST'
        : pickTodaySlot(coachState),
    [mode, coachState],
  )

  const session = useMemo(
    () => buildWeeklySession({ slotId, settings, state: coachState }),
    [slotId, settings, coachState],
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

  const handleCheckInDone = useCallback(
    (result: CheckInResult) => {
      recordCompletion()
      recordCheckIn()
      setStreak(currentStreak())

      const slot = activeSlotId ?? slotId
      const slotIdForHistory: WorkoutHistoryEntry['slotId'] =
        slot === 'SURF_PRE' ? 'pre' : slot === 'SURF_POST' ? 'post' : slot
      void recordWorkoutHistory({
        date: new Date().toISOString().slice(0, 10),
        slotId: slotIdForHistory,
        durationSeconds: summary?.elapsedSeconds ?? 0,
        volume: 0,
        feel: result.feel,
        joint: result.joint,
      }).then(() => {
        setCoachState(loadCoachState()) // reload so the UI reflects level/week/joint care
      })

      setScreen('coach')
      setActiveSession(null)
      setSummary(null)
    },
    [activeSlotId, slotId, summary],
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
    return (
      <CheckIn
        summary={summary}
        focusTags={activeSession.focusTags}
        exercises={activeSession.exercises}
        onDone={handleCheckInDone}
      />
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-8 px-5 pb-8 pt-6">
      <CoachHeader weekly={streak.weekly} weeklyGoal={streak.weeklyGoal} />

      <DaySwitch value={mode} onChange={setMode} />

      <div key={contentKey} className="animate-coach-rise flex flex-col gap-8">
        <HeroCard
          session={session}
          completedToday={completedToday}
          onStart={() => startPlayer(0)}
          onAdapt={() => setAdaptOpen(true)}
        />
        <SessionBreakdown exercises={session.exercises} onSelect={(index) => startPlayer(index)} />
      </div>

      <AdaptSheet
        open={adaptOpen}
        onOpenChange={setAdaptOpen}
        settings={settings}
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
