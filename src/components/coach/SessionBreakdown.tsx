import { Play } from 'lucide-react'
import type { Exercise } from '@/data/sessions'

interface SessionBreakdownProps {
  exercises: Exercise[]
}

export function SessionBreakdown({ exercises }: SessionBreakdownProps) {
  return (
    <section aria-labelledby="session-breakdown-title" className="flex flex-col gap-4">
      <h2
        id="session-breakdown-title"
        className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground"
      >
        Session breakdown ({exercises.length} exercises)
      </h2>

      <ul className="flex flex-col gap-3">
        {exercises.map((exercise) => (
          <li key={exercise.id} className="flex items-center gap-4">
            {/* 16:9 placeholder for the Stage 2 execution video */}
            <div
              className="relative flex aspect-video w-28 shrink-0 items-center justify-center rounded-xl bg-card"
              aria-hidden="true"
            >
              <Play className="h-4 w-4 fill-muted-foreground text-muted-foreground" />
            </div>
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="truncate font-semibold text-foreground">{exercise.name}</p>
              <p className="text-sm tabular-nums text-muted-foreground">{exercise.dose}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
