'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createPeerConnection, createAudioLevelDetector, replaceVideoTrack } from './webrtc'
import { MeetRecorder, ParticipantStreamInfo } from './recorder'
import { endMeetingAction, uploadMeetingRecordingAction } from '@/app/actions/meet'

export interface RemoteParticipant {
  id: string
  name: string
  role: 'host' | 'co-host' | 'participant'
  hasAudio: boolean
  hasVideo: boolean
  isScreenSharing: boolean
  isHandRaised: boolean
  audioLevel: number
  stream?: MediaStream
  videoElement?: HTMLVideoElement | null
}

export interface WaitingParticipant {
  id: string
  name: string
  requestedAt: string
}

export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  senderRole: string
  message: string
  fileUrl?: string | null
  fileName?: string | null
  isPrivate?: boolean
  recipientId?: string | null
  timestamp: string
}

export interface ReactionItem {
  id: string
  emoji: string
  senderName: string
}

export interface WhiteboardStroke {
  points: { x: number; y: number }[]
  color: string
  size: number
  tool: 'pen' | 'highlighter' | 'eraser'
}

export interface RoomPermissions {
  allowScreenShare: boolean
  allowChat: boolean
  allowUnmute: boolean
  allowVideo: boolean
}

export interface UseMeetRoomProps {
  roomId: string
  roomCode: string
  roomTitle: string
  userId: string
  userName: string
  userRole: 'host' | 'co-host' | 'participant'
  initialMuted?: boolean
  initialVideoOff?: boolean
  initialStream?: MediaStream | null
  audioDeviceId?: string
  videoDeviceId?: string
}

export function useMeetRoom({
  roomId,
  roomCode,
  roomTitle,
  userId,
  userName,
  userRole,
  initialMuted = false,
  initialVideoOff = false,
  initialStream,
  audioDeviceId,
  videoDeviceId,
}: UseMeetRoomProps) {
  const supabase = useMemo(() => createClient(), [])

  // Meeting Room Status
  const [roomStatus, setRoomStatus] = useState<'lobby' | 'waiting' | 'in_meeting' | 'kicked' | 'ended'>('in_meeting')
  const [isLocked, setIsLocked] = useState(false)
  const [isWaitingRoomEnabled, setIsWaitingRoomEnabled] = useState(false)
  const [permissions, setPermissions] = useState<RoomPermissions>({
    allowScreenShare: true,
    allowChat: true,
    allowUnmute: true,
    allowVideo: true,
  })

  // Local Media State
  const [isAudioEnabled, setIsAudioEnabled] = useState(!initialMuted)
  const [isVideoEnabled, setIsVideoEnabled] = useState(!initialVideoOff)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isHandRaised, setIsHandRaised] = useState(false)
  const [localAudioLevel, setLocalAudioLevel] = useState(0)

  // Local Streams State & Refs
  const [localStream, setLocalStream] = useState<MediaStream | null>(initialStream || null)
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)
  const localStreamRef = useRef<MediaStream | null>(initialStream || null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const localVideoRef = useRef<HTMLVideoElement | null>(null)

  // Remote Participants State
  const [participants, setParticipants] = useState<Map<string, RemoteParticipant>>(new Map())
  const [waitingList, setWaitingList] = useState<WaitingParticipant[]>([])
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const audioCleanupsRef = useRef<Map<string, () => void>>(new Map())

  // In-Meeting Chat, Reactions & Whiteboard
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [reactions, setReactions] = useState<ReactionItem[]>([])
  const [whiteboardStrokes, setWhiteboardStrokes] = useState<WhiteboardStroke[]>([])

  // Recording
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [isUploadingRecording, setIsUploadingRecording] = useState(false)
  const recorderRef = useRef<MeetRecorder | null>(null)

  // Pin & Active Speaker
  const [pinnedPeerId, setPinnedPeerId] = useState<string | null>(null)
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null)

  // Supabase Channel Ref
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // Use a ref for audio enabled state so initLocalMedia doesn't change reference on mute/unmute
  const isAudioEnabledRef = useRef(isAudioEnabled)
  useEffect(() => {
    isAudioEnabledRef.current = isAudioEnabled
  }, [isAudioEnabled])

  // Initialize Local Media
  const initLocalMedia = useCallback(async () => {
    if (typeof window === 'undefined') {
      const emptyStream = new MediaStream()
      localStreamRef.current = emptyStream
      return emptyStream
    }

    // 1. If live initialStream was handed over directly from Lobby, adopt it immediately
    if (initialStream && initialStream.getTracks().some((t) => t.readyState === 'live')) {
      localStreamRef.current = initialStream
      setLocalStream(initialStream)

      // Apply initial muted/video off states
      initialStream.getAudioTracks().forEach((t) => {
        t.enabled = !initialMuted
      })
      initialStream.getVideoTracks().forEach((t) => {
        t.enabled = !initialVideoOff
      })

      // Local audio level detector
      createAudioLevelDetector(initialStream, (level) => {
        setLocalAudioLevel(level)
        if (level > 25 && isAudioEnabledRef.current) {
          setActiveSpeakerId('local')
        }
      })

      return initialStream
    }

    // 2. Otherwise safely query getUserMedia with constraints
    try {
      let stream: MediaStream
      try {
        const videoConstraints: MediaTrackConstraints = videoDeviceId
          ? { deviceId: { exact: videoDeviceId } }
          : { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
          
        const audioConstraints: MediaTrackConstraints | boolean = audioDeviceId
          ? { deviceId: { exact: audioDeviceId } }
          : true

        stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: audioConstraints,
        })
      } catch (firstErr) {
        console.warn('Ideal media constraints failed in room, trying basic:', firstErr)
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        } catch (secondErr) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true })
          } catch (thirdErr) {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          }
        }
      }

      localStreamRef.current = stream
      setLocalStream(stream)

      // Apply initial muted/video off states
      stream.getAudioTracks().forEach((t) => {
        t.enabled = !initialMuted
      })
      stream.getVideoTracks().forEach((t) => {
        t.enabled = !initialVideoOff
      })

      // Local audio level detector
      createAudioLevelDetector(stream, (level) => {
        setLocalAudioLevel(level)
        if (level > 25 && isAudioEnabledRef.current) {
          setActiveSpeakerId('local')
        }
      })

      return stream
    } catch (err: any) {
      if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        console.info('No webcam/microphone detected on this device. Initialized with audio/video disabled.')
      } else {
        console.warn('Could not acquire media devices, using empty stream:', err)
      }
      const emptyStream = new MediaStream()
      localStreamRef.current = emptyStream
      setLocalStream(emptyStream)
      return emptyStream
    }
  }, [initialStream, initialMuted, initialVideoOff, audioDeviceId, videoDeviceId])

  // Setup Peer Connection
  const createPeer = useCallback(
    (peerId: string, initiator: boolean) => {
      if (peersRef.current.has(peerId)) {
        return peersRef.current.get(peerId)!
      }

      const pc = createPeerConnection(peerId, {
        onTrack: (event) => {
          setParticipants((prev) => {
            const next = new Map(prev)
            const existing = next.get(peerId)

            if (event.track) {
              event.track.enabled = true
            }

            let streamToUse: MediaStream
            if (event.streams && event.streams[0]) {
              streamToUse = event.streams[0]
            } else if (existing?.stream) {
              if (!existing.stream.getTracks().some((t) => t.id === event.track.id)) {
                existing.stream.addTrack(event.track)
              }
              streamToUse = existing.stream
            } else {
              streamToUse = new MediaStream([event.track])
            }

            streamToUse.getTracks().forEach((t) => {
              t.enabled = true
            })

            const hasAudioTrack = streamToUse.getAudioTracks().length > 0
            const hasVideoTrack = streamToUse.getVideoTracks().length > 0

            if (existing) {
              next.set(peerId, {
                ...existing,
                stream: streamToUse,
                hasAudio: hasAudioTrack || existing.hasAudio,
                hasVideo: hasVideoTrack || existing.hasVideo,
              })
            } else {
              next.set(peerId, {
                id: peerId,
                name: 'Participant',
                role: 'participant',
                hasAudio: hasAudioTrack,
                hasVideo: hasVideoTrack,
                isScreenSharing: false,
                isHandRaised: false,
                audioLevel: 0,
                stream: streamToUse,
              })
            }

            // Setup remote audio level detection if audio track exists
            if (streamToUse.getAudioTracks().length > 0) {
              if (audioCleanupsRef.current.has(peerId)) {
                audioCleanupsRef.current.get(peerId)! ()
              }
              const cleanup = createAudioLevelDetector(streamToUse, (level) => {
                setParticipants((p) => {
                  const current = p.get(peerId)
                  if (!current || current.audioLevel === level) return p
                  const updated = new Map(p)
                  updated.set(peerId, { ...current, audioLevel: level })
                  return updated
                })
                if (level > 25) {
                  setActiveSpeakerId(peerId)
                }
              })
              audioCleanupsRef.current.set(peerId, cleanup)
            }

            return next
          })
        },
        onIceCandidate: (candidate) => {
          channelRef.current?.send({
            type: 'broadcast',
            event: 'ice-candidate',
            payload: { from: userId, to: peerId, candidate },
          })
        },
        onConnectionStateChange: (state) => {
          if (state === 'disconnected' || state === 'failed' || state === 'closed') {
            peersRef.current.delete(peerId)
            setParticipants((prev) => {
              const next = new Map(prev)
              next.delete(peerId)
              return next
            })
          }
        },
      })

      // Always add local camera/mic tracks to peer connection
      const streamToSend = localStreamRef.current || initialStream
      if (streamToSend) {
        streamToSend.getTracks().forEach((track) => {
          pc.addTrack(track, streamToSend)
        })
      }

      // If screen sharing is active when a new peer connects, immediately send screen track
      if (isScreenSharing && screenStreamRef.current) {
        const screenVideoTrack = screenStreamRef.current.getVideoTracks()[0]
        if (screenVideoTrack) {
          setTimeout(() => {
            replaceVideoTrack(pc, screenVideoTrack, screenStreamRef.current)
          }, 100)
        }
      }

      peersRef.current.set(peerId, pc)

      if (initiator) {
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            channelRef.current?.send({
              type: 'broadcast',
              event: 'offer',
              payload: {
                from: userId,
                to: peerId,
                offer: pc.localDescription,
                name: userName,
                role: userRole,
                hasAudio: isAudioEnabled,
                hasVideo: isVideoEnabled,
                isScreenShare: isScreenSharing,
              },
            })
          })
          .catch((e) => console.error('Error creating offer:', e))
      }

      return pc
    },
    [userId, userName, userRole, isAudioEnabled, isVideoEnabled, isScreenSharing, initialStream]
  )

  const cleanup = useCallback(() => {
    // Close all peer connections
    peersRef.current.forEach((pc) => pc.close())
    peersRef.current.clear()

    // Clean audio monitors
    audioCleanupsRef.current.forEach((clean) => clean())
    audioCleanupsRef.current.clear()

    // Stop local media
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop())
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop())
    }

    // Send user-left broadcast
    channelRef.current?.send({
      type: 'broadcast',
      event: 'user-left',
      payload: { from: userId },
    })

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }
  }, [userId, supabase])

  // Setup Supabase Realtime Channel & WebRTC Signaling Mesh
  useEffect(() => {
    let mounted = true

    const init = async () => {
      // Step 1: Initialize local user media
      await initLocalMedia()

      if (!mounted) return

      // Step 2: Connect to room signaling channel
      const channel = supabase.channel(`meet_room_${roomId}`, {
        config: {
          broadcast: { self: false, ack: false },
          presence: { key: userId },
        },
      })
      channelRef.current = channel

      // User Join Broadcast
      channel.on('broadcast', { event: 'user-joined' }, (event) => {
        const { from, name, role, hasAudio, hasVideo, isScreenShare } = event.payload
        if (from === userId) return

        setParticipants((prev) => {
          const next = new Map(prev)
          next.set(from, {
            id: from,
            name: name || 'Participant',
            role: role || 'participant',
            hasAudio: hasAudio ?? true,
            hasVideo: hasVideo ?? true,
            isScreenSharing: isScreenShare ?? false,
            isHandRaised: false,
            audioLevel: 0,
          })
          return next
        })

        // Create offer to connect to new participant
        createPeer(from, true)
      })

      // SDP Offer Received
      channel.on('broadcast', { event: 'offer' }, async (event) => {
        const { from, to, offer, name, role, hasAudio, hasVideo, isScreenShare } = event.payload
        if (to !== userId) return

        if (name) {
          setParticipants((prev) => {
            const next = new Map(prev)
            const existing = next.get(from)
            next.set(from, {
              id: from,
              name: name || existing?.name || 'Participant',
              role: role || existing?.role || 'participant',
              hasAudio: hasAudio ?? existing?.hasAudio ?? true,
              hasVideo: hasVideo ?? existing?.hasVideo ?? true,
              isScreenSharing: isScreenShare ?? existing?.isScreenSharing ?? false,
              isHandRaised: existing?.isHandRaised ?? false,
              audioLevel: existing?.audioLevel ?? 0,
              stream: existing?.stream,
            })
            return next
          })
        }

        // Create bare peer connection (NO transceivers added yet - that would break SDP)
        const pc = createPeer(from, false)
        await pc.setRemoteDescription(new RTCSessionDescription(offer))

        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        channelRef.current?.send({
          type: 'broadcast',
          event: 'answer',
          payload: {
            from: userId,
            to: from,
            answer: pc.localDescription || answer,
            name: userName,
            role: userRole,
            hasAudio: isAudioEnabled,
            hasVideo: isVideoEnabled,
            isScreenShare: isScreenSharing,
          },
        })
      })

      // SDP Answer Received
      channel.on('broadcast', { event: 'answer' }, async (event) => {
        const { from, to, answer, name, role, hasAudio, hasVideo, isScreenShare } = event.payload
        if (to !== userId) return

        if (name) {
          setParticipants((prev) => {
            const next = new Map(prev)
            const existing = next.get(from)
            next.set(from, {
              id: from,
              name: name || existing?.name || 'Participant',
              role: role || existing?.role || 'participant',
              hasAudio: hasAudio ?? existing?.hasAudio ?? true,
              hasVideo: hasVideo ?? existing?.hasVideo ?? true,
              isScreenSharing: isScreenShare ?? existing?.isScreenSharing ?? false,
              isHandRaised: existing?.isHandRaised ?? false,
              audioLevel: existing?.audioLevel ?? 0,
              stream: existing?.stream,
            })
            return next
          })
        }

        const pc = peersRef.current.get(from)
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer))
        }
      })

      // ICE Candidate Received
      channel.on('broadcast', { event: 'ice-candidate' }, async (event) => {
        const { from, to, candidate } = event.payload
        if (to !== userId) return

        const pc = peersRef.current.get(from)
        if (pc && candidate) {
          const addCandidate = async (retries = 10) => {
            try {
              if (pc.remoteDescription) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate))
              } else if (retries > 0) {
                setTimeout(() => addCandidate(retries - 1), 100)
              }
            } catch (e) {
              console.warn('Error adding ICE candidate:', e)
            }
          }
          addCandidate()
        }
      })

      // Peer Media State Updates (Camera, Mic, Screen, Hand Raise)
      channel.on('broadcast', { event: 'peer-state' }, (event) => {
        const { from, hasAudio, hasVideo, isScreenShare, isHandRaised, name, role } = event.payload
        setParticipants((prev) => {
          const current = prev.get(from)
          if (!current) return prev
          const next = new Map(prev)
          next.set(from, {
            ...current,
            name: name ?? current.name,
            role: role ?? current.role,
            hasAudio: hasAudio ?? current.hasAudio,
            hasVideo: hasVideo ?? current.hasVideo,
            isScreenSharing: isScreenShare ?? current.isScreenSharing,
            isHandRaised: isHandRaised ?? current.isHandRaised,
          })
          return next
        })
      })

      // Participant Left
      channel.on('broadcast', { event: 'user-left' }, (event) => {
        const { from } = event.payload
        if (peersRef.current.has(from)) {
          peersRef.current.get(from)!.close()
          peersRef.current.delete(from)
        }
        if (audioCleanupsRef.current.has(from)) {
          audioCleanupsRef.current.get(from)! ()
          audioCleanupsRef.current.delete(from)
        }
        setParticipants((prev) => {
          const next = new Map(prev)
          next.delete(from)
          return next
        })
      })

      // Host Moderation Commands
      channel.on('broadcast', { event: 'moderation' }, (event) => {
        const { action, targetId, value, permissions: newPerms } = event.payload

        if (action === 'mute-all') {
          if (userRole !== 'host') {
            if (localStreamRef.current) {
              localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = false))
            }
            setIsAudioEnabled(false)
          }
        } else if (action === 'mute-user' && targetId === userId) {
          if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = false))
          }
          setIsAudioEnabled(false)
        } else if (action === 'kick-user' && targetId === userId) {
          setRoomStatus('kicked')
          cleanup()
        } else if (action === 'lock-toggle') {
          setIsLocked(value)
        } else if (action === 'waiting-room-toggle') {
          setIsWaitingRoomEnabled(value)
        } else if (action === 'permissions-update') {
          setPermissions(newPerms)
        } else if (action === 'end-meeting') {
          setRoomStatus('ended')
          cleanup()
        }
      })

      // Waiting Room: Knock / Join Request (Host receives)
      channel.on('broadcast', { event: 'join-request' }, (event) => {
        const { from, name, requestedAt } = event.payload
        if (userRole === 'host' || userRole === 'co-host') {
          setWaitingList((prev) => [...prev.filter((w) => w.id !== from), { id: from, name, requestedAt }])
        }
      })

      // Waiting Room: Host Response (Candidate receives)
      channel.on('broadcast', { event: 'join-response' }, (event) => {
        const { targetId, status } = event.payload
        if (targetId === userId) {
          if (status === 'admitted') {
            setRoomStatus('in_meeting')
            // Announce presence
            channel.send({
              type: 'broadcast',
              event: 'user-joined',
              payload: {
                from: userId,
                name: userName,
                role: userRole,
                hasAudio: isAudioEnabled,
                hasVideo: isVideoEnabled,
                isScreenShare: isScreenSharing,
              },
            })
          } else {
            setRoomStatus('kicked')
          }
        }
      })

      // In-Meeting Chat Broadcast
      channel.on('broadcast', { event: 'chat' }, (event) => {
        const msg = event.payload as ChatMessage
        setMessages((prev) => [...prev, msg])
      })

      // Reactions Broadcast
      channel.on('broadcast', { event: 'reaction' }, (event) => {
        const { emoji, senderName } = event.payload
        const reactionId = `${Date.now()}-${Math.random()}`
        setReactions((prev) => [...prev, { id: reactionId, emoji, senderName }])
        setTimeout(() => {
          setReactions((prev) => prev.filter((r) => r.id !== reactionId))
        }, 3500)
      })

      // Whiteboard Broadcasts
      channel.on('broadcast', { event: 'whiteboard-stroke' }, (event) => {
        const stroke = event.payload as WhiteboardStroke
        setWhiteboardStrokes((prev) => [...prev, stroke])
      })
      channel.on('broadcast', { event: 'whiteboard-clear' }, () => {
        setWhiteboardStrokes([])
      })

      // Subscribe and announce presence
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED' && mounted) {
          channel.send({
            type: 'broadcast',
            event: 'user-joined',
            payload: {
              from: userId,
              name: userName,
              role: userRole,
              hasAudio: isAudioEnabled,
              hasVideo: isVideoEnabled,
              isScreenShare: isScreenSharing,
            },
          })
        }
      })
    }

    init()

    return () => {
      mounted = false
      cleanup()
    }
  }, [roomId, userId, userName, userRole, initLocalMedia, createPeer, cleanup])

  // Toggle Audio (Mute / Unmute)
  const toggleAudio = useCallback(() => {
    if (!permissions.allowUnmute && !isAudioEnabled && userRole === 'participant') {
      return
    }

    const nextState = !isAudioEnabled
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = nextState
      })
    }
    setIsAudioEnabled(nextState)

    channelRef.current?.send({
      type: 'broadcast',
      event: 'peer-state',
      payload: { from: userId, hasAudio: nextState },
    })
  }, [isAudioEnabled, permissions.allowUnmute, userRole, userId])

  // Toggle Camera Video
  const toggleVideo = useCallback(() => {
    if (!permissions.allowVideo && !isVideoEnabled && userRole === 'participant') {
      return
    }

    const nextState = !isVideoEnabled
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = nextState
      })
    }
    setIsVideoEnabled(nextState)

    channelRef.current?.send({
      type: 'broadcast',
      event: 'peer-state',
      payload: { from: userId, hasVideo: nextState },
    })
  }, [isVideoEnabled, permissions.allowVideo, userRole, userId])

  // Toggle Screen Share
  const toggleScreenShare = useCallback(async () => {
    if (!permissions.allowScreenShare && !isScreenSharing && userRole === 'participant') {
      return
    }

    if (isScreenSharing) {
      // Stop Screen Share -> Revert to Webcam
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop())
        screenStreamRef.current = null
      }
      setScreenStream(null)
      setIsScreenSharing(false)

      const cameraTrack = localStreamRef.current?.getVideoTracks()[0] || null
      peersRef.current.forEach(async (pc, peerId) => {
        const res = await replaceVideoTrack(pc, cameraTrack, localStreamRef.current)
        if (res.renegotiateNeeded) {
          try {
            const offer = await pc.createOffer()
            await pc.setLocalDescription(offer)
            channelRef.current?.send({
              type: 'broadcast',
              event: 'offer',
              payload: {
                from: userId,
                to: peerId,
                offer: pc.localDescription,
                name: userName,
                role: userRole,
                hasAudio: isAudioEnabled,
                hasVideo: isVideoEnabled,
                isScreenShare: false,
              },
            })
          } catch (err) {
            console.warn('Renegotiation failed on stop screenshare:', err)
          }
        }
      })

      channelRef.current?.send({
        type: 'broadcast',
        event: 'peer-state',
        payload: { from: userId, isScreenShare: false },
      })
    } else {
      // Start Screen Share
      try {
        let capturedScreenStream: MediaStream
        try {
          capturedScreenStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
          })
        } catch (audioErr) {
          console.warn('getDisplayMedia failed, falling back to minimal video constraints:', audioErr)
          capturedScreenStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              frameRate: 30,
            },
          })
        }

        // Ensure all video tracks are active and enabled
        capturedScreenStream.getVideoTracks().forEach((t) => {
          t.enabled = true
          if ('contentHint' in t) {
            t.contentHint = 'detail'
          }
        })

        screenStreamRef.current = capturedScreenStream
        setScreenStream(capturedScreenStream)
        const screenVideoTrack = capturedScreenStream.getVideoTracks()[0]

        // When user clicks browser's native "Stop Sharing" floating button
        screenVideoTrack.onended = () => {
          setIsScreenSharing(false)
          setScreenStream(null)
          if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach((t) => t.stop())
            screenStreamRef.current = null
          }
          const camTrack = localStreamRef.current?.getVideoTracks()[0] || null
          peersRef.current.forEach(async (pc, peerId) => {
            const res = await replaceVideoTrack(pc, camTrack, localStreamRef.current)
            if (res.renegotiateNeeded) {
              try {
                const offer = await pc.createOffer()
                await pc.setLocalDescription(offer)
                channelRef.current?.send({
                  type: 'broadcast',
                  event: 'offer',
                  payload: {
                    from: userId,
                    to: peerId,
                    offer: pc.localDescription,
                    name: userName,
                    role: userRole,
                    hasAudio: isAudioEnabled,
                    hasVideo: isVideoEnabled,
                    isScreenShare: false,
                  },
                })
              } catch (err) {
                console.warn('Renegotiation failed on stop screenshare onended:', err)
              }
            }
          })
          channelRef.current?.send({
            type: 'broadcast',
            event: 'peer-state',
            payload: { from: userId, isScreenShare: false },
          })
        }

        peersRef.current.forEach(async (pc, peerId) => {
          // Bundle the screenshare track into the existing localStream so the remote browser 
          // fires ontrack with the same event.streams[0] containing both audio and video.
          const res = await replaceVideoTrack(pc, screenVideoTrack, localStreamRef.current)
          if (res.renegotiateNeeded) {
            try {
              const offer = await pc.createOffer()
              await pc.setLocalDescription(offer)
              channelRef.current?.send({
                type: 'broadcast',
                event: 'offer',
                payload: {
                  from: userId,
                  to: peerId,
                  offer: pc.localDescription,
                  name: userName,
                  role: userRole,
                  hasAudio: isAudioEnabled,
                  hasVideo: isVideoEnabled,
                  isScreenShare: true,
                },
              })
            } catch (err) {
              console.warn('Renegotiation failed on screenshare:', err)
            }
          }
        })

        setIsScreenSharing(true)

        channelRef.current?.send({
          type: 'broadcast',
          event: 'peer-state',
          payload: { from: userId, isScreenShare: true },
        })
      } catch (err) {
        console.warn('Screen share canceled or denied:', err)
      }
    }
  }, [isScreenSharing, permissions.allowScreenShare, userRole, userId, userName, isAudioEnabled, isVideoEnabled])

  // Toggle Hand Raise
  const toggleHandRaise = useCallback(() => {
    const nextState = !isHandRaised
    setIsHandRaised(nextState)

    channelRef.current?.send({
      type: 'broadcast',
      event: 'peer-state',
      payload: { from: userId, isHandRaised: nextState },
    })

    if (nextState) {
      // Send reaction notification
      channelRef.current?.send({
        type: 'broadcast',
        event: 'reaction',
        payload: { emoji: '✋', senderName: userName },
      })
    }
  }, [isHandRaised, userId, userName])

  // Send Floating Reaction Emoji
  const sendReaction = useCallback(
    (emoji: string) => {
      const reactionId = `${Date.now()}-${Math.random()}`
      setReactions((prev) => [...prev, { id: reactionId, emoji, senderName: userName }])
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== reactionId))
      }, 3500)

      channelRef.current?.send({
        type: 'broadcast',
        event: 'reaction',
        payload: { emoji, senderName: userName },
      })
    },
    [userName]
  )

  // Send Chat Message
  const sendMessage = useCallback(
    async (text: string, fileInfo?: { url: string; name: string }, recipientId?: string) => {
      if (!permissions.allowChat && userRole === 'participant') return

      const msg: ChatMessage = {
        id: `${Date.now()}-${Math.random()}`,
        senderId: userId,
        senderName: userName,
        senderRole: userRole,
        message: text,
        fileUrl: fileInfo?.url || null,
        fileName: fileInfo?.name || null,
        isPrivate: !!recipientId,
        recipientId: recipientId || null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages((prev) => [...prev, msg])

      channelRef.current?.send({
        type: 'broadcast',
        event: 'chat',
        payload: msg,
      })

      // Persist to database
      try {
        await supabase.from('meet_messages').insert({
          room_id: roomId,
          sender_id: userId,
          sender_name: userName,
          sender_role: userRole,
          message: text,
          file_url: fileInfo?.url || null,
          file_name: fileInfo?.name || null,
          is_private: !!recipientId,
          recipient_id: recipientId || null,
        })
      } catch (err) {
        console.warn('Could not persist message to db:', err)
      }
    },
    [permissions.allowChat, userRole, userId, userName, roomId, supabase]
  )

  // Whiteboard Actions
  const addWhiteboardStroke = useCallback((stroke: WhiteboardStroke) => {
    setWhiteboardStrokes((prev) => [...prev, stroke])
    channelRef.current?.send({
      type: 'broadcast',
      event: 'whiteboard-stroke',
      payload: stroke,
    })
  }, [])

  const clearWhiteboard = useCallback(() => {
    setWhiteboardStrokes([])
    channelRef.current?.send({
      type: 'broadcast',
      event: 'whiteboard-clear',
      payload: {},
    })
  }, [])

  // Host Moderation Actions
  const muteAll = useCallback(() => {
    if (userRole !== 'host' && userRole !== 'co-host') return
    channelRef.current?.send({
      type: 'broadcast',
      event: 'moderation',
      payload: { action: 'mute-all' },
    })
  }, [userRole])

  const muteUser = useCallback(
    (targetId: string) => {
      if (userRole !== 'host' && userRole !== 'co-host') return
      channelRef.current?.send({
        type: 'broadcast',
        event: 'moderation',
        payload: { action: 'mute-user', targetId },
      })
    },
    [userRole]
  )

  const kickUser = useCallback(
    (targetId: string) => {
      if (userRole !== 'host' && userRole !== 'co-host') return
      channelRef.current?.send({
        type: 'broadcast',
        event: 'moderation',
        payload: { action: 'kick-user', targetId },
      })
    },
    [userRole]
  )

  const toggleLockRoom = useCallback(() => {
    if (userRole !== 'host') return
    const nextLocked = !isLocked
    setIsLocked(nextLocked)
    channelRef.current?.send({
      type: 'broadcast',
      event: 'moderation',
      payload: { action: 'lock-toggle', value: nextLocked },
    })
    supabase.from('meet_rooms').update({ is_locked: nextLocked }).eq('id', roomId).then()
  }, [userRole, isLocked, roomId, supabase])

  const toggleWaitingRoom = useCallback(() => {
    if (userRole !== 'host') return
    const next = !isWaitingRoomEnabled
    setIsWaitingRoomEnabled(next)
    channelRef.current?.send({
      type: 'broadcast',
      event: 'moderation',
      payload: { action: 'waiting-room-toggle', value: next },
    })
    supabase.from('meet_rooms').update({ waiting_room_enabled: next }).eq('id', roomId).then()
  }, [userRole, isWaitingRoomEnabled, roomId, supabase])

  const updatePermissions = useCallback(
    (newPerms: Partial<RoomPermissions>) => {
      if (userRole !== 'host') return
      const updated = { ...permissions, ...newPerms }
      setPermissions(updated)
      channelRef.current?.send({
        type: 'broadcast',
        event: 'moderation',
        payload: { action: 'permissions-update', permissions: updated },
      })
      supabase
        .from('meet_rooms')
        .update({
          allow_screen_share: updated.allowScreenShare,
          allow_chat: updated.allowChat,
          allow_unmute: updated.allowUnmute,
        })
        .eq('id', roomId)
        .then()
    },
    [userRole, permissions, roomId, supabase]
  )

  const admitWaitingUser = useCallback(
    (targetId: string) => {
      if (userRole !== 'host' && userRole !== 'co-host') return
      setWaitingList((prev) => prev.filter((w) => w.id !== targetId))
      channelRef.current?.send({
        type: 'broadcast',
        event: 'join-response',
        payload: { targetId, status: 'admitted' },
      })
    },
    [userRole]
  )

  const rejectWaitingUser = useCallback(
    (targetId: string) => {
      if (userRole !== 'host' && userRole !== 'co-host') return
      setWaitingList((prev) => prev.filter((w) => w.id !== targetId))
      channelRef.current?.send({
        type: 'broadcast',
        event: 'join-response',
        payload: { targetId, status: 'rejected' },
      })
    },
    [userRole]
  )

  const endMeetingForAll = useCallback(async () => {
    if (userRole !== 'host') return
    channelRef.current?.send({
      type: 'broadcast',
      event: 'moderation',
      payload: { action: 'end-meeting' },
    })
    setRoomStatus('ended')
    cleanup()

    try {
      await endMeetingAction(roomId)
    } catch (e) {
      console.warn('Failed to mark meeting as ended in DB:', e)
    }
  }, [userRole, roomId, cleanup])

  // Recording Controls
  const startRecording = useCallback(() => {
    const recorder = new MeetRecorder((sec) => setRecordingSeconds(sec))
    recorderRef.current = recorder

    const getStreams = (): ParticipantStreamInfo[] => {
      const list: ParticipantStreamInfo[] = []

      // If host is screen sharing, add screen share stream first
      if (isScreenSharing && screenStreamRef.current) {
        list.push({
          id: 'local_screenshare',
          name: `${userName} (Screen)`,
          stream: screenStreamRef.current,
          isScreenShare: true,
        })
      }

      // Add local camera stream
      if (localStreamRef.current) {
        list.push({
          id: 'local',
          name: userName,
          stream: localStreamRef.current,
          isScreenShare: false,
          videoElement: localVideoRef.current,
        })
      }

      // Add remote participant streams
      participants.forEach((p) => {
        list.push({
          id: p.id,
          name: p.name,
          stream: p.stream,
          isScreenShare: p.isScreenSharing,
          videoElement: p.videoElement,
        })
      })

      return list
    }

    const success = recorder.start(getStreams, roomTitle)
    if (success) {
      setIsRecording(true)
    }
  }, [userName, isScreenSharing, participants, roomTitle])

  const stopRecording = useCallback(async () => {
    if (!recorderRef.current) return
    const result = await recorderRef.current.stop()
    setIsRecording(false)
    recorderRef.current = null

    if (result) {
      // 1. Instant local download backup
      MeetRecorder.downloadLocally(result.blob, `${roomTitle.replace(/\s+/g, '_')}_recording.webm`)

      // 2. Upload to Supabase Storage & Google Drive
      setIsUploadingRecording(true)
      try {
        const formData = new FormData()
        formData.append('file', result.blob, `${roomTitle.replace(/\s+/g, '_')}_recording.webm`)
        formData.append('room_id', roomId)
        formData.append('room_title', roomTitle)
        formData.append('recorded_by_name', userName)
        formData.append('duration_seconds', result.durationSeconds.toString())

        const uploadRes = await uploadMeetingRecordingAction(formData)
        if (uploadRes?.googleDriveUrl) {
          console.info('Recording uploaded to Google Drive:', uploadRes.googleDriveUrl)
        }
      } catch (err) {
        console.error('Failed to upload recording to Storage / Google Drive:', err)
      } finally {
        setIsUploadingRecording(false)
      }
    }
  }, [roomTitle, roomId, userName])

  return {
    roomStatus,
    isLocked,
    isWaitingRoomEnabled,
    permissions,
    // Local state
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    isHandRaised,
    localAudioLevel,
    localStream,
    activeVideoStream: isScreenSharing && (screenStream || screenStreamRef.current) ? (screenStream || screenStreamRef.current) : (localStream || localStreamRef.current),
    localVideoRef,
    // Remote participants
    participants,
    waitingList,
    pinnedPeerId,
    activeSpeakerId,
    setPinnedPeerId,
    // Chat, Reactions, Whiteboard
    messages,
    reactions,
    whiteboardStrokes,
    sendMessage,
    sendReaction,
    addWhiteboardStroke,
    clearWhiteboard,
    // Recording
    isRecording,
    recordingSeconds,
    isUploadingRecording,
    startRecording,
    stopRecording,
    // Media controls
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    toggleHandRaise,
    // Host moderation
    muteAll,
    muteUser,
    kickUser,
    toggleLockRoom,
    toggleWaitingRoom,
    updatePermissions,
    admitWaitingUser,
    rejectWaitingUser,
    endMeetingForAll,
  }
}
