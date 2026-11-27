import { Play } from 'lucide-react'
import type { Exercise, PlayerExercise } from '@/data/sessions'
import type { PhaseName } from '@/data/player-types'
import { PHASE_LABELS, SESSION_BLOCKS } from '@/data/player-types'

interface SessionBreakdownProps {
  exercises: Exercise[]
  /** Present → rows become buttons that launch the player at that exercise. */
  onSelect?: (index: number) => void
}

/** Index of each exercise in the flat list, so onSelect stays position-based. */
function groupByPhase(exercises: PlayerExercise[]): {
  phase: PhaseName
  items: { exercise: PlayerExercise; index: number }[]
}[] {
  return SESSION_BLOCKS.map((block) => ({
    phase: block.phase,
    items: exercises
      .map((exercise, index) => ({ exercise, index }))
      .filter((item) => (item.exercise.phase ?? 'main') === block.phase),
  })).filter((group) => group.items.length > 0)
}

export function SessionBreakdown({ exercises, onSelect }: SessionBreakdownProps) {
  // Surf routines and flat-day sessions have no phase field — the whole list
  // falls into one ungrouped list (main) below.
  const hasPhases = exercises.some((e) => 'phase' in e && e.phase)
  const groups = hasPhases ? groupByPhase(exercises as PlayerExercise[]) : null

  const renderRow = (exercise: PlayerExercise | Exercise, index: number) => {
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
  }

  return (
    <section aria-labelledby="session-breakdown-title" className="flex flex-col gap-4">
      <h2
        id="session-breakdown-title"
        className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground"
      >
        Session breakdown ({exercises.length} exercises)
      </h2>

      {groups ? (
        groups.map((group) => (
          <div key={group.phase} className="flex flex-col gap-2.5">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
              {PHASE_LABELS[group.phase]}
              <span className="h-px flex-1 bg-border" aria-hidden="true" />
              <span className="tabular-nums text-muted-foreground/70">{group.items.length}</span>
            </p>
            <ul className="flex flex-col gap-3">
              {group.items.map((item) => renderRow(item.exercise, item.index))}
            </ul>
          </div>
        ))
      ) : (
        <ul className="flex flex-col gap-3">
          {exercises.map((exercise, index) => renderRow(exercise, index))}
        </ul>
      )}
    </section>
  )
}

export default SessionBreakdown
