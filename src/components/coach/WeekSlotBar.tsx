// WeekSlotBar: the S1–S4 week grid under the Coach header. Each day shows its
// complementary surf focus and a completion state derived from the REAL
// workout history (Supabase by device_id, localStorage offline mirror) —
// never from mock data.
//
// Every card is tappable: the user is never locked to pickTodaySlot()'s
// suggestion. The suggested slot keeps its visual highlight, the currently
// displayed slot gets a selection ring, and repeating a completed day is
// allowed. Surf Day slots ('pre'/'post') are NOT here — they stay under the
// SurfRoutineSwitch.

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DAY_LABELS, type DayId } from '@/data/player-types'
import { WEEKLY_SLOT_ORDER } from '@/data/player-types'

export type SlotStatus = 'done' | 'today' | 'future'

interface WeekSlotBarProps {
  /** Completed counts per archetype this week (from CoachState.weeklyFocusCounts). */
  counts: Record<DayId, number>
  /** The slot the Coach picked for today (least-hit archetype) — the suggestion. */
  todaySlot: DayId
  /** The slot currently displayed in the Hero Card (user's free pick). */
  selectedSlot: DayId
  /** ISO date of the last completed workout — marks "done today" distinctly. */
  completedToday: boolean
  /** Tapping a card loads that day's session into the Coach screen. */
  onSelectSlot: (day: DayId) => void
}

/** Short surf-focus label per archetype (the full label lives in DAY_LABELS). */
const SLOT_HINT: Record<DayId, string> = {
  S1: 'Paddle',
  S2: 'Cuff & Pop-Up',
  S3: 'Back & Hips',
  S4: 'Capacity',
}

function statusOf(counts: Record<DayId, number>, day: DayId, todaySlot: DayId): SlotStatus {
  if (counts[day] > 0) return 'done'
  if (day === todaySlot) return 'today'
  return 'future'
}

export function WeekSlotBar({
  counts,
  todaySlot,
  selectedSlot,
  completedToday,
  onSelectSlot,
}: WeekSlotBarProps) {
  const remaining = WEEKLY_SLOT_ORDER.filter((d) => counts[d] === 0).length

  return (
    <section aria-label="This week's training days" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          This Week
        </h2>
        <p
          className="text-[11px] font-medium tabular-nums text-muted-foreground"
          aria-live="polite"
        >
          {completedToday ? 'Session done today · ' : ''}
          {remaining} {remaining === 1 ? 'day' : 'days'} left
        </p>
      </div>

      <div role="list" className="grid grid-cols-4 gap-2">
        {WEEKLY_SLOT_ORDER.map((day) => {
          const status = statusOf(counts, day, todaySlot)
          const selected = day === selectedSlot
          const label = DAY_LABELS[day].split(' · ')[1] ?? day
          const stateText =
            selected && status !== 'done'
              ? 'shown below'
              : status === 'done'
                ? 'trained this week — tap to repeat'
                : status === 'today'
                  ? 'up next today'
                  : 'later this week'
          return (
            <div key={day} role="listitem">
              <button
                type="button"
                aria-pressed={selected}
                aria-label={`${label}: ${stateText}`}
                onClick={() => onSelectSlot(day)}
                className={cn(
                  'flex w-full flex-col gap-1.5 rounded-2xl border p-2.5 text-left transition-colors duration-200 motion-reduce:transition-none',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]',
                  status === 'done' && 'border-primary/40 bg-primary/10',
                  status === 'today' && 'border-border bg-card',
                  status === 'future' && 'border-border/60 bg-card/50',
                  selected && 'border-[#00D1B2] ring-1 ring-[#00D1B2]',
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      'text-xs font-bold tabular-nums',
                      status === 'done' ? 'text-primary' : 'text-foreground',
                    )}
                  >
                    {day}
                  </span>
                  {status === 'done' ? (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                      <Check className="h-2.5 w-2.5 text-primary-foreground" aria-hidden="true" />
                    </span>
                  ) : (
                    <span
                      aria-hidden="true"
                      className={cn(
                        'h-2 w-2 rounded-full',
                        status === 'today' ? 'bg-[#00D1B2]' : 'bg-white/15',
                      )}
                    />
                  )}
                </div>
                <div className="flex min-w-0 flex-col">
                  <span
                    className={cn(
                      'truncate text-[11px] font-medium leading-tight',
                      status === 'future' ? 'text-muted-foreground/70' : 'text-foreground',
                    )}
                  >
                    {SLOT_HINT[day]}
                  </span>
                  <span className="text-[10px] tabular-nums text-muted-foreground/60">
                    {counts[day] > 0 ? `×${counts[day]}` : '—'}
                  </span>
                </div>
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default WeekSlotBar
