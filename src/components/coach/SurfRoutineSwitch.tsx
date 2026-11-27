// SurfRoutineSwitch: Pre-Surf / Post-Surf segmented switch for Surf Day mode.
// Selecting one swaps which routine the Coach builds and the HeroCard shows.

import { cn } from '@/lib/utils'
import type { SurfSubMode } from '@/data/player-types'

interface SurfRoutineSwitchProps {
  value: SurfSubMode
  onChange: (next: SurfSubMode) => void
}

const OPTIONS: { value: SurfSubMode; label: string; hint: string }[] = [
  { value: 'pre', label: 'Pre-Surf', hint: 'Activate' },
  { value: 'post', label: 'Post-Surf', hint: 'Decompress' },
]

export function SurfRoutineSwitch({ value, onChange }: SurfRoutineSwitchProps) {
  return (
    <div
      role="group"
      aria-label="Surf routine"
      className="grid grid-cols-2 gap-1 rounded-full bg-card p-1"
    >
      {OPTIONS.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex min-h-11 flex-col items-center justify-center rounded-full px-4 py-1 transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <span className="text-sm font-semibold leading-tight">{option.label}</span>
            <span
              className={cn(
                'text-[10px] font-medium uppercase tracking-[0.15em]',
                active ? 'text-primary-foreground/70' : 'text-muted-foreground/60',
              )}
            >
              {option.hint}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default SurfRoutineSwitch
