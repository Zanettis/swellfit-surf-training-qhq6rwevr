import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Bell, Waves, Zap, ChevronLeft } from 'lucide-react'
import { useSwellFit } from '../context/SwellFitContext'
import { useToast } from '../hooks/use-toast'

export default function Paywall() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { unlockPaywall } = useSwellFit()

  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual')
  const [remindMe, setRemindMe] = useState<boolean>(true)

  const handleStartTrial = () => {
    unlockPaywall()
    toast({
      title: 'Subscription active — your plan is live.',
      description: 'Full access to all adaptive programming restored.',
    })
    navigate('/today')
  }

  return (
    <div className="flex-1 flex flex-col justify-between px-5 py-6 bg-[#0B1117] relative select-none">
      {/* Top Bar with back button */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => navigate('/profile')}
          aria-label="Back to profile"
          className="w-10 h-10 rounded-xl bg-[#141C24] border border-[#1E293B] flex items-center justify-center text-[#94A3B8] hover:text-[#F8FAFC] active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D1B2]"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
          Membership Access
        </span>
        <div className="w-10" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center my-auto space-y-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#00D1B2]/15 border border-[#00D1B2]/30 flex items-center justify-center text-[#00D1B2] mx-auto mb-3">
            <Waves className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
            Reactivate SwellFit Access
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1 max-w-xs mx-auto">
            7 days free. Periodized surf conditioning, breathwork tables, and prehab guardrails.
          </p>
        </div>

        {/* Plan Cards */}
        <div className="space-y-3 pt-2">
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
                  <span className="text-2xl font-bold font-mono text-[#F8FAFC]">$8.33</span>
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
                <p className="text-xs font-semibold text-[#F8FAFC]">Monthly Flex Plan</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-lg font-bold font-mono text-[#F8FAFC]">$19.99</span>
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
            <label
              htmlFor="paywall-remind-toggle"
              className="text-xs font-medium text-[#F8FAFC] cursor-pointer"
            >
              Remind me 2 days before trial ends
            </label>
          </div>
          <input
            id="paywall-remind-toggle"
            type="checkbox"
            checked={remindMe}
            onChange={(e) => setRemindMe(e.target.checked)}
            className="w-4 h-4 rounded text-[#00D1B2] focus:ring-[#00D1B2] bg-[#0B1117] border-[#1E293B]"
          />
        </div>

        {/* Fine print */}
        <p className="text-[11px] text-center text-[#94A3B8]/70">
          No commitment. Instant 1-Click cancellation inside Profile.
        </p>
      </div>

      {/* CTA Button */}
      <div className="pt-4 space-y-2">
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
    </div>
  )
}
