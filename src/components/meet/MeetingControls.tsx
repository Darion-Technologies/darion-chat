'use client'

import React, { useState } from 'react'
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  StopCircle,
  MessageSquare,
  Users,
  Shield,
  PenTool,
  PhoneOff,
  Smile,
  CircleDot,
  Radio,
} from 'lucide-react'

export interface MeetingControlsProps {
  isAudioEnabled: boolean
  isVideoEnabled: boolean
  isScreenSharing: boolean
  isHandRaised: boolean
  isRecording: boolean
  recordingSeconds: number
  isUploadingRecording?: boolean
  unreadChatCount: number
  participantsCount: number
  waitingCount: number
  userRole: 'host' | 'co-host' | 'participant'
  activeSidebarTab: 'chat' | 'participants' | 'whiteboard' | 'info' | null
  onToggleAudio: () => void
  onToggleVideo: () => void
  onToggleScreenShare: () => void
  onToggleHandRaise: () => void
  onSendReaction: (emoji: string) => void
  onToggleRecording: () => void
  onToggleSidebarTab: (tab: 'chat' | 'participants' | 'whiteboard' | 'info') => void
  onOpenHostControls: () => void
  onLeaveMeeting: () => void
  onEndMeetingForAll?: () => void
}

const EMOJIS = ['👍', '❤️', '👏', '🎉', '🔥', '🚀', '😂', '💡']

export const MeetingControls: React.FC<MeetingControlsProps> = ({
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  isHandRaised,
  isRecording,
  recordingSeconds,
  isUploadingRecording,
  unreadChatCount,
  participantsCount,
  waitingCount,
  userRole,
  activeSidebarTab,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleHandRaise,
  onSendReaction,
  onToggleRecording,
  onToggleSidebarTab,
  onOpenHostControls,
  onLeaveMeeting,
  onEndMeetingForAll,
}) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const [showLeaveModal, setShowLeaveModal] = useState(false)

  const isHost = userRole === 'host' || userRole === 'co-host'

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <>
      <div className="fixed bottom-4 inset-x-0 z-40 flex items-center justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto bg-slate-950/85 backdrop-blur-2xl border border-slate-800/80 rounded-full px-4 py-2.5 shadow-2xl shadow-black/80 flex items-center gap-2 md:gap-3">
          {/* Recording Badge & Button */}
          {isRecording && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/20 border border-rose-500/40 rounded-full mr-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-mono font-bold text-rose-300">
                REC {formatTime(recordingSeconds)}
              </span>
            </div>
          )}

          {/* Microphone Toggle */}
          <button
            type="button"
            onClick={onToggleAudio}
            className={`p-3 rounded-full transition-all cursor-pointer shadow-md ${
              isAudioEnabled
                ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700'
                : 'bg-rose-500 text-white hover:bg-rose-600'
            }`}
            title={isAudioEnabled ? 'Turn off microphone (Mute)' : 'Turn on microphone (Unmute)'}
          >
            {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* Camera Toggle */}
          <button
            type="button"
            onClick={onToggleVideo}
            className={`p-3 rounded-full transition-all cursor-pointer shadow-md ${
              isVideoEnabled
                ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700'
                : 'bg-rose-500 text-white hover:bg-rose-600'
            }`}
            title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* Screen Share Toggle */}
          <button
            type="button"
            onClick={onToggleScreenShare}
            className={`p-3 rounded-full transition-all cursor-pointer shadow-md ${
              isScreenSharing
                ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/30'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title={isScreenSharing ? 'Stop sharing screen' : 'Share entire screen or window'}
          >
            {isScreenSharing ? <StopCircle className="w-5 h-5" /> : <ScreenShare className="w-5 h-5" />}
          </button>

          {/* Hand Raise & Reactions Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              className={`p-3 rounded-full transition-all cursor-pointer shadow-md ${
                isHandRaised
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
              title="Reactions & Hand Raise"
            >
              {isHandRaised ? <span className="text-base">✋</span> : <Smile className="w-5 h-5" />}
            </button>

            {/* Reaction Popover */}
            {showReactionPicker && (
              <div
                onMouseLeave={() => setShowReactionPicker(false)}
                className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-3xl p-3 shadow-2xl flex flex-col gap-2 z-50 animate-scale-in min-w-[240px]"
              >
                {/* Hand Raise Button */}
                <button
                  type="button"
                  onClick={() => {
                    onToggleHandRaise()
                    setShowReactionPicker(false)
                  }}
                  className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    isHandRaised
                      ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                      : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  <span className="text-base">✋</span>
                  <span>{isHandRaised ? 'Lower Hand' : 'Raise Hand'}</span>
                </button>

                <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-slate-800">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        onSendReaction(emoji)
                        setShowReactionPicker(false)
                      }}
                      className="p-2 rounded-xl text-xl hover:bg-slate-800 hover:scale-125 transition-all text-center cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-slate-800 mx-1 hidden sm:block" />

          {/* In-Browser Recording Toggle */}
          <button
            type="button"
            onClick={onToggleRecording}
            disabled={isUploadingRecording}
            className={`p-3 rounded-full transition-all cursor-pointer shadow-md ${
              isRecording
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title={
              isUploadingRecording
                ? 'Saving recording...'
                : isRecording
                ? 'Stop Recording'
                : 'Record Full Meeting'
            }
          >
            <CircleDot className={`w-5 h-5 ${isRecording ? 'text-white' : 'text-rose-400'}`} />
          </button>

          {/* Whiteboard Toggle */}
          <button
            type="button"
            onClick={() => onToggleSidebarTab('whiteboard')}
            className={`p-3 rounded-full transition-all cursor-pointer shadow-md ${
              activeSidebarTab === 'whiteboard'
                ? 'bg-indigo-600 text-white shadow-indigo-500/30'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title="Collaborative Whiteboard"
          >
            <PenTool className="w-5 h-5" />
          </button>

          {/* Chat Sidebar Toggle */}
          <button
            type="button"
            onClick={() => onToggleSidebarTab('chat')}
            className={`relative p-3 rounded-full transition-all cursor-pointer shadow-md ${
              activeSidebarTab === 'chat'
                ? 'bg-blue-600 text-white shadow-blue-500/30'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title="In-meeting Chat"
          >
            <MessageSquare className="w-5 h-5" />
            {unreadChatCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-slate-950">
                {unreadChatCount}
              </span>
            )}
          </button>

          {/* Participants Toggle */}
          <button
            type="button"
            onClick={() => onToggleSidebarTab('participants')}
            className={`relative p-3 rounded-full transition-all cursor-pointer shadow-md ${
              activeSidebarTab === 'participants'
                ? 'bg-blue-600 text-white shadow-blue-500/30'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title="Participants List"
          >
            <Users className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 px-1.5 h-4 rounded-full bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center justify-center ring-2 ring-slate-950">
              {participantsCount}
            </span>
            {waitingCount > 0 && isHost && (
              <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-amber-400 animate-ping ring-2 ring-slate-950" />
            )}
          </button>

          {/* Host Controls */}
          {isHost && (
            <button
              type="button"
              onClick={onOpenHostControls}
              className="p-3 rounded-full bg-slate-800/80 hover:bg-slate-700 text-blue-400 border border-slate-700 transition-all cursor-pointer shadow-md"
              title="Host Controls & Security"
            >
              <Shield className="w-5 h-5" />
            </button>
          )}

          {/* Leave / End Call Button */}
          <button
            type="button"
            onClick={() => setShowLeaveModal(true)}
            className="p-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white transition-all cursor-pointer shadow-lg shadow-rose-600/30"
            title="Leave Meeting"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Leave / End Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 animate-scale-in">
            <h3 className="text-lg font-bold text-white">Leave Meeting?</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to leave this meeting session?
            </p>

            <div className="flex flex-col gap-2 pt-2">
              {isHost && onEndMeetingForAll && (
                <button
                  type="button"
                  onClick={() => {
                    setShowLeaveModal(false)
                    onEndMeetingForAll()
                  }}
                  className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all cursor-pointer"
                >
                  End Meeting for All
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowLeaveModal(false)
                  onLeaveMeeting()
                }}
                className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all cursor-pointer"
              >
                Just Leave Meeting
              </button>
              <button
                type="button"
                onClick={() => setShowLeaveModal(false)}
                className="w-full py-2.5 rounded-2xl text-slate-400 hover:text-slate-200 text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
