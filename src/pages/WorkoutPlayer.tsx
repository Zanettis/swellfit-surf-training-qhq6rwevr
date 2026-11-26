import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RefreshCw,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react'
import { useSwellFit } from '../context/SwellFitContext'
import { Exercise } from '../types/swellfit'
import { getValidSwapsForExercise } from '../data/engine'
import { useToast } from '../hooks/use-toast'

export default function WorkoutPlayer() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { profile, activeSession, recordCheckIn } = useSwellFit()

  // Dynamic session exercises (supports live swaps)
  const [exercises, setExercises] = useState<Exercise[]>(activeSession.exercises)

  // Player state: exercise vs rest
  const [currentExIndex, setCurrentExIndex] = useState(0)
  const [isRestPhase, setIsRestPhase] = useState(false)
  const [isPlaying, setIsPlaying] = useState(true)

  // Accurate timestamp-based timer state
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    return activeSession.exercises[0]?.defaultSeconds || 40
  })

  // Swap exercise bottom sheet state
  const [showSwapSheet, setShowSwapSheet] = useState(false)
  const [swapCandidates, setSwapCandidates] = useState<Exercise[]>([])

  // Exit confirmation modal
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  // Completion check-in modal
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [sessionIntensity, setSessionIntensity] = useState<'Too Easy' | 'Just Right' | 'Brutal'>('Just Right')
  const [jointDiscomfort, setJointDiscomfort] = useState<'none' | 'shoulder' | 'lower-back'>('none')
  const [adaptationMessage, setAdaptationMessage] = useState<string>('')

  // References for accurate timestamp interval tracking
  const currentEx = exercises[currentExIndex] || exercises[0]
  const REST_DURATION = 15 // Standard athletic rest interval

  // Setup swap candidates whenever sheet opens or exercise changes
  const handleOpenSwap = () => {
    if (!currentEx) return
    const swaps = getValidSwapsForExercise(
      currentEx,
      profile.activeEquipmentChip,
      profile.injuryGuardrails
    )
    setSwapCandidates(swaps)
    setShowSwapSheet(true)
  }

  const handleApplySwap = (newEx: Exercise) => {
    setExercises((prev) => {
      const copy = [...prev]
      copy[currentExIndex] = newEx
      return copy
    })
    setSecondsRemaining(newEx.defaultSeconds)
    setShowSwapSheet(false)
    toast({
      title: 'Exercise swapped',
      description: `Swapped to ${newEx.name} with matched joint guardrails.`,
    })
  }

  // Handle phase advance (exercise -> rest -> next exercise)
  const advanceToNext = useCallback(() => {
    if (isRestPhase) {
      // Finished rest, go to next exercise
      setIsRestPhase(false)
      const nextIdx = currentExIndex + 1
      if (nextIdx < exercises.length) {
        setCurrentExIndex(nextIdx)
        setSecondsRemaining(exercises[nextIdx].defaultSeconds)
      } else {
        // All exercises completed!
        setIsPlaying(false)
        setShowCompletionModal(true)
      }
    } else {
      // Finished exercise
      if (currentExIndex + 1 < exercises.length) {
        setIsRestPhase(true)
        setSecondsRemaining(REST_DURATION)
      } else {
        // Last exercise completed!
        setIsPlaying(false)
        setShowCompletionModal(true)
      }
    }
  }, [currentExIndex, exercises, isRestPhase])

  const goToPrevious = () => {
    if (isRestPhase) {
      setIsRestPhase(false)
      setSecondsRemaining(currentEx.defaultSeconds)
    } else if (currentExIndex > 0) {
      const prevIdx = currentExIndex - 1
      setCurrentExIndex(prevIdx)
      setIsRestPhase(false)
      setSecondsRemaining(exercises[prevIdx].defaultSeconds)
    }
  }

  const skipRest = () => {
    if (isRestPhase) {
      advanceToNext()
    }
  }

  // Timestamp-based accurate interval timer
  useEffect(() => {
    if (!isPlaying || showExitConfirm || showCompletionModal) return

    let lastTime = Date.now()
    const interval = setInterval(() => {
      const now = Date.now()
      const delta = (now - lastTime) / 1000

      if (delta >= 1) {
        lastTime = now
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            advanceToNext()
            return 0
          }
          return prev - 1
        })
      }
    }, 200)

    return () => clearInterval(interval)
  }, [isPlaying, showExitConfirm, showCompletionModal, advanceToNext])

  // Overall workout progress calculation
  const totalSteps = exercises.length * 2 - 1
  const completedSteps = currentExIndex * 2 + (isRestPhase ? 1 : 0)
  const overallProgressPercent = Math.min(100, Math.round((completedSteps / totalSteps) * 100))

  // Handle post-workout check-in submission
  const handleSubmitCheckIn = () => {
    let explanation = 'Session load calibrated perfectly.'
    if (jointDiscomfort === 'shoulder') {
      explanation = 'Next session drops load volume 10% and adds targeted thoracic & rotator cuff mobility.'
    } else if (jointDiscomfort === 'lower-back') {
      explanation = 'Next session excludes lumbar torsion and prioritizes anterior core bracing.'
    } else if (sessionIntensity === 'Brutal') {
      explanation = 'Next session pacing eased by 15% with extended recovery intervals.'
    } else if (sessionIntensity === 'Too Easy') {
      explanation = 'Next session volume escalated with progressive eccentric tempos.'
    }

    setAdaptationMessage(explanation)

    recordCheckIn({
      date: new Date().toISOString().split('T')[0],
      workoutId: activeSession.id,
      sessionTitle: activeSession.title,
      intensity: sessionIntensity,
      jointDiscomfort,
      adaptationMessage: explanation,
    })

    toast({
      title: 'Workout logged — streak updated!',
      description: explanation,
    })

    setTimeout(() => {
      navigate('/today')
    }, 800)
  }

  if (!currentEx) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <p className="text-sm text-[#94A3B8]">Loading workout routine...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col justify-between bg-[#0B1117] relative select-none">
      {/* 1. TOP OVERALL PROGRESS BAR */}
      <div className="w-full h-1 bg-[#141C24] relative z-20">
        <div
          className="h-full bg-[#00D1B2] transition-all duration-300 ease-out"
          style={{ width: `${overallProgressPercent}%` }}
        />
      </div>

      {/* 2. TOP MINIMAL CHROME */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2 z-20">
        <button
          type="button"
          onClick={() => setShowExitConfirm(true)}
          aria-label="Exit workout"
          className="w-10 h-10 rounded-xl bg-[#141C24] border border-[#1E293B] flex items-center justify-center text-[#94A3B8] hover:text-[#F8FAFC] active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D1B2]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#94A3B8]">
            {isRestPhase
              ? 'RECOVERY PHASE'
              : `EXERCISE ${currentExIndex + 1} OF ${exercises.length}`}
          </p>
          <p className="text-xs font-semibold text-[#F8FAFC] truncate max-w-[200px]">
            {activeSession.title}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenSwap}
          aria-label="Swap exercise"
          className="w-10 h-10 rounded-xl bg-[#141C24] border border-[#1E293B] flex items-center justify-center text-[#00D1B2] hover:bg-[#00D1B2]/10 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D1B2]"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* 3. EXERCISE STAGE OR REST TIMER STAGE */}
      <div className="flex-1 flex flex-col justify-center px-6 py-2 my-auto">
        {isRestPhase ? (
          /* REST TIMER STAGE WITH LARGE AMBER RING */
          <div className="flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <span className="text-xs font-bold uppercase tracking-widest text-[#F59E0B]">
              Rest & Breathe
            </span>

            {/* Circular Countdown Ring */}
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="88"
                  cy="88"
                  r="78"
                  stroke="#141C24"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="88"
                  cy="88"
                  r="78"
                  stroke="#F59E0B"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 78}
                  strokeDashoffset={
                    (2 * Math.PI * 78) * (1 - secondsRemaining / REST_DURATION)
                  }
                  className="transition-all duration-300 ease-linear"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold font-mono text-[#F8FAFC] tracking-tight">
                  {secondsRemaining}s
                </span>
                <span className="text-xs text-[#94A3B8] mt-1">Deep Diaphragm</span>
              </div>
            </div>

            {/* Next Up Preview */}
            <div className="p-3.5 rounded-2xl bg-[#141C24] border border-[#1E293B] w-full max-w-xs text-left space-y-1">
              <p className="text-[10px] uppercase font-bold tracking-wider text-[#94A3B8]">
                Next Up
              </p>
              <p className="text-sm font-bold text-[#F8FAFC]">
                {exercises[currentExIndex + 1]?.name}
              </p>
              <p className="text-xs text-[#00D1B2]">
                {exercises[currentExIndex + 1]?.repsOrDuration}
              </p>
            </div>

            <button
              type="button"
              onClick={skipRest}
              className="px-5 py-2 rounded-xl bg-[#141C24] border border-[#1E293B] text-xs font-semibold text-[#F8FAFC] hover:text-[#00D1B2] active:scale-95 transition-all"
            >
              Skip Rest
            </button>
          </div>
        ) : (
          /* ACTIVE EXERCISE STAGE */
          <div className="space-y-4">
            {/* Athletic Visual Movement Cue Container (Structured for future video) */}
            <div className="w-full aspect-[16/10] rounded-2xl bg-[#141C24] border border-[#1E293B] relative flex flex-col items-center justify-center overflow-hidden">
              {/* Subtle background pulse rings indicating movement cadence */}
              <div className="absolute w-36 h-36 rounded-full border border-[#00D1B2]/20 animate-ping [animation-duration:3s]" />
              <div className="absolute w-28 h-28 rounded-full border border-[#00D1B2]/30" />

              {/* Movement pattern icon indicator */}
              <div className="w-16 h-16 rounded-2xl bg-[#00D1B2]/15 border border-[#00D1B2]/40 flex items-center justify-center text-[#00D1B2] relative z-10 mb-2">
                <Sparkles className="w-8 h-8" />
              </div>

              <div className="relative z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0B1117]/80 border border-[#1E293B] text-[11px] text-[#00D1B2] font-semibold">
                <span>Pattern: {currentEx.pattern.toUpperCase()}</span>
              </div>
            </div>

            {/* Exercise Name & Reps/Duration */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
                  {currentEx.name}
                </h2>
                <button
                  type="button"
                  onClick={handleOpenSwap}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#00D1B2] hover:underline"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Swap</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-[#00D1B2] font-mono">
                  {currentEx.repsOrDuration}
                </span>
                <span className="text-xs text-[#94A3B8]">
                  ({secondsRemaining}s target pace)
                </span>
              </div>
            </div>

            {/* Surf Transfer Cue Sentence Callout */}
            <div className="p-3.5 rounded-xl bg-[#141C24] border border-[#1E293B] space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#00D1B2] flex items-center gap-1">
                <span>Surf Transfer Cue</span>
              </p>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                "{currentEx.surfTransferCue}"
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 4. LOWER THIRD PLAYER CONTROLS */}
      <div className="px-6 py-5 bg-[#0B1117]/95 border-t border-[#1E293B] z-20">
        <div className="flex items-center justify-around max-w-xs mx-auto">
          {/* Previous Exercise */}
          <button
            type="button"
            onClick={goToPrevious}
            disabled={currentExIndex === 0 && !isRestPhase}
            aria-label="Previous exercise"
            className="w-12 h-12 rounded-2xl bg-[#141C24] border border-[#1E293B] flex items-center justify-center text-[#94A3B8] hover:text-[#F8FAFC] disabled:opacity-30 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D1B2]"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          {/* Primary Play / Pause Toggle */}
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            aria-label={isPlaying ? 'Pause workout' : 'Resume workout'}
            className="w-18 h-18 w-[72px] h-[72px] rounded-3xl bg-[#00D1B2] hover:bg-[#00B39B] active:scale-95 text-[#0B1117] flex items-center justify-center shadow-lg shadow-[#00D1B2]/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D1B2]"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 fill-current" />
            ) : (
              <Play className="w-8 h-8 fill-current translate-x-0.5" />
            )}
          </button>

          {/* Next Exercise */}
          <button
            type="button"
            onClick={advanceToNext}
            aria-label="Next exercise"
            className="w-12 h-12 rounded-2xl bg-[#141C24] border border-[#1E293B] flex items-center justify-center text-[#94A3B8] hover:text-[#F8FAFC] active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D1B2]"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 5. INSTANT "SWAP EXERCISE" BOTTOM SHEET */}
      {showSwapSheet && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center p-0 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#141C24] border-t border-[#1E293B] rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
              <div>
                <h3 className="text-base font-bold text-[#F8FAFC]">
                  Swap {currentEx.name}
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  Joint-friendly & equipment-matched alternatives
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSwapSheet(false)}
                className="w-8 h-8 rounded-lg bg-[#0B1117] flex items-center justify-center text-[#94A3B8] hover:text-[#F8FAFC]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {swapCandidates.map((alt) => (
                <button
                  key={alt.id}
                  type="button"
                  onClick={() => handleApplySwap(alt)}
                  className="w-full p-3.5 rounded-xl bg-[#0B1117] border border-[#1E293B] hover:border-[#00D1B2] text-left transition-all active:scale-[0.98] space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-[#F8FAFC]">
                      {alt.name}
                    </p>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00D1B2]/10 text-[#00D1B2]">
                      {alt.requiredEquipment}
                    </span>
                  </div>
                  <p className="text-xs text-[#94A3B8] leading-tight">
                    {alt.surfTransferCue}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. CONFIRM-ON-EXIT MODAL */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-5">
          <div className="w-full max-w-xs bg-[#141C24] border border-[#1E293B] rounded-2xl p-5 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F8FAFC]">
                Pause or Exit Workout?
              </h3>
              <p className="text-xs text-[#94A3B8] mt-1">
                Your completed progress will not be logged if you exit prematurely.
              </p>
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="w-full py-2.5 rounded-xl bg-[#00D1B2] text-[#0B1117] font-bold text-xs"
              >
                Resume Workout
              </button>
              <button
                type="button"
                onClick={() => navigate('/today')}
                className="w-full py-2.5 rounded-xl bg-[#0B1117] border border-[#1E293B] text-[#F87171] font-semibold text-xs"
              >
                Exit to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. COMPLETION → ADAPTIVE CHECK-IN MODAL */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#141C24] border border-[#1E293B] rounded-3xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#00D1B2]/15 text-[#00D1B2] flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-[#F8FAFC]">
                Session Completed!
              </h3>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Adaptive check-in to calibrate your next session volume
              </p>
            </div>

            {/* Question 1: Session Intensity */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                1. How was the intensity?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Too Easy', 'Just Right', 'Brutal'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSessionIntensity(level)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                      sessionIntensity === level
                        ? 'bg-[#00D1B2] text-[#0B1117]'
                        : 'bg-[#0B1117] border border-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC]'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Question 2: Joint Discomfort */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                2. Any shoulder or lower-back discomfort?
              </label>
              <div className="space-y-1.5">
                {[
                  { id: 'none' as const, label: 'No, joints feel bulletproof' },
                  { id: 'shoulder' as const, label: 'Yes, shoulder / rotator fatigue' },
                  { id: 'lower-back' as const, label: 'Yes, lumbar tightness' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setJointDiscomfort(opt.id)}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-medium text-left border transition-all ${
                      jointDiscomfort === opt.id
                        ? 'bg-[#00D1B2]/15 border-[#00D1B2] text-[#00D1B2] font-semibold'
                        : 'bg-[#0B1117] border-[#1E293B] text-[#94A3B8]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Adaptation */}
            <button
              type="button"
              onClick={handleSubmitCheckIn}
              className="w-full min-h-[48px] py-3 rounded-xl bg-[#00D1B2] hover:bg-[#00B39B] active:scale-[0.98] text-[#0B1117] font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <span>Save & Adapt Next Session</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
