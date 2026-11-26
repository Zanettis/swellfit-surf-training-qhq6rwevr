// Post-workout Coach check-in: session summary, two feedback steps with pills,
// a one-line Coach adjustment note, and the Finish & Save CTA.

import { useMemo, useState } from 'react'
import { CheckCircle2, Dumbbell, Timer } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type Feel = 'too_easy' | 'just_right' | 'brutal'
export type Joint = 'all_good' | 'shoulder' | 'lower_back'

export interface CheckInResult {
  feel: Feel | null
  joint: Joint | null
}

interface CheckInProps {
  summary: { elapsedSeconds: number; exerciseCount: number }
  focusTags: string[]
  onDone: (result: CheckInResult) => void
}

const FEEL_PILLS: { value: Feel; label: string }[] = [
  { value: 'too_easy', label: 'Too Easy' },
  { value: 'just_right', label: 'Just Right' },
  { value: 'brutal', label: 'Brutal' },
]

const JOINT_PILLS: { value: Joint; label: string }[] = [
  { value: 'all_good', label: 'All Good' },
  { value: 'shoulder', label: 'Shoulder Tightness' },
  { value: 'lower_back', label: 'Lower Back Tightness' },
]

function coachNote(feel: Feel | null, joint: Joint | null): string {
  if (!feel && !joint) return ''
  const feelPart =
    feel === 'too_easy'
      ? 'Got it — Coach will add load and trim rest in your next session.'
      : feel === 'brutal'
        ? 'Got it — Coach will dial the volume back and extend your rest windows.'
        : 'Locked in — Coach keeps this dose and builds on it next time.'
  const jointPart =
    joint === 'shoulder'
      ? ' Shoulders were tight: extra rotator-cuff prehab and lighter pressing are queued up.'
      : joint === 'lower_back'
        ? ' Lower back was tight: expect more hip-hinge mobility and less loaded flexion.'
        : joint === 'all_good'
          ? ' Joints feel good — no changes needed there.'
          : ''
  return feelPart + jointPart
}

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function CheckIn({ summary, focusTags, onDone }: CheckInProps) {
  const [feel, setFeel] = useState<Feel | null>(null)
  const [joint, setJoint] = useState<Joint | null>(null)
  const note = useMemo(() => coachNote(feel, joint), [feel, joint])

  const pillClass = (active: boolean) =>
    cn(
      'rounded-full border px-5 py-2.5 text-sm font-medium transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D1B2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#090C10]',
      active
        ? 'border-[#00D1B2] bg-[#00D1B2]/15 text-[#00D1B2]'
        : 'border-[#1E2633] bg-[#131820] text-white/70 hover:border-white/30 hover:text-white',
    )

  return (
    <div className="fixed inset-0 z-50 flex h-dvh flex-col overflow-y-auto bg-[#090C10] px-5 py-10 text-white motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#00D1B2]/15">
            <CheckCircle2 className="h-7 w-7 text-[#00D1B2]" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Session Complete</h1>
          <p className="mt-1 text-sm text-white/50">Nice work — here's how it went.</p>
        </div>

        {/* Session summary card */}
        <div className="mt-8 rounded-2xl border border-[#1E2633] bg-[#131820] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-[#00D1B2]" aria-hidden="true" />
              <span className="text-xs font-medium uppercase tracking-wide text-white/50">
                Time trained
              </span>
            </div>
            <span className="text-lg font-bold tabular-nums">
              {formatClock(summary.elapsedSeconds)}
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-[#00D1B2]" aria-hidden="true" />
              <span className="text-xs font-medium uppercase tracking-wide text-white/50">
                Exercises
              </span>
            </div>
            <span className="text-lg font-bold tabular-nums">{summary.exerciseCount}</span>
          </div>
          {focusTags.length > 0 && (
            <div className="mt-4 border-t border-[#1E2633] pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-white/50">
                Focus areas hit
              </p>
              <p className="mt-1.5 text-sm text-white/80">{focusTags.join(' · ')}</p>
            </div>
          )}
        </div>

        {/* Step 1 — feel */}
        <fieldset className="mt-8">
          <legend className="text-sm font-semibold text-white">1. How did that feel?</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {FEEL_PILLS.map((p) => (
              <button
                key={p.value}
                type="button"
                aria-pressed={feel === p.value}
                onClick={() => setFeel(p.value)}
                className={pillClass(feel === p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Step 2 — joints */}
        <fieldset className="mt-6">
          <legend className="text-sm font-semibold text-white">
            2. Joint check <span className="font-normal text-white/40">(optional)</span>
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {JOINT_PILLS.map((p) => (
              <button
                key={p.value}
                type="button"
                aria-pressed={joint === p.value}
                onClick={() => setJoint(p.value)}
                className={pillClass(joint === p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Coach note */}
        {note && (
          <p
            className="mt-6 rounded-xl border border-[#1E2633] bg-[#131820] p-4 text-sm leading-relaxed text-white/80"
            role="status"
          >
            {note}
          </p>
        )}

        <div className="mt-auto pt-8">
          <Button
            type="button"
            size="lg"
            className="h-14 w-full rounded-full bg-[#00D1B2] text-base font-semibold text-[#090C10] hover:bg-[#00D1B2]/90"
            onClick={() => onDone({ feel, joint })}
          >
            Finish & Save Session
          </Button>
          <p className="mt-3 text-center text-xs text-white/40">
            Feedback is optional — you can save as is.
          </p>
        </div>
      </div>
    </div>
  )
}

export default CheckIn
