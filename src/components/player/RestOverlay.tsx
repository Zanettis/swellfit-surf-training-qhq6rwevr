// High-contrast rest state: big countdown, +15s / Skip Rest, and an
// "UP NEXT" preview card with a quick swap button.

import { RefreshCw } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { PlayerExercise } from '@/data/player-types'

interface RestOverlayProps {
  remaining: number
  total?: number
  next?: PlayerExercise
  onAddRest: () => void
  onSkipRest: () => void
  onSwap: () => void
}

export function RestOverlay({ remaining, next, onAddRest, onSkipRest, onSwap }: RestOverlayProps) {
  return (
    <div className="flex w-full max-w-md flex-col items-center motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/40">Rest</p>
      <p className="mt-3 text-8xl font-bold tabular-nums tracking-tight">
        {String(Math.floor(remaining / 60)).padStart(2, '0')}:
        {String(remaining % 60).padStart(2, '0')}
      </p>

      <div className="mt-6 flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          className="rounded-full border-[#1E2633] bg-transparent text-sm font-medium text-white/80 hover:bg-[#1E2633] hover:text-white"
          onClick={onAddRest}
        >
          +15s
        </Button>
        <Button
          type="button"
          className="rounded-full bg-[#00D1B2] text-sm font-semibold text-[#090C10] hover:bg-[#00D1B2]/90"
          onClick={onSkipRest}
        >
          Skip Rest
        </Button>
        {next && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Swap upcoming exercise"
            onClick={onSwap}
            className="h-10 w-10 rounded-full border-[#1E2633] bg-transparent text-white/70 hover:bg-[#1E2633] hover:text-white"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>

      {next && (
        <div className="mt-10 w-full rounded-2xl border border-[#1E2633] bg-[#131820] p-5 text-left">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#00D1B2]">
            Up Next
          </p>
          <p className="mt-2 text-lg font-bold text-white">{next.name}</p>
          <p className="mt-1 text-sm text-white/50">
            {next.type === 'time'
              ? `${next.durationSeconds ?? 45}s`
              : `${next.reps ?? 0} reps${next.perSide ? ' / side' : ''}`}
            {' · '}
            {next.sets > 1 ? `Set 1 of ${next.sets}` : 'Single set'}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {next.alternativeTags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="border-[#1E2633] text-[10px] tracking-wide text-white/60"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
      {!next && (
        <p className="mt-10 text-sm text-white/40">
          Last set done — nothing left but the check-in.
        </p>
      )}
    </div>
  )
}
