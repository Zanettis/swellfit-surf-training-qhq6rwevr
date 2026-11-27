import { useState } from 'react'
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

interface AdaptSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: CoachSettings
  onUpdate: (next: CoachSettings) => void
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

const JOINT_OPTIONS: { value: JointOption; label: string }[] = [
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'lowerBack', label: 'Lower Back' },
  { value: 'knees', label: 'Knees' },
]

export function AdaptSheet({ open, onOpenChange, settings, onUpdate }: AdaptSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-w-md rounded-t-3xl border-border bg-card px-6 pb-8 pt-6"
      >
        {/* Form mounts on open, so each opening starts from the current session settings */}
        {open && <AdaptForm settings={settings} onUpdate={onUpdate} />}
      </SheetContent>
    </Sheet>
  )
}

function AdaptForm({ settings, onUpdate }: Pick<AdaptSheetProps, 'settings' | 'onUpdate'>) {
  const [time, setTime] = useState<TimeOption>(settings.time)
  const [equipment, setEquipment] = useState<EquipmentOption>(settings.equipment)
  const [joints, setJoints] = useState<JointOption[]>(settings.joints)

  const toggleJoint = (joint: JointOption) =>
    setJoints((current) =>
      current.includes(joint) ? current.filter((j) => j !== joint) : [...current, joint],
    )

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
              const active = joints.includes(option.value)
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleJoint(option.value)}
                  className={chipClass(active)}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
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
