import { useCallback, useMemo, useState } from 'react'
import type { DayMode } from '@/data/sessions'
import { toast } from '@/hooks/use-toast'
import { buildSession, cloneSession } from '@/data/sessions'
import type { CoachSession } from '@/data/player-types'
import { CoachHeader } from '@/components/coach/CoachHeader'
import { DaySwitch } from '@/components/coach/DaySwitch'
import { HeroCard } from '@/components/coach/HeroCard'
import { SessionBreakdown } from '@/components/coach/SessionBreakdown'
import { AdaptSheet } from '@/components/coach/AdaptSheet'
import { Player } from '@/pages/Player'
import { CheckIn, type CheckInResult } from '@/pages/CheckIn'
import {
  currentStreak,
  loadSettings,
  recordCheckIn,
  recordCompletion,
  saveSettings,
} from '@/lib/storage'
import { primeAudio } from '@/lib/sound'

type Screen = 'coach' | 'player' | 'checkin'

export default function Coach() {
  const [mode, setMode] = useState<DayMode>('flat')
  const [settings, setSettings] = useState(() => loadSettings())
  const [adaptOpen, setAdaptOpen] = useState(false)
  const [screen, setScreen] = useState<Screen>('coach')
  const [activeSession, setActiveSession] = useState<CoachSession | null>(null)
  const [, setStartExercise] = useState(0)
  const [summary, setSummary] = useState<{ elapsedSeconds: number; exerciseCount: number } | null>(
    null,
  )
  const [streak, setStreak] = useState(() => currentStreak())

  const session = useMemo(() => buildSession(mode, settings), [mode, settings])

  // Re-keys the animated block whenever the session content changes, so the update is visible.
  const contentKey = `${mode}-${settings.time}-${settings.equipment}-${settings.joints.join(',')}`

  const completedToday = streak.lastCompleted === new Date().toISOString().slice(0, 10)

  const startPlayer = useCallback(
    (exerciseIndex: number) => {
      primeAudio() // unlock Web Audio inside the user gesture
      setActiveSession(cloneSession(session))
      setStartExercise(exerciseIndex)
      setScreen('player')
    },
    [session],
  )

  const handlePlayerExit = useCallback(() => setScreen('coach'), [])

  const handlePlayerComplete = useCallback(
    (s: { elapsedSeconds: number; exerciseCount: number }) => {
      setSummary(s)
      setScreen('checkin')
    },
    [],
  )

  const handleCheckInDone = useCallback((result: CheckInResult) => {
    recordCompletion()
    recordCheckIn()
    setStreak(currentStreak())
    setScreen('coach')
    setActiveSession(null)
    setSummary(null)
    void result
  }, [])

  if (screen === 'player' && activeSession) {
    return (
      <Player session={activeSession} onExit={handlePlayerExit} onComplete={handlePlayerComplete} />
    )
  }

  if (screen === 'checkin' && summary && activeSession) {
    return (
      <CheckIn summary={summary} focusTags={activeSession.focusTags} onDone={handleCheckInDone} />
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
