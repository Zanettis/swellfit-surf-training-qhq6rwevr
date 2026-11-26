// Subtle Web Audio cues for the workout player. No audio files: tones are
// synthesized on the fly, so they layer cleanly over background music.
// A single AudioContext is reused; browsers require the first resume() to
// happen inside a user gesture, which is always the Start Session tap.

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/** Unlock the audio context from a user gesture (call on Start Session). */
export function primeAudio(): void {
  getCtx()
}

interface ToneOpts {
  freq: number
  durationMs: number
  gain?: number
  delayMs?: number
  type?: OscillatorType
}

function tone({ freq, durationMs, gain = 0.08, delayMs = 0, type = 'sine' }: ToneOpts): void {
  const ac = getCtx()
  if (!ac) return
  const start = ac.currentTime + delayMs / 1000
  const osc = ac.createOscillator()
  const amp = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  amp.gain.setValueAtTime(0, start)
  amp.gain.linearRampToValueAtTime(gain, start + 0.012)
  amp.gain.exponentialRampToValueAtTime(0.0001, start + durationMs / 1000)
  osc.connect(amp)
  amp.connect(ac.destination)
  osc.start(start)
  osc.stop(start + durationMs / 1000 + 0.05)
}

/** One beep of the 3-2-1 countdown (last one is higher-pitched). */
export function beepCountdown(remaining: number): void {
  const last = remaining <= 1
  tone({
    freq: last ? 880 : 660,
    durationMs: last ? 260 : 140,
    gain: last ? 0.1 : 0.07,
    type: 'triangle',
  })
}

/** Set completed / exercise done chime: a quick two-note rise. */
export function chimeComplete(): void {
  tone({ freq: 660, durationMs: 150, gain: 0.09, type: 'triangle' })
  tone({ freq: 990, durationMs: 220, gain: 0.09, delayMs: 130, type: 'triangle' })
}

/** Session finished: a calm three-note arpeggio. */
export function chimeFinish(): void {
  tone({ freq: 523, durationMs: 220, gain: 0.08 })
  tone({ freq: 659, durationMs: 220, gain: 0.08, delayMs: 160 })
  tone({ freq: 784, durationMs: 340, gain: 0.09, delayMs: 320 })
}

/** Rest is over — a single soft low tone pulls attention back. */
export function beepRestOver(): void {
  tone({ freq: 440, durationMs: 320, gain: 0.08 })
}
