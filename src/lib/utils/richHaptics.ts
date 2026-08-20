/**
 * Universal Rich Haptics Controller
 * Supports Capacitor Native Haptics with automatic fallback to Web Vibration API.
 * Provides Apple Taptic Engine inspired micro-vibrations for tactile mobile UX.
 */

export type HapticImpactStyle = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error'

class RichHapticsEngine {
  private isCapacitor = false
  private capacitorHaptics: any = null
  private isEnabled = true

  constructor() {
    if (typeof window !== 'undefined') {
      const pref = localStorage.getItem('darion_haptics_enabled')
      this.isEnabled = pref === null ? true : pref === 'true'

      // Check for Capacitor native environment
      // @ts-ignore
      if (window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform()) {
        this.isCapacitor = true
        import('@capacitor/haptics')
          .then((mod) => {
            this.capacitorHaptics = mod.Haptics
          })
          .catch(() => {})
      }
    }
  }

  public isHapticsEnabled(): boolean {
    return this.isEnabled
  }

  public setHapticsEnabled(enabled: boolean): void {
    this.isEnabled = enabled
    if (typeof window !== 'undefined') {
      localStorage.setItem('darion_haptics_enabled', enabled ? 'true' : 'false')
    }
  }

  public toggleHaptics(): boolean {
    const next = !this.isHapticsEnabled()
    this.setHapticsEnabled(next)
    return next
  }

  /**
   * Trigger tactile haptic feedback
   */
  public trigger(style: HapticImpactStyle = 'light'): void {
    if (!this.isEnabled || typeof window === 'undefined') return

    // 1. Native Capacitor Haptics (iOS & Android)
    if (this.capacitorHaptics) {
      try {
        switch (style) {
          case 'light':
            this.capacitorHaptics.impact({ style: 'LIGHT' })
            return
          case 'medium':
            this.capacitorHaptics.impact({ style: 'MEDIUM' })
            return
          case 'heavy':
            this.capacitorHaptics.impact({ style: 'HEAVY' })
            return
          case 'selection':
            this.capacitorHaptics.selectionChanged()
            return
          case 'success':
            this.capacitorHaptics.notification({ type: 'SUCCESS' })
            return
          case 'warning':
            this.capacitorHaptics.notification({ type: 'WARNING' })
            return
          case 'error':
            this.capacitorHaptics.notification({ type: 'ERROR' })
            return
        }
      } catch {
        // Fallback to web vibration
      }
    }

    // 2. Web Vibration API Fallback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator && typeof navigator.vibrate === 'function') {
      try {
        switch (style) {
          case 'light':
          case 'selection':
            navigator.vibrate(8) // Ultra-crisp 8ms tap
            break
          case 'medium':
            navigator.vibrate(18)
            break
          case 'heavy':
            navigator.vibrate(35)
            break
          case 'success':
            navigator.vibrate([12, 35, 12]) // Double-tap pulse
            break
          case 'warning':
            navigator.vibrate([25, 50, 25])
            break
          case 'error':
            navigator.vibrate([40, 60, 40, 60, 40])
            break
        }
      } catch {
        // Ignored
      }
    }
  }

  /**
   * Convenience helpers for specific UX interactions
   */
  public impact(style: 'light' | 'medium' | 'heavy' = 'light'): void {
    this.trigger(style)
  }

  public selection(): void {
    this.trigger('selection')
  }

  public success(): void {
    this.trigger('success')
  }

  public warning(): void {
    this.trigger('warning')
  }

  public error(): void {
    this.trigger('error')
  }

  public swipeSnap(): void {
    this.trigger('light')
  }

  public longPress(): void {
    this.trigger('medium')
  }
}

export const richHaptics = new RichHapticsEngine()
