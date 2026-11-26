// The workout engine: one source of truth for the player's position in the
// session (exercise i, set s), its phase (work / rest / done) and the tick.
// One interval derives remaining time from a wall-clock deadline, so pausing,
// skipping, swapping and +15s never accumulate drift; every phase change
// re-arms the deadline exactly once.

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
  exerciseCount: number
  completeSet: () => void
  toggleRunning: () => void
  goNext: () => void
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
  opts: { soundOn: boolean; onFinish: () => void },
): WorkoutEngine {
  const { soundOn, onFinish } = opts

  // Swaps mutate this local copy, so the input session object stays untouched.
  const [exercises, setExercises] = useState<PlayerExercise[]>(() =>
    input.exercises.map((e) => clone(e)),
  )
  const [exerciseIndex, setExerciseIndex] = useState(0)
  const [setNumber, setSetNumber] = useState(1)
  const [phase, setPhase] = useState<Phase>('work')
  const [total, setTotal] = useState(() => blockLength(input.exercises[0]))
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

    if (phase === 'work') {
      if (lastSet && lastExercise) {
        finishedRef.current = true
        setPhase('done')
        setRunning(false)
        if (soundRef.current) chimeFinish()
        onFinishRef.current()
        return
      }
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
  }, [arm, exerciseIndex, exercises, phase, setNumber])

  // The single tick: 100ms, derives remaining from the deadline (zero drift),
  // fires 3-2-1 beeps and advances exactly once per block.
  useEffect(() => {
    if (!running || phase === 'done') return
    const id = window.setInterval(() => {
      setElapsedSeconds((s) => s + 0.1)
      const leftMs = deadlineRef.current - Date.now()
      const leftSec = Math.max(0, Math.ceil(leftMs / MS_PER_SEC))
      // 3-2-1 beeps: once per second tick, only for real countdown blocks.
      if (
        phase === 'work' &&
        soundRef.current &&
        total > 5 &&
        leftSec >= 1 &&
        leftSec <= 3 &&
        leftSec < lastLeftRef.current
      ) {
        beepCountdown(leftSec)
      }
      lastLeftRef.current = leftSec
      setRemaining(leftSec)
      // Rep blocks (total === 1) never auto-advance: they wait for Set Complete.
      if (leftMs <= 0 && (phase === 'rest' || total > 1)) advance()
    }, 100)
    return () => window.clearInterval(id)
  }, [advance, phase, running, total])

  const completeSet = useCallback(() => {
    if (phase === 'work') advance()
  }, [advance, phase])

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

  /** Skip: the current block ends now, exactly as if its timer had run out. */
  const goNext = useCallback(() => {
    if (phase !== 'done') advance()
  }, [advance, phase])

  /** Previous: restart the current set; from set 1, jump to the previous one. */
  const goPrev = useCallback(() => {
    finishedRef.current = false
    let idx = exerciseIndex
    let st = setNumber
    if (st > 1) {
      st -= 1
    } else if (idx > 0) {
      idx -= 1
      st = exercises[idx]?.sets ?? 1
    }
    const len = blockLength(exercises[idx])
    setExerciseIndex(idx)
    setSetNumber(st)
    setPhase('work')
    setTotal(len)
    setRemaining(len)
    arm(len)
    setRunning(true)
  }, [arm, exerciseIndex, exercises, setNumber])

  const addRest = useCallback(
    (extraSeconds = 15) => {
      if (phase !== 'rest') return
      setTotal((t) => t + extraSeconds)
      setRemaining((r) => {
        deadlineRef.current += extraSeconds * MS_PER_SEC
        return r + extraSeconds
      })
    },
    [phase],
  )

  const skipRest = useCallback(() => {
    if (phase === 'rest') advance()
  }, [advance, phase])

  /** Replace the exercise at `index` with a cloned alternative, same slot. */
  const swapExercise = useCallback(
    (index: number, replacement: PlayerExercise) => {
      const incoming = clone(replacement)
      setExercises((prev) => prev.map((e, i) => (i === index ? incoming : e)))
      if (index === exerciseIndex && phase === 'work') {
        const len = blockLength(incoming)
        setTotal(len)
        setRemaining((r) => {
          const next = running ? len : Math.min(r, len)
          arm(next)
          return next
        })
      }
    },
    [arm, exerciseIndex, phase, running],
  )

  const session = useMemo<PlayerSession>(() => ({ ...input, exercises }), [exercises, input])
  const current = exercises[exerciseIndex]
  const restEndsExercise = phase === 'rest' && setNumber >= (current?.sets ?? 1)
  const next =
    phase === 'rest' ? (restEndsExercise ? exercises[exerciseIndex + 1] : current) : undefined

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
