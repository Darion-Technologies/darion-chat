'use client'

import React, { useState, useEffect } from 'react'
import {
  Settings,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Keyboard,
  Sparkles,
  Play,
} from 'lucide-react'
import { soundEffects } from '@/lib/utils/soundEffects'

export const SettingsPanel: React.FC = () => {
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(true)

  useEffect(() => {
    setSoundEnabled(soundEffects.isSoundEnabled())
    setIsDarkMode(document.documentElement.classList.contains('dark'))
  }, [])

  const toggleSound = () => {
    const next = soundEffects.toggleSound()
    setSoundEnabled(next)
  }

  const toggleTheme = () => {
    const next = !isDarkMode
    setIsDarkMode(next)
    if (next) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const handleTestSentSound = () => {
    soundEffects.unlockAudio()
    soundEffects.playMessageSentSound()
  }

  const handleTestIncomingSound = () => {
    soundEffects.unlockAudio()
    soundEffects.playMeetingAlertSound()
  }

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 sm:p-6 bg-[var(--md-sys-color-surface-container-lowest)] flex flex-col justify-between max-w-2xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-[var(--md-sys-color-outline-variant)]">
          <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-primary)]/15 text-[var(--md-sys-color-primary)] flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
              Chat & Audio Preferences
              <Sparkles className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
            </h2>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              Customize sound effects, appearance, notifications and shortcuts
            </p>
          </div>
        </div>

        {/* 1. Audio & Sound Effects */}
        <div className="p-5 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--md-sys-color-primary)]/15 text-[var(--md-sys-color-primary)] flex items-center justify-center">
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[var(--md-sys-color-on-surface)]">Synthesized Audio Effects</h3>
                <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                  Zero-latency Web Audio pops, chimes and ringing alerts
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleSound}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-sm shadow-[var(--md-sys-color-primary)]/20'
                  : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]'
              }`}
            >
              {soundEnabled ? 'Enabled' : 'Muted'}
            </button>
          </div>

          {soundEnabled && (
            <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)] flex items-center gap-3">
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">Test Chimes:</span>
              <button
                type="button"
                onClick={handleTestSentSound}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)] text-[11px] font-medium transition-colors"
              >
                <Play className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
                <span>Message Sent Pop</span>
              </button>
              <button
                type="button"
                onClick={handleTestIncomingSound}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)] text-[11px] font-medium transition-colors"
              >
                <Play className="w-3 h-3 text-emerald-400" />
                <span>Join Chime</span>
              </button>
            </div>
          )}
        </div>

        {/* 2. Theme & Appearance */}
        <div className="p-5 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[var(--md-sys-color-on-surface)]">Color Theme</h3>
              <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                {isDarkMode ? 'Dark Enterprise Mode (High Contrast)' : 'Light Clean Mode'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="px-3 py-1.5 rounded-xl bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)] text-xs font-bold transition-all cursor-pointer border border-[var(--md-sys-color-outline-variant)]"
          >
            {isDarkMode ? 'Switch to Light' : 'Switch to Dark'}
          </button>
        </div>

        {/* 3. Keyboard Shortcuts */}
        <div className="p-5 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] space-y-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--md-sys-color-secondary)]/15 text-[var(--md-sys-color-secondary)] flex items-center justify-center">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[var(--md-sys-color-on-surface)]">Pro Keyboard Shortcuts</h3>
              <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">Speed up your daily workflow</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">Send Message</span>
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)] font-mono text-[10px]">Enter</kbd>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">New Line</span>
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)] font-mono text-[10px]">Shift + Enter</kbd>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">Cancel Reply / Modal</span>
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)] font-mono text-[10px]">Escape</kbd>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">Emoji / GIF Picker</span>
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)] font-mono text-[10px]">😊 Icon</kbd>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-6 text-center text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
        Preferences saved locally in your browser
      </div>
    </div>
  )
}
