'use client'

import React from 'react'
import Link from 'next/link'
import {
  Video,
  Phone,
  PhoneMissed,
  PhoneOff,
  ArrowUpRight,
  Radio,
} from 'lucide-react'

interface ChatMeetCardProps {
  metadata?: {
    roomId?: string
    roomCode?: string
    title?: string
    hostName?: string
    callerId?: string
    callType?: 'video' | 'audio'
    status?: 'calling' | 'ringing' | 'connected' | 'missed' | 'declined' | 'cancelled'
    startedAt?: string
    endedAt?: string
    meetUrl?: string
  }
}

export const ChatMeetCard: React.FC<ChatMeetCardProps> = ({ metadata }) => {
  const roomCode = metadata?.roomCode || 'live-room'
  const meetTitle = metadata?.title || 'Team Call'
  const hostName = metadata?.hostName || 'Team Member'
  const meetUrl = metadata?.meetUrl || `/meet/${roomCode}`
  const callType = metadata?.callType || 'video'
  const status = metadata?.status || 'connected'

  const formattedTime = metadata?.startedAt
    ? new Date(metadata.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : ''

  // Handle Call Back trigger
  const handleCallBack = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('start-outgoing-call', {
          detail: {
            callId: metadata?.roomId || '',
            roomCode: `dar-${callType}-${Math.floor(1000 + Math.random() * 9000)}`,
            callerId: metadata?.callerId || '',
            callerName: hostName,
            conversationId: '',
            callType,
            meetUrl: `/meet/${roomCode}`,
            startedAt: new Date().toISOString(),
          },
        })
      )
    }
  }

  // 1. MISSED / DECLINED / CANCELLED CALL (RULED ENTERPRISE UI - NO MEETING LINK)
  if (status === 'missed' || status === 'declined' || status === 'cancelled') {
    const isMissed = status === 'missed'
    const isDeclined = status === 'declined'

    return (
      <div className="w-full min-w-0 max-w-full sm:max-w-[320px] rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-error)]/30 shadow-xs hover:shadow-md p-2.5 sm:p-3 flex items-center justify-between gap-2 sm:gap-2.5 text-[var(--md-sys-color-on-surface)] select-none transition-all overflow-hidden">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 overflow-hidden">
          {/* Subtle Rose/Red Icon Container */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[var(--md-sys-color-error)]/15 text-[var(--md-sys-color-error)] flex items-center justify-center shrink-0 border border-[var(--md-sys-color-error)]/20 shadow-2xs">
            {callType === 'video' ? (
              <PhoneMissed className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </div>

          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5 truncate">
              <span className="px-1.5 py-0.5 rounded-md bg-[var(--md-sys-color-error)]/15 text-[var(--md-sys-color-error)] border border-[var(--md-sys-color-error)]/30 text-[9px] font-black uppercase tracking-wider shrink-0">
                {isMissed ? 'Missed' : isDeclined ? 'Declined' : 'Cancelled'}
              </span>
              <span className="text-[9.5px] text-[var(--md-sys-color-on-surface-variant)] font-bold uppercase truncate">
                • {callType}
              </span>
            </div>
            <h4 className="text-xs sm:text-[13px] font-bold text-[var(--md-sys-color-on-surface)] truncate">
              {meetTitle}
            </h4>
            <p className="text-[10px] sm:text-[11px] text-[var(--md-sys-color-on-surface-variant)] truncate mt-0.5">
              {isDeclined ? 'Declined' : 'No answer'} {formattedTime && `• ${formattedTime}`}
            </p>
          </div>
        </div>

        {/* 1-Click Call Back Action */}
        <button
          type="button"
          onClick={handleCallBack}
          className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-[var(--md-sys-color-primary)] hover:opacity-90 text-[var(--md-sys-color-on-primary)] font-bold text-[11px] sm:text-xs transition-all active:scale-95 shadow-xs shrink-0 cursor-pointer"
          title="Call back"
        >
          {callType === 'video' ? (
            <Video className="w-3.5 h-3.5" />
          ) : (
            <Phone className="w-3.5 h-3.5" />
          )}
          <span>Call Back</span>
        </button>
      </div>
    )
  }

  // 2. ACTIVE CALLING OR RINGING IN-PROGRESS (RULED ENTERPRISE UI)
  if (status === 'calling' || status === 'ringing') {
    const isCalling = status === 'calling'

    return (
      <div className="w-full min-w-0 max-w-full sm:max-w-[320px] rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-primary)]/40 shadow-xs hover:shadow-md p-2.5 sm:p-3 flex items-center justify-between gap-2 sm:gap-2.5 text-[var(--md-sys-color-on-surface)] select-none transition-all overflow-hidden">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 overflow-hidden">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[var(--md-sys-color-primary)]/15 text-[var(--md-sys-color-primary)] flex items-center justify-center shrink-0 border border-[var(--md-sys-color-primary)]/30 shadow-2xs">
            <Radio className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse text-[var(--md-sys-color-primary)]" />
          </div>

          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5 truncate">
              <span className="px-1.5 py-0.5 rounded-md bg-[var(--md-sys-color-primary)]/15 text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-primary)]/30 text-[9px] font-black uppercase tracking-wider shrink-0">
                {isCalling ? 'Calling...' : 'Ringing...'}
              </span>
              <span className="text-[9.5px] text-[var(--md-sys-color-on-surface-variant)] font-bold uppercase truncate">
                • {callType}
              </span>
            </div>
            <h4 className="text-xs sm:text-[13px] font-bold text-[var(--md-sys-color-on-surface)] truncate">
              {meetTitle}
            </h4>
            <p className="text-[10px] sm:text-[11px] text-[var(--md-sys-color-on-surface-variant)] truncate mt-0.5">
              {isCalling ? `Connecting to ${hostName}...` : `Ringing...`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCallBack}
          className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] sm:text-xs transition-all active:scale-95 shadow-sm shrink-0 cursor-pointer"
        >
          <span>Answer</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  // 3. SUCCESSFUL CONNECTED DIRECT CALL (WHATSAPP STYLE CALL LOG)
  return (
    <div className="w-full min-w-0 max-w-full sm:max-w-[320px] rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-emerald-500/40 shadow-xs hover:shadow-md p-2.5 sm:p-3 flex items-center justify-between gap-2 sm:gap-2.5 text-[var(--md-sys-color-on-surface)] select-none transition-all overflow-hidden">
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 overflow-hidden">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30 shadow-2xs">
          {callType === 'video' ? (
            <Video className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </div>

        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5 truncate">
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase tracking-wider shrink-0">
              {callType === 'video' ? 'Video Call' : 'Voice Call'}
            </span>
          </div>
          <h4 className="text-xs sm:text-[13px] font-bold text-[var(--md-sys-color-on-surface)] truncate">
            {meetTitle}
          </h4>
          <p className="text-[10px] sm:text-[11px] text-[var(--md-sys-color-on-surface-variant)] truncate mt-0.5">
            {hostName} {formattedTime && `• ${formattedTime}`}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleCallBack}
        className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-[var(--md-sys-color-primary)] hover:opacity-90 text-[var(--md-sys-color-on-primary)] font-bold text-[11px] sm:text-xs transition-all active:scale-95 shadow-sm shrink-0 cursor-pointer"
        title="Call back"
      >
        {callType === 'video' ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
        <span>Call</span>
      </button>
    </div>
  )
}
