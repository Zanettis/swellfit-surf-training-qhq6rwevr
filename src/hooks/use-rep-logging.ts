// Rep-set logging flow state: open the sheet on Set Complete, pause the
// engine while it's up, persist the confirmed reps and surface the "vs last
// time" delta. Kept out of Player.tsx so the screen stays under ~400 lines.

import { useCallback, useRef, useState } from 'react'

import { recordRepLog, type RepLogEntry } from '@/lib/storage'
import type { PlayerExercise } from '@/data/player-types'

export interface LoggedSetFeedback {
  exerciseName: string
  setNumber: number // 1-based
  reps: number
  /** +N / −N vs the most recent previous entry, when one exists. */
  delta: number | null
}

interface UseRepLoggingOptions {
  /** The engine's pause control: the set must freeze while the sheet is up. */
  pause: () => void
  /** No-op when the confirmed set already advanced the engine to rest. */
  resume: () => void
}

export function useRepLogging({ pause, resume }: UseRepLoggingOptions) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [feedback, setFeedback] = useState<LoggedSetFeedback | null>(null)
  const pendingRef = useRef<{ exercise: PlayerExercise; setIndex: number; seconds: number } | null>(
    null,
  )

  /** Called INSTEAD of engine.completeSet on a rep-based exercise. */
  const openRepLog = useCallback(
    (exercise: PlayerExercise, setIndex: number, seconds: number) => {
      pendingRef.current = { exercise, setIndex, seconds }
      pause()
      setSheetOpen(true)
    },
    [pause],
  )

  /** Persist the confirmed reps; the caller decides whether to end the set. */
  const confirmReps = useCallback(
    (reps: number) => {
      const pending = pendingRef.current
      setSheetOpen(false)
      if (!pending) return
      const previous: RepLogEntry | null = recordRepLog({
        exerciseId: pending.exercise.id,
        setIndex: pending.setIndex,
        reps,
        seconds: pending.seconds > 0 ? pending.seconds : undefined,
      })
      setFeedback({
        exerciseName: pending.exercise.name,
        setNumber: pending.setIndex + 1,
        reps,
        delta: previous ? reps - previous.reps : null,
      })
      pendingRef.current = null
      resume()
    },
    [resume],
  )

  /** Discard the sheet and go back to the live set (timer resumes). */
  const cancelRepLog = useCallback(() => {
    pendingRef.current = null
    setSheetOpen(false)
    resume()
  }, [resume])

  /** Clear the "Set 1: 12 reps" pill once the next block has started. */
  const dismissFeedback = useCallback(() => setFeedback(null), [])

  return { sheetOpen, feedback, openRepLog, confirmReps, cancelRepLog, dismissFeedback }
}
