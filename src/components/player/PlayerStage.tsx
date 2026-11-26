// The exercise stage: real <video> when videoUrl exists, otherwise a crafted
// "Demo Loop" placeholder with a pulsing teal tempo ring, category badge and a
// corner Form Cues toggle that reveals the execution bullets.

import { useState } from 'react'
import { Info } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PlayerExercise } from '@/data/player-types'

function categoryOf(ex: PlayerExercise): string {
  const n = ex.name.toLowerCase()
  if (n.includes('press') || n.includes('push')) return 'Press'
  if (n.includes('row') || n.includes('pull') || n.includes('swim')) return 'Pull'
  if (n.includes('rotation') || n.includes('open book') || n.includes('thread')) return 'Mobility'
  if (n.includes('core') || n.includes('bird') || n.includes('dead') || n.includes('bridge'))
    return 'Core'
  if (n.includes('swing') || n.includes('bound') || n.includes('pop-up') || n.includes('squat'))
    return 'Power'
  return 'Conditioning'
}

function durationLabel(ex: PlayerExercise): string {
  return ex.type === 'time' ? `${ex.durationSeconds ?? 45}s` : `${ex.reps ?? 0} reps`
}

interface StageProps {
  exercise: PlayerExercise
  phase: 'work' | 'rest' | 'done'
  dimmed?: boolean
}

export function PlayerStage({ exercise, dimmed }: StageProps) {
  const [cuesOpen, setCuesOpen] = useState(false)

  return (
    <div className="relative">
      <div
        className={cn(
          'relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[#1E2633] bg-[#090C10]',
          'motion-safe:transition-opacity motion-safe:duration-300',
          dimmed && 'opacity-40',
        )}
      >
        {exercise.videoUrl ? (
          <video
            key={exercise.id}
            className="h-full w-full object-cover"
            src={exercise.videoUrl}
            poster={exercise.posterUrl}
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <div
            className="relative flex h-full w-full items-center justify-center"
            aria-hidden="true"
          >
            {/* pulsing teal tempo ring */}
            <div className="relative flex h-32 w-32 items-center justify-center">
              <span
                className={cn(
                  'absolute inset-0 rounded-full border-2 border-[#00D1B2]/40',
                  'motion-safe:animate-[swell-pulse_2.4s_ease-in-out_infinite]',
                )}
              />
              <span className="absolute inset-3 rounded-full border border-[#00D1B2]/20" />
              <span className="text-[11px] font-medium tabular-nums tracking-widest text-[#00D1B2]">
                {durationLabel(exercise)}
              </span>
            </div>

            {/* exercise category badge */}
            <Badge
              variant="outline"
              className="absolute left-3 top-3 border-[#1E2633] bg-[#131820]/80 text-[10px] font-medium tracking-wide text-white/70"
            >
              {categoryOf(exercise)}
            </Badge>

            {/* demo loop indicator */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-[#131820]/80 px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00D1B2] motion-safe:animate-pulse" />
              <span className="text-[10px] font-medium tracking-wide text-white/60">Demo Loop</span>
            </div>
          </div>
        )}

        {/* Form Cues corner toggle */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={cuesOpen ? 'Hide form cues' : 'Show form cues'}
          aria-expanded={cuesOpen}
          onClick={() => setCuesOpen((v) => !v)}
          className="absolute right-2 top-2 h-8 w-8 rounded-full bg-[#131820]/80 text-white/70 hover:bg-[#1E2633] hover:text-white"
        >
          <Info className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {/* form cues panel */}
      {cuesOpen && (
        <ul className="mt-3 space-y-1.5 rounded-xl border border-[#1E2633] bg-[#131820] p-4">
          {exercise.formTips.map((tip) => (
            <li key={tip} className="flex gap-2 text-xs leading-relaxed text-white/70">
              <span
                className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#00D1B2]"
                aria-hidden="true"
              />
              {tip}
            </li>
          ))}
        </ul>
      )}

      {/* screen-reader summary of the placeholder when video is absent */}
      {!exercise.videoUrl && (
        <p className="sr-only">
          {exercise.name}, {durationLabel(exercise)} — demo loop placeholder shown; use Form Cues
          for execution points.
        </p>
      )}
    </div>
  )
}
