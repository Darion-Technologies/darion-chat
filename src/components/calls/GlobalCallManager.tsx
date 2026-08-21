'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { soundEffects } from '@/lib/utils/soundEffects'
import { CallSessionPayload, respondToCallAction, updateCallStatusAction } from '@/app/actions/calls'
import {
  Phone,
  PhoneOff,
  Video,
  Radio,
} from 'lucide-react'
import { DirectCallModal } from './DirectCallModal'
import { FloatingCallBubble } from './FloatingCallBubble'

interface GlobalCallManagerProps {
  currentUserId?: string
}

export const GlobalCallManager: React.FC<GlobalCallManagerProps> = ({ currentUserId }) => {
  const router = useRouter()
  const [resolvedUserId, setResolvedUserId] = useState<string | undefined>(currentUserId)

  // Incoming Call State
  const [incomingCall, setIncomingCall] = useState<CallSessionPayload | null>(null)
  // Outgoing Call State
  const [outgoingCall, setOutgoingCall] = useState<CallSessionPayload | null>(null)
  const [outgoingStatus, setOutgoingStatus] = useState<'calling' | 'ringing'>('calling')
  const [outgoingTimer, setOutgoingTimer] = useState(0)

  // Active Direct 1:1 Call State (WhatsApp / FaceTime style)
  const [activeDirectCall, setActiveDirectCall] = useState<{
    callId: string
    callerName: string
    callerAvatar?: string
    callType: 'audio' | 'video'
    isInitiator: boolean
  } | null>(null)
  const [isCallMinimized, setIsCallMinimized] = useState(false)
  const [minimizedDuration, setMinimizedDuration] = useState(0)
  const [isCallMuted, setIsCallMuted] = useState(false)

  const outgoingCallRef = useRef<CallSessionPayload | null>(null)
  const incomingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const outgoingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const outgoingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const broadcastChannelRef = useRef<any>(null)

  // Sync outgoingCallRef
  useEffect(() => {
    outgoingCallRef.current = outgoingCall
  }, [outgoingCall])

  // Resolve user id
  useEffect(() => {
    if (currentUserId) {
      setResolvedUserId(currentUserId)
      return
    }
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.id) setResolvedUserId(data.user.id)
    })
  }, [currentUserId])

  // Handle push notification deep links (e.g. ?callId=...&action=accept)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const callId = params.get('callId')
    const action = params.get('action')
    const callType = (params.get('callType') as 'audio' | 'video') || 'audio'
    const callerName = params.get('callerName') || 'Teammate'

    if (callId && action === 'accept') {
      setActiveDirectCall({
        callId,
        callerName: decodeURIComponent(callerName),
        callType,
        isInitiator: false,
      })
      setIsCallMinimized(false)
      // Clean query params without reload
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  // Start outgoing call handler
  const startOutgoingCall = (payload: CallSessionPayload) => {
    setOutgoingCall(payload)
    outgoingCallRef.current = payload
    setOutgoingStatus('calling') // Start with "Calling..." (waiting for recipient to acknowledge)
    setOutgoingTimer(0)

    if (outgoingIntervalRef.current) clearInterval(outgoingIntervalRef.current)
    outgoingIntervalRef.current = setInterval(() => {
      setOutgoingTimer((prev) => prev + 1)
    }, 1000)

    // Auto cancel after 35s if recipient never answers
    if (outgoingTimeoutRef.current) clearTimeout(outgoingTimeoutRef.current)
    outgoingTimeoutRef.current = setTimeout(() => {
      handleCancelOutgoing()
    }, 35000)
  }

  // Start incoming call handler (Loud Ringing on recipient)
  const triggerIncomingCall = (incoming: CallSessionPayload) => {
    // Don't ring if the caller is ourselves
    if (resolvedUserId && incoming.callerId === resolvedUserId) return

    setIncomingCall(incoming)
    soundEffects.startRingingIncoming()
    richHaptics.impact('heavy')

    // Trigger Native / Browser Heads-Up Notification if backgrounded
    try {
      const cap = (window as any).Capacitor
      const localNotif = cap?.Plugins?.LocalNotifications
      if (localNotif) {
        localNotif.schedule({
          notifications: [
            {
              title: `📞 Incoming ${incoming.callType === 'audio' ? 'Voice' : 'Video'} Call`,
              body: `${incoming.callerName} is calling you. Tap to answer.`,
              id: Math.floor(Math.random() * 1000000),
              channelId: 'darion_chat_high_priority',
              extra: { roomCode: incoming.roomCode, callType: incoming.callType },
              schedule: { at: new Date(Date.now() + 50) },
            },
          ],
        }).catch(() => {})
      } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(`📞 Incoming ${incoming.callType === 'audio' ? 'Voice' : 'Video'} Call: ${incoming.callerName}`, {
          body: `${incoming.callerName} is calling you. Tap to answer.`,
          icon: '/icon.svg',
          tag: `call-${incoming.roomCode}`,
        })
      }
    } catch {}

    // Acknowledge to caller that recipient device is ONLINE and actively RINGING
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.send({
        type: 'broadcast',
        event: 'call_ringing',
        payload: { roomCode: incoming.roomCode, recipientId: resolvedUserId },
      })
    }

    if (incomingTimeoutRef.current) clearTimeout(incomingTimeoutRef.current)
    incomingTimeoutRef.current = setTimeout(() => {
      handleDeclineIncoming('missed')
    }, 35000)
  }

  // 1. Listen for local events dispatched from Chat / Anywhere in UI
  useEffect(() => {
    const handleStartOutgoingEvent = (e: CustomEvent<CallSessionPayload>) => {
      if (e.detail) startOutgoingCall(e.detail)
    }

    const handleTriggerIncomingEvent = (e: CustomEvent<CallSessionPayload>) => {
      if (e.detail) triggerIncomingCall(e.detail)
    }

    window.addEventListener('start-outgoing-call' as any, handleStartOutgoingEvent)
    window.addEventListener('trigger-incoming-call' as any, handleTriggerIncomingEvent)

    return () => {
      window.removeEventListener('start-outgoing-call' as any, handleStartOutgoingEvent)
      window.removeEventListener('trigger-incoming-call' as any, handleTriggerIncomingEvent)
    }
  }, [resolvedUserId])

  // 2. Real-time Supabase Signaling (Broadcast + Database triggers)
  useEffect(() => {
    const supabase = createClient()

    // Create and store persistent broadcast channel
    const broadcastChannel = supabase.channel('global-call-signaling')
    broadcastChannelRef.current = broadcastChannel

    broadcastChannel
      .on('broadcast', { event: 'incoming_call' }, ({ payload }) => {
        if (!payload || !resolvedUserId) return
        // 1. Never ring if caller is self
        if (payload.callerId === resolvedUserId) return
        // 2. Strict recipient validation: only ring if current user is in recipientIds
        const recipients = payload.recipientIds || []
        if (recipients.length > 0 && !recipients.includes(resolvedUserId)) return

        triggerIncomingCall(payload)
      })
      .on('broadcast', { event: 'call_ringing' }, ({ payload }) => {
        // Recipient is verified online and actively ringing:
        // Transition caller from "Calling..." -> "Ringing..." and start playing ringback tone!
        setOutgoingStatus('ringing')
        soundEffects.startRingingOutgoing()
        if (payload?.roomCode) {
          updateCallStatusAction(payload.roomCode, 'ringing').catch(() => {})
        }
      })
      .on('broadcast', { event: 'call_declined' }, () => {
        // When declined, cancel outgoing screen immediately
        soundEffects.playCallEndedSound()
        if (outgoingTimeoutRef.current) clearTimeout(outgoingTimeoutRef.current)
        if (outgoingIntervalRef.current) clearInterval(outgoingIntervalRef.current)
        setOutgoingCall(null)
        outgoingCallRef.current = null
        setOutgoingTimer(0)
      })
      .on('broadcast', { event: 'call_cancelled' }, () => {
        // When caller hangs up/cancels, dismiss incoming screen immediately
        soundEffects.playCallEndedSound()
        if (incomingTimeoutRef.current) clearTimeout(incomingTimeoutRef.current)
        setIncomingCall(null)
      })
      .on('broadcast', { event: 'call_accepted' }, ({ payload }) => {
        // When accepted, transition caller to Direct 1:1 Call Screen
        soundEffects.stopRinging()
        if (outgoingTimeoutRef.current) clearTimeout(outgoingTimeoutRef.current)
        if (outgoingIntervalRef.current) clearInterval(outgoingIntervalRef.current)

        const cur = outgoingCallRef.current
        setOutgoingCall(null)
        outgoingCallRef.current = null

        if (cur) {
          setActiveDirectCall({
            callId: cur.roomCode,
            callerName: cur.conversationName || cur.callerName,
            callerAvatar: cur.callerAvatar,
            callType: cur.callType,
            isInitiator: true,
          })
          setIsCallMinimized(false)
        }
      })
      .subscribe()

    // Database notifications & chat_messages table change listener for 100% reliable ringing
    let notifChannel: any = null
    if (resolvedUserId) {
      notifChannel = supabase
        .channel(`call-notifs-${resolvedUserId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${resolvedUserId}`,
          },
          (payload) => {
            const item = payload.new as any
            if (item?.type === 'meet_started' || item?.type === 'incoming_call') {
              const meta = item.metadata || {}
              const meetUrl = item.link || ''
              const roomCode = meta.roomCode || meetUrl.replace('/meet/', '') || `dar-call-${Date.now()}`

              const incoming: CallSessionPayload = {
                callId: meta.callId || item.id,
                roomCode,
                callerId: meta.callerId || '',
                callerName: meta.callerName || item.title?.replace(/📞 Incoming (VIDEO|AUDIO|Voice|Video) Call:?/i, '').trim() || 'Team Member',
                callerAvatar: meta.callerAvatar || '',
                callerRole: meta.callerRole || '',
                conversationId: meta.conversationId || '',
                callType: meta.callType || (item.title?.toLowerCase().includes('audio') || item.title?.toLowerCase().includes('voice') ? 'audio' : 'video'),
                recipientIds: meta.recipientIds || (resolvedUserId ? [resolvedUserId] : []),
                meetUrl: meta.meetUrl || item.link || `/meet/${roomCode}`,
                startedAt: item.created_at || new Date().toISOString(),
              }

              triggerIncomingCall(incoming)
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
          },
          (payload) => {
            const msg = payload.new as any
            if (!msg || !resolvedUserId) return
            if (msg.sender_id === resolvedUserId) return
            if (msg.message_type === 'meet_card') {
              const meta = msg.metadata || {}
              if (meta.status === 'calling') {
                const recipients = meta.recipientIds || []
                if (recipients.length === 0 || recipients.includes(resolvedUserId)) {
                  const incoming: CallSessionPayload = {
                    callId: meta.roomId || msg.id,
                    roomCode: meta.roomCode || `dar-${meta.callType || 'video'}-${Date.now()}`,
                    callerId: msg.sender_id,
                    callerName: meta.hostName || 'Team Member',
                    callerAvatar: '',
                    callerRole: 'member',
                    conversationId: msg.conversation_id,
                    callType: meta.callType || 'video',
                    recipientIds: recipients.length > 0 ? recipients : [resolvedUserId],
                    meetUrl: meta.meetUrl || `/meet/${meta.roomCode}`,
                    startedAt: meta.startedAt || msg.created_at || new Date().toISOString(),
                  }
                  triggerIncomingCall(incoming)
                }
              }
            }
          }
        )
        .subscribe()
    }

    return () => {
      supabase.removeChannel(broadcastChannel)
      if (notifChannel) supabase.removeChannel(notifChannel)
    }
  }, [resolvedUserId, router])

  // Handle Accept Incoming Call
  const handleAcceptIncoming = async () => {
    if (!incomingCall) return
    soundEffects.stopRinging()
    if (incomingTimeoutRef.current) clearTimeout(incomingTimeoutRef.current)

    const meetUrl = incomingCall.meetUrl
    const targetRoom = incomingCall.roomCode
    const targetCaller = incomingCall.callerId
    const callerName = incomingCall.callerName
    const callerAvatar = incomingCall.callerAvatar
    const callType = incomingCall.callType

    setIncomingCall(null)

    // Broadcast to caller that call was accepted
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.send({
        type: 'broadcast',
        event: 'call_accepted',
        payload: { roomCode: targetRoom, meetUrl },
      })
    }

    await respondToCallAction({
      roomCode: targetRoom,
      callerId: targetCaller,
      response: 'accept',
    })

    // Open dedicated 1:1 Direct Call UI
    setActiveDirectCall({
      callId: targetRoom,
      callerName,
      callerAvatar,
      callType,
      isInitiator: false,
    })
    setIsCallMinimized(false)
  }

  // Handle Decline Incoming Call
  const handleDeclineIncoming = async (reason: 'decline' | 'missed' = 'decline') => {
    if (!incomingCall) return
    soundEffects.playCallEndedSound()
    if (incomingTimeoutRef.current) clearTimeout(incomingTimeoutRef.current)

    const cur = incomingCall
    setIncomingCall(null)

    // Broadcast to caller that call was declined
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.send({
        type: 'broadcast',
        event: 'call_declined',
        payload: { roomCode: cur.roomCode, callerId: cur.callerId },
      })
    }

    await respondToCallAction({
      roomCode: cur.roomCode,
      callerId: cur.callerId,
      response: reason,
    })
  }

  // Handle Cancel Outgoing Call (Caller hangs up)
  const handleCancelOutgoing = () => {
    soundEffects.playCallEndedSound()
    if (outgoingTimeoutRef.current) clearTimeout(outgoingTimeoutRef.current)
    if (outgoingIntervalRef.current) clearInterval(outgoingIntervalRef.current)

    const cur = outgoingCall
    setOutgoingCall(null)
    setOutgoingTimer(0)

    // Broadcast to all receivers that call was cancelled
    if (cur) {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.send({
          type: 'broadcast',
          event: 'call_cancelled',
          payload: { roomCode: cur.roomCode, callerId: cur.callerId },
        })
      }

      respondToCallAction({
        roomCode: cur.roomCode,
        callerId: cur.callerId,
        response: 'cancelled',
      }).catch(() => {})
    }
  }

  // Join Meet Room directly from Outgoing Screen
  const handleJoinOutgoingRoom = () => {
    if (!outgoingCall) return
    soundEffects.stopRinging()
    if (outgoingTimeoutRef.current) clearTimeout(outgoingTimeoutRef.current)
    if (outgoingIntervalRef.current) clearInterval(outgoingIntervalRef.current)

    const url = outgoingCall.meetUrl
    setOutgoingCall(null)
    router.push(url)
  }

  return (
    <>
      {/* 1. ELEGANT, RULED ENTERPRISE INCOMING CALL MODAL */}
      {incomingCall && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150 select-none">
          <div className="relative w-full max-w-[340px] bg-[#0d1424]/95 border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center text-white overflow-hidden">
            
            {/* Top Clean Pill Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-slate-300 text-[11px] font-semibold uppercase tracking-wider mb-6">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Incoming {incomingCall.callType.toUpperCase()} Call</span>
            </div>

            {/* Clean Avatar Container */}
            <div className="relative mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 border-2 border-white/20 flex items-center justify-center text-white text-2xl font-bold shadow-xl overflow-hidden">
                {incomingCall.callerAvatar ? (
                  <img src={incomingCall.callerAvatar} alt={incomingCall.callerName} className="w-full h-full object-cover" />
                ) : (
                  <span>{incomingCall.callerName.charAt(0).toUpperCase()}</span>
                )}
              </div>
            </div>

            {/* Caller Name & Status */}
            <h3 className="text-xl font-bold text-white mb-1 tracking-tight">
              {incomingCall.callerName}
            </h3>
            <p className="text-xs text-slate-400 font-normal mb-8">
              Ringing...
            </p>

            {/* Action Buttons: Decline & Accept */}
            <div className="w-full flex items-center justify-around px-2">
              {/* Decline Action */}
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDeclineIncoming('decline')}
                  className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 text-white flex items-center justify-center shadow-lg transition-all cursor-pointer"
                  title="Decline Call"
                  aria-label="Decline Call"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
                <span className="text-xs text-slate-400 font-medium">Decline</span>
              </div>

              {/* Accept Action */}
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={handleAcceptIncoming}
                  className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white flex items-center justify-center shadow-lg transition-all cursor-pointer"
                  title="Accept Call"
                  aria-label="Accept Call"
                >
                  {incomingCall.callType === 'video' ? (
                    <Video className="w-6 h-6" />
                  ) : (
                    <Phone className="w-6 h-6" />
                  )}
                </button>
                <span className="text-xs text-slate-400 font-medium">Accept</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. ELEGANT, RULED ENTERPRISE OUTGOING CALL MODAL */}
      {outgoingCall && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150 select-none">
          <div className="relative w-full max-w-[340px] bg-[#0d1424]/95 border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center text-white overflow-hidden">
            
            {/* Top Outgoing Status Pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-slate-300 text-[11px] font-semibold uppercase tracking-wider mb-6">
              <span className={`w-2 h-2 rounded-full ${outgoingStatus === 'calling' ? 'bg-blue-400 animate-ping' : 'bg-amber-400 animate-pulse'}`} />
              <span>{outgoingStatus === 'calling' ? `Calling ${outgoingCall.callType.toUpperCase()}...` : 'Ringing...'}</span>
            </div>

            {/* Target Avatar */}
            <div className="relative mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 border-2 border-white/20 flex items-center justify-center text-white text-2xl font-bold shadow-xl overflow-hidden">
                {outgoingCall.callerAvatar ? (
                  <img src={outgoingCall.callerAvatar} alt={outgoingCall.callerName} className="w-full h-full object-cover" />
                ) : (
                  <span>{outgoingCall.callerName.charAt(0).toUpperCase()}</span>
                )}
              </div>
            </div>

            {/* Recipient & Status / Timer */}
            <h3 className="text-xl font-bold text-white mb-1 tracking-tight">
              {outgoingCall.conversationName || outgoingCall.callerName}
            </h3>
            <p className="text-xs text-slate-400 font-mono mb-8">
              {outgoingStatus === 'calling'
                ? 'Connecting to recipient...'
                : `Ringing on recipient's device • ${Math.floor(outgoingTimer / 60)}:${(outgoingTimer % 60).toString().padStart(2, '0')}`}
            </p>

            {/* Actions: Cancel & Direct Join */}
            <div className="w-full flex items-center justify-around px-2">
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelOutgoing}
                  className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 text-white flex items-center justify-center shadow-lg transition-all cursor-pointer"
                  title="Cancel Call"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
                <span className="text-xs text-slate-400 font-medium">Cancel</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. ACTIVE 1:1 DIRECT CALL FULLSCREEN MODAL */}
      {activeDirectCall && !isCallMinimized && (
        <DirectCallModal
          callId={activeDirectCall.callId}
          callerName={activeDirectCall.callerName}
          callerAvatar={activeDirectCall.callerAvatar}
          callType={activeDirectCall.callType}
          isInitiator={activeDirectCall.isInitiator}
          onClose={() => {
            setActiveDirectCall(null)
            setIsCallMinimized(false)
          }}
          onMinimize={(dur, muted) => {
            setMinimizedDuration(dur)
            setIsCallMuted(muted)
            setIsCallMinimized(true)
          }}
        />
      )}

      {/* 4. MINIMIZED DRAGGABLE FLOATING CALL BUBBLE (Allows texting while calling) */}
      {activeDirectCall && isCallMinimized && (
        <FloatingCallBubble
          callerName={activeDirectCall.callerName}
          callerAvatar={activeDirectCall.callerAvatar}
          callType={activeDirectCall.callType}
          callDuration={minimizedDuration}
          isMuted={isCallMuted}
          onToggleMute={() => setIsCallMuted(!isCallMuted)}
          onEndCall={() => {
            setActiveDirectCall(null)
            setIsCallMinimized(false)
          }}
          onExpand={() => setIsCallMinimized(false)}
        />
      )}
    </>
  )
}
