import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  Check,
  Download,
  Calendar,
  Layers,
  Shield,
  Zap,
  Clock,
  Sparkles,
} from 'lucide-react'
import { useSwellFit } from '../context/SwellFitContext'
import { SWELLFIT_PROGRAMS } from '../data/programs'
import { useToast } from '../hooks/use-toast'

export default function ProgramDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { profile, setActiveProgram, toggleOfflineProgram } = useSwellFit()

  const program = SWELLFIT_PROGRAMS.find((p) => p.id === id) || SWELLFIT_PROGRAMS[0]
  const isActive = profile.activeProgramId === program.id
  const isSavedOffline = profile.savedOfflineProgramIds.includes(program.id)

  const handleSetAsActive = () => {
    setActiveProgram(program.id)
    toast({
      title: 'Active Program Updated',
      description: `${program.name} is now feeding your Today dashboard.`,
    })
  }

  const handleToggleOffline = () => {
    const nowSaved = toggleOfflineProgram(program.id)
    toast({
      title: nowSaved
        ? 'Saved for offline — ready for your trip.'
        : 'Removed from offline storage.',
    })
  }

  return (
    <div className="flex-1 flex flex-col px-5 pt-4 pb-8 space-y-4">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/programs')}
          aria-label="Back to programs"
          className="w-10 h-10 rounded-xl bg-[#141C24] border border-[#1E293B] flex items-center justify-center text-[#94A3B8] hover:text-[#F8FAFC] active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D1B2]"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
          Program Curriculum
        </span>

        <button
          type="button"
          onClick={handleToggleOffline}
          aria-label="Save for trip mode offline"
          className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
            isSavedOffline
              ? 'bg-[#00D1B2]/20 border-[#00D1B2] text-[#00D1B2]'
              : 'bg-[#141C24] border-[#1E293B] text-[#94A3B8]'
          }`}
        >
          {isSavedOffline ? <Check className="w-5 h-5" /> : <Download className="w-5 h-5" />}
        </button>
      </div>

      {/* Program Hero Header */}
      <div className="p-4 rounded-2xl bg-[#141C24] border border-[#1E293B] space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-[#00D1B2]">
            {program.durationWeeks} WEEKS
          </span>
          <span className="text-xs text-[#94A3B8]">·</span>
          <span className="text-xs font-medium text-[#94A3B8]">
            {program.phases.length} Progressive Blocks
          </span>
        </div>

        <h1 className="text-xl font-bold tracking-tight text-[#F8FAFC]">{program.name}</h1>

        <p className="text-xs text-[#94A3B8] leading-relaxed">{program.focus}</p>

        {/* Set as My Program Primary Action */}
        <button
          type="button"
          onClick={handleSetAsActive}
          disabled={isActive}
          className={`w-full min-h-[46px] py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            isActive
              ? 'bg-[#00D1B2]/20 border border-[#00D1B2] text-[#00D1B2] cursor-default'
              : 'bg-[#00D1B2] text-[#0B1117] hover:bg-[#00B39B] active:scale-[0.98]'
          }`}
        >
          {isActive ? (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Current Active Program</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-current" />
              <span>Set as My Program</span>
            </>
          )}
        </button>
      </div>

      {/* Injury Guardrails Integration Callout */}
      <div className="p-3.5 rounded-2xl bg-[#0B1117] border border-[#00D1B2]/30 flex items-start gap-2.5">
        <Shield className="w-4 h-4 text-[#00D1B2] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-[#F8FAFC]">Injury Guardrails Active</p>
          <p className="text-[11px] text-[#94A3B8] leading-relaxed">
            {program.injuryNotes} Your profile's joints (
            <span className="text-[#00D1B2]">{profile.injuryGuardrails.join(', ')}</span>) are
            continuously protected across every scheduled set.
          </p>
        </div>
      </div>

      {/* Periodized Phase Breakdown */}
      <div className="space-y-3 pt-1">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-[#00D1B2]" />
          <span>Phase Breakdown</span>
        </h2>

        <div className="space-y-2.5">
          {program.phases.map((phase) => (
            <div
              key={phase.phaseNumber}
              className="p-3.5 rounded-xl bg-[#141C24] border border-[#1E293B] space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#00D1B2]">{phase.weeksRange}</span>
                <span className="text-[10px] font-mono text-[#94A3B8] bg-[#0B1117] px-2 py-0.5 rounded">
                  {phase.sessionsPerWeek} sessions/wk
                </span>
              </div>
              <p className="text-sm font-bold text-[#F8FAFC]">{phase.name}</p>
              <p className="text-xs text-[#94A3B8] leading-relaxed">{phase.focus}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sample Weekly Session Structure */}
      <div className="space-y-2.5 pt-1">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-[#00D1B2]" />
          <span>Weekly Session Structure</span>
        </h2>

        <div className="space-y-2">
          {program.weeklyStructure.map((session, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-[#141C24] border border-[#1E293B] flex items-center justify-between gap-2"
            >
              <div>
                <p className="text-[10px] font-mono text-[#94A3B8] uppercase">{session.dayLabel}</p>
                <p className="text-xs font-semibold text-[#F8FAFC]">{session.sessionTitle}</p>
                <div className="flex gap-1.5 mt-1">
                  {session.focusTags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-[#00D1B2]/10 text-[#00D1B2]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <span className="text-xs font-mono font-medium text-[#00D1B2] bg-[#00D1B2]/10 px-2 py-1 rounded shrink-0">
                {session.durationMinutes}m
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
