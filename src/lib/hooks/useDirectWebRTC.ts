import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { richHaptics } from '@/lib/utils/richHaptics'
import { soundEffects } from '@/lib/utils/soundEffects'

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
}

export interface DirectWebRTCOptions {
  callId: string
  isInitiator: boolean
  callType: 'audio' | 'video'
  onCallEnded?: () => void
}

export function useDirectWebRTC({
  callId,
  isInitiator,
  callType,
  onCallEnded,
}: DirectWebRTCOptions) {
  const [connectionStatus, setConnectionStatus] = useState<'initiating' | 'ringing' | 'connecting' | 'connected' | 'ended'>('initiating')
  const [callDuration, setCallDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(callType === 'audio')
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [audioVolume, setAudioVolume] = useState(0) // 0 - 100 for live waveform
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')

  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const signalingChannelRef = useRef<any>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null)

  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize Media Streams (Microphone & Camera)
  const startMedia = useCallback(async () => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video:
          callType === 'video'
            ? {
                facingMode: facingMode,
                width: { ideal: 1280 },
                height: { ideal: 720 },
              }
            : false,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      localStreamRef.current = stream

      if (localVideoRef.current && callType === 'video') {
        localVideoRef.current.srcObject = stream
      }

      // Setup Web Audio Analyser for live visualizer waveform
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        if (AudioCtx) {
          const audioCtx = new AudioCtx()
          audioContextRef.current = audioCtx
          const source = audioCtx.createMediaStreamSource(stream)
          const analyser = audioCtx.createAnalyser()
          analyser.fftSize = 64
          source.connect(analyser)
          analyserRef.current = analyser

          const dataArray = new Uint8Array(analyser.frequencyBinCount)
          const updateVolume = () => {
            if (analyserRef.current) {
              analyserRef.current.getByteFrequencyData(dataArray)
              let sum = 0
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i]
              }
              const avg = sum / dataArray.length
              setAudioVolume(Math.min(100, Math.round((avg / 128) * 100)))
            }
            animationFrameRef.current = requestAnimationFrame(updateVolume)
          }
          updateVolume()
        }
      } catch {}

      return stream
    } catch (err) {
      console.error('Error accessing media devices:', err)
      return null
    }
  }, [callType, facingMode])

  // Setup Peer Connection
  useEffect(() => {
    let isCancelled = false
    const supabase = createClient()
    const channelName = `direct-call-signal-${callId}`
    const channel = supabase.channel(channelName)
    signalingChannelRef.current = channel

    const pc = new RTCPeerConnection(ICE_SERVERS)
    peerConnectionRef.current = pc

    pc.onicecandidate = (event) => {
      if (event.candidate && channel) {
        channel.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: { candidate: event.candidate, isInitiator },
        })
      }
    }

    pc.ontrack = (event) => {
      const stream = event.streams[0]
      remoteStreamRef.current = stream

      if (remoteVideoRef.current && callType === 'video') {
        remoteVideoRef.current.srcObject = stream
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream
        remoteAudioRef.current.play().catch(() => {})
      }
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setConnectionStatus('connected')
        soundEffects.stopRinging()
        richHaptics.success()

        // Start call duration timer
        if (!durationTimerRef.current) {
          durationTimerRef.current = setInterval(() => {
            setCallDuration((prev) => prev + 1)
          }, 1000)
        }
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        setConnectionStatus('ended')
      }
    }

    // Initialize local media and add tracks to PC
    startMedia().then(async (stream) => {
      if (!stream || isCancelled) return

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream)
      })

      // Signaling Listeners
      channel
        .on('broadcast', { event: 'offer' }, async ({ payload }) => {
          if (isInitiator) return
          try {
            setConnectionStatus('connecting')
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            channel.send({
              type: 'broadcast',
              event: 'answer',
              payload: { sdp: answer },
            })
          } catch (e) {
            console.error('Error handling offer:', e)
          }
        })
        .on('broadcast', { event: 'answer' }, async ({ payload }) => {
          if (!isInitiator) return
          try {
            setConnectionStatus('connecting')
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
          } catch (e) {
            console.error('Error handling answer:', e)
          }
        })
        .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
          if (payload.isInitiator === isInitiator) return
          try {
            if (payload.candidate) {
              await pc.addIceCandidate(new RTCIceCandidate(payload.candidate))
            }
          } catch (e) {
            console.error('Error adding ICE candidate:', e)
          }
        })
        .on('broadcast', { event: 'call_ended' }, () => {
          endCall(false)
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED' && isInitiator) {
            try {
              setConnectionStatus('ringing')
              const offer = await pc.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: callType === 'video',
              })
              await pc.setLocalDescription(offer)
              channel.send({
                type: 'broadcast',
                event: 'offer',
                payload: { sdp: offer },
              })
            } catch (e) {
              console.error('Error creating offer:', e)
            }
          }
        })
    })

    return () => {
      isCancelled = true
      if (channel) supabase.removeChannel(channel)
      if (pc) pc.close()
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {})
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current)
      }
    }
  }, [callId, callType, isInitiator, startMedia])

  // Toggle Microphone Mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
        richHaptics.impact('light')
      }
    }
  }, [])

  // Toggle Video Camera
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoOff(!videoTrack.enabled)
        richHaptics.impact('light')
      }
    }
  }, [])

  // Flip Camera (Front / Back on Mobile)
  const flipCamera = useCallback(async () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(nextMode)
    richHaptics.impact('medium')

    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.stop()
      }

      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: nextMode },
        })
        const newTrack = newStream.getVideoTracks()[0]

        if (peerConnectionRef.current) {
          const sender = peerConnectionRef.current
            .getSenders()
            .find((s) => s.track && s.track.kind === 'video')
          if (sender) {
            sender.replaceTrack(newTrack)
          }
        }

        localStreamRef.current.removeTrack(videoTrack)
        localStreamRef.current.addTrack(newTrack)

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current
        }
      } catch (err) {
        console.error('Error flipping camera:', err)
      }
    }
  }, [facingMode])

  // End Call Handler
  const endCall = useCallback(
    (broadcast = true) => {
      richHaptics.impact('heavy')
      soundEffects.playCallEndedSound()
      soundEffects.stopRinging()
      setConnectionStatus('ended')

      if (broadcast && signalingChannelRef.current) {
        signalingChannelRef.current.send({
          type: 'broadcast',
          event: 'call_ended',
          payload: { callId },
        })
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop())
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
      }
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current)
      }

      if (onCallEnded) {
        onCallEnded()
      }
    },
    [callId, onCallEnded]
  )

  return {
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
  }
}
