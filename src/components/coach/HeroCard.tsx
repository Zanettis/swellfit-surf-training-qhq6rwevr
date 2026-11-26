import { CheckCircle2, Clock, Dumbbell, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CoachSession } from '@/data/sessions'

interface HeroCardProps {
  session: CoachSession
  completedToday?: boolean
  onStart: () => void
  onAdapt: () => void
}

export function HeroCard({ session, completedToday, onStart, onAdapt }: HeroCardProps) {
  return (
    <section aria-labelledby="hero-session-title" className="overflow-hidden rounded-3xl bg-card">
      {/* Drawn-in-code ocean wave header: flat slate strokes, no gradient */}
      <div className="relative h-28 w-full overflow-hidden bg-secondary" aria-hidden="true">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 360 112"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
        >
          <path
            d="M0 60 C 40 40, 80 40, 120 60 S 200 80, 240 60 S 320 40, 360 60"
            className="stroke-muted-foreground/50"
            strokeWidth="2"
          />
          <path
            d="M0 78 C 40 58, 80 58, 120 78 S 200 98, 240 78 S 320 58, 360 78"
            className="stroke-muted-foreground/30"
            strokeWidth="2"
          />
          <path
            d="M0 96 C 40 76, 80 76, 120 96 S 200 116, 240 96 S 320 76, 360 96"
            className="stroke-muted-foreground/20"
            strokeWidth="2"
          />
        </svg>
      </div>

      <div className="flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {session.description}
          </p>
          <h2 id="hero-session-title" className="text-2xl font-bold leading-tight tracking-tight">
            {session.title}
          </h2>
          {completedToday && (
            <p
              className="mt-1 flex items-center gap-1.5 text-sm font-medium text-primary"
              role="status"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Completed Today ✓
            </p>
          )}
        </div>

        <dl className="flex flex-col gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
            <dt className="sr-only">Duration</dt>
            <dd className="font-semibold tabular-nums text-foreground">
              {session.durationMin} min
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4 shrink-0" aria-hidden="true" />
            <dt className="sr-only">Equipment</dt>
            <dd>{session.equipmentTag}</dd>
          </div>
        </dl>

        <ul className="flex flex-wrap gap-2">
          {session.focusTags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-foreground"
            >
              {tag}
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-3 pt-1">
          <Button
            size="lg"
            className="h-14 w-full rounded-2xl text-base font-semibold"
            onClick={onStart}
          >
            Start Session
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-12 w-full gap-2 rounded-2xl font-medium"
            onClick={onAdapt}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Adapt Session
          </Button>
        </div>
      </div>
    </section>
  )
}
