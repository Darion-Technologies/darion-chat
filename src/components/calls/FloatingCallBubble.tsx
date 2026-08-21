'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Mic,
  MicOff,
  PhoneOff,
  Maximize2,
  Volume2,
} from 'lucide-react'
import { richHaptics } from '@/lib/utils/richHaptics'

interface FloatingCallBubbleProps {
  callerName: string
  callerAvatar?: string
  callType: 'audio' | 'video'
  callDuration: number
  isMuted: boolean
  onToggleMute: () => void
  onEndCall: () => void
  onExpand: () => void
}

export const FloatingCallBubble: React.FC<FloatingCallBubbleProps> = ({
  callerName,
  callerAvatar,
  callType,
  callDuration,
  isMuted,
  onToggleMute,
  onEndCall,
  onExpand,
}) => {
  const [position, setPosition] = useState({ x: 20, y: 100 })
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true
    dragStart.current = {
      x: e.touches[0].clientX - position.x,
      y: e.touches[0].clientY - position.y,
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return
    const newX = Math.max(10, Math.min(window.innerWidth - 200, e.touches[0].clientX - dragStart.current.x))
    const newY = Math.max(50, Math.min(window.innerHeight - 100, e.touches[0].clientY - dragStart.current.y))
    setPosition({ x: newX, y: newY })
  }

  const handleTouchEnd = () => {
    isDragging.current = false
  }

  return (
    <div
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="fixed z-50 rounded-3xl bg-slate-900/95 backdrop-blur-2xl border border-white/15 shadow-2xl p-2.5 flex items-center gap-3 select-none cursor-move animate-in fade-in zoom-in-95 duration-200"
    >
      {/* Avatar with Live Green Pulse */}
      <div className="relative shrink-0" onClick={onExpand}>
        {callerAvatar ? (
          <img
            src={callerAvatar}
            alt={callerName}
            className="w-10 h-10 rounded-2xl object-cover border border-white/10"
          />
        ) : (
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0B57D0] to-blue-500 text-white font-bold flex items-center justify-center text-sm shadow-md">
            {callerName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" />
      </div>

      {/* Info & Timer */}
      <div className="min-w-0 cursor-pointer" onClick={onExpand}>
        <h4 className="text-xs font-bold text-white truncate max-w-[90px]">
          {callerName}
        </h4>
        <p className="text-[10px] font-mono text-emerald-400 font-semibold">
          {formatDuration(callDuration)}
        </p>
      </div>

      {/* Quick Action Controls */}
      <div className="flex items-center gap-1.5 shrink-0 pl-1 border-l border-white/10">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            richHaptics.impact('light')
            onToggleMute()
          }}
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            isMuted
              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
              : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          title={isMuted ? 'Unmute mic' : 'Mute mic'}
        >
          {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            richHaptics.impact('light')
            onExpand()
          }}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
          title="Expand to Fullscreen"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            richHaptics.impact('heavy')
            onEndCall()
          }}
          className="p-2 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white transition-all shadow-md shadow-red-600/30 cursor-pointer"
          title="End Call"
        >
          <PhoneOff className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
