import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Check,
  ChevronLeft,
  Calendar,
  Sparkles,
  Shield,
  Layers,
  ArrowRight,
  Bell,
  Waves,
  Zap,
} from 'lucide-react'
import { useSwellFit } from '../context/SwellFitContext'
import {
  PrimaryGoal,
  BoardType,
  InjuryGuardrail,
  EquipmentTier,
} from '../types/swellfit'
import { deriveWeek1Schedule } from '../data/engine'
import { useToast } from '../hooks/use-toast'

export default function Onboarding() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { profile, updateProfile, unlockPaywall } = useSwellFit()

  // 1 to 6 steps
  const [step, setStep] = useState<number>(1)

  // Step 1: Goal
  const [goal, setGoal] = useState<PrimaryGoal>(profile.primaryGoal)
  const [tripDate, setTripDate] = useState<string>(
    profile.surfTripDate ||
      new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )

  // Step 2: Board Type
  const [boardType, setBoardType] = useState<BoardType>(profile.boardType)

  // Step 3: Injury Guardrails (multi-select)
  const [guardrails, setGuardrails] = useState<InjuryGuardrail[]>(
    profile.injuryGuardrails.length ? profile.injuryGuardrails : ['none']
  )

  // Step 4: Equipment Tier
  const [equipment, setEquipment] = useState<EquipmentTier>(profile.equipment)

  // Step 6: Paywall state
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual')
  const [remindMe, setRemindMe] = useState<boolean>(true)

  // Handle Guardrails selection logic: 'none' is mutually exclusive
  const toggleGuardrail = (g: InjuryGuardrail) => {
    if (g === 'none') {
      setGuardrails(['none'])
    } else {
      setGuardrails((prev) => {
        const withoutNone = prev.filter((item) => item !== 'none')
        if (withoutNone.includes(g)) {
          const filtered = withoutNone.filter((item) => item !== g)
          return filtered.length === 0 ? ['none'] : filtered
        } else {
          return [...withoutNone, g]
        }
      })
    }
  }

  // Compute snap plan duration based on departure date
  const computeTripSnapWeeks = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now()
    const days = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)))
    if (days <= 21) return 2
    if (days <= 42) return 4
    return 6
  }

  const snappedWeeks = computeTripSnapWeeks(tripDate)

  // Step navigation
  const nextStep = () => {
    // Save state on step forward
    updateProfile({
      primaryGoal: goal,
      surfTripDate: goal === 'surf-trip-prep' ? tripDate : undefined,
      boardType,
      injuryGuardrails: guardrails,
      equipment,
      activeEquipmentChip: equipment,
    })
    setStep((s) => Math.min(6, s + 1))
  }

  const prevStep = () => {
    if (step === 1) {
      navigate('/')
    } else {
      setStep((s) => s - 1)
    }
  }

  // Derive Week 1 schedule preview dynamically using filter engine
  const week1Schedule = deriveWeek1Schedule({
    goal,
    boardType,
    injuryGuardrails: guardrails,
    equipment,
  })

  // Final Paywall submit
  const handleStartTrial = () => {
    updateProfile({
      primaryGoal: goal,
      surfTripDate: goal === 'surf-trip-prep' ? tripDate : undefined,
      boardType,
      injuryGuardrails: guardrails,
      equipment,
      activeEquipmentChip: equipment,
    })
    unlockPaywall()
    toast({
      title: 'Trial started — your plan is live.',
      description: 'Adaptive sports-science programming configured.',
    })
    navigate('/today')
  }

  return (
    <div className="flex-1 flex flex-col justify-between px-5 py-6 bg-[#0B1117] relative select-none">
      {/* Top Header & Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={prevStep}
            aria-label="Back to previous step"
            className="w-10 h-10 rounded-xl bg-[#141C24] border border-[#1E293B] flex items-center justify-center text-[#94A3B8] hover:text-[#F8FAFC] active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D1B2]"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
            Step {step} of 6
          </span>

          <div className="w-10" />
        </div>

        {/* Animated teal progress bar */}
        <div className="w-full h-1.5 bg-[#141C24] rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-[#00D1B2] rounded-full transition-all duration-300 ease-out"
            style={{ width: `${(step / 6) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Step Content Area */}
      <div className="flex-1 flex flex-col justify-center my-auto transition-opacity duration-200">
        {/* STEP 1: PRIMARY GOAL */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
                What is your primary surfing goal?
              </h2>
              <p className="text-sm text-[#94A3B8] mt-1">
                We calibrate exercise loading, stroke biomechanics, and progression cadence.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {[
                {
                  id: 'surf-trip-prep' as PrimaryGoal,
                  title: 'Surf Trip Prep',
                  desc: 'Periodized countdown block targeting peak endurance for your flight date.',
                },
                {
                  id: 'paddle-endurance' as PrimaryGoal,
                  title: 'Paddle Endurance & Wave Count',
                  desc: 'High-elbow stamina, lat capacity, and back posture to stay out longer.',
                },
                {
                  id: 'shoulder-longevity' as PrimaryGoal,
                  title: 'Shoulder & Lower Back Longevity (Prehab)',
                  desc: 'Rotator cuff stabilization, thoracic extension, and facet decompression.',
                },
                {
                  id: 'popup-mobility' as PrimaryGoal,
                  title: 'Pop-Up Explosiveness & Hip Mobility',
                  desc: 'Sub-0.4s hip snap-under, ankle clearance, and deep rail compression.',
                },
              ].map((item) => {
                const isSelected = goal === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setGoal(item.id)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D1B2] flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#00D1B2]/10 border-[#00D1B2] shadow-sm'
                        : 'bg-[#141C24] border-[#1E293B] hover:border-[#94A3B8]/30'
                    }`}
                  >
                    <div>
                      <p className="text-base font-semibold text-[#F8FAFC]">
                        {item.title}
                      </p>
                      <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isSelected
                          ? 'border-[#00D1B2] bg-[#00D1B2] text-[#0B1117]'
                          : 'border-[#1E293B] bg-[#0B1117]'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Conditional reveal: Surf Trip departure date */}
            {goal === 'surf-trip-prep' && (
              <div className="p-4 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center gap-2 mb-2 text-[#F59E0B]">
                  <Calendar className="w-4 h-4" />
                  <label htmlFor="trip-date-input" className="text-xs font-semibold uppercase tracking-wider">
                    Departure Date Picker
                  </label>
                </div>
                <input
                  id="trip-date-input"
                  type="date"
                  value={tripDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setTripDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0B1117] border border-[#1E293B] text-[#F8FAFC] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
                />
                <p className="text-xs text-[#94A3B8] mt-2">
                  Plan automatically snaps to a <span className="text-[#F59E0B] font-semibold">{snappedWeeks}-Week</span> periodized block based on your departure date.
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: BOARD TYPE */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
                What board do you surf most?
              </h2>
              <p className="text-sm text-[#94A3B8] mt-1">
                Board volume dictates wave-entry mechanics, pop-up speed, and paddle drag.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {[
                {
                  id: 'shortboard' as BoardType,
                  name: 'Shortboard',
                  focus: 'Prioritizes pop-up explosiveness and duck-dive power',
                  detail: 'Fast-twitch hip flexion, tight rail compression, and submerged board control.',
                },
                {
                  id: 'midlength' as BoardType,
                  name: 'Midlength / Twin-Fin',
                  focus: 'Balanced paddle volume with pop-up speed work',
                  detail: 'Flow-state shoulder endurance with smooth rail-to-rail rotational transitions.',
                },
                {
                  id: 'longboard' as BoardType,
                  name: 'Longboard',
                  focus: 'Hip mobility and paddle tolerance over explosive power',
                  detail: 'Upright posture tolerance, cross-step balance, and continuous paddle pacing.',
                },
              ].map((item) => {
                const isSelected = boardType === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setBoardType(item.id)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D1B2] flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#00D1B2]/10 border-[#00D1B2] shadow-sm'
                        : 'bg-[#141C24] border-[#1E293B] hover:border-[#94A3B8]/30'
                    }`}
                  >
                    <div>
                      <p className="text-base font-semibold text-[#F8FAFC]">
                        {item.name}
                      </p>
                      <p className="text-xs text-[#00D1B2] font-medium mt-1">
                        {item.focus}
                      </p>
                      <p className="text-xs text-[#94A3B8] mt-1">
                        {item.detail}
                      </p>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isSelected
                          ? 'border-[#00D1B2] bg-[#00D1B2] text-[#0B1117]'
                          : 'border-[#1E293B] bg-[#0B1117]'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* STEP 3: INJURY GUARDRAILS */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
                Joint & Injury Guardrails
              </h2>
              <p className="text-sm text-[#94A3B8] mt-1">
                Select any areas needing prehab or load protection. (Multi-select)
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {[
                {
                  id: 'shoulder' as InjuryGuardrail,
                  name: 'Shoulder / Rotator Cuff',
                  desc: 'Excludes heavy overhead pressing; prioritizes external rotation & thoracic extension.',
                },
                {
                  id: 'lower-back' as InjuryGuardrail,
                  name: 'Lower Back',
                  desc: 'Excludes high lumbar shear loads; favors anterior core bracing & decompression.',
                },
                {
                  id: 'neck-thoracic' as InjuryGuardrail,
                  name: 'Neck / Thoracic',
                  desc: 'Reinforces mid-back endurance so traps do not seize during prolonged paddling.',
                },
                {
                  id: 'knee' as InjuryGuardrail,
                  name: 'Knee',
                  desc: 'Swaps extreme rotational squats for supported split-squat stance mechanics.',
                },
                {
                  id: 'none' as InjuryGuardrail,
                  name: 'No Current Issues',
                  desc: 'Full athletic load capacity across all kinetic chains.',
                },
              ].map((item) => {
                const isSelected = guardrails.includes(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleGuardrail(item.id)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D1B2] flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#00D1B2]/10 border-[#00D1B2] shadow-sm'
                        : 'bg-[#141C24] border-[#1E293B] hover:border-[#94A3B8]/30'
                    }`}
                  >
                    <div>
                      <p className="text-base font-semibold text-[#F8FAFC]">
                        {item.name}
                      </p>
                      <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isSelected
                          ? 'border-[#00D1B2] bg-[#00D1B2] text-[#0B1117]'
                          : 'border-[#1E293B] bg-[#0B1117]'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* STEP 4: EQUIPMENT */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
                What equipment do you have access to?
              </h2>
              <p className="text-sm text-[#94A3B8] mt-1">
                Higher tiers include all lower tier movements.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {[
                {
                  id: 'bodyweight' as EquipmentTier,
                  name: 'Bodyweight Only (Apartment / Travel)',
                  desc: 'Zero equipment needed. Ideal for hotel rooms, van life, or remote beaches.',
                },
                {
                  id: 'bands' as EquipmentTier,
                  name: 'Resistance Bands',
                  desc: 'Loop bands and handles for rotator cuff prehab and high-elbow paddle pulling.',
                },
                {
                  id: 'home-setup' as EquipmentTier,
                  name: 'Home Setup (Kettlebell / TRX)',
                  desc: 'Kettlebells, suspension straps, bands, and floor space for ballistic power.',
                },
                {
                  id: 'gym' as EquipmentTier,
                  name: 'Full Gym',
                  desc: 'Barbells, cables, dumbbells, pull-up stations, and specialized turf.',
                },
              ].map((item) => {
                const isSelected = equipment === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setEquipment(item.id)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D1B2] flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#00D1B2]/10 border-[#00D1B2] shadow-sm'
                        : 'bg-[#141C24] border-[#1E293B] hover:border-[#94A3B8]/30'
                    }`}
                  >
                    <div>
                      <p className="text-base font-semibold text-[#F8FAFC]">
                        {item.name}
                      </p>
                      <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isSelected
                          ? 'border-[#00D1B2] bg-[#00D1B2] text-[#0B1117]'
                          : 'border-[#1E293B] bg-[#0B1117]'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* STEP 5: PERSONALIZED WEEK 1 PREVIEW */}
        {step === 5 && (
          <div className="space-y-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00D1B2]/15 text-[#00D1B2] text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Derived from Sports-Science Engine</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
                Your Week 1 Surf-Ready Plan
              </h2>
            </div>

            {/* Derived Callout Card */}
            <div className="p-4 rounded-2xl bg-[#141C24] border border-[#00D1B2]/30 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-[#F8FAFC]">
                  {goal === 'surf-trip-prep'
                    ? `Your Surf Trip Prep Block — ${snappedWeeks} Weeks`
                    : 'Personalized Periodized Schedule'}
                </p>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#00D1B2]/10 text-[#00D1B2] font-medium">
                  {equipment}
                </span>
              </div>

              {guardrails.includes('shoulder') && (
                <div className="flex items-start gap-2 text-xs text-[#94A3B8]">
                  <Shield className="w-3.5 h-3.5 text-[#00D1B2] shrink-0 mt-0.5" />
                  <span>
                    Heavy overhead pressing excluded; external rotation & thoracic extension prioritized.
                  </span>
                </div>
              )}

              {guardrails.includes('lower-back') && (
                <div className="flex items-start gap-2 text-xs text-[#94A3B8]">
                  <Shield className="w-3.5 h-3.5 text-[#00D1B2] shrink-0 mt-0.5" />
                  <span>
                    Lumbar shear loads eliminated; anterior core and gentle spinal decompression added.
                  </span>
                </div>
              )}

              {guardrails.includes('knee') && (
                <div className="flex items-start gap-2 text-xs text-[#94A3B8]">
                  <Shield className="w-3.5 h-3.5 text-[#00D1B2] shrink-0 mt-0.5" />
                  <span>
                    High-angle knee torque replaced with supported split-stance stability drills.
                  </span>
                </div>
              )}

              {equipment === 'home-setup' && (
                <div className="flex items-start gap-2 text-xs text-[#94A3B8]">
                  <Layers className="w-3.5 h-3.5 text-[#00D1B2] shrink-0 mt-0.5" />
                  <span>
                    Kettlebell hinge power and suspension rows integrated based on your Home Setup.
                  </span>
                </div>
              )}
            </div>

            {/* 7-Day Week List */}
            <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
              {week1Schedule.map((day) => (
                <div
                  key={day.dayLabel}
                  className="p-3 rounded-xl bg-[#141C24] border border-[#1E293B] flex items-center justify-between gap-3 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-lg bg-[#0B1117] border border-[#1E293B] flex items-center justify-center text-xs font-bold text-[#F8FAFC]">
                      {day.dayLabel}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-[#F8FAFC]">
                        {day.title}
                      </p>
                      <p className="text-[11px] text-[#94A3B8]">
                        {day.isRest ? 'Active Recovery / Ocean Float' : `${day.exercises.length} calibrated surf drills`}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-medium text-[#00D1B2] bg-[#00D1B2]/10 px-2 py-1 rounded-md shrink-0">
                    {day.durationMinutes} min
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 6: HARD PAYWALL (Runna/Fitbod style) */}
        {step === 6 && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#00D1B2]/15 border border-[#00D1B2]/30 flex items-center justify-center text-[#00D1B2] mx-auto mb-3">
                <Waves className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
                Unlock Your Complete Plan
              </h2>
              <p className="text-xs text-[#94A3B8] mt-1 max-w-xs mx-auto">
                7 days free. Cancel anytime in 1 tap from your profile with zero friction.
              </p>
            </div>

            {/* Plan Cards */}
            <div className="space-y-3 pt-1">
              {/* Annual Plan (Pre-selected) */}
              <button
                type="button"
                onClick={() => setSelectedPlan('annual')}
                className={`w-full p-4 rounded-2xl border text-left relative transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D1B2] ${
                  selectedPlan === 'annual'
                    ? 'bg-[#00D1B2]/10 border-[#00D1B2] shadow-md'
                    : 'bg-[#141C24] border-[#1E293B]'
                }`}
              >
                {/* Amber Badge */}
                <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-[#F59E0B] text-[#0B1117] text-[10px] font-bold uppercase tracking-wide">
                  BEST VALUE — SAVE 58%
                </span>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#00D1B2]">
                      Annual Membership
                    </p>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-2xl font-bold font-mono text-[#F8FAFC]">
                        $8.33
                      </span>
                      <span className="text-xs text-[#94A3B8]">/ month</span>
                    </div>
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                      Billed annually at $99.99/year after 7-day trial
                    </p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${
                      selectedPlan === 'annual'
                        ? 'border-[#00D1B2] bg-[#00D1B2] text-[#0B1117]'
                        : 'border-[#1E293B] bg-[#0B1117]'
                    }`}
                  >
                    {selectedPlan === 'annual' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </button>

              {/* Monthly Plan (De-emphasized) */}
              <button
                type="button"
                onClick={() => setSelectedPlan('monthly')}
                className={`w-full p-3.5 rounded-2xl border text-left transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D1B2] ${
                  selectedPlan === 'monthly'
                    ? 'bg-[#00D1B2]/10 border-[#00D1B2]'
                    : 'bg-[#141C24]/60 border-[#1E293B] opacity-80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#F8FAFC]">
                      Monthly Flex Plan
                    </p>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-lg font-bold font-mono text-[#F8FAFC]">
                        $19.99
                      </span>
                      <span className="text-xs text-[#94A3B8]">/ month</span>
                    </div>
                    <p className="text-[11px] text-[#94A3B8]">
                      Standard monthly billing, cancel anytime
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      selectedPlan === 'monthly'
                        ? 'border-[#00D1B2] bg-[#00D1B2] text-[#0B1117]'
                        : 'border-[#1E293B] bg-[#0B1117]'
                    }`}
                  >
                    {selectedPlan === 'monthly' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              </button>
            </div>

            {/* Trial Reminder Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#141C24] border border-[#1E293B]">
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-[#F59E0B]" />
                <label htmlFor="remind-toggle" className="text-xs font-medium text-[#F8FAFC] cursor-pointer">
                  Remind me 2 days before my trial ends
                </label>
              </div>
              <input
                id="remind-toggle"
                type="checkbox"
                checked={remindMe}
                onChange={(e) => setRemindMe(e.target.checked)}
                className="w-4 h-4 rounded text-[#00D1B2] focus:ring-[#00D1B2] bg-[#0B1117] border-[#1E293B]"
              />
            </div>

            {/* Fine print */}
            <p className="text-[11px] text-center text-[#94A3B8]/70">
              No immediate charge. 7 days free trial. 1-Click cancellation inside Profile at any time.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Sticky CTA Row */}
      <div className="pt-4">
        {step < 5 && (
          <button
            type="button"
            onClick={nextStep}
            className="w-full min-h-[50px] py-3.5 px-6 rounded-xl bg-[#00D1B2] hover:bg-[#00B39B] active:scale-[0.98] text-[#0B1117] font-semibold text-base flex items-center justify-center gap-2 transition-all shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D1B2]"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        )}

        {step === 5 && (
          <button
            type="button"
            onClick={nextStep}
            className="w-full min-h-[50px] py-3.5 px-6 rounded-xl bg-[#00D1B2] hover:bg-[#00B39B] active:scale-[0.98] text-[#0B1117] font-semibold text-base flex items-center justify-center gap-2 transition-all shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D1B2]"
          >
            <span>Continue to Activation</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        )}

        {step === 6 && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleStartTrial}
              className="w-full min-h-[52px] py-3.5 px-6 rounded-xl bg-[#00D1B2] hover:bg-[#00B39B] active:scale-[0.98] text-[#0B1117] font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#00D1B2]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D1B2]"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Start 7-Day Free Trial</span>
            </button>
            <p className="text-[10px] text-center text-[#94A3B8]/60">
              Restore purchase · Terms of Service · Privacy Policy
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
