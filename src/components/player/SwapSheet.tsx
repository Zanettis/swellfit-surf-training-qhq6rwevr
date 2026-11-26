// Mid-workout "Swap Exercise" bottom sheet. Pauses the block on open, lists the
// biomechanical alternatives with their fit tags, applies the swap on pick.

import { useEffect } from 'react'
import { Check, RefreshCw } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PlayerExercise } from '@/data/player-types'

interface SwapSheetProps {
  exercise: PlayerExercise
  open: boolean
  onOpenChange: (open: boolean) => void
  onSwap: (replacement: PlayerExercise) => void
}

export function SwapSheet({ exercise, open, onOpenChange, onSwap }: SwapSheetProps) {
  // Opening the sheet pauses the active timer (Resume handled by the player).
  useEffect(() => {
    if (open) {
      const timer = window.setTimeout(
        () => document.getElementById('swap-sheet-title')?.focus(),
        50,
      )
      return () => window.clearTimeout(timer)
    }
  }, [open])

  const alternatives = exercise.alternatives

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl border-[#1E2633] bg-[#131820] px-5 pb-8 pt-3 text-white"
      >
        <SheetHeader className="p-0 text-left">
          <SheetTitle
            id="swap-sheet-title"
            className="text-sm font-semibold tracking-wide text-white"
          >
            Swap Exercise
          </SheetTitle>
          <SheetDescription className="text-xs text-white/50">
            Swap out <span className="text-white/80">{exercise.name}</span> for a biomechanically
            similar movement.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-2">
          {alternatives.length === 0 && (
            <p className="rounded-xl border border-[#1E2633] bg-[#090C10] p-4 text-sm text-white/60">
              No alternatives for this exercise yet.
            </p>
          )}
          {alternatives.map((alt) => (
            <button
              key={alt.id}
              type="button"
              onClick={() => onSwap(alt)}
              className={cn(
                'w-full rounded-xl border border-[#1E2633] bg-[#090C10] p-4 text-left',
                'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D1B2]',
                'hover:border-[#00D1B2]/40',
              )}
            >
              <span className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-white">{alt.name}</span>
                  <span className="mt-0.5 block text-xs text-white/50">
                    {alt.dose} · {alt.surfCue}
                  </span>
                </span>
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#00D1B2]" aria-hidden="true" />
              </span>
              <span className="mt-2 flex flex-wrap gap-1.5">
                {alt.alternativeTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="border-[#1E2633] bg-transparent text-[10px] font-medium tracking-wide text-[#00D1B2]"
                  >
                    {tag}
                  </Badge>
                ))}
              </span>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
