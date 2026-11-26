import { Play } from 'lucide-react'
import type { Exercise } from '@/data/sessions'

interface SessionBreakdownProps {
  exercises: Exercise[]
  /** Present → rows become buttons that launch the player at that exercise. */
  onSelect?: (index: number) => void
}

export function SessionBreakdown({ exercises, onSelect }: SessionBreakdownProps) {
  return (
    <section aria-labelledby="session-breakdown-title" className="flex flex-col gap-4">
      <h2
        id="session-breakdown-title"
        className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground"
      >
        Session breakdown ({exercises.length} exercises)
      </h2>

      <ul className="flex flex-col gap-3">
        {exercises.map((exercise, index) => {
          const row = (
            <>
              {/* 16:9 placeholder for the execution video */}
              <div
                className="relative flex aspect-video w-28 shrink-0 items-center justify-center rounded-xl bg-card"
                aria-hidden="true"
              >
                <Play className="h-4 w-4 fill-muted-foreground text-muted-foreground" />
              </div>
              <div className="flex min-w-0 flex-col gap-0.5 text-left">
                <p className="truncate font-semibold text-foreground">{exercise.name}</p>
                <p className="text-sm tabular-nums text-muted-foreground">{exercise.dose}</p>
              </div>
            </>
          )

          if (!onSelect) {
            return (
              <li key={exercise.id} className="flex items-center gap-4">
                {row}
              </li>
            )
          }

          return (
            <li key={exercise.id}>
              <button
                type="button"
                onClick={() => onSelect(index)}
                aria-label={`Start session from ${exercise.name}`}
                className="flex w-full items-center gap-4 rounded-xl p-1 text-left transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {row}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
