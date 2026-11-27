// Full-screen guided workout player (Stage 2). Owns the engine hook, top bar
// with segmented progress + controls, work/rest stages, swap sheet and the
// "End Session Early?" confirmation.

import { useCallback, useMemo, useRef, useState } from 'react'
import { Pause, Play, SkipForward, Volume2, VolumeX, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RefreshCw } from 'lucide-react'
import { SwapSheet } from '@/components/player/SwapSheet'
import { PlayerStage } from '@/components/player/PlayerStage'
import { RestOverlay } from '@/components/player/RestOverlay'
import { RepLogSheet } from '@/components/player/RepLogSheet'
import { useWorkoutEngine } from '@/hooks/use-workout-engine'
import { useRepLogging } from '@/hooks/use-rep-logging'
import { loadRepHistory, type RepLogEntry } from '@/lib/storage'
import { cn } from '@/lib/utils'
import type { CoachSession } from '@/data/player-types'

interface PlayerProps {
  session: CoachSession | null
  /** Which exercise (0-based) the session should open on. */
  startIndex?: number
  onExit: () => void
  onComplete: (summary: { elapsedSeconds: number; exerciseCount: number }) => void
}

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function Player({ session, startIndex, onExit, onComplete }: PlayerProps) {
  const [soundOn, setSoundOn] = useState(true)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [swapOpen, setSwapOpen] = useState(false)
  const swapWasRunningRef = useRef(false)

  const engine = useWorkoutEngine(
    session ?? {
      title: '',
      description: '',
      durationMin: 0,
      equipmentTag: '',
      focusTags: [],
      exercises: [],
    },
    {
      soundOn,
      startIndex,
      onFinish: () => {
        // ONLY onComplete here: it switches the Coach to the check-in screen,
        // which is where the session is recorded (history + streak). Calling
        // onExit() too overwrote screen='checkin' with screen='coach' in the
        // same batched tick, so the check-in — and with it the whole
        // workout-history write — never happened. onExit stays for the
        // "End Session Early" path, which is its real job.
        onComplete({
          elapsedSeconds: engineRef.current?.elapsedSeconds ?? 0,
          exerciseCount: session?.exercises.length ?? 0,
        })
      },
    },
  )
  const engineRef = useRef(engine)
  engineRef.current = engine

  // Alias AFTER the early-return guard below, for the stage JSX.
  const current = engine.current

  // Rep-set logging: pause the engine while the sheet is up, persist the
  // confirmed reps, resume the count-up where it was on cancel.
  const repLog = useRepLogging({
    pause: engine.pause,
    resume: engine.resume,
  })

  // Last logged value for THIS exercise + set, for the sheet's comparison hint.
  // Memoized: the count-up re-renders ~10x/s and this reads localStorage.
  const lastTime: RepLogEntry | null = useMemo(
    () =>
      current && current.type === 'reps' && !repLog.sheetOpen
        ? (loadRepHistory(current.id, engine.setNumber - 1)[0] ?? null)
        : null,
    [current, engine.setNumber, repLog.sheetOpen],
  )

  // "Set Complete": rep sets open the log sheet first; timed sets advance.
  const handleSetComplete = useCallback(() => {
    const eng = engineRef.current
    const ex = eng.current
    if (ex && ex.type === 'reps') {
      repLog.openRepLog(ex, eng.setNumber - 1, eng.blockElapsed)
      return
    }
    eng.completeSet()
  }, [engineRef, repLog])

  // Confirmed reps END the set (engine.advance → rest), so the sheet never
  // covers a block that already finished; the feedback pill shows on rest.
  const handleRepLogConfirm = useCallback(
    (reps: number) => {
      const eng = engineRef.current
      const ex = eng.current
      const wasLastBlock =
        !ex || (eng.setNumber >= ex.sets && eng.exerciseIndex >= eng.exerciseCount - 1)
      repLog.confirmReps(reps)
      if (!wasLastBlock) eng.completeSet()
      else repLog.dismissFeedback()
    },
    [engineRef, repLog],
  )

  const handleExit = useCallback(() => {
    setConfirmOpen(false)
    onExit()
  }, [onExit])

  const openSwap = useCallback(() => {
    if (engine.phase !== 'done') {
      swapWasRunningRef.current = engine.running
      engine.toggleRunning() // pause; resume happens on close if it was running
    }
    setSwapOpen(true)
  }, [engine])

  const closeSwap = useCallback(
    (open: boolean) => {
      setSwapOpen(open)
      if (!open && swapWasRunningRef.current) engine.toggleRunning()
      if (!open) swapWasRunningRef.current = false
    },
    [engine],
  )

  const blocks = useMemo(
    () => engine.session.exercises.map((e) => e.sets),
    [engine.session.exercises],
  )

  const currentBlockIndex = useMemo(() => {
    let i = 0
    for (let k = 0; k < engine.exerciseIndex; k++) i += blocks[k]
    return i + engine.setNumber - 1
  }, [blocks, engine.exerciseIndex, engine.setNumber])

  const totalBlocks = useMemo(() => blocks.reduce((a, b) => a + b, 0), [blocks])

  const resting = engine.phase === 'rest'
  if (!session || !current) return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex h-dvh flex-col bg-[#090C10] text-white',
        'motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300',
      )}
      role="region"
      aria-label="Guided workout player"
    >
      {/* ── Top progress bar ─────────────────────────────────────────── */}
      <div className="flex h-1.5 w-full gap-1 px-3 pt-3">
        {blocks.map((setCount, idx) =>
          Array.from({ length: setCount }, (_, s) => {
            const isDone =
              idx < engine.exerciseIndex ||
              (idx === engine.exerciseIndex && s < engine.setNumber - 1) ||
              engine.phase === 'done'
            const isCurrent =
              idx === engine.exerciseIndex && s === engine.setNumber - 1 && engine.phase !== 'done'
            return (
              <span
                key={`${idx}-${s}`}
                className={cn(
                  'h-full flex-1 rounded-full',
                  isDone ? 'bg-[#00D1B2]' : isCurrent ? 'bg-[#00D1B2]/50' : 'bg-white/10',
                )}
              />
            )
          }),
        )}
      </div>

      {/* ── Top controls row ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="End session early"
          onClick={() => setConfirmOpen(true)}
          className="h-10 w-10 rounded-full text-white/60 hover:bg-[#1E2633] hover:text-white"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </Button>
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/50 tabular-nums">
          Exercise {engine.exerciseIndex + 1} of {engine.exerciseCount} · Set {engine.setNumber}/
          {current.sets}
        </p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={soundOn ? 'Mute sound cues' : 'Unmute sound cues'}
            aria-pressed={soundOn}
            onClick={() => setSoundOn((v) => !v)}
            className="h-10 w-10 rounded-full text-white/60 hover:bg-[#1E2633] hover:text-white"
          >
            {soundOn ? (
              <Volume2 className="h-5 w-5" aria-hidden="true" />
            ) : (
              <VolumeX className="h-5 w-5" aria-hidden="true" />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Swap exercise"
            onClick={openSwap}
            className="h-10 w-10 rounded-full text-white/60 hover:bg-[#1E2633] hover:text-white"
          >
            <RefreshCw className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* ── Work stage ───────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-5">
        {resting ? (
          <RestOverlay
            remaining={engine.remaining}
            next={engine.next}
            onAddRest={() => engine.addRest(15)}
            onSkipRest={engine.skipRest}
            onSwap={() => {
              if (engine.next) openSwap()
            }}
          />
        ) : (
          <>
            <h2 className="text-center text-2xl font-bold tracking-tight">{current.name}</h2>
            <p className="mt-1 line-clamp-2 text-center text-sm text-white/50">{current.surfCue}</p>

            {/* shrink-0: the media box keeps its size instead of being crushed
                or pushed off-viewport by the tall timer + buttons below */}
            <div className="mt-4 w-full max-w-md shrink-0">
              <PlayerStage exercise={current} phase={engine.phase} />
            </div>

            {/* Logged feedback pill: lives OUTSIDE the work/rest branch so it
               stays visible on the rest screen right after Save Reps. */}
            {repLog.feedback && (
              <p
                role="status"
                className="mt-4 shrink-0 rounded-full border border-[#00D1B2]/40 bg-[#00D1B2]/10 px-4 py-2 text-center text-sm font-medium tabular-nums text-[#00D1B2]"
              >
                {repLog.feedback.exerciseName} · Set {repLog.feedback.setNumber}:{' '}
                {repLog.feedback.reps} reps
                {repLog.feedback.delta === null
                  ? ''
                  : repLog.feedback.delta >= 0
                    ? ` (+${repLog.feedback.delta} vs last time)`
                    : ` (${repLog.feedback.delta} vs last time)`}
              </p>
            )}
            <div className="mt-5 flex min-h-0 flex-col items-center">
              {current.type === 'time' ? (
                <>
                  <p
                    aria-live="off"
                    className="text-6xl font-bold tabular-nums tracking-tight sm:text-7xl"
                  >
                    {formatClock(engine.remaining)}
                  </p>
                  <div
                    role="progressbar"
                    aria-label="Time left in this set"
                    aria-valuemin={0}
                    aria-valuemax={engine.total}
                    aria-valuenow={engine.remaining}
                    className="mt-3 h-1.5 w-48 overflow-hidden rounded-full bg-white/10 sm:w-56"
                  >
                    <div
                      className="h-full rounded-full bg-[#00D1B2] motion-safe:transition-[width] motion-safe:duration-100 motion-safe:ease-linear"
                      style={{
                        width: `${Math.round(((engine.total - engine.remaining) / engine.total) * 100)}%`,
                      }}
                    />
                    {/* total is engine.total; width drives the teal fill */}
                  </div>
                </>
              ) : (
                <>
                  {/* Count-up clock: runs while the set is live so the timer
                      guides/challenges the user to hit the target inside it.
                      Pauses/resumes with the engine's Play/Pause control. */}
                  <p
                    aria-live="off"
                    className="text-3xl font-semibold tabular-nums tracking-tight text-[#00D1B2] sm:text-4xl"
                  >
                    {formatClock(engine.blockElapsed)}
                    <span className="ml-2 align-middle text-xs font-medium uppercase tracking-widest text-white/40">
                      elapsed
                    </span>
                  </p>
                  <p
                    aria-live="off"
                    className="text-6xl font-bold tabular-nums tracking-tight sm:text-7xl"
                  >
                    {current.reps ?? 0}
                    <span className="ml-2 align-middle text-base font-medium uppercase tracking-widest text-white/50">
                      reps
                    </span>
                    {current.perSide && (
                      <span className="ml-1 align-middle text-base font-medium uppercase tracking-widest text-white/50">
                        / side
                      </span>
                    )}
                  </p>
                  <Button
                    type="button"
                    size="lg"
                    className="mt-5 h-12 w-full max-w-xs rounded-full bg-[#00D1B2] text-base font-semibold text-[#090C10] hover:bg-[#00D1B2]/90"
                    onClick={handleSetComplete}
                  >
                    Set Complete
                  </Button>
                  {lastTime && (
                    <p className="mt-3 text-xs font-medium uppercase tracking-wide text-white/40 tabular-nums">
                      Last time: {lastTime.reps} reps
                    </p>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Sweaty-hands bottom control bar ──────────────────────────── */}
      <div className="flex shrink-0 items-center justify-center gap-8 pb-8 pt-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={
            engine.setNumber > 1
              ? `Restart as set ${engine.setNumber - 1}`
              : engine.nextExercise
                ? `Back to ${engine.prevTargetLabel}`
                : 'No previous exercise'
          }
          disabled={engine.setNumber === 1 && engine.exerciseIndex === 0}
          onClick={engine.goPrev}
          className="h-14 w-14 rounded-full border-[#1E2633] bg-[#131820] text-white/80 hover:bg-[#1E2633] hover:text-white disabled:opacity-40"
        >
          {/* lucide has no dedicated prev icon; SkipForward works mirrored */}
          <SkipForward className="h-5 w-5 rotate-180" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          size="icon"
          aria-label={engine.running ? 'Pause' : 'Resume'}
          onClick={engine.toggleRunning}
          className="h-20 w-20 rounded-full bg-[#00D1B2] text-[#090C10] hover:bg-[#00D1B2]/90"
        >
          {engine.running ? (
            <Pause className="h-8 w-8" aria-hidden="true" />
          ) : (
            <Play className="h-8 w-8" aria-hidden="true" />
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={
            engine.nextExercise ? `Skip to ${engine.nextExercise.name}` : 'Finish session'
          }
          onClick={engine.goNext}
          className="h-14 w-14 rounded-full border-[#1E2633] bg-[#131820] text-white/80 hover:bg-[#1E2633] hover:text-white"
        >
          <SkipForward className="h-5 w-5" aria-hidden="true" />
        </Button>
      </div>

      {/* ── End early confirmation ───────────────────────────────────── */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="rounded-2xl border-[#1E2633] bg-[#131820] text-white sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>End Session Early?</DialogTitle>
            <DialogDescription className="text-white/60">
              You're{' '}
              {Math.round(
                ((currentBlockIndex + (resting ? 0 : 1)) / Math.max(1, totalBlocks)) * 100,
              )}
              % through. Your progress won't be saved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              type="button"
              className="w-full rounded-full bg-[#00D1B2] font-semibold text-[#090C10] hover:bg-[#00D1B2]/90"
              onClick={handleExit}
            >
              End Session
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full border-[#1E2633] bg-transparent text-white hover:bg-[#1E2633] hover:text-white"
              onClick={() => setConfirmOpen(false)}
            >
              Keep Training
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Rep log sheet ──────────────────────────────────────────────── */}
      <RepLogSheet
        exerciseName={current.name}
        setNumber={engine.setNumber}
        targetReps={current.reps ?? 0}
        lastTime={lastTime}
        open={repLog.sheetOpen}
        initialReps={current.reps ?? 0}
        onConfirm={handleRepLogConfirm}
        onCancel={repLog.cancelRepLog}
      />

      {/* ── Swap sheet ───────────────────────────────────────────────── */}
      <SwapSheet
        exercise={resting ? (engine.next ?? current) : current}
        open={swapOpen}
        onOpenChange={closeSwap}
        onSwap={(replacement) => {
          const idx = resting
            ? engine.setNumber >= (engine.current?.sets ?? 1)
              ? engine.exerciseIndex + 1
              : engine.exerciseIndex
            : engine.exerciseIndex
          engine.swapExercise(idx, replacement)
          setSwapOpen(false)
          if (swapWasRunningRef.current) engine.toggleRunning()
          swapWasRunningRef.current = false
        }}
      />
    </div>
  )
}

export default Player
