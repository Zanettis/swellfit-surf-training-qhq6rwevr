// Coach top bar: journey label in micro-uppercase, the live "Week N · X Days
// Left" line, the Coach level, and the weekly streak pill.

import { cn } from '@/lib/utils'
import type { CoachLevel } from '@/data/player-types'

interface CoachHeaderProps {
  weekly: number
  weeklyGoal: number
  /** Progressive-cycle week number from CoachState. */
  week: number
  /** Days remaining in the journey block. */
  daysLeft: number
  /** Coach intensity level from CoachState. */
  coachLevel: CoachLevel
}

export function CoachHeader({ weekly, weeklyGoal, week, daysLeft, coachLevel }: CoachHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Surf Trip Prep
        </p>
        <h1 className="text-lg font-bold tracking-tight text-foreground">
          Week {week} · {daysLeft} Days Left
        </h1>
        <p
          className="text-[11px] font-medium uppercase tracking-[0.16em] text-primary/80"
          aria-label={`Coach level ${coachLevel}`}
        >
          Coach Lvl {coachLevel}
        </p>
      </div>

      <p
        aria-label={`Sessions this week: ${weekly} of ${weeklyGoal}`}
        className="mt-0.5 flex shrink-0 items-center rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold tabular-nums text-foreground"
      >
        <span className={cn(weekly >= weeklyGoal && 'text-primary')}>{weekly}</span>
        <span className="text-muted-foreground">/{weeklyGoal}</span>
      </p>
    </header>
  )
}

export default CoachHeader
