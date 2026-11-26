// Full-screen guided workout player (Stage 2). Owns the engine hook, top bar
// with segmented progress + controls, work/rest stages, swap sheet and the
// "End Session Early?" confirmation.

import { useCallback, useMemo, useRef, useState } from 'react'
import { Pause, Play, SkipForward, Volume2, VolumeX, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

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
import { useWorkoutEngine } from '@/hooks/use-workout-engine'
import { cn } from '@/lib/utils'
import type { PlayerSession } from '@/data/player-types'

interface PlayerProps {
  session: PlayerSession | null
  onExit: () => void
  onComplete: (summary: { elapsedSeconds: number; exerciseCount: number }) => void
}

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function Player({ session, onExit, onComplete }: PlayerProps) {
  const [soundOn, setSoundOn] = useState(true)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [swapOpen, setSwapOpen] = useState(false)
  const swapWasRunningRef = useRef(false)

  const engine = useWorkoutEngine(
    session ?? { title: '', description: '', durationMin: 0, focusTags: [], exercises: [] },
    {
      soundOn,
      onFinish: () => {
        onComplete({
          elapsedSeconds: engineRef.current?.elapsedSeconds ?? 0,
          exerciseCount: session?.exercises.length ?? 0,
        })
        onExit()
      },
    },
  )
  const engineRef = useRef(engine)
  engineRef.current = engine

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
  const current = engine.current
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
            <p className="mt-1 text-center text-sm text-white/50">{current.surfCue}</p>

            <div className="mt-6 w-full max-w-md">
              <PlayerStage exercise={current} phase={engine.phase} />
            </div>

            <div className="mt-8 flex flex-col items-center">
              {current.type === 'time' ? (
                <>
                  <p className="text-7xl font-bold tabular-nums tracking-tight">
                    {formatClock(engine.remaining)}
                  </p>
                  <div className="mt-4 h-1.5 w-56 overflow-hidden rounded-full bg-white/10">
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
                  <p className="text-7xl font-bold tabular-nums tracking-tight">
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
                    className="mt-8 h-14 w-full max-w-xs rounded-full bg-[#00D1B2] text-base font-semibold text-[#090C10] hover:bg-[#00D1B2]/90"
                    onClick={engine.completeSet}
                  >
                    Set Complete
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Sweaty-hands bottom control bar ──────────────────────────── */}
      <div className="flex items-center justify-center gap-8 pb-10 pt-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Previous set or exercise"
          onClick={engine.goPrev}
          className="h-14 w-14 rounded-full border-[#1E2633] bg-[#131820] text-white/80 hover:bg-[#1E2633] hover:text-white"
        >
          {/* lucide has no dedicated prev icon; SkipBack works mirrored */}
          <SkipForward className="h-5 w-5 rotate-180" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          size="icon"
          aria-label={engine.running ? 'Pause' : 'Play'}
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
          aria-label="Skip to next"
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
