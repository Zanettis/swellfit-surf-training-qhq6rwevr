import { cn } from '@/lib/utils'

export type CoachMode = 'weekly' | 'surf'

interface DaySwitchProps {
  value: CoachMode
  onChange: (next: CoachMode) => void
}

const OPTIONS: { value: CoachMode; label: string }[] = [
  { value: 'weekly', label: 'Weekly Plan' },
  { value: 'surf', label: 'Surf Day' },
]

export function DaySwitch({ value, onChange }: DaySwitchProps) {
  return (
    <div
      role="group"
      aria-label="Ocean context"
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
              'min-h-11 rounded-full px-4 text-sm font-semibold transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
