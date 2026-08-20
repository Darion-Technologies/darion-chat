'use client'

import React, { useEffect, useRef } from 'react'
import {
  Mic,
  MicOff,
  Pin,
  PinOff,
  Shield,
  MoreVertical,
  UserX,
  VolumeX,
  Monitor,
} from 'lucide-react'
import { RemoteParticipant } from '@/lib/meet/useMeetRoom'

export interface VideoTileProps {
  id: string
  name: string
  role: 'host' | 'co-host' | 'participant'
  hasAudio: boolean
  hasVideo: boolean
  isScreenShare?: boolean
  isHandRaised?: boolean
  audioLevel?: number
  stream?: MediaStream
  isLocal?: boolean
  isPinned?: boolean
  isActiveSpeaker?: boolean
  userRole?: 'host' | 'co-host' | 'participant'
  onPin?: () => void
  onMute?: () => void
  onKick?: () => void
}

export const VideoTile: React.FC<VideoTileProps> = ({
  id,
  name,
  role,
  hasAudio,
  hasVideo,
  isScreenShare = false,
  isHandRaised = false,
  audioLevel = 0,
  stream,
  isLocal = false,
  isPinned = false,
  isActiveSpeaker = false,
  userRole = 'participant',
  onPin,
  onMute,
  onKick,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [showMenu, setShowMenu] = React.useState(false)

  // Attach and play stream reliably on video element
  const attachStream = React.useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el
    if (!el) return

    el.defaultMuted = isLocal
    el.muted = isLocal
    el.playsInline = true
    el.autoplay = true

    if (stream) {
      if (el.srcObject !== stream) {
        el.srcObject = stream
      }
      const p = el.play()
      if (p !== undefined) {
        p.catch(() => {
          el.muted = true
          el.defaultMuted = true
          el.play().catch(() => {})
        })
      }
    } else {
      el.srcObject = null
    }
  }, [stream, isLocal])

  useEffect(() => {
    attachStream(videoRef.current)
  }, [attachStream])

  const isSpeaking = (audioLevel || 0) > 25 && hasAudio
  const canModerate = (userRole === 'host' || userRole === 'co-host') && !isLocal

  return (
    <div
      className={`relative w-full h-full bg-slate-900 rounded-3xl overflow-hidden border transition-all duration-300 group flex items-center justify-center ${
        isSpeaking
          ? 'border-emerald-500 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500/50'
          : isPinned
          ? 'border-blue-500 shadow-lg shadow-blue-500/20'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Video Element */}
      {stream && (hasVideo || isScreenShare) && (
        <video
          ref={attachStream}
          autoPlay
          playsInline
          muted={isLocal}
          onLoadedMetadata={(e) => {
            const video = e.currentTarget
            video.muted = isLocal
            video.play().catch(() => {})
          }}
          onCanPlay={(e) => {
            const video = e.currentTarget
            video.play().catch(() => {})
          }}
          className={`w-full h-full ${
            isScreenShare ? 'object-contain bg-black' : 'object-cover'
          } ${
            isLocal && !isScreenShare ? 'transform -scale-x-100' : ''
          }`}
        />
      )}

      {/* Avatar Fallback when video is off */}
      {(!hasVideo && !isScreenShare) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-slate-900 to-slate-950">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-3xl md:text-4xl font-bold text-white shadow-xl">
            {(name[0] || 'U').toUpperCase()}
          </div>
          <span className="text-sm font-semibold text-slate-300">{name}</span>
        </div>
      )}

      {/* Top Indicators: Pin & Hand Raise */}
      <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2">
          {isHandRaised && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/90 backdrop-blur-md rounded-full shadow-lg animate-bounce text-slate-950 font-bold text-xs">
              <span>✋</span>
              <span>Hand Raised</span>
            </div>
          )}
          {isScreenShare && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-600/90 backdrop-blur-md rounded-full shadow-lg text-white font-semibold text-xs">
              <Monitor className="w-3.5 h-3.5" />
              <span>Screen Share</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity">
          {onPin && (
            <button
              onClick={onPin}
              className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-200 backdrop-blur-md border border-slate-700 transition-all cursor-pointer shadow-md"
              title={isPinned ? 'Unpin' : 'Pin to spotlight'}
            >
              {isPinned ? <PinOff className="w-4 h-4 text-blue-400" /> : <Pin className="w-4 h-4" />}
            </button>
          )}

          {canModerate && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-200 backdrop-blur-md border border-slate-700 transition-all cursor-pointer shadow-md"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <div
                  onMouseLeave={() => setShowMenu(false)}
                  className="absolute right-0 top-full mt-2 w-44 bg-slate-900 border border-slate-700 rounded-2xl p-1.5 shadow-2xl z-30 flex flex-col gap-1"
                >
                  {onMute && hasAudio && (
                    <button
                      onClick={() => {
                        onMute()
                        setShowMenu(false)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 text-left cursor-pointer"
                    >
                      <VolumeX className="w-4 h-4 text-rose-400" />
                      Mute Participant
                    </button>
                  )}
                  {onKick && (
                    <button
                      onClick={() => {
                        onKick()
                        setShowMenu(false)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 text-left cursor-pointer"
                    >
                      <UserX className="w-4 h-4" />
                      Remove from Meet
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Information Pill: Name & Mic Status */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2 max-w-[80%] bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-800">
          {role === 'host' && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-blue-600/30 text-blue-400 px-1.5 py-0.5 rounded-md border border-blue-500/30">
              <Shield className="w-3 h-3" /> Host
            </span>
          )}
          <span className="text-xs font-medium text-slate-200 truncate">
            {name} {isLocal ? '(You)' : ''}
          </span>
        </div>

        <div
          className={`p-1.5 rounded-full backdrop-blur-md shadow-md ${
            hasAudio
              ? isSpeaking
                ? 'bg-emerald-500/90 text-slate-950 animate-pulse'
                : 'bg-slate-950/70 text-slate-300 border border-slate-800'
              : 'bg-rose-500/90 text-white'
          }`}
        >
          {hasAudio ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
        </div>
      </div>
    </div>
  )
}

export interface MeetingStageProps {
  localStream: MediaStream | null
  localVideoRef?: React.RefObject<HTMLVideoElement | null>
  userName: string
  userRole: 'host' | 'co-host' | 'participant'
  isAudioEnabled: boolean
  isVideoEnabled: boolean
  isScreenSharing: boolean
  isHandRaised: boolean
  localAudioLevel: number
  participants: Map<string, RemoteParticipant>
  pinnedPeerId: string | null
  activeSpeakerId: string | null
  onPin: (peerId: string | null) => void
  onMuteUser: (peerId: string) => void
  onKickUser: (peerId: string) => void
}

export const MeetingStage: React.FC<MeetingStageProps> = ({
  localStream,
  localVideoRef,
  userName,
  userRole,
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  isHandRaised,
  localAudioLevel,
  participants,
  pinnedPeerId,
  activeSpeakerId,
  onPin,
  onMuteUser,
  onKickUser,
}) => {
  const remoteList = Array.from(participants.values())
  const totalCount = remoteList.length + 1

  // Check if any participant (local or remote) is sharing screen
  const screenShareParticipant = remoteList.find((p) => p.isScreenSharing)
  const isAnyScreenSharing = isScreenSharing || !!screenShareParticipant
  const activeSpotlightId = pinnedPeerId || (isScreenSharing ? 'local' : screenShareParticipant ? screenShareParticipant.id : null)

  // Spotlight / Presentation Mode
  if (activeSpotlightId) {
    const isLocalSpotlight = activeSpotlightId === 'local'
    const spotlightPeer = remoteList.find((p) => p.id === activeSpotlightId)

    return (
      <div className="w-full h-full flex flex-col lg:flex-row gap-4 p-4">
        {/* Main Spotlight Frame */}
        <div className="flex-1 h-[60vh] lg:h-full">
          {isLocalSpotlight ? (
            <VideoTile
              id="local"
              name={userName}
              role={userRole}
              hasAudio={isAudioEnabled}
              hasVideo={isVideoEnabled}
              isScreenShare={isScreenSharing}
              isHandRaised={isHandRaised}
              audioLevel={localAudioLevel}
              stream={localStream || undefined}
              isLocal
              isPinned={pinnedPeerId === 'local'}
              onPin={() => onPin(null)}
            />
          ) : spotlightPeer ? (
            <VideoTile
              id={spotlightPeer.id}
              name={spotlightPeer.name}
              role={spotlightPeer.role}
              hasAudio={spotlightPeer.hasAudio}
              hasVideo={spotlightPeer.hasVideo || spotlightPeer.isScreenSharing}
              isScreenShare={spotlightPeer.isScreenSharing}
              isHandRaised={spotlightPeer.isHandRaised}
              audioLevel={spotlightPeer.audioLevel}
              stream={spotlightPeer.stream}
              isPinned={pinnedPeerId === spotlightPeer.id}
              userRole={userRole}
              onPin={() => onPin(null)}
              onMute={() => onMuteUser(spotlightPeer.id)}
              onKick={() => onKickUser(spotlightPeer.id)}
            />
          ) : null}
        </div>

        {/* Filmstrip of other participants */}
        <div className="w-full lg:w-72 h-44 lg:h-full flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto shrink-0 pb-2">
          {!isLocalSpotlight && (
            <div className="w-60 lg:w-full aspect-video shrink-0">
              <VideoTile
                id="local"
                name={userName}
                role={userRole}
                hasAudio={isAudioEnabled}
                hasVideo={isVideoEnabled}
                isScreenShare={isScreenSharing}
                isHandRaised={isHandRaised}
                audioLevel={localAudioLevel}
                stream={localStream || undefined}
                isLocal
                onPin={() => onPin('local')}
              />
            </div>
          )}

          {remoteList
            .filter((p) => p.id !== activeSpotlightId)
            .map((p) => (
              <div key={p.id} className="w-60 lg:w-full aspect-video shrink-0">
                <VideoTile
                  id={p.id}
                  name={p.name}
                  role={p.role}
                  hasAudio={p.hasAudio}
                  hasVideo={p.hasVideo}
                  isScreenShare={p.isScreenSharing}
                  isHandRaised={p.isHandRaised}
                  audioLevel={p.audioLevel}
                  stream={p.stream}
                  userRole={userRole}
                  onPin={() => onPin(p.id)}
                  onMute={() => onMuteUser(p.id)}
                  onKick={() => onKickUser(p.id)}
                />
              </div>
            ))}
        </div>
      </div>
    )
  }

  // Dynamic Grid Layout Mode
  let gridColsClass = 'grid-cols-1'
  if (totalCount === 2) {
    gridColsClass = 'grid-cols-1 md:grid-cols-2'
  } else if (totalCount <= 4) {
    gridColsClass = 'grid-cols-1 md:grid-cols-2'
  } else if (totalCount <= 6) {
    gridColsClass = 'grid-cols-1 md:grid-cols-3'
  } else {
    gridColsClass = 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4'
  }

  return (
    <div className={`w-full h-full p-4 grid ${gridColsClass} gap-4 auto-rows-fr`}>
      {/* Local Video Tile */}
      <VideoTile
        id="local"
        name={userName}
        role={userRole}
        hasAudio={isAudioEnabled}
        hasVideo={isVideoEnabled}
        isScreenShare={isScreenSharing}
        isHandRaised={isHandRaised}
        audioLevel={localAudioLevel}
        stream={localStream || undefined}
        isLocal
        isActiveSpeaker={activeSpeakerId === 'local'}
        onPin={() => onPin('local')}
      />

      {/* Remote Video Tiles */}
      {remoteList.map((p) => (
        <VideoTile
          key={p.id}
          id={p.id}
          name={p.name}
          role={p.role}
          hasAudio={p.hasAudio}
          hasVideo={p.hasVideo}
          isScreenShare={p.isScreenSharing}
          isHandRaised={p.isHandRaised}
          audioLevel={p.audioLevel}
          stream={p.stream}
          isActiveSpeaker={activeSpeakerId === p.id}
          userRole={userRole}
          onPin={() => onPin(p.id)}
          onMute={() => onMuteUser(p.id)}
          onKick={() => onKickUser(p.id)}
        />
      ))}
    </div>
  )
}
