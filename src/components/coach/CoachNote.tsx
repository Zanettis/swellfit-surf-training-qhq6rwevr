// Coach note on the HeroCard: derived from the ADAPTIVE state (CoachState),
// never from user text and never from any generated model — the "Coach" voice.

import { MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CoachState } from '@/lib/storage'
import { loadAllRepHistory } from '@/lib/storage'

const LABELS: Record<number, string> = {
  1: 'Rebuild',
  2: 'Build',
  3: 'Push',
}

/**
 * One line of Coach guidance from the real state:
 *  - persistent joint care wins (protecting the flagged joint today);
 *  - otherwise the coach level sets the tone (L1 Rebuild, L2 Build, L3 Push).
 */
export function coachNoteOf(state: CoachState, completedToday: boolean): string {
  const care = state.persistentJointCare
  const flagged: string[] = []
  if (care.shoulders) flagged.push('shoulders')
  if (care.lowerBack) flagged.push('lower back')
  if (care.knees) flagged.push('knees')
  if (flagged.length > 0) {
    return `Coach flagged your ${flagged.join(' and ')} from the last check-in — today's session swaps in joint-friendly alternatives until it clears.`
  }
  if (completedToday) {
    return 'Session banked. Recovery matters as much as volume — hydrate and let the adaptation land.'
  }
  return `Coach is at Level ${state.coachLevel} · ${LABELS[state.coachLevel] ?? 'Build'} — today's dose is tuned to that.`
}

interface CoachNoteProps {
  state: CoachState
  completedToday: boolean
  className?: string
}

export function CoachNote({ state, completedToday, className }: CoachNoteProps) {
  const note = coachNoteOf(state, completedToday)
  void loadAllRepHistory // keep the storage import honest for future note cues
  return (
    <div
      className={cn(
        'flex items-start gap-2.5 rounded-2xl border border-border bg-secondary/60 p-3.5',
        className,
      )}
      role="note"
      aria-label="Coach note"
    >
      <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <p className="text-sm leading-relaxed text-muted-foreground">{note}</p>
    </div>
  )
}

export default CoachNote
