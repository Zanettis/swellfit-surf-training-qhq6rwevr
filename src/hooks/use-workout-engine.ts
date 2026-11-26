// The workout engine: one source of truth for the player's position in the
// session (exercise i, set s), its phase (work / rest / done) and the tick.
// One interval derives remaining time from a wall-clock deadline, so pausing,
// skipping, swapping and +15s never accumulate drift; every phase change
// re-arms the deadline exactly once.
//
// State machine invariant (the bug this guards against): the ticking interval
// MUST keep running whenever running=true and phase!=='done'. Two known ways it
// silently stopped before, both fixed here:
// 1) advance() and goPrev() must never `arm()` while a block is still live
//    (arm() overwrites the deadline of the block that is still ticking).
// 2) The interval must not depend on `phase` or `total`: those changing
//    re-created the interval mid-block and dropped ticks. It reads them
//    through refs instead, so ONE interval lives for the whole session.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { beepCountdown, beepRestOver, chimeComplete, chimeFinish } from '@/lib/sound'
import type { PlayerExercise, PlayerSession } from '@/data/player-types'

export type Phase = 'work' | 'rest' | 'done'

export interface WorkoutEngine {
  phase: Phase
  exerciseIndex: number
  setNumber: number // 1-based
  remaining: number // seconds left in the current block (ceil, display-ready)
  total: number // length of the current block in seconds
  running: boolean
  elapsedSeconds: number // wall-clock training time, pause-excluded
  session: PlayerSession // live copy: swaps applied here
  current: PlayerExercise | undefined
  next: PlayerExercise | undefined // what the rest screen shows as UP NEXT
  /** The exercise after the current one (for the Skip button's aria-label). */
  nextExercise: PlayerExercise | undefined
  /** What the Previous button will land on, phrased for a screen reader. */
  prevTargetLabel: string
  exerciseCount: number
  completeSet: () => void
  toggleRunning: () => void
  /** End the current set (or rest block) now — exactly as if the timer ran out. */
  goNext: () => void
  /** Restart the current set; from set 1, jump to the previous exercise's set 1. */
  goPrev: () => void
  addRest: (extraSeconds?: number) => void
  skipRest: () => void
  swapExercise: (index: number, replacement: PlayerExercise) => void
}

const MS_PER_SEC = 1000

function blockLength(e: PlayerExercise): number {
  return e.type === 'time' ? (e.durationSeconds ?? 45) : 1
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function useWorkoutEngine(
  input: PlayerSession,
  opts: { soundOn: boolean; onFinish: () => void; startIndex?: number },
): WorkoutEngine {
  const { soundOn, onFinish } = opts

  // Swaps mutate this local copy, so the input session object stays untouched.
  const [exercises, setExercises] = useState<PlayerExercise[]>(() =>
    input.exercises.map((e) => clone(e)),
  )
  const [exerciseIndex, setExerciseIndex] = useState(() =>
    Math.min(Math.max(0, opts.startIndex ?? 0), Math.max(0, input.exercises.length - 1)),
  )
  const [setNumber, setSetNumber] = useState(1)
  const [phase, setPhase] = useState<Phase>('work')
  const [total, setTotal] = useState(() => blockLength(input.exercises[exerciseIndex]))
  const [remaining, setRemaining] = useState(total)
  const [running, setRunning] = useState(true)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  const deadlineRef = useRef(Date.now() + total * MS_PER_SEC)
  const lastLeftRef = useRef(total)
  const finishedRef = useRef(false)
  const soundRef = useRef(soundOn)
  soundRef.current = soundOn
  const onFinishRef = useRef(onFinish)
  onFinishRef.current = onFinish
  // Live phase/total mirrors, so the single tick effect never needs to depend
  // on them (a dependency there re-created the interval mid-block).
  const phaseRef = useRef<Phase>('work')
  phaseRef.current = phase
  const totalRef = useRef(total)
  totalRef.current = total

  const arm = useCallback((lengthSeconds: number) => {
    deadlineRef.current = Date.now() + lengthSeconds * MS_PER_SEC
    lastLeftRef.current = lengthSeconds
  }, [])

  /** End of a work or rest block: rest → next set/exercise; last block → done. */
  const advance = useCallback(() => {
    if (finishedRef.current) return
    const ex = exercises[exerciseIndex]
    if (!ex) return
    const lastSet = setNumber >= ex.sets
    const lastExercise = exerciseIndex >= exercises.length - 1

    if (phaseRef.current === 'work') {
      if (lastSet && lastExercise) {
        finishedRef.current = true
        setPhase('done')
        setRunning(false)
        if (soundRef.current) chimeFinish()
        onFinishRef.current()
        return
      }
      // The CURRENT work block just ended: re-arm the deadline for the rest
      // block that replaces it (never arm a block that is still live).
      setPhase('rest')
      setTotal(ex.restSeconds)
      setRemaining(ex.restSeconds)
      arm(ex.restSeconds)
      if (soundRef.current) chimeComplete()
    } else {
      const nextIdx = lastSet ? exerciseIndex + 1 : exerciseIndex
      if (lastSet) {
        setExerciseIndex(nextIdx)
        setSetNumber(1)
      } else {
        setSetNumber(setNumber + 1)
      }
      setPhase('work')
      const len = blockLength(exercises[nextIdx])
      setTotal(len)
      setRemaining(len)
      arm(len)
      if (soundRef.current) beepRestOver()
    }
  }, [arm, exerciseIndex, exercises, setNumber])

  // The single tick for the WHOLE session: 100ms, derives remaining from the
  // deadline (zero drift), fires 3-2-1 beeps and advances exactly once per
  // block. Depends ONLY on [running]: phase and total are read through refs
  // so a phase change re-arms the deadline instead of killing the interval —
  // this is what made the work timer freeze while rest ticked.
  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      const leftMs = deadlineRef.current - Date.now()
      const leftSec = Math.max(0, Math.ceil(leftMs / MS_PER_SEC))
      const ph = phaseRef.current
      const tot = totalRef.current
      // 3-2-1 beeps: once per second tick, only for real countdown blocks.
      if (
        ph === 'work' &&
        soundRef.current &&
        tot > 5 &&
        leftSec >= 1 &&
        leftSec <= 3 &&
        leftSec < lastLeftRef.current
      ) {
        beepCountdown(leftSec)
      }
      lastLeftRef.current = leftSec
      setRemaining(leftSec)
      // Rep blocks (total === 1) never auto-advance: they wait for Set Complete.
      if (leftMs <= 0 && (ph === 'rest' || tot > 1)) advance()
    }, 100)
    return () => window.clearInterval(id)
  }, [advance, running])

  const completeSet = useCallback(() => {
    if (phaseRef.current === 'work') advance()
  }, [advance])

  const pause = useCallback(() => {
    if (phase !== 'done') setRunning(false)
  }, [phase])

  const resume = useCallback(() => {
    if (phase === 'done') return
    arm(remaining)
    setRunning(true)
  }, [arm, phase, remaining])

  const toggleRunning = useCallback(() => {
    if (running) pause()
    else resume()
  }, [pause, resume, running])

  /** Skip: end the current set (or the rest block) right now. */
  const goNext = useCallback(() => {
    if (phaseRef.current !== 'done') advance()
  }, [advance])

  /** Previous: restart the current set; from set 1, jump to the previous exercise's set 1. */
  const goPrev = useCallback(() => {
    finishedRef.current = false
    const wasRunning = phaseRef.current !== 'done'
    let idx = exerciseIndex
    let st = setNumber
    if (st > 1) {
      st -= 1
    } else if (idx > 0) {
      idx -= 1
      st = 1
    }
    const len = blockLength(exercises[idx])
    setExerciseIndex(idx)
    setSetNumber(st)
    setPhase('work')
    setTotal(len)
    setRemaining(len)
    arm(len)
    if (wasRunning) setRunning(true)
  }, [arm, exerciseIndex, exercises, setNumber])

  const addRest = useCallback((extraSeconds = 15) => {
    if (phaseRef.current !== 'rest') return
    setTotal((t) => t + extraSeconds)
    setRemaining((r) => {
      deadlineRef.current += extraSeconds * MS_PER_SEC
      return r + extraSeconds
    })
  }, [])

  const skipRest = useCallback(() => {
    if (phaseRef.current === 'rest') advance()
  }, [advance])

  /** Replace the exercise at `index` with a cloned alternative, same slot. */
  const swapExercise = useCallback(
    (index: number, replacement: PlayerExercise) => {
      const incoming = clone(replacement)
      setExercises((prev) => prev.map((e, i) => (i === index ? incoming : e)))
      if (index === exerciseIndex && phaseRef.current === 'work') {
        // Re-arm only the FRESH block length when paused (the live deadline
        // still belongs to the block that is ticking — never clobber it).
        const len = blockLength(incoming)
        setTotal(len)
        setRemaining((r) => {
          if (running) return Math.min(r, len)
          arm(len)
          return len
        })
      }
    },
    [arm, exerciseIndex, running],
  )

  const session = useMemo<PlayerSession>(() => ({ ...input, exercises }), [exercises, input])
  const current = exercises[exerciseIndex]
  const restEndsExercise = phase === 'rest' && setNumber >= (current?.sets ?? 1)
  const next =
    phase === 'rest' ? (restEndsExercise ? exercises[exerciseIndex + 1] : current) : undefined
  // "EXERCISE n OF m" and the Previous button's target both read from these.
  const nextExercise = exercises[exerciseIndex + 1]
  const prevTarget = (() => {
    if (setNumber > 1) return current
    if (exerciseIndex > 0) return exercises[exerciseIndex - 1]
    return undefined
  })()
  const prevTargetLabel = prevTarget
    ? setNumber > 1
      ? `Repeat Set ${setNumber - 1} of ${current?.sets ?? 1}`
      : `Back to ${prevTarget.name}, Set 1 of ${prevTarget.sets}`
    : 'This is the first exercise'

  return {
    phase,
    exerciseIndex,
    setNumber,
    remaining: Math.max(0, Math.ceil(remaining)),
    total,
    running,
    elapsedSeconds: Math.floor(elapsedSeconds),
    session,
    current,
    next,
    nextExercise,
    prevTargetLabel,
    exerciseCount: exercises.length,
    completeSet,
    toggleRunning,
    goNext,
    goPrev,
    addRest,
    skipRest,
    swapExercise,
  }
}
