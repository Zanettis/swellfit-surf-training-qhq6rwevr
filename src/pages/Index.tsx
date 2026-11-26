import React, { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Waves, ArrowRight, ShieldCheck, Compass, Dumbbell } from 'lucide-react'
import { useSwellFit } from '../context/SwellFitContext'

export default function Index() {
  const navigate = useNavigate()
  const { profile, isHydrated } = useSwellFit()

  useEffect(() => {
    document.title = 'SwellFit — Adaptive Sports-Science Programming for Surfers'
  }, [])

  // Auto-redirect if onboarding and paywall were already completed
  useEffect(() => {
    if (isHydrated && profile.isEntitled) {
      navigate('/today', { replace: true })
    }
  }, [isHydrated, profile.isEntitled, navigate])

  return (
    <div className="flex-1 flex flex-col justify-between px-6 py-8 relative overflow-hidden bg-gradient-to-b from-[#0B1117] via-[#0E1721] to-[#0B1117]">
      {/* Subtle pulsing background wave motif */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 pointer-events-none">
        <div className="absolute inset-0 rounded-full border border-[#00D1B2]/10 animate-ping [animation-duration:4s]" />
        <div className="absolute inset-6 rounded-full border border-[#00D1B2]/15" />
        <div className="absolute inset-16 rounded-full border border-[#00D1B2]/20" />
        <div className="absolute inset-28 rounded-full bg-[#00D1B2]/5 blur-2xl" />
      </div>

      {/* Top Header / Wordmark */}
      <div className="relative z-10 pt-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141C24] border border-[#1E293B] text-xs font-medium text-[#00D1B2] mb-6">
          <Waves className="w-3.5 h-3.5" />
          <span>High-Performance Surf Conditioning</span>
        </div>

        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-xl bg-[#00D1B2]/15 border border-[#00D1B2]/40 flex items-center justify-center text-[#00D1B2]">
            <Waves className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-3xl font-bold tracking-tight text-[#F8FAFC]">
            Swell<span className="text-[#00D1B2]">Fit</span>
          </span>
        </div>

        <p className="text-sm uppercase tracking-widest text-[#94A3B8] font-medium">
          Sports-Science Lab
        </p>
      </div>

      {/* Core Tagline & Value Props */}
      <div className="relative z-10 my-auto py-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F8FAFC] text-center leading-[1.15] mb-4">
          Adaptive Sports-Science Programming for Surfers
        </h1>
        <p className="text-base text-[#94A3B8] text-center max-w-xs mx-auto mb-8">
          Endless paddle stamina, explosive pop-ups, and bulletproof joint longevity tailored to
          your board and injury profile.
        </p>

        {/* Feature Highlights Grid */}
        <div className="space-y-3">
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#141C24]/80 border border-[#1E293B]">
            <div className="w-9 h-9 rounded-xl bg-[#00D1B2]/10 border border-[#00D1B2]/20 flex items-center justify-center text-[#00D1B2] shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#F8FAFC]">Ocean Context Switcher</p>
              <p className="text-xs text-[#94A3B8]">
                Instantly swap between full training and pre/post surf activation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#141C24]/80 border border-[#1E293B]">
            <div className="w-9 h-9 rounded-xl bg-[#00D1B2]/10 border border-[#00D1B2]/20 flex items-center justify-center text-[#00D1B2] shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#F8FAFC]">Joint & Injury Guardrails</p>
              <p className="text-xs text-[#94A3B8]">
                Rotator cuff & lower-back prehab prioritized; high-risk loading excluded.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#141C24]/80 border border-[#1E293B]">
            <div className="w-9 h-9 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B] shrink-0">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#F8FAFC]">Surf Trip Countdown Engine</p>
              <p className="text-xs text-[#94A3B8]">
                Periodized 2, 4, or 6-week blocks aligned with your departure date.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Primary CTAs */}
      <div className="relative z-10 space-y-3 pt-2">
        <button
          type="button"
          onClick={() => navigate('/onboarding')}
          className="w-full min-h-[52px] py-3.5 px-6 rounded-xl bg-[#00D1B2] hover:bg-[#00B39B] active:scale-[0.98] text-[#0B1117] font-semibold text-base flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#00D1B2]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D1B2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1117]"
        >
          <span>Get Started</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>

        <button
          type="button"
          onClick={() => {
            if (profile.isEntitled) {
              navigate('/today')
            } else {
              navigate('/onboarding')
            }
          }}
          className="w-full py-2.5 text-center text-sm font-medium text-[#94A3B8] hover:text-[#F8FAFC] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D1B2] rounded-lg"
        >
          I already have a plan
        </button>

        <p className="text-[11px] text-center text-[#94A3B8]/70">
          Sports-science validated · No equipment required to start
        </p>
      </div>
    </div>
  )
}
