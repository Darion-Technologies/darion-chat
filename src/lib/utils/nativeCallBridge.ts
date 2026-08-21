/**
 * Native Android Call Bridge
 * Interacts with DarionCallPlugin to trigger native hardware ringtones,
 * lock screen wake-up full-screen intents, and speakerphone routing.
 */

export interface NativeCallPayload {
  callerName: string
  roomCode: string
  callType: 'video' | 'audio'
}

class NativeCallBridge {
  private getPlugin() {
    if (typeof window !== 'undefined') {
      const cap = (window as any).Capacitor
      return cap?.Plugins?.DarionCall || null
    }
    return null
  }

  public async showIncomingCall(payload: NativeCallPayload): Promise<boolean> {
    try {
      const plugin = this.getPlugin()
      if (plugin && typeof plugin.showIncomingCall === 'function') {
        await plugin.showIncomingCall(payload)
        return true
      }
    } catch (err) {
      console.error('Error invoking native showIncomingCall:', err)
    }
    return false
  }

  public async startRingtone(): Promise<boolean> {
    try {
      const plugin = this.getPlugin()
      if (plugin && typeof plugin.startRingtone === 'function') {
        await plugin.startRingtone()
        return true
      }
    } catch (err) {
      console.error('Error invoking native startRingtone:', err)
    }
    return false
  }

  public async stopRingtone(): Promise<boolean> {
    try {
      const plugin = this.getPlugin()
      if (plugin && typeof plugin.stopRingtone === 'function') {
        await plugin.stopRingtone()
        return true
      }
    } catch (err) {
      console.error('Error invoking native stopRingtone:', err)
    }
    return false
  }

  public async setSpeakerphone(enabled: boolean): Promise<boolean> {
    try {
      const plugin = this.getPlugin()
      if (plugin && typeof plugin.setSpeakerphone === 'function') {
        await plugin.setSpeakerphone({ enabled })
        return true
      }
    } catch (err) {
      console.error('Error invoking native setSpeakerphone:', err)
    }
    return false
  }
}

export const NativeCall = new NativeCallBridge()
