import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSwellFit } from '../context/SwellFitContext'
import { useToast } from '../hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  User,
  Waves,
  Target,
  Dumbbell,
  ShieldCheck,
  Lock,
  Unlock,
  Trash2,
  ChevronRight,
  CalendarDays,
  Watch,
  Flame,
} from 'lucide-react'
import { PrimaryGoal, BoardType, InjuryGuardrail, EquipmentTier } from '../types/swellfit'

const GOAL_LABELS: Record<PrimaryGoal, string> = {
  'surf-trip-prep': 'Surf Trip Prep',
  'paddle-endurance': 'Paddle Endurance',
  'shoulder-longevity': 'Shoulder Longevity',
  'popup-mobility': 'Pop-Up Mobility',
}

const BOARD_LABELS: Record<BoardType, string> = {
  shortboard: 'Shortboard',
  midlength: 'Midlength',
  longboard: 'Longboard',
}

const INJURY_LABELS: Record<Exclude<InjuryGuardrail, 'none'>, string> = {
  shoulder: 'Shoulder',
  'lower-back': 'Lower Back',
  'neck-thoracic': 'Neck / Thoracic',
  knee: 'Knee',
}

const EQUIPMENT_LABELS: Record<EquipmentTier, string> = {
  bodyweight: 'Bodyweight Only',
  bands: 'Resistance Bands',
  'home-setup': 'Home Setup (Kettlebell / TRX)',
  gym: 'Full Gym',
}

const WEARABLES: { key: 'appleHealth' | 'garmin' | 'whoop'; label: string }[] = [
  { key: 'appleHealth', label: 'Apple Health' },
  { key: 'garmin', label: 'Garmin Connect' },
  { key: 'whoop', label: 'Whoop' },
]

function OptionRow({
  label,
  selected,
  onSelect,
}: {
  label: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      role="radio"
      aria-checked={selected}
      className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium text-left border transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D1B2] ${
        selected
          ? 'bg-[#00D1B2]/15 border-[#00D1B2] text-[#00D1B2] font-semibold'
          : 'bg-[#0B1117] border-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC]'
      }`}
    >
      {label}
    </button>
  )
}

function SettingSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <Card className="bg-[#141C24] border-[#1E293B]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-2">
          {icon}
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">{children}</CardContent>
    </Card>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const {
    profile,
    tripCountdown,
    shoulderReadinessScore,
    updateProfile,
    unlockPaywall,
    lockPaywall,
    resetAllData,
  } = useSwellFit()

  const [nameDraft, setNameDraft] = useState(profile.name)
  const [tripDateDraft, setTripDateDraft] = useState(profile.surfTripDate ?? '')

  const handleSaveIdentity = () => {
    const trimmedName = nameDraft.trim()
    if (!trimmedName) {
      toast({
        title: 'Name required',
        description: 'Please enter your name before saving.',
        variant: 'destructive',
      })
      return
    }
    updateProfile({
      name: trimmedName,
      surfTripDate: tripDateDraft || undefined,
    })
    toast({
      title: 'Profile updated',
      description: 'Your countdown and sessions now use the new settings.',
    })
  }

  const toggleGuardrail = (g: Exclude<InjuryGuardrail, 'none'>) => {
    const next = profile.injuryGuardrails.includes(g)
      ? profile.injuryGuardrails.filter((x) => x !== g)
      : [...profile.injuryGuardrails, g]
    updateProfile({ injuryGuardrails: next.length ? next : ['none'] })
  }

  const toggleWearable = (key: 'appleHealth' | 'garmin' | 'whoop') => {
    updateProfile({
      connectedWearables: {
        ...profile.connectedWearables,
        [key]: !profile.connectedWearables[key],
      },
    })
  }

  const handleReset = () => {
    resetAllData()
    toast({
      title: 'All data reset',
      description: 'SwellFit restored to fresh onboarding state.',
    })
    navigate('/')
  }

  return (
    <div className="flex-1 flex flex-col px-5 pt-5 pb-8 space-y-4">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#00D1B2]/15 text-[#00D1B2] text-xs font-semibold mb-2">
          <User className="w-3.5 h-3.5" />
          <span>Athlete Profile</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">Your Setup</h1>
        <p className="text-xs text-[#94A3B8] mt-0.5">
          Edit goals, guardrails, and gear — sessions recalibrate instantly.
        </p>
      </div>

      {/* Status Snapshot */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-[#141C24] border-[#1E293B]">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-[#00D1B2]">
              <CalendarDays className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Trip Countdown</span>
            </div>
            <p className="text-2xl font-bold text-[#F8FAFC] font-mono">
              {tripCountdown.daysRemaining}
              <span className="text-sm text-[#94A3B8] ml-1">days</span>
            </p>
            <p className="text-[11px] text-[#94A3B8]">{tripCountdown.phaseName}</p>
            <Progress value={tripCountdown.progressPercent} className="h-1.5 mt-1" />
          </CardContent>
        </Card>

        <Card className="bg-[#141C24] border-[#1E293B]">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-[#00D1B2]">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Shoulder Readiness
              </span>
            </div>
            <p className="text-2xl font-bold text-[#F8FAFC] font-mono">
              {shoulderReadinessScore}
              <span className="text-sm text-[#94A3B8] ml-1">/100</span>
            </p>
            <div className="flex items-center gap-1.5 text-[#94A3B8] text-[11px]">
              <Flame className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>{profile.streakCount} day streak</span>
            </div>
            <Progress value={shoulderReadinessScore} className="h-1.5 mt-1" />
          </CardContent>
        </Card>
      </div>

      {/* Identity */}
      <SettingSection icon={<User className="w-4 h-4 text-[#00D1B2]" />} title="Identity">
        <div className="space-y-1.5">
          <Label htmlFor="profile-name" className="text-xs text-[#94A3B8]">
            Name
          </Label>
          <Input
            id="profile-name"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            autoComplete="name"
            className="bg-[#0B1117] border-[#1E293B] text-[#F8FAFC]"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-trip-date" className="text-xs text-[#94A3B8]">
            Surf trip departure (optional)
          </Label>
          <Input
            id="profile-trip-date"
            type="date"
            value={tripDateDraft}
            onChange={(e) => setTripDateDraft(e.target.value)}
            className="bg-[#0B1117] border-[#1E293B] text-[#F8FAFC]"
          />
        </div>
        <Button
          type="button"
          onClick={handleSaveIdentity}
          className="w-full bg-[#00D1B2] hover:bg-[#00B39B] text-[#0B1117] font-bold"
        >
          Save Profile
        </Button>
      </SettingSection>

      {/* Goal */}
      <SettingSection icon={<Target className="w-4 h-4 text-[#00D1B2]" />} title="Primary Goal">
        <div role="radiogroup" aria-label="Primary goal" className="grid grid-cols-2 gap-2">
          {(Object.keys(GOAL_LABELS) as PrimaryGoal[]).map((g) => (
            <OptionRow
              key={g}
              label={GOAL_LABELS[g]}
              selected={profile.primaryGoal === g}
              onSelect={() => updateProfile({ primaryGoal: g })}
            />
          ))}
        </div>
      </SettingSection>

      {/* Board Type */}
      <SettingSection icon={<Waves className="w-4 h-4 text-[#00D1B2]" />} title="Board Type">
        <div role="radiogroup" aria-label="Board type" className="grid grid-cols-3 gap-2">
          {(Object.keys(BOARD_LABELS) as BoardType[]).map((b) => (
            <OptionRow
              key={b}
              label={BOARD_LABELS[b]}
              selected={profile.boardType === b}
              onSelect={() => updateProfile({ boardType: b })}
            />
          ))}
        </div>
      </SettingSection>

      {/* Equipment */}
      <SettingSection icon={<Dumbbell className="w-4 h-4 text-[#00D1B2]" />} title="Equipment">
        <div role="radiogroup" aria-label="Equipment tier" className="space-y-2">
          {(Object.keys(EQUIPMENT_LABELS) as EquipmentTier[]).map((e) => (
            <OptionRow
              key={e}
              label={EQUIPMENT_LABELS[e]}
              selected={profile.equipment === e}
              onSelect={() => updateProfile({ equipment: e })}
            />
          ))}
        </div>
      </SettingSection>

      {/* Injury Guardrails */}
      <SettingSection
        icon={<ShieldCheck className="w-4 h-4 text-[#00D1B2]" />}
        title="Injury Guardrails"
      >
        <div role="radiogroup" aria-label="Injury guardrails" className="grid grid-cols-2 gap-2">
          {(Object.keys(INJURY_LABELS) as Exclude<InjuryGuardrail, 'none'>[]).map((g) => (
            <OptionRow
              key={g}
              label={INJURY_LABELS[g]}
              selected={profile.injuryGuardrails.includes(g)}
              onSelect={() => toggleGuardrail(g)}
            />
          ))}
        </div>
        <p className="text-[11px] text-[#94A3B8]">
          Contraindicated movements are auto-filtered from every session.
        </p>
      </SettingSection>

      {/* Wearables */}
      <SettingSection
        icon={<Watch className="w-4 h-4 text-[#00D1B2]" />}
        title="Connected Wearables"
      >
        {WEARABLES.map((w) => (
          <div
            key={w.key}
            className="flex items-center justify-between p-3 rounded-xl bg-[#0B1117] border border-[#1E293B]"
          >
            <span className="text-sm text-[#F8FAFC]">{w.label}</span>
            <Switch
              checked={profile.connectedWearables[w.key]}
              onCheckedChange={() => toggleWearable(w.key)}
              aria-label={`Toggle ${w.label} connection`}
            />
          </div>
        ))}
      </SettingSection>

      <Separator className="bg-[#1E293B]" />

      {/* Subscription */}
      <Card className="bg-[#141C24] border-[#1E293B]">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {profile.isEntitled ? (
                <Unlock className="w-4 h-4 text-[#00D1B2]" />
              ) : (
                <Lock className="w-4 h-4 text-[#F59E0B]" />
              )}
              <span className="text-sm font-bold text-[#F8FAFC]">
                {profile.isEntitled ? 'Subscription Active' : 'Free Preview Locked'}
              </span>
            </div>
            <Badge
              variant={profile.isEntitled ? 'default' : 'secondary'}
              className={profile.isEntitled ? 'bg-[#00D1B2] text-[#0B1117]' : ''}
            >
              {profile.isEntitled ? 'PRO' : 'FREE'}
            </Badge>
          </div>
          <Button
            type="button"
            onClick={() => navigate('/paywall')}
            className="w-full bg-[#00D1B2] hover:bg-[#00B39B] text-[#0B1117] font-bold"
          >
            {profile.isEntitled ? 'Manage Subscription' : 'Unlock Full Access'}
            <ChevronRight className="w-4 h-4" />
          </Button>
          {profile.isEntitled && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                lockPaywall()
                toast({ title: 'Subscription cancelled', description: 'Free preview restored.' })
              }}
              className="w-full border-[#1E293B] bg-[#0B1117] text-[#94A3B8] hover:text-[#F87171]"
            >
              Cancel Subscription
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Button
        type="button"
        variant="outline"
        onClick={handleReset}
        className="w-full border-[#7F1D1D]/50 bg-[#0B1117] text-[#F87171] hover:bg-[#7F1D1D]/20 hover:text-[#F87171]"
      >
        <Trash2 className="w-4 h-4" />
        Reset All Data & Restart Onboarding
      </Button>
    </div>
  )
}
