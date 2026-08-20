import { richHaptics } from './richHaptics'

/**
 * High-fidelity Enterprise Audio Sound Effects Engine
 * Built using Web Audio API (Zero external assets required, zero latency, ultra-lightweight)
 */

class SoundEffectsEngine {
  private ctx: AudioContext | null = null
  private ringInterval: any = null
  private isCurrentlyRinging = false
  private activeNodes: Array<{ osc: OscillatorNode; gain: GainNode }> = []

  constructor() {
    if (typeof window !== 'undefined') {
      const unlock = () => {
        this.unlockAudio()
      }
      window.addEventListener('click', unlock, { passive: true })
      window.addEventListener('touchstart', unlock, { passive: true })
      window.addEventListener('keydown', unlock, { passive: true })
    }
  }

  public unlockAudio(): void {
    try {
      const ctx = this.getContext()
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {})
      }
    } catch {
      // Ignored
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    try {
      if (!this.ctx || this.ctx.state === 'closed') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        if (AudioCtx) {
          this.ctx = new AudioCtx()
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {})
      }
      return this.ctx
    } catch {
      return null
    }
  }

  /**
   * Check if sound is enabled by user preference
   */
  public isSoundEnabled(): boolean {
    if (typeof window === 'undefined') return false
    const pref = localStorage.getItem('push_sound_enabled')
    return pref === null ? true : pref === 'true'
  }

  public setSoundEnabled(enabled: boolean): void {
    if (typeof window === 'undefined') return
    localStorage.setItem('push_sound_enabled', enabled ? 'true' : 'false')
  }

  public toggleSound(): boolean {
    const next = !this.isSoundEnabled()
    this.setSoundEnabled(next)
    return next
  }

  /**
   * Crisp, modern "Message Sent" pop/swoosh (Apple iMessage & Telegram inspired)
   */
  public playMessageSentSound(): void {
    richHaptics.impact('light')
    if (!this.isSoundEnabled()) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      this.unlockAudio()
      const now = ctx.currentTime

      // 1. Upward swoosh chirp
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(420, now)
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.07)

      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.1)

      // 2. Sparkle click
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()

      osc2.type = 'triangle'
      osc2.frequency.setValueAtTime(1320, now + 0.04)
      gain2.gain.setValueAtTime(0.08, now + 0.04)
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.12)

      osc2.connect(gain2)
      gain2.connect(ctx.destination)

      osc2.start(now + 0.04)
      osc2.stop(now + 0.12)
    } catch {
      // Ignored
    }
  }

  /**
   * Pleasant, crystal-clear Incoming Notification chime (Apple / Slack style chord)
   */
  public playNotificationSound(): void {
    richHaptics.success()
    if (!this.isSoundEnabled()) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      this.unlockAudio()
      const now = ctx.currentTime

      // Note 1: D5 (587.33 Hz)
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(587.33, now)
      gain1.gain.setValueAtTime(0.2, now)
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22)
      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      osc1.start(now)
      osc1.stop(now + 0.22)

      // Note 2: A5 (880.00 Hz)
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(880.0, now + 0.09)
      gain2.gain.setValueAtTime(0.25, now + 0.09)
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38)
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.start(now + 0.09)
      osc2.stop(now + 0.38)

      // Note 3: D6 (1174.66 Hz) Harmonic overtone
      const osc3 = ctx.createOscillator()
      const gain3 = ctx.createGain()
      osc3.type = 'sine'
      osc3.frequency.setValueAtTime(1174.66, now + 0.16)
      gain3.gain.setValueAtTime(0.18, now + 0.16)
      gain3.gain.exponentialRampToValueAtTime(0.0005, now + 0.5)
      osc3.connect(gain3)
      gain3.connect(ctx.destination)
      osc3.start(now + 0.16)
      osc3.stop(now + 0.5)
    } catch {
      // Ignored
    }
  }

  /**
   * Crisp micro-acoustic reaction pop/ping (like Apple iMessage emoji heart/tap)
   */
  public playReactionSound(): void {
    richHaptics.impact('light')
    if (!this.isSoundEnabled()) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      this.unlockAudio()
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(950, now)
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.05)

      gain.gain.setValueAtTime(0.1, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.06)
    } catch {}
  }

  /**
   * Tactile micro-tap sound for buttons and navigation items
   */
  public playTapSound(): void {
    richHaptics.selection()
  }

  /**
   * Meeting / Urgent Live Invite chime
   */
  public playMeetingAlertSound(): void {
    if (!this.isSoundEnabled()) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      this.unlockAudio()
      const now = ctx.currentTime
      const notes = [659.25, 783.99, 987.77, 1318.51] // E5 -> G5 -> B5 -> E6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now + i * 0.07)
        gain.gain.setValueAtTime(0.22, now + i * 0.07)
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.28)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + i * 0.07)
        osc.stop(now + i * 0.07 + 0.28)
      })
    } catch {
      // Ignored
    }
  }

  /**
   * Play single burst of MODERN MARIMBA / HARMONIC ENTERPRISE CALL RINGTONE
   */
  private playIncomingRingBurst(): void {
    if (!this.isCurrentlyRinging) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      this.unlockAudio()
      const now = ctx.currentTime

      // Melodic notes sequence (Marimba Arpeggio)
      // Phase 1: G4, C5, E5, G5, E5 (C Major chime)
      // Phase 2: A4, D5, F#5, A5, D5 (D Major chime)
      const noteSequence = [
        // Time offset, Frequency, Volume, Decay Duration
        { t: 0.00, f: 392.00, v: 0.35, d: 0.25 }, // G4
        { t: 0.12, f: 523.25, v: 0.40, d: 0.28 }, // C5
        { t: 0.24, f: 659.25, v: 0.45, d: 0.30 }, // E5
        { t: 0.36, f: 783.99, v: 0.50, d: 0.40 }, // G5 (peak)
        { t: 0.52, f: 659.25, v: 0.35, d: 0.25 }, // E5

        // Second melodic phrase
        { t: 0.76, f: 440.00, v: 0.35, d: 0.25 }, // A4
        { t: 0.88, f: 587.33, v: 0.40, d: 0.28 }, // D5
        { t: 1.00, f: 739.99, v: 0.45, d: 0.30 }, // F#5
        { t: 1.12, f: 880.00, v: 0.52, d: 0.45 }, // A5 (peak)
        { t: 1.28, f: 587.33, v: 0.35, d: 0.30 }, // D5
      ]

      noteSequence.forEach(({ t, f, v, d }) => {
        if (!this.isCurrentlyRinging) return
        const noteTime = now + t

        // Fundamental Tone (Sine)
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(f, noteTime)

        gain.gain.setValueAtTime(0.0001, noteTime)
        gain.gain.exponentialRampToValueAtTime(v, noteTime + 0.015) // Crisp attack
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + d) // Natural marimba decay

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(noteTime)
        osc.stop(noteTime + d)

        // Marimba overtone (Triangle 2x frequency harmonic)
        const oscOvertone = ctx.createOscillator()
        const gainOvertone = ctx.createGain()
        oscOvertone.type = 'triangle'
        oscOvertone.frequency.setValueAtTime(f * 2, noteTime)

        gainOvertone.gain.setValueAtTime(0.0001, noteTime)
        gainOvertone.gain.exponentialRampToValueAtTime(v * 0.4, noteTime + 0.01)
        gainOvertone.gain.exponentialRampToValueAtTime(0.0001, noteTime + (d * 0.6))

        oscOvertone.connect(gainOvertone)
        gainOvertone.connect(ctx.destination)

        oscOvertone.start(noteTime)
        oscOvertone.stop(noteTime + d)

        this.activeNodes.push({ osc, gain }, { osc: oscOvertone, gain: gainOvertone })
      })
    } catch {
      // Ignored
    }
  }

  /**
   * Start looping Loud Incoming Call Ringtone
   */
  public startRingingIncoming(): void {
    if (!this.isSoundEnabled()) return
    this.stopRinging()
    this.isCurrentlyRinging = true
    this.unlockAudio()

    this.playIncomingRingBurst()
    this.ringInterval = setInterval(() => {
      if (this.isCurrentlyRinging) {
        this.playIncomingRingBurst()
      } else {
        this.stopRinging()
      }
    }, 2400)
  }

  /**
   * Play single burst of outgoing ringback tone ("tuuuut...")
   */
  private playOutgoingRingbackBurst(): void {
    if (!this.isCurrentlyRinging) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      this.unlockAudio()
      const now = ctx.currentTime
      const freqs = [440, 480] // Standard telecommunications tone
      freqs.forEach((f) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(f, now)
        gain.gain.setValueAtTime(0.18, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 1.3)

        this.activeNodes.push({ osc, gain })
      })
    } catch {
      // Ignored
    }
  }

  /**
   * Start looping Outgoing Call Ringback Tone
   */
  public startRingingOutgoing(): void {
    if (!this.isSoundEnabled()) return
    this.stopRinging()
    this.isCurrentlyRinging = true
    this.unlockAudio()

    this.playOutgoingRingbackBurst()
    this.ringInterval = setInterval(() => {
      if (this.isCurrentlyRinging) {
        this.playOutgoingRingbackBurst()
      } else {
        this.stopRinging()
      }
    }, 3000)
  }

  /**
   * Immediately stops any active ringer loop and silences all oscillators
   */
  public stopRinging(): void {
    this.isCurrentlyRinging = false
    if (this.ringInterval) {
      clearInterval(this.ringInterval)
      this.ringInterval = null
    }

    // Instantly mute and stop all active nodes
    try {
      this.activeNodes.forEach(({ osc, gain }) => {
        try {
          gain.gain.setValueAtTime(0, 0)
          gain.disconnect()
          osc.stop()
          osc.disconnect()
        } catch {
          // Node may have already ended
        }
      })
    } catch {
      // Ignored
    }
    this.activeNodes = []
  }

  /**
   * Play Call Disconnected / Ended 3-pip tone
   */
  public playCallEndedSound(): void {
    this.stopRinging()
    if (!this.isSoundEnabled()) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      this.unlockAudio()
      const now = ctx.currentTime
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(480, now + i * 0.16)
        gain.gain.setValueAtTime(0.2, now + i * 0.16)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.16 + 0.1)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + i * 0.16)
        osc.stop(now + i * 0.16 + 0.1)
      }
    } catch {
      // Ignored
    }
  }
}

export const soundEffects = new SoundEffectsEngine()
