export type PrimaryGoal =
  | 'surf-trip-prep'
  | 'paddle-endurance'
  | 'shoulder-longevity'
  | 'popup-mobility'

export type BoardType = 'shortboard' | 'midlength' | 'longboard'

export type InjuryGuardrail = 'shoulder' | 'lower-back' | 'neck-thoracic' | 'knee' | 'none'

export type EquipmentTier = 'bodyweight' | 'bands' | 'home-setup' | 'gym'

export type OceanContext = 'flat' | 'surf'
export type SurfDaySubtype = 'pre-surf' | 'post-surf'
export type DurationChip = '10' | '25'

export type SurfBenefitTag =
  | 'Thoracic Extension'
  | 'Duck Dive Power'
  | 'Rotator Cuff'
  | 'Paddle Endurance'
  | 'Hip Mobility'
  | 'Pop-Up Power'

export interface Exercise {
  id: string
  name: string
  requiredEquipment: EquipmentTier
  tags: SurfBenefitTag[]
  contraindicatedJoints: ('shoulder' | 'lower-back' | 'neck-thoracic' | 'knee')[]
  surfTransferCue: string
  repsOrDuration: string
  defaultSeconds: number
  swapAlternatives: string[] // exercise IDs
  pattern: 'pull' | 'push' | 'hinge' | 'rotate' | 'extend' | 'squat' | 'core'
}

export interface WorkoutSession {
  id: string
  title: string
  context: OceanContext
  surfSubtype?: SurfDaySubtype
  durationMinutes: number
  equipmentTier: EquipmentTier
  tags: SurfBenefitTag[]
  exercises: Exercise[]
  adaptiveExplanation: string
}

export interface DayPlanPreview {
  dayLabel: string
  dayIndex: number // 0 = Mon, 6 = Sun
  title: string
  durationMinutes: number
  isRest?: boolean
  tags: SurfBenefitTag[]
  exercises: Exercise[]
}

export interface ProgramPhase {
  phaseNumber: number
  name: string
  weeksRange: string
  focus: string
  sessionsPerWeek: number
}

export interface Program {
  id: string
  name: string
  durationWeeks: number
  focus: string
  progressPercent: number
  savedOffline: boolean
  phases: ProgramPhase[]
  weeklyStructure: {
    dayLabel: string
    sessionTitle: string
    durationMinutes: number
    focusTags: SurfBenefitTag[]
  }[]
  injuryNotes: string
}

export interface CheckInRecord {
  date: string
  workoutId: string
  sessionTitle: string
  intensity: 'Too Easy' | 'Just Right' | 'Brutal'
  jointDiscomfort: 'none' | 'shoulder' | 'lower-back'
  adaptationMessage: string
  completedAt: number
}

export interface UserProfile {
  name: string
  primaryGoal: PrimaryGoal
  surfTripDate?: string // YYYY-MM-DD
  boardType: BoardType
  injuryGuardrails: InjuryGuardrail[]
  equipment: EquipmentTier
  isEntitled: boolean // Paywall unlocked
  oceanContext: OceanContext
  surfSubtype: SurfDaySubtype
  durationChip: DurationChip
  activeEquipmentChip: EquipmentTier
  activeProgramId: string
  streakCount: number
  savedOfflineProgramIds: string[]
  completedDaysThisWeek: number[] // 0-6
  checkIns: CheckInRecord[]
  connectedWearables: {
    appleHealth: boolean
    garmin: boolean
    whoop: boolean
  }
}
