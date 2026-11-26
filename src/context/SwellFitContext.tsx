import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  UserProfile,
  PrimaryGoal,
  BoardType,
  InjuryGuardrail,
  EquipmentTier,
  OceanContext,
  SurfDaySubtype,
  DurationChip,
  WorkoutSession,
  CheckInRecord,
} from '../types/swellfit'
import { deriveWorkoutSession, calculateTripCountdown } from '../data/engine'
import { SWELLFIT_PROGRAMS } from '../data/programs'

const STORAGE_KEY = 'swellfit_v1_store'

const DEFAULT_PROFILE: UserProfile = {
  name: 'Kai Robertson',
  primaryGoal: 'surf-trip-prep',
  surfTripDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  boardType: 'shortboard',
  injuryGuardrails: ['shoulder'],
  equipment: 'home-setup',
  isEntitled: false,
  oceanContext: 'flat',
  surfSubtype: 'pre-surf',
  durationChip: '25',
  activeEquipmentChip: 'home-setup',
  activeProgramId: 'surf-trip-countdown',
  streakCount: 3,
  savedOfflineProgramIds: ['endless-paddle-endurance'],
  completedDaysThisWeek: [0, 2], // Mon, Wed completed
  checkIns: [],
  connectedWearables: {
    appleHealth: false,
    garmin: false,
    whoop: false,
  },
}

interface SwellFitContextType {
  profile: UserProfile
  activeSession: WorkoutSession
  isHydrated: boolean
  updateProfile: (updates: Partial<UserProfile>) => void
  setOceanContext: (ctx: OceanContext) => void
  setSurfSubtype: (sub: SurfDaySubtype) => void
  setDurationChip: (chip: DurationChip) => void
  setEquipmentChip: (equip: EquipmentTier) => void
  toggleOfflineProgram: (programId: string) => boolean
  setActiveProgram: (programId: string) => void
  unlockPaywall: () => void
  lockPaywall: () => void
  recordCheckIn: (checkIn: Omit<CheckInRecord, 'completedAt'>) => void
  resetAllData: () => void
  tripCountdown: ReturnType<typeof calculateTripCountdown>
  shoulderReadinessScore: number
}

const SwellFitContext = createContext<SwellFitContextType | null>(null)

export const SwellFitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE)
  const [isHydrated, setIsHydrated] = useState(false)

  // Hydrate from localStorage on initial load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        setProfile((prev) => ({
          ...prev,
          ...parsed,
          connectedWearables: {
            ...prev.connectedWearables,
            ...(parsed.connectedWearables || {}),
          },
        }))
      }
    } catch {
      // Fallback to default
    } finally {
      setIsHydrated(true)
    }
  }, [])

  // Persist to localStorage whenever profile changes (after hydration)
  useEffect(() => {
    if (!isHydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
    } catch {
      // Storage quota or private browsing guard
    }
  }, [profile, isHydrated])

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates }
      // If equipment changed, sync active chip if needed
      if (updates.equipment && !updates.activeEquipmentChip) {
        next.activeEquipmentChip = updates.equipment
      }
      return next
    })
  }

  const setOceanContext = (ctx: OceanContext) => {
    setProfile((prev) => ({ ...prev, oceanContext: ctx }))
  }

  const setSurfSubtype = (sub: SurfDaySubtype) => {
    setProfile((prev) => ({ ...prev, surfSubtype: sub }))
  }

  const setDurationChip = (chip: DurationChip) => {
    setProfile((prev) => ({ ...prev, durationChip: chip }))
  }

  const setEquipmentChip = (equip: EquipmentTier) => {
    setProfile((prev) => ({ ...prev, activeEquipmentChip: equip }))
  }

  const toggleOfflineProgram = (programId: string): boolean => {
    let nowOffline = false
    setProfile((prev) => {
      const exists = prev.savedOfflineProgramIds.includes(programId)
      nowOffline = !exists
      const updated = exists
        ? prev.savedOfflineProgramIds.filter((id) => id !== programId)
        : [...prev.savedOfflineProgramIds, programId]
      return { ...prev, savedOfflineProgramIds: updated }
    })
    return nowOffline
  }

  const setActiveProgram = (programId: string) => {
    setProfile((prev) => ({ ...prev, activeProgramId: programId }))
  }

  const unlockPaywall = () => {
    setProfile((prev) => ({ ...prev, isEntitled: true }))
  }

  const lockPaywall = () => {
    setProfile((prev) => ({ ...prev, isEntitled: false }))
  }

  const recordCheckIn = (checkIn: Omit<CheckInRecord, 'completedAt'>) => {
    setProfile((prev) => {
      const todayIndex = (new Date().getDay() + 6) % 7 // Mon = 0, Sun = 6
      const completedDays = Array.from(new Set([...prev.completedDaysThisWeek, todayIndex]))
      const fullRecord: CheckInRecord = {
        ...checkIn,
        completedAt: Date.now(),
      }
      return {
        ...prev,
        completedDaysThisWeek: completedDays,
        streakCount: prev.streakCount + 1,
        checkIns: [fullRecord, ...prev.checkIns],
      }
    })
  }

  const resetAllData = () => {
    localStorage.removeItem(STORAGE_KEY)
    setProfile(DEFAULT_PROFILE)
  }

  // Live computed session based on all current filters
  const activeSession = deriveWorkoutSession({
    goal: profile.primaryGoal,
    boardType: profile.boardType,
    injuryGuardrails: profile.injuryGuardrails,
    equipment: profile.activeEquipmentChip,
    oceanContext: profile.oceanContext,
    surfSubtype: profile.surfSubtype,
    durationChip: profile.durationChip,
  })

  // Live computed countdown
  const tripCountdown = calculateTripCountdown(profile.surfTripDate)

  // Derived shoulder readiness score (0-100)
  const baseReadiness = profile.injuryGuardrails.includes('shoulder') ? 78 : 92
  const recentDiscomfort = profile.checkIns[0]?.jointDiscomfort === 'shoulder' ? -12 : 0
  const shoulderReadinessScore = Math.max(50, Math.min(100, baseReadiness + recentDiscomfort))

  return (
    <SwellFitContext.Provider
      value={{
        profile,
        activeSession,
        isHydrated,
        updateProfile,
        setOceanContext,
        setSurfSubtype,
        setDurationChip,
        setEquipmentChip,
        toggleOfflineProgram,
        setActiveProgram,
        unlockPaywall,
        lockPaywall,
        recordCheckIn,
        resetAllData,
        tripCountdown,
        shoulderReadinessScore,
      }}
    >
      {children}
    </SwellFitContext.Provider>
  )
}

export const useSwellFit = () => {
  const context = useContext(SwellFitContext)
  if (!context) {
    throw new Error('useSwellFit must be used within a SwellFitProvider')
  }
  return context
}
