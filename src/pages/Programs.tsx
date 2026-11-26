import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Layers,
  ArrowRight,
  Download,
  Check,
  Clock,
  Sparkles,
  Shield,
  Plane,
} from 'lucide-react'
import { useSwellFit } from '../context/SwellFitContext'
import { SWELLFIT_PROGRAMS } from '../data/programs'
import { useToast } from '../hooks/use-toast'

export default function Programs() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { profile, toggleOfflineProgram } = useSwellFit()

  const handleToggleOffline = (e: React.MouseEvent, programId: string) => {
    e.stopPropagation()
    const nowSaved = toggleOfflineProgram(programId)
    toast({
      title: nowSaved
        ? 'Saved for offline — ready for your trip.'
        : 'Removed from offline storage.',
      description: nowSaved
        ? 'Full workout timers and cues available without cellular data.'
        : undefined,
    })
  }

  return (
    <div className="flex-1 flex flex-col px-5 pt-5 pb-8 space-y-4">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#00D1B2]/15 text-[#00D1B2] text-xs font-semibold mb-2">
          <Layers className="w-3.5 h-3.5" />
          <span>Periodized Macrocycles</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
          Training Programs
        </h1>
        <p className="text-xs text-[#94A3B8] mt-0.5">
          Sports-science roadmaps for trips, paddle power, joint prehab, and rail mechanics.
        </p>
      </div>

      {/* Program Cards Stack */}
      <div className="space-y-3.5">
        {SWELLFIT_PROGRAMS.map((program) => {
          const isActive = profile.activeProgramId === program.id
          const isSavedOffline = profile.savedOfflineProgramIds.includes(program.id)

          return (
            <div
              key={program.id}
              onClick={() => navigate(`/programs/${program.id}`)}
              className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-150 active:scale-[0.99] space-y-3 relative ${
                isActive
                  ? 'bg-[#141C24] border-[#00D1B2]/60 shadow-lg shadow-[#00D1B2]/5'
                  : 'bg-[#141C24] border-[#1E293B] hover:border-[#94A3B8]/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-[#00D1B2]">
                      {program.durationWeeks} WEEKS
                    </span>
                    {isActive && (
                      <span className="px-2 py-0.5 rounded-full bg-[#00D1B2] text-[#0B1117] text-[10px] font-bold tracking-wider uppercase">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <h2 className="text-base font-bold text-[#F8FAFC] leading-snug">
                    {program.name}
                  </h2>
                </div>

                {/* Trip Mode (Save Offline) interactive toggle badge */}
                <button
                  type="button"
                  onClick={(e) => handleToggleOffline(e, program.id)}
                  aria-label={
                    isSavedOffline
                      ? 'Saved offline. Tap to remove'
                      : 'Download for offline trip mode'
                  }
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                    isSavedOffline
                      ? 'bg-[#00D1B2]/20 border border-[#00D1B2] text-[#00D1B2]'
                      : 'bg-[#0B1117] border border-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  {isSavedOffline ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Trip Mode</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Save Offline</span>
                    </>
                  )}
                </button>
              </div>

              {/* Focus Line */}
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                {program.focus}
              </p>

              {/* Bottom Meta & Progress */}
              <div className="pt-2 border-t border-[#1E293B] flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-[#94A3B8]">
                  <span>{program.phases.length} Periodized Phases</span>
                </div>

                <div className="flex items-center gap-1 font-semibold text-[#00D1B2]">
                  <span>Explore Plan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
