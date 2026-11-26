// Coach top bar: journey label (Stage 1 static copy) and the live weekly
// streak pill fed from localStorage (Stage 2).

interface CoachHeaderProps {
  weekly: number
  weeklyGoal: number
}

export function CoachHeader({ weekly, weeklyGoal }: CoachHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Surf Trip Prep
        </p>
        <h1 className="text-lg font-bold tracking-tight text-foreground">Week 1 · 28 Days Left</h1>
      </div>

      <p
        aria-label={`Sessions this week: ${weekly} of ${weeklyGoal}`}
        className="mt-0.5 flex shrink-0 items-center rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold tabular-nums text-foreground"
      >
        {weekly}/{weeklyGoal}
      </p>
    </header>
  )
}
