import { useMemo, useState } from 'react'
import { toast } from '@/hooks/use-toast'
import { buildSession, DEFAULT_SETTINGS, type CoachSettings, type DayMode } from '@/data/sessions'
import { CoachHeader } from '@/components/coach/CoachHeader'
import { DaySwitch } from '@/components/coach/DaySwitch'
import { HeroCard } from '@/components/coach/HeroCard'
import { SessionBreakdown } from '@/components/coach/SessionBreakdown'
import { AdaptSheet } from '@/components/coach/AdaptSheet'

export default function Coach() {
  const [mode, setMode] = useState<DayMode>('flat')
  const [settings, setSettings] = useState<CoachSettings>(DEFAULT_SETTINGS)
  const [adaptOpen, setAdaptOpen] = useState(false)

  const session = useMemo(() => buildSession(mode, settings), [mode, settings])

  // Re-keys the animated block whenever the session content changes, so the update is visible.
  const contentKey = `${mode}-${settings.time}-${settings.equipment}-${settings.joints.join(',')}`

  return (
    <div className="flex flex-1 flex-col gap-8 px-5 pb-8 pt-6">
      <CoachHeader />

      <DaySwitch value={mode} onChange={setMode} />

      <div key={contentKey} className="animate-coach-rise flex flex-col gap-8">
        <HeroCard
          session={session}
          onStart={() => toast({ title: 'Workout Player coming in Stage 2' })}
          onAdapt={() => setAdaptOpen(true)}
        />
        <SessionBreakdown exercises={session.exercises} />
      </div>

      <AdaptSheet
        open={adaptOpen}
        onOpenChange={setAdaptOpen}
        settings={settings}
        onUpdate={(next) => {
          setSettings(next)
          setAdaptOpen(false)
        }}
      />
    </div>
  )
}
