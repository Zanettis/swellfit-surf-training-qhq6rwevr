// "Log Your Reps" bottom sheet: after Set Complete on a rep-based exercise the
// player pauses, this sheet slides up with a big numeric stepper so the user
// records what they actually did — the number that powers their progression
// history. "Back to Set" cancels: the set resumes with its count-up intact.

import { useEffect, useRef, useState } from 'react'
import { Minus, Plus } from 'lucide-react'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

interface RepLogSheetProps {
  exerciseName: string
  setNumber: number // 1-based, for the sheet's subtitle
  targetReps: number
  /** Optional "+N vs last time" hint from history, shown above the stepper. */
  lastTime?: { reps: number } | null
  open: boolean
  initialReps: number
  onConfirm: (reps: number) => void
  onCancel: () => void
}

export function RepLogSheet({
  exerciseName,
  setNumber,
  targetReps,
  lastTime,
  open,
  initialReps,
  onConfirm,
  onCancel,
}: RepLogSheetProps) {
  const [reps, setReps] = useState(initialReps)
  const titleRef = useRef<HTMLHeadingElement>(null)

  // Re-seed whenever the sheet opens for a new set, then move focus into it.
  useEffect(() => {
    if (open) {
      setReps(initialReps)
      const t = window.setTimeout(() => titleRef.current?.focus(), 50)
      return () => window.clearTimeout(t)
    }
  }, [open, initialReps])

  const clamp = (n: number) => Math.min(999, Math.max(0, n))
  const adjust = (delta: number) => setReps((r) => clamp(r + delta))
  const setType = (raw: string) => setReps(clamp(Math.floor(Number(raw)) || 0))

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onCancel()}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl border-[#1E2633] bg-[#131820] px-5 pb-10 pt-3 text-white"
      >
        <SheetHeader className="p-0 text-left">
          <SheetTitle
            ref={titleRef}
            tabIndex={-1}
            className="text-sm font-semibold uppercase tracking-wide text-white outline-none"
          >
            Log Your Reps
          </SheetTitle>
          <SheetDescription className="text-xs text-white/50">
            {exerciseName} · Set {setNumber} · Target {targetReps}
            {lastTime ? ` · Last time: ${lastTime.reps}` : ''}
          </SheetDescription>
        </SheetHeader>

        {/* Big stepper: − / number / + */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="One rep less"
            onClick={() => adjust(-1)}
            className="h-14 w-14 rounded-full border-[#1E2633] bg-[#090C10] text-white hover:bg-[#1E2633] hover:text-white"
          >
            <Minus className="h-6 w-6" aria-hidden="true" />
          </Button>

          <label htmlFor="rep-log-input" className="sr-only">
            Reps performed
          </label>
          <input
            id="rep-log-input"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={String(reps)}
            onChange={(e) => setType(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            className="h-20 w-28 rounded-2xl border border-[#1E2633] bg-[#090C10] text-center text-5xl font-bold tabular-nums text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D1B2]"
          />

          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="One rep more"
            onClick={() => adjust(1)}
            className="h-14 w-14 rounded-full border-[#1E2633] bg-[#090C10] text-white hover:bg-[#1E2633] hover:text-white"
          >
            <Plus className="h-6 w-6" aria-hidden="true" />
          </Button>
        </div>
        <p className="mt-3 text-center text-xs text-white/40">
          Type or tap − / + to log what you actually did
        </p>

        <Button
          type="button"
          size="lg"
          className="mt-6 h-14 w-full rounded-full bg-[#00D1B2] text-base font-semibold text-[#090C10] hover:bg-[#00D1B2]/90"
          onClick={() => onConfirm(reps)}
        >
          Save Reps
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="mt-2 h-11 w-full rounded-full text-white/60 hover:bg-[#1E2633] hover:text-white"
          onClick={onCancel}
        >
          Back to Set
        </Button>
      </SheetContent>
    </Sheet>
  )
}
