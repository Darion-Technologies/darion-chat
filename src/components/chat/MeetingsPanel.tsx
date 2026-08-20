'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Video, Plus, KeyRound, Sparkles, Radio, ArrowRight, Loader2 } from 'lucide-react'
import { createInstantMeetingAction } from '@/app/actions/meet'

interface MeetingsPanelProps {
  currentUserId: string
  currentUserName: string
}

export const MeetingsPanel: React.FC<MeetingsPanelProps> = ({ currentUserId, currentUserName }) => {
  const router = useRouter()
  const [roomCodeInput, setRoomCodeInput] = useState('')
  const [creatingMeet, setCreatingMeet] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleStartInstantMeet = async () => {
    setCreatingMeet(true)
    setErrorMsg('')
    try {
      const res = await createInstantMeetingAction(
        currentUserName,
        currentUserId,
        `${currentUserName}'s Meeting`
      )
      if (!res?.roomCode) {
        throw new Error('Failed to generate meeting room')
      }
      router.push(`/meet/${res.roomCode}`)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to start meeting')
    } finally {
      setCreatingMeet(false)
    }
  }

  const handleJoinWithCode = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanCode = roomCodeInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')
    if (!cleanCode) return
    router.push(`/meet/${cleanCode}`)
  }

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 sm:p-6 bg-[var(--md-sys-color-surface-container-lowest)] flex flex-col justify-between max-w-2xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-[var(--md-sys-color-outline-variant)]">
          <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-primary)]/15 text-[var(--md-sys-color-primary)] flex items-center justify-center">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
              Video Meetings & Huddles
              <Sparkles className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
            </h2>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              HD WebRTC video rooms, screen sharing, and encrypted P2P calls
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-[var(--md-sys-color-error)]/10 border border-[var(--md-sys-color-error)]/30 text-[var(--md-sys-color-error)] text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. Start Instant Meeting */}
          <div className="p-5 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center shadow-sm shadow-[var(--md-sys-color-primary)]/30 mb-3">
                <Plus className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] mb-1">Instant Meeting</h3>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                Generate a private video room and share the link with teammates
              </p>
            </div>

            <button
              type="button"
              onClick={handleStartInstantMeet}
              disabled={creatingMeet}
              className="mt-4 w-full py-2.5 px-4 rounded-xl bg-[var(--md-sys-color-primary)] hover:opacity-90 text-[var(--md-sys-color-on-primary)] font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-[var(--md-sys-color-primary)]/20 active:scale-95 transition-all cursor-pointer disabled:opacity-60"
            >
              {creatingMeet ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Room...</span>
                </>
              ) : (
                <>
                  <span>Start Instant Meet</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* 2. Join via Code */}
          <form
            onSubmit={handleJoinWithCode}
            className="p-5 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[var(--md-sys-color-secondary)]/15 text-[var(--md-sys-color-secondary)] flex items-center justify-center mb-3">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] mb-1">Join with a Code</h3>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                Enter the 9-digit meeting code or room link to jump in
              </p>
            </div>

            <div className="mt-4 space-y-2">
              <input
                type="text"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value)}
                placeholder="abc-defg-hij"
                className="w-full px-3 py-2 rounded-xl bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] text-xs text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)] outline-none focus:border-[var(--md-sys-color-primary)]"
              />
              <button
                type="submit"
                disabled={!roomCodeInput.trim()}
                className="w-full py-2 px-4 rounded-xl bg-[var(--md-sys-color-primary)] hover:opacity-90 text-[var(--md-sys-color-on-primary)] font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-[var(--md-sys-color-primary)]/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>Join Meeting</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Feature Highlights */}
        <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] flex items-center gap-3 text-xs text-[var(--md-sys-color-on-surface-variant)]">
          <Radio className="w-5 h-5 text-[var(--md-sys-color-primary)] flex-shrink-0 animate-pulse" />
          <span>
            Meetings feature live multi-participant WebRTC mesh, full HD screen sharing, noise suppression, and host admission controls.
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-6 text-center text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
        Enterprise Cloud Signaling • End-to-End Encrypted WebRTC
      </div>
    </div>
  )
}
