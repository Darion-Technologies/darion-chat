'use client'

import React, { useState } from 'react'
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Minimize2,
  SwitchCamera,
  Radio,
  Sparkles,
} from 'lucide-react'
import { useDirectWebRTC } from '@/lib/hooks/useDirectWebRTC'
import { richHaptics } from '@/lib/utils/richHaptics'
import { NativeCall } from '@/lib/utils/nativeCallBridge'

interface DirectCallModalProps {
  callId: string
  callerName: string
  callerAvatar?: string
  callType: 'audio' | 'video'
  isInitiator: boolean
  onClose: () => void
  onMinimize: (duration: number, isMuted: boolean) => void
}

export const DirectCallModal: React.FC<DirectCallModalProps> = ({
  callId,
  callerName,
  callerAvatar,
  callType,
  isInitiator,
  onClose,
  onMinimize,
}) => {
  const {
    connectionStatus,
    callDuration,
    isMuted,
    isVideoOff,
    isSpeakerOn,
    audioVolume,
    localVideoRef,
    remoteVideoRef,
    remoteAudioRef,
    toggleMute,
    toggleVideo,
    flipCamera,
    setIsSpeakerOn,
    endCall,
  } = useDirectWebRTC({
    callId,
    isInitiator,
    callType,
    onCallEnded: onClose,
  })

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'initiating':
      case 'ringing':
        return isInitiator ? 'Ringing...' : 'Incoming call...'
      case 'connecting':
        return 'Connecting...'
      case 'connected':
        return formatDuration(callDuration)
      case 'ended':
        return 'Call ended'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070a12] text-white select-none overflow-hidden animate-in fade-in duration-200">
      {/* Hidden audio element for remote stream output */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* 1. BACKGROUND / VIDEO STREAM */}
      {callType === 'video' && !isVideoOff && connectionStatus === 'connected' ? (
        <div className="absolute inset-0 w-full h-full bg-black">
          {/* Fullscreen Remote Video */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Draggable / Pinned Self-View Picture-in-Picture */}
          <div className="absolute top-6 right-6 w-28 sm:w-36 h-40 sm:h-52 rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl z-20 bg-slate-900">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
            {/* Flip Camera Overlay Button on PiP */}
            <button
              type="button"
              onClick={flipCamera}
              className="absolute bottom-2 right-2 p-1.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-colors"
              title="Flip Camera"
            >
              <SwitchCamera className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Ambient Glow Backdrop for Audio Call */
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl" />
        </div>
      )}

      {/* 2. TOP HEADER (Minimize & Security) */}
      <div className="absolute top-6 inset-x-0 px-6 flex items-center justify-between z-30 pt-[max(env(safe-area-inset-top,0px),0px)]">
        <button
          type="button"
          onClick={() => {
            richHaptics.selection()
            onMinimize(callDuration, isMuted)
          }}
          className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/10 text-white transition-all cursor-pointer active:scale-95 shadow-lg"
          title="Minimize Call"
        >
          <Minimize2 className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 text-xs font-semibold text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>End-to-End Encrypted</span>
        </div>
      </div>

      {/* 3. CENTER CONTENT (Avatar, Name, Live Waveform) */}
      {!(callType === 'video' && !isVideoOff && connectionStatus === 'connected') && (
        <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-sm w-full">
          {/* Pulsing Avatar Halo */}
          <div className="relative mb-6">
            {/* Animated Audio Frequency Wave Halo */}
            <div
              style={{
                transform: `scale(${1 + (audioVolume / 100) * 0.35})`,
                opacity: 0.3 + (audioVolume / 100) * 0.7,
              }}
              className="absolute -inset-4 rounded-full bg-gradient-to-tr from-blue-600/40 to-cyan-400/40 blur-md transition-transform duration-75"
            />
            <div className="absolute -inset-1.5 rounded-full bg-blue-500/30 animate-ping duration-1000" />

            {callerAvatar ? (
              <img
                src={callerAvatar}
                alt={callerName}
                className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white/15 shadow-2xl"
              />
            ) : (
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-[#0B57D0] to-blue-500 flex items-center justify-center text-white text-3xl sm:text-4xl font-extrabold border-4 border-white/15 shadow-2xl">
                {callerName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1.5">
            {callerName}
          </h2>

          <div className="flex items-center gap-2 text-sm sm:text-base font-semibold font-mono text-emerald-400">
            {connectionStatus === 'connected' && (
              <Radio className="w-4 h-4 animate-pulse text-emerald-400" />
            )}
            <span>{getStatusText()}</span>
          </div>

          {/* Dynamic Live Audio Waveform Bars */}
          {connectionStatus === 'connected' && (
            <div className="flex items-center justify-center gap-1.5 h-8 mt-6">
              {[0.4, 0.8, 1.2, 0.7, 1.4, 0.9, 0.5].map((multiplier, i) => (
                <span
                  key={i}
                  style={{
                    height: `${Math.max(6, Math.min(32, (audioVolume * multiplier * 0.4) + 6))}px`,
                  }}
                  className="w-1.5 rounded-full bg-gradient-to-t from-blue-500 to-cyan-400 transition-all duration-75"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. BOTTOM FLOATING CALL ACTION PILL BAR */}
      <div className="absolute bottom-8 inset-x-0 px-6 flex items-center justify-center z-30 pb-[max(env(safe-area-inset-bottom,0px),0px)]">
        <div className="bg-slate-900/85 backdrop-blur-2xl border border-white/15 shadow-2xl rounded-full p-2.5 sm:p-3 flex items-center gap-3 sm:gap-4">
          {/* Mute Mic Toggle */}
          <button
            type="button"
            onClick={toggleMute}
            className={`p-3.5 sm:p-4 rounded-full transition-all active:scale-95 cursor-pointer ${
              isMuted
                ? 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-lg shadow-red-500/10'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Speakerphone Toggle */}
          <button
            type="button"
            onClick={() => {
              richHaptics.impact('light')
              const next = !isSpeakerOn
              setIsSpeakerOn(next)
              NativeCall.setSpeakerphone(next)
            }}
            className={`p-3.5 sm:p-4 rounded-full transition-all active:scale-95 cursor-pointer ${
              isSpeakerOn
                ? 'bg-white/20 text-white shadow-md'
                : 'bg-white/10 text-slate-400'
            }`}
            title="Speakerphone"
          >
            {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* Video Camera Toggle (for video calls) */}
          {callType === 'video' && (
            <>
              <button
                type="button"
                onClick={toggleVideo}
                className={`p-3.5 sm:p-4 rounded-full transition-all active:scale-95 cursor-pointer ${
                  isVideoOff
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title={isVideoOff ? 'Turn camera on' : 'Turn camera off'}
              >
                {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={flipCamera}
                className="p-3.5 sm:p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 cursor-pointer"
                title="Flip Camera"
              >
                <SwitchCamera className="w-5 h-5" />
              </button>
            </>
          )}

          {/* End Call Button */}
          <button
            type="button"
            onClick={() => endCall(true)}
            className="p-3.5 sm:p-4 rounded-full bg-red-600 hover:bg-red-500 active:scale-90 text-white transition-all shadow-xl shadow-red-600/40 cursor-pointer"
            title="End Call"
          >
            <PhoneOff className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  )
}
