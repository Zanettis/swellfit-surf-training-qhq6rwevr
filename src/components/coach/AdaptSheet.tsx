import { useState } from 'react'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import type { CoachSettings, EquipmentOption, JointOption, TimeOption } from '@/data/sessions'
import type { CoachState } from '@/lib/storage'

interface AdaptSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: CoachSettings
  /** Live coach state — persistent joint-care flags come from the check-ins. */
  coachState: CoachState
  onUpdate: (next: CoachSettings) => void
  /** Release one check-in-flagged joint (manual choice overrides the flag). */
  onReleaseJoint: (joint: JointOption) => void
}

const TIME_OPTIONS: { value: TimeOption; label: string }[] = [
  { value: 'express', label: '10 min (Express)' },
  { value: 'full', label: '25 min (Full)' },
]

const EQUIPMENT_OPTIONS: { value: EquipmentOption; label: string }[] = [
  { value: 'bodyweight', label: 'Bodyweight Only' },
  { value: 'bands', label: 'Resistance Bands' },
  { value: 'kettlebell', label: 'Kettlebell / TRX' },
  { value: 'gym', label: 'Full Gym' },
]

type JointCareFlag = 'shoulders' | 'lowerBack' | 'knees'

const JOINT_OPTIONS: {
  value: JointOption
  label: string
  /** CoachState flag this chip mirrors (locked = set by the last check-in). */
  persistent: JointCareFlag | null
}[] = [
  { value: 'shoulders', label: 'Shoulders', persistent: 'shoulders' },
  { value: 'lowerBack', label: 'Lower Back', persistent: 'lowerBack' },
  { value: 'knees', label: 'Knees', persistent: 'knees' },
]

export function AdaptSheet({
  open,
  onOpenChange,
  settings,
  coachState,
  onUpdate,
  onReleaseJoint,
}: AdaptSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-w-md rounded-t-3xl border-border bg-card px-6 pb-8 pt-6"
      >
        {/* Form mounts on open, so each opening starts from the current state */}
        {open && (
          <AdaptForm
            settings={settings}
            coachState={coachState}
            onUpdate={onUpdate}
            onReleaseJoint={onReleaseJoint}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

function AdaptForm({
  settings,
  coachState,
  onUpdate,
  onReleaseJoint,
}: Pick<AdaptSheetProps, 'settings' | 'coachState' | 'onUpdate' | 'onReleaseJoint'>) {
  const [time, setTime] = useState<TimeOption>(settings.time)
  const [equipment, setEquipment] = useState<EquipmentOption>(settings.equipment)
  const [joints, setJoints] = useState<JointOption[]>(settings.joints)

  const toggleJoint = (joint: JointOption) =>
    setJoints((current) =>
      current.includes(joint) ? current.filter((j) => j !== joint) : [...current, joint],
    )

  /** Turning a locked chip off also releases the check-in's persistent flag. */
  const releasePersistent = (joint: JointOption) => {
    onReleaseJoint(joint)
    setJoints((current) => current.filter((j) => j !== joint))
  }

  return (
    <>
      <SheetHeader className="space-y-1 text-left">
        <SheetTitle className="text-xl font-bold">Adapt Session</SheetTitle>
        <SheetDescription>Adjust today's session to your time, kit and joints.</SheetDescription>
      </SheetHeader>

      <div className="mt-6 flex flex-col gap-6">
        <ChoiceGroup
          legend="Time available"
          options={TIME_OPTIONS}
          value={time}
          onChange={(next: TimeOption) => setTime(next)}
        />
        <ChoiceGroup
          legend="Equipment today"
          options={EQUIPMENT_OPTIONS}
          value={equipment}
          onChange={(next: EquipmentOption) => setEquipment(next)}
        />

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-sm font-semibold text-foreground">
            Joints feeling tight today?
          </legend>
          <div className="flex flex-wrap gap-2">
            {JOINT_OPTIONS.map((option) => {
              const locked = option.persistent
                ? coachState.persistentJointCare[option.persistent]
                : false
              const active = joints.includes(option.value) || locked
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    locked ? releasePersistent(option.value) : toggleJoint(option.value)
                  }
                  className={chipClass(active)}
                >
                  {locked && <Lock className="mr-1 inline h-3 w-3" aria-hidden="true" />}
                  {option.label}
                  {locked && <span className="sr-only"> (locked from check-in)</span>}
                </button>
              )
            })}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Locked chips were flagged in your last check-in. Tap one to release the protection
            manually.
          </p>
        </fieldset>
      </div>

      <SheetFooter className="mt-8">
        <Button
          type="button"
          size="lg"
          className="h-14 w-full rounded-2xl text-base font-semibold"
          onClick={() => onUpdate({ time, equipment, joints })}
        >
          Update Session
        </Button>
      </SheetFooter>
    </>
  )
}

interface ChoiceGroupProps<T extends string> {
  legend: string
  options: { value: T; label: string }[]
  value: T
  onChange: (next: T) => void
}

function ChoiceGroup<T extends string>({ legend, options, value, onChange }: ChoiceGroupProps<T>) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-sm font-semibold text-foreground">{legend}</legend>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => {
          const active = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className={cn(chipClass(active), 'min-h-12 px-3 text-center')}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function chipClass(active: boolean) {
  return cn(
    'min-h-11 rounded-full border px-4 text-sm font-medium transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]',
    active
      ? 'border-primary bg-primary text-primary-foreground'
      : 'border-border bg-secondary text-foreground hover:text-foreground',
  )
}
