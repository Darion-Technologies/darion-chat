'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Settings,
  Copy,
  Check,
  ShieldAlert,
  Users,
  Radio,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { createAudioLevelDetector } from '@/lib/meet/webrtc'
import { useBranding } from '@/components/providers/BrandingProvider'

export interface LobbyViewProps {
  roomCode: string
  roomTitle: string
  isWaitingRoom: boolean
  isLocked: boolean
  initialName?: string
  onJoin: (
    name: string,
    muted: boolean,
    videoOff: boolean,
    stream: MediaStream | null,
    audioId?: string,
    videoId?: string
  ) => void
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  roomCode,
  roomTitle,
  isWaitingRoom,
  isLocked,
  initialName = '',
  onJoin,
}) => {
  const branding = useBranding()
  const [name, setName] = useState(initialName || 'Guest User')
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [copied, setCopied] = useState(false)
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedAudioId, setSelectedAudioId] = useState<string>('')
  const [selectedVideoId, setSelectedVideoId] = useState<string>('')
  const [showSettings, setShowSettings] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'insecure'>('prompt')
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false)

  const videoPreviewRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Explicit permission requester with fallbacks
  const requestMediaPermissions = async () => {
    if (typeof window === 'undefined') return

    // Check secure context
    if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setPermissionStatus('insecure')
      setPermissionError('Browsers block camera/mic over insecure HTTP. Please use HTTPS (e.g. your tunnel URL) or localhost.')
      return
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionStatus('denied')
      setPermissionError('Camera/Microphone API is not supported in this browser or over insecure HTTP.')
      return
    }

    setIsRequestingPermissions(true)
    setPermissionError(null)

    try {
      // 1. Try with ideal constraints
      const videoConstraints: MediaTrackConstraints = selectedVideoId
        ? { deviceId: { exact: selectedVideoId } }
        : { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }

      const audioConstraints: MediaTrackConstraints | boolean = selectedAudioId
        ? { deviceId: { exact: selectedAudioId } }
        : true

      let stream: MediaStream | null = null
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: audioConstraints,
        })
      } catch (firstErr: any) {
        if (firstErr?.name === 'NotFoundError' || firstErr?.name === 'DevicesNotFoundError') {
          // No devices detected
          setIsVideoOff(true)
          setIsMuted(true)
          setPermissionStatus('granted')
          setPermissionError('No physical camera or microphone detected. You can still join to view, chat, and listen.')
          return
        }
        // Fallback to basic true/true
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        } catch (secondErr: any) {
          if (secondErr?.name === 'NotFoundError' || secondErr?.name === 'DevicesNotFoundError') {
            setIsVideoOff(true)
            setIsMuted(true)
            setPermissionStatus('granted')
            setPermissionError('No physical camera or microphone detected. You can still join to view, chat, and listen.')
            return
          }
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true })
          } catch (thirdErr) {
            try {
              stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            } catch (fourthErr: any) {
              if (fourthErr?.name === 'NotFoundError' || fourthErr?.name === 'DevicesNotFoundError') {
                setIsVideoOff(true)
                setIsMuted(true)
                setPermissionStatus('granted')
                setPermissionError('No physical camera or microphone detected on this device.')
                return
              }
              throw fourthErr
            }
          }
        }
      }

      // Stop previous stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }

      if (stream) {
        streamRef.current = stream
        setPermissionStatus('granted')
        setPermissionError(null)

        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream
          videoPreviewRef.current.play().catch(() => {})
        }
      }

      // Detect available devices
      if (navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices()
        setAudioDevices(devices.filter((d) => d.kind === 'audioinput'))
        setVideoDevices(devices.filter((d) => d.kind === 'videoinput'))
      }
    } catch (err: any) {
      if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        setIsVideoOff(true)
        setIsMuted(true)
        setPermissionStatus('granted')
        setPermissionError('No camera or microphone found on this device.')
      } else {
        console.warn('Media permission request failed:', err)
        setPermissionStatus('denied')
        if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
          setPermissionError('Camera & Microphone permission was denied. Please click the camera/lock icon in your browser address bar to allow permissions.')
        } else {
          setPermissionError(err?.message || 'Failed to access camera and microphone.')
        }
      }
    } finally {
      setIsRequestingPermissions(false)
    }
  }

  const hasJoinedRef = useRef(false)

  // Initialize preview stream on mount
  useEffect(() => {
    let cleanupAudio: (() => void) | null = null

    requestMediaPermissions()

    const checkAudioLevel = () => {
      if (streamRef.current && streamRef.current.getAudioTracks().length > 0) {
        cleanupAudio = createAudioLevelDetector(streamRef.current, (level) => {
          setAudioLevel(level)
        })
      }
    }
    checkAudioLevel()

    return () => {
      cleanupAudio?.()
      // Only stop local tracks if user is navigating away or changing devices, NOT when joining the room
      if (!hasJoinedRef.current && streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [selectedAudioId, selectedVideoId])

  // Handle mute toggles
  const handleToggleMute = () => {
    const next = !isMuted
    setIsMuted(next)
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((t) => (t.enabled = !next))
    }
  }

  // Handle video toggles
  const handleToggleVideo = () => {
    const next = !isVideoOff
    setIsVideoOff(next)
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((t) => (t.enabled = !next))
    }
  }

  const handleCopyLink = () => {
    const meetUrl = `${window.location.origin}/meet/${roomCode}`
    navigator.clipboard.writeText(meetUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || isLocked) return
    hasJoinedRef.current = true
    onJoin(name.trim(), isMuted, isVideoOff, streamRef.current, selectedAudioId, selectedVideoId)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Dynamic Background Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Video Preview & Device Controls */}
        <div className="lg:col-span-7 flex flex-col items-center gap-4">
          <div className="relative w-full aspect-video bg-slate-900/90 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl shadow-black/60 flex items-center justify-center">
            {/* Live Video Element */}
            <video
              ref={videoPreviewRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-300 ${
                isVideoOff ? 'opacity-0' : 'opacity-100'
              }`}
            />

            {/* Permission Prompt / Error Overlay */}
            {permissionStatus !== 'granted' && !isVideoOff && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-slate-950/90 text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Video className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-white">Camera & Microphone Access</h4>
                <p className="text-xs text-slate-300 max-w-sm">
                  {permissionError || 'Click below to allow camera and microphone access for this meeting.'}
                </p>
                <button
                  type="button"
                  onClick={requestMediaPermissions}
                  disabled={isRequestingPermissions}
                  className="mt-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center cursor-pointer transition-all disabled:opacity-50"
                >
                  {isRequestingPermissions ? 'Requesting Permissions...' : 'Allow Camera & Microphone'}
                </button>
              </div>
            )}

            {/* Video Off Placeholder */}
            {isVideoOff && permissionStatus === 'granted' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                  {name.charAt(0).toUpperCase() || 'U'}
                </div>
                <p className="text-sm font-medium text-slate-400">Camera is turned off</p>
              </div>
            )}

            {/* Audio Level Visualizer Ring around bottom */}
            {!isMuted && audioLevel > 5 && (
              <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-emerald-500/40">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-300">Mic Active</span>
              </div>
            )}

            {/* Floating Media Controls inside Preview */}
            <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleToggleMute}
                className={`p-3.5 rounded-full backdrop-blur-md transition-all cursor-pointer shadow-lg ${
                  isMuted
                    ? 'bg-rose-500/90 text-white hover:bg-rose-600'
                    : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700/90 border border-slate-700'
                }`}
                title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={handleToggleVideo}
                className={`p-3.5 rounded-full backdrop-blur-md transition-all cursor-pointer shadow-lg ${
                  isVideoOff
                    ? 'bg-rose-500/90 text-white hover:bg-rose-600'
                    : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700/90 border border-slate-700'
                }`}
                title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
              >
                {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className="p-3.5 rounded-full backdrop-blur-md bg-slate-800/80 text-slate-200 hover:bg-slate-700/90 border border-slate-700 transition-all cursor-pointer shadow-lg"
                title="Device Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Mic Visualizer Bar */}
          <div className="w-full flex items-center gap-3 px-2">
            <Mic className={`w-4 h-4 ${isMuted ? 'text-rose-400' : 'text-slate-400'}`} />
            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-75 rounded-full"
                style={{ width: isMuted ? '0%' : `${Math.min(100, audioLevel * 1.5)}%` }}
              />
            </div>
            <span className="text-xs text-slate-400 w-12 text-right">
              {isMuted ? 'Muted' : audioLevel > 5 ? 'Speaking' : 'Quiet'}
            </span>
          </div>

          {/* Device Settings Drawer */}
          {showSettings && (
            <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 animate-fade-in backdrop-blur-md">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Microphone</label>
                <select
                  value={selectedAudioId}
                  onChange={(e) => setSelectedAudioId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {audioDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Camera</label>
                <select
                  value={selectedVideoId}
                  onChange={(e) => setSelectedVideoId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {videoDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Camera ${d.deviceId.slice(0, 5)}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Join Form & Meeting Information */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-3">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                {branding.appTitle} Meet
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{roomTitle}</h1>
              <p className="text-sm text-slate-400 mt-1">Ready to join this collaborative session?</p>
            </div>

            {/* Room Code Pill */}
            <div className="flex items-center justify-between p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/60">
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Room Code</span>
                <span className="text-base font-mono font-bold text-slate-200">{roomCode}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy Link'}
              </button>
            </div>

            {/* Lock Notice */}
            {isLocked && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-300 text-sm">
                <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />
                <span>This meeting has been locked by the host. New participants cannot join.</span>
              </div>
            )}

            {/* Waiting Room Notice */}
            {isWaitingRoom && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3 text-amber-300 text-xs">
                <Users className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Waiting Room is enabled. The host will admit you upon joining.</span>
              </div>
            )}

            {/* Join Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Your Display Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-slate-800/90 border border-slate-700 focus:border-blue-500 rounded-2xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all"
                />
              </div>

              <Button
                type="submit"
                disabled={isLocked || !name.trim()}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-base shadow-lg shadow-blue-600/25 flex items-center justify-center cursor-pointer transition-all"
              >
                {isWaitingRoom ? 'Ask to Join' : 'Join Meeting Now'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
