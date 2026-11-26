import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Wind, Play, Pause, RotateCcw, SkipForward, AlertTriangle, Info, Waves } from 'lucide-react'

type ProtocolType = 'co2' | 'o2'

interface TableRound {
  roundNumber: number
  breatheSeconds: number
  holdSeconds: number
}

/**
 * Authentic CO2 & O2 hold-down table generator calibrated for surf hold-downs:
 * Hold phases 7-20s under elevated heart rate context.
 * - CO2 table: Hold is constant (e.g. 15s), breathe-up interval decreases round-by-round.
 * - O2 table: Breathe-up is constant (e.g. 20s), hold interval increases round-by-round.
 */
function generateTable(protocol: ProtocolType): TableRound[] {
  if (protocol === 'co2') {
    // 6 rounds: holds stay 15s, breathe-ups shorten: 30s -> 25s -> 20s -> 15s -> 12s -> 10s
    const breatheTimes = [30, 25, 20, 15, 12, 10]
    return breatheTimes.map((b, i) => ({
      roundNumber: i + 1,
      breatheSeconds: b,
      holdSeconds: 15,
    }))
  } else {
    // 6 rounds: breathe-ups stay 20s, holds lengthen: 8s -> 10s -> 12s -> 14s -> 17s -> 20s
    const holdTimes = [8, 10, 12, 14, 17, 20]
    return holdTimes.map((h, i) => ({
      roundNumber: i + 1,
      breatheSeconds: 20,
      holdSeconds: h,
    }))
  }
}

export default function Breathwork() {
  const [protocol, setProtocol] = useState<ProtocolType>('co2')
  const rounds = generateTable(protocol)

  const [currentRoundIdx, setCurrentRoundIdx] = useState(0)
  const [currentPhase, setCurrentPhase] = useState<'breathe' | 'hold'>('breathe')
  const [isActive, setIsActive] = useState(false)

  // Current timer duration & remaining seconds
  const currentRound = rounds[currentRoundIdx] || rounds[0]
  const phaseTotalSeconds =
    currentPhase === 'breathe' ? currentRound.breatheSeconds : currentRound.holdSeconds

  const [secondsRemaining, setSecondsRemaining] = useState<number>(currentRound.breatheSeconds)

  // Switch protocol resets timer
  const handleSelectProtocol = (p: ProtocolType) => {
    setProtocol(p)
    setIsActive(false)
    setCurrentRoundIdx(0)
    setCurrentPhase('breathe')
    const newRounds = generateTable(p)
    setSecondsRemaining(newRounds[0].breatheSeconds)
  }

  // Phase transition handler
  const advancePhase = useCallback(() => {
    if (currentPhase === 'breathe') {
      // Transition from breathe to hold
      setCurrentPhase('hold')
      setSecondsRemaining(currentRound.holdSeconds)
    } else {
      // Transition from hold to next round or finish
      if (currentRoundIdx + 1 < rounds.length) {
        const nextIdx = currentRoundIdx + 1
        setCurrentRoundIdx(nextIdx)
        setCurrentPhase('breathe')
        setSecondsRemaining(rounds[nextIdx].breatheSeconds)
      } else {
        // Complete table
        setIsActive(false)
        setCurrentRoundIdx(0)
        setCurrentPhase('breathe')
        setSecondsRemaining(rounds[0].breatheSeconds)
      }
    }
  }, [currentPhase, currentRoundIdx, currentRound, rounds])

  // Accurate interval countdown
  useEffect(() => {
    if (!isActive) return

    let lastTime = Date.now()
    const interval = setInterval(() => {
      const now = Date.now()
      const delta = (now - lastTime) / 1000

      if (delta >= 1) {
        lastTime = now
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            advancePhase()
            return 0
          }
          return prev - 1
        })
      }
    }, 200)

    return () => clearInterval(interval)
  }, [isActive, advancePhase])

  const handleReset = () => {
    setIsActive(false)
    setCurrentRoundIdx(0)
    setCurrentPhase('breathe')
    setSecondsRemaining(rounds[0].breatheSeconds)
  }

  const isFinalThreeSeconds =
    currentPhase === 'hold' && secondsRemaining <= 3 && secondsRemaining > 0

  return (
    <div className="flex-1 flex flex-col justify-between px-5 pt-5 pb-8 space-y-4">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#00D1B2]/15 text-[#00D1B2] text-xs font-semibold mb-2">
          <Wind className="w-3.5 h-3.5" />
          <span>Apnea Conditioning</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">Dry-Land Breath Tables</h1>
        <p className="text-xs text-[#94A3B8] mt-0.5">
          Simulate wipeout hold-down panic suppression and CO2 acidosis resilience.
        </p>
      </div>

      {/* Protocol Selector */}
      <div className="p-1 rounded-2xl bg-[#141C24] border border-[#1E293B] grid grid-cols-2 gap-1">
        <button
          type="button"
          onClick={() => handleSelectProtocol('co2')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
            protocol === 'co2'
              ? 'bg-[#00D1B2] text-[#0B1117] shadow-sm'
              : 'text-[#94A3B8] hover:text-[#F8FAFC]'
          }`}
        >
          CO2 Tolerance Table
        </button>
        <button
          type="button"
          onClick={() => handleSelectProtocol('o2')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
            protocol === 'o2'
              ? 'bg-[#00D1B2] text-[#0B1117] shadow-sm'
              : 'text-[#94A3B8] hover:text-[#F8FAFC]'
          }`}
        >
          O2 Depletion Table
        </button>
      </div>

      {/* Large Circular Timer Stage */}
      <div className="p-6 rounded-3xl bg-[#141C24] border border-[#1E293B] flex flex-col items-center justify-center space-y-4 relative">
        <div className="flex items-center justify-between w-full text-xs font-mono text-[#94A3B8]">
          <span className="font-bold uppercase tracking-wider text-[#00D1B2]">
            Round {currentRoundIdx + 1} of {rounds.length}
          </span>
          <span className="capitalize">
            {protocol === 'co2' ? 'Descending Recovery' : 'Ascending Hold'}
          </span>
        </div>

        {/* Circular Countdown Ring */}
        <div className="relative w-56 h-56 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90">
            <circle cx="112" cy="112" r="96" stroke="#0B1117" strokeWidth="10" fill="none" />
            <circle
              cx="112"
              cy="112"
              r="96"
              stroke={currentPhase === 'hold' ? '#F59E0B' : '#00D1B2'}
              strokeWidth="10"
              fill="none"
              strokeDasharray={2 * Math.PI * 96}
              strokeDashoffset={2 * Math.PI * 96 * (1 - secondsRemaining / phaseTotalSeconds)}
              className={`transition-all duration-300 ease-linear ${
                isFinalThreeSeconds ? 'animate-pulse' : ''
              }`}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span
              className={`text-xs font-bold uppercase tracking-widest mb-1 ${
                currentPhase === 'hold' ? 'text-[#F59E0B]' : 'text-[#00D1B2]'
              }`}
            >
              {currentPhase === 'hold' ? 'HOLD APNEA' : 'VENTILATE / BREATHE'}
            </span>
            <span className="text-6xl font-bold font-mono tabular-nums text-[#F8FAFC] tracking-tight">
              {secondsRemaining}s
            </span>
            <span className="text-[11px] text-[#94A3B8] mt-1 font-mono">
              of {phaseTotalSeconds}s target
            </span>
          </div>
        </div>

        {/* Timer Control Row */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleReset}
            aria-label="Reset table"
            className="w-11 h-11 rounded-xl bg-[#0B1117] border border-[#1E293B] flex items-center justify-center text-[#94A3B8] hover:text-[#F8FAFC] active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsActive((a) => !a)}
            className={`min-h-[46px] px-6 rounded-xl font-bold text-sm flex items-center gap-2 transition-all active:scale-95 shadow-md ${
              isActive
                ? 'bg-[#141C24] border border-[#00D1B2] text-[#00D1B2]'
                : 'bg-[#00D1B2] text-[#0B1117] hover:bg-[#00B39B]'
            }`}
          >
            {isActive ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            <span>{isActive ? 'Pause' : 'Start Table'}</span>
          </button>

          <button
            type="button"
            onClick={advancePhase}
            aria-label="Skip phase"
            className="w-11 h-11 rounded-xl bg-[#0B1117] border border-[#1E293B] flex items-center justify-center text-[#94A3B8] hover:text-[#F8FAFC] active:scale-95 transition-all"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Safety Banner (Exact Required Copy) */}
      <div className="p-3.5 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
        <p className="text-xs text-[#F59E0B] font-medium leading-relaxed">
          Dry-land training only. Never practice breath-holds alone in water.
        </p>
      </div>

      {/* "How It Maps to Surfing" Explainer Card */}
      <div className="p-4 rounded-2xl bg-[#141C24] border border-[#1E293B] space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#00D1B2]">
          <Waves className="w-4 h-4" />
          <span>How It Maps to Ocean Hold-Downs</span>
        </div>
        <p className="text-xs text-[#94A3B8] leading-relaxed">
          A typical 6-to-8ft wave hold-down lasts 7–12 seconds, but elevated heart rates cause
          hypercapnia panic. CO2 tables condition your brainstem to tolerate high carbonic acid
          levels without involuntary diaphragm spasms or fight-or-flight heart spikes.
        </p>
      </div>
    </div>
  )
}
