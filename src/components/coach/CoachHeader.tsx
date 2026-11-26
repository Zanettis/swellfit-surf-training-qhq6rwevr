// Stage 1 static journey data: mock values only, no database.
const JOURNEY_LABEL = 'Surf Trip Prep'
const JOURNEY_PROGRESS = 'Week 1 · 28 Days Left'
const SESSIONS_DONE = 3
const SESSIONS_TARGET = 4

export function CoachHeader() {
  return (
    <header className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {JOURNEY_LABEL}
        </p>
        <h1 className="text-lg font-bold tracking-tight text-foreground">{JOURNEY_PROGRESS}</h1>
      </div>

      <p
        aria-label={`Sessions this week: ${SESSIONS_DONE} of ${SESSIONS_TARGET}`}
        className="mt-0.5 flex shrink-0 items-center rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold tabular-nums text-foreground"
      >
        {SESSIONS_DONE}/{SESSIONS_TARGET}
      </p>
    </header>
  )
}
