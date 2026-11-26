import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Compass,
  Flame,
  Shield,
  ChevronDown,
  ChevronUp,
  Play,
  Calendar,
  Clock,
  Sparkles,
  Waves,
  Sun,
  Activity,
} from 'lucide-react'
import { useSwellFit } from '../context/SwellFitContext'
import { OceanContext, SurfDaySubtype, DurationChip, EquipmentTier } from '../types/swellfit'

export default function Today() {
  const navigate = useNavigate()
  const {
    profile,
    activeSession,
    tripCountdown,
    shoulderReadinessScore,
    setOceanContext,
    setSurfSubtype,
    setDurationChip,
    setEquipmentChip,
  } = useSwellFit()

  const [expandedPreview, setExpandedPreview] = useState(false)

  const isTripGoal = profile.primaryGoal === 'surf-trip-prep'

  const weekDayLetters = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const todayDayIndex = (new Date().getDay() + 6) % 7 // Mon = 0, Sun = 6

  return (
    <div className="flex-1 flex flex-col px-5 pt-5 pb-8 space-y-4">
      {/* 1. TOP STATUS BANNER */}
      {isTripGoal ? (
        <div className="p-4 rounded-2xl bg-[#141C24] border border-[#F59E0B]/30 relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#F59E0B]">
              <Calendar className="w-3.5 h-3.5" />
              <span>Surf Trip Countdown</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] font-semibold">
              {tripCountdown.weeksRemaining} wks left
            </span>
          </div>

          <div className="flex items-baseline gap-2 my-1">
            <span className="text-4xl font-bold font-mono text-[#F8FAFC] tracking-tight">
              {tripCountdown.daysRemaining}
            </span>
            <span className="text-sm font-medium text-[#94A3B8]">Days to Surf Trip</span>
          </div>

          <p className="text-xs font-semibold text-[#F59E0B] mb-2.5">{tripCountdown.phaseName}</p>

          {/* Amber Progress Bar */}
          <div className="w-full h-1.5 bg-[#0B1117] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#F59E0B] rounded-full transition-all duration-300"
              style={{ width: `${tripCountdown.progressPercent}%` }}
            />
          </div>
        </div>
      ) : (
        /* Streak + Shoulder Readiness Banner */
        <div className="grid grid-cols-2 gap-3">
          {/* Weekly Streak Card */}
          <div className="p-3.5 rounded-2xl bg-[#141C24] border border-[#1E293B] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B] shrink-0">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                Week Streak
              </p>
              <p className="text-xl font-bold font-mono text-[#F8FAFC]">
                {profile.streakCount}{' '}
                <span className="text-xs font-normal text-[#94A3B8]">sessions</span>
              </p>
            </div>
          </div>

          {/* Shoulder Readiness Score Card */}
          <div className="p-3.5 rounded-2xl bg-[#141C24] border border-[#1E293B] flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-[#00D1B2]/15 border border-[#00D1B2]/30 flex items-center justify-center text-[#00D1B2] shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                Shoulder Status
              </p>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold font-mono text-[#F8FAFC]">
                  {shoulderReadinessScore}
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    shoulderReadinessScore >= 80
                      ? 'bg-[#00D1B2]/15 text-[#00D1B2]'
                      : 'bg-[#F59E0B]/15 text-[#F59E0B]'
                  }`}
                >
                  {shoulderReadinessScore >= 80 ? 'READY' : 'GUARDED'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. OCEAN CONTEXT SWITCHER (Core Differentiator) */}
      <div className="space-y-2">
        <div className="p-1 rounded-2xl bg-[#141C24] border border-[#1E293B] grid grid-cols-2 gap-1 relative">
          <button
            type="button"
            onClick={() => setOceanContext('flat')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D1B2] ${
              profile.oceanContext === 'flat'
                ? 'bg-[#00D1B2] text-[#0B1117] shadow-sm'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Flat Day (Full Training)</span>
          </button>

          <button
            type="button"
            onClick={() => setOceanContext('surf')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] ${
              profile.oceanContext === 'surf'
                ? 'bg-[#F59E0B] text-[#0B1117] shadow-sm'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <Waves className="w-4 h-4" />
            <span>Surf Day (Active Recovery)</span>
          </button>
        </div>

        {/* Surf Day Sub-toggle (Pre / Post Surf) */}
        {profile.oceanContext === 'surf' && (
          <div className="p-2.5 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/25 flex items-center justify-between animate-in fade-in duration-200">
            <span className="text-xs font-medium text-[#F59E0B]">Routine Timing:</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setSurfSubtype('pre-surf')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  profile.surfSubtype === 'pre-surf'
                    ? 'bg-[#F59E0B] text-[#0B1117]'
                    : 'bg-[#141C24] text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                Pre-Surf Activation
              </button>
              <button
                type="button"
                onClick={() => setSurfSubtype('post-surf')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  profile.surfSubtype === 'post-surf'
                    ? 'bg-[#F59E0B] text-[#0B1117]'
                    : 'bg-[#141C24] text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                Post-Surf Recovery
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. "ADAPT TODAY'S SESSION" BAR */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#00D1B2]" />
            Adapt Today's Session
          </span>
          <span className="text-[11px] text-[#94A3B8]">Instant re-derivation</span>
        </div>

        {/* Duration Chips */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#94A3B8] w-14 shrink-0">Time:</span>
          <div className="flex gap-2">
            {[
              { id: '10' as DurationChip, label: '10 min (Express)' },
              { id: '25' as DurationChip, label: '25 min (Full)' },
            ].map((chip) => {
              const active = profile.durationChip === chip.id
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setDurationChip(chip.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D1B2] ${
                    active
                      ? 'bg-[#00D1B2] text-[#0B1117] shadow-sm'
                      : 'bg-[#141C24] text-[#94A3B8] border border-[#1E293B] hover:text-[#F8FAFC]'
                  }`}
                >
                  {chip.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Equipment Chips */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#94A3B8] w-14 shrink-0">Gear:</span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'bodyweight' as EquipmentTier, label: 'Bodyweight' },
              { id: 'bands' as EquipmentTier, label: 'Bands' },
              { id: 'home-setup' as EquipmentTier, label: 'Kettlebell/TRX' },
              { id: 'gym' as EquipmentTier, label: 'Gym' },
            ].map((chip) => {
              const active = profile.activeEquipmentChip === chip.id
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setEquipmentChip(chip.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D1B2] ${
                    active
                      ? 'bg-[#00D1B2]/20 border border-[#00D1B2] text-[#00D1B2] font-semibold'
                      : 'bg-[#141C24] text-[#94A3B8] border border-[#1E293B] hover:text-[#F8FAFC]'
                  }`}
                >
                  {chip.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 4. TODAY'S WORKOUT CARD */}
      <div className="p-4 rounded-2xl bg-[#141C24] border border-[#1E293B] space-y-3.5 relative overflow-hidden shadow-lg">
        <div>
          <div className="flex items-center justify-between text-xs text-[#94A3B8] mb-1">
            <span className="font-semibold uppercase tracking-wider text-[#00D1B2]">
              {profile.oceanContext === 'surf' ? 'Active Recovery' : 'Calibrated Session'}
            </span>
            <div className="flex items-center gap-1 font-mono text-[#F8FAFC]">
              <Clock className="w-3.5 h-3.5 text-[#00D1B2]" />
              <span>{activeSession.durationMinutes} min</span>
              <span className="mx-1">·</span>
              <span>{activeSession.exercises.length} moves</span>
            </div>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-[#F8FAFC]">{activeSession.title}</h2>
        </div>

        {/* Surf Benefit Tag Pills */}
        <div className="flex flex-wrap gap-1.5">
          {activeSession.tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#00D1B2]/10 border border-[#00D1B2]/25 text-[#00D1B2]"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Expandable Exercise Preview */}
        <div className="border-t border-[#1E293B] pt-2">
          <button
            type="button"
            onClick={() => setExpandedPreview((v) => !v)}
            className="w-full flex items-center justify-between text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D1B2] rounded"
          >
            <span>Preview Exercises ({activeSession.exercises.length})</span>
            {expandedPreview ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {expandedPreview && (
            <div className="space-y-2 pt-2 animate-in fade-in duration-150">
              {activeSession.exercises.map((ex, idx) => (
                <div
                  key={ex.id}
                  className="p-2.5 rounded-xl bg-[#0B1117] border border-[#1E293B] flex items-start justify-between gap-2"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-[#141C24] border border-[#1E293B] flex items-center justify-center text-[10px] font-mono text-[#00D1B2] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-[#F8FAFC]">{ex.name}</p>
                      <p className="text-[11px] text-[#94A3B8]">{ex.repsOrDuration}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-[#94A3B8] bg-[#141C24] px-1.5 py-0.5 rounded shrink-0">
                    {ex.defaultSeconds}s
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Start Workout Button */}
        <button
          type="button"
          onClick={() => navigate('/workout')}
          className="w-full min-h-[50px] py-3 px-4 rounded-xl bg-[#00D1B2] hover:bg-[#00B39B] active:scale-[0.98] text-[#0B1117] font-bold text-base flex items-center justify-center gap-2 transition-all shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D1B2]"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Start Workout</span>
        </button>

        {profile.oceanContext === 'surf' && (
          <p className="text-[11px] text-center text-[#F59E0B] font-medium pt-0.5">
            Active recovery — protects your streak.
          </p>
        )}
      </div>

      {/* 5. THIS WEEK STRIP & ADAPTIVE EXPLANATION */}
      <div className="p-4 rounded-2xl bg-[#141C24] border border-[#1E293B] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
            This Week's Plan
          </span>
          <span className="text-xs font-mono text-[#00D1B2]">
            {profile.completedDaysThisWeek.length}/7 Completed
          </span>
        </div>

        {/* 7-Day Dot Strip */}
        <div className="flex items-center justify-between pt-1">
          {weekDayLetters.map((letter, idx) => {
            const isCompleted = profile.completedDaysThisWeek.includes(idx)
            const isToday = idx === todayDayIndex
            return (
              <div key={idx} className="flex flex-col items-center gap-1.5">
                <span
                  className={`text-[10px] font-bold ${isToday ? 'text-[#00D1B2]' : 'text-[#94A3B8]'}`}
                >
                  {letter}
                </span>
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono transition-all ${
                    isCompleted
                      ? 'bg-[#00D1B2] text-[#0B1117] font-bold'
                      : isToday
                        ? 'border-2 border-[#00D1B2] bg-[#0B1117] text-[#00D1B2] font-bold'
                        : 'bg-[#0B1117] border border-[#1E293B] text-[#94A3B8]'
                  }`}
                >
                  {isCompleted ? '✓' : idx + 1}
                </div>
              </div>
            )
          })}
        </div>

        {/* Single Info Sentence Explaining Today's Adaptive Logic */}
        <div className="pt-2 border-t border-[#1E293B] flex items-start gap-2">
          <Shield className="w-3.5 h-3.5 text-[#00D1B2] shrink-0 mt-0.5" />
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            {activeSession.adaptiveExplanation}
          </p>
        </div>
      </div>
    </div>
  )
}
