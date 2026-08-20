'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Hash,
  MessageSquare,
  Video,
  Send,
  Smile,
  Paperclip,
  Search,
  Plus,
  MoreVertical,
  Pin,
  MessageCircle,
  Users,
  ChevronRight,
  ChevronLeft,
  X,
  Phone,
  Sparkles,
  Check,
  CheckCheck,
  Download,
  FileText,
  Clock,
  Radio,
  Share2,
  Copy,
  Trash2,
  Forward,
  Pencil,
  Reply,
  SmilePlus,
  Mic,
  MicOff,
  Maximize2,
  Image as ImageIcon,
  Loader2,
  Home,
  Layers,
  MoreHorizontal,
  ArrowLeft,
  Star,
  AtSign,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  ChatConversationItem,
  ChatMessageItem,
  getConversationsListAction,
  getConversationMessagesAction,
  sendMessageAction,
  uploadChatAttachmentAction,
  toggleReactionAction,
  startInstantMeetInChatAction,
  markConversationAsReadAction,
  deleteMessageAction,
  editMessageAction,
} from '@/app/actions/messages'
import { initiateCallAction } from '@/app/actions/calls'
import { useBranding } from '@/components/providers/BrandingProvider'
import { ChatMeetCard } from './ChatMeetCard'
import { NewChatModal } from './NewChatModal'
import { NewChannelModal } from './NewChannelModal'
import { ForwardMessageModal } from './ForwardMessageModal'
import { EmojiAndGifPicker } from './EmojiAndGifPicker'
import { ImagePreviewModal } from './ImagePreviewModal'
import { VoiceNotePlayer } from './VoiceNotePlayer'
import { soundEffects } from '@/lib/utils/soundEffects'
import { richHaptics } from '@/lib/utils/richHaptics'
import { MiniSidebarRail, ChatNavTab } from '@/components/navigation/MiniSidebarRail'
import { MeetingsPanel } from './MeetingsPanel'
import { CalendarPanel } from './CalendarPanel'
import { SettingsPanel } from './SettingsPanel'
import { GoogleChatHeader } from './GoogleChatHeader'
import { ChatNavColumn } from './ChatNavColumn'
import { HomeFeedPane } from './HomeFeedPane'
import { NoConversationSelected } from './NoConversationSelected'
import { CompanionRail } from './CompanionRail'
import { BrowseSpacesModal } from './BrowseSpacesModal'
import { SpaceSharedFilesTab } from './SpaceSharedFilesTab'
import { SpaceTasksTab } from './SpaceTasksTab'
import { GoogleChatComposer } from './GoogleChatComposer'
import { CodeSnippetModal } from './CodeSnippetModal'
import { ChatCodeCard } from './ChatCodeCard'
import { ThreadSideDrawer } from './ThreadSideDrawer'
import { MentionsView } from './MentionsView'
import { StarredView } from './StarredView'

interface TeamsChatWorkspaceProps {
  currentUserId: string
  currentUserName: string
  currentUserRole: string
  currentUserAvatar?: string
  initialConversations: ChatConversationItem[]
  initialActiveId?: string
  showMiniSidebar?: boolean
}

const COMMON_EMOJIS = ['👍', '❤️', '🚀', '😂', '👏', '🔥', '🎉', '👀']

export const TeamsChatWorkspace: React.FC<TeamsChatWorkspaceProps> = ({
  currentUserId,
  currentUserName,
  currentUserRole,
  currentUserAvatar,
  initialConversations,
  initialActiveId,
  showMiniSidebar = false,
}) => {
  const branding = useBranding()
  const [activeNavTab, setActiveNavTab] = useState<ChatNavTab>('chat')
  const [conversations, setConversations] = useState<ChatConversationItem[]>(initialConversations)
  const [activeConvId, setActiveConvId] = useState<string>(initialActiveId || '')
  const [messages, setMessages] = useState<ChatMessageItem[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [startingMeet, setStartingMeet] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)

  // Search & Modals
  const [convSearch, setConvSearch] = useState('')
  const [isNewChatOpen, setIsNewChatOpen] = useState(false)
  const [isNewChannelOpen, setIsNewChannelOpen] = useState(false)
  const [activeThreadParent, setActiveThreadParent] = useState<ChatMessageItem | null>(null)
  const [threadMessages, setThreadMessages] = useState<ChatMessageItem[]>([])
  const [threadInputText, setThreadInputText] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [showMobileMenuDrawer, setShowMobileMenuDrawer] = useState(false)
  const [isFirstSidebarOpen, setIsFirstSidebarOpen] = useState(true)
  const [activeMobileTab, setActiveMobileTab] = useState<'home' | 'dms' | 'spaces'>('home')
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false)
  const [forwardingMessage, setForwardingMessage] = useState<ChatMessageItem | null>(null)
  const [isForwardOpen, setIsForwardOpen] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [replyingTo, setReplyingTo] = useState<ChatMessageItem | null>(null)
  const [reactingMessageId, setReactingMessageId] = useState<string | null>(null)
  const [mobileActionMessage, setMobileActionMessage] = useState<ChatMessageItem | null>(null)
  const [activeNavShortcut, setActiveNavShortcut] = useState<'home' | 'mentions' | 'starred'>('home')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [activeSpaceTab, setActiveSpaceTab] = useState<'chat' | 'shared' | 'tasks'>('chat')
  const [isBrowseSpacesOpen, setIsBrowseSpacesOpen] = useState(false)
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false)

  // Image Lightbox Preview State
  const [previewImage, setPreviewImage] = useState<{
    url: string
    fileName?: string
    fileSize?: number
  } | null>(null)

  // Voice Note Recording State
  const [isRecordingVoice, setIsRecordingVoice] = useState<boolean>(false)
  const [recordingDuration, setRecordingDuration] = useState<number>(0)
  const [recordingWaveformLevels, setRecordingWaveformLevels] = useState<number[]>([0.3, 0.5, 0.2, 0.7, 0.4, 0.6, 0.3, 0.5])

  // Touch Gestures State
  const [swipingMessageId, setSwipingMessageId] = useState<string | null>(null)
  const [swipeOffset, setSwipeOffset] = useState<number>(0)
  const [heartBursts, setHeartBursts] = useState<Array<{ id: string; msgId: string; x: number; y: number }>>([])
  const [actionSheetPullOffset, setActionSheetPullOffset] = useState<number>(0)

  // Real-time Typing Users State
  const [typingUsers, setTypingUsers] = useState<Record<string, { userName: string; avatarUrl?: string; timestamp: number }>>({})
  const typingDebounceTimer = useRef<NodeJS.Timeout | null>(null)
  const isCurrentlyTypingRef = useRef(false)

  // 100% Accurate Online Presence State via Supabase Realtime WebSockets
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set())
  const [userPresenceMap, setUserPresenceMap] = useState<Record<string, { status: string; statusMessage?: string }>>({})
  const [currentUserPresenceStatus, setCurrentUserPresenceStatus] = useState<'active' | 'away' | 'dnd'>('active')
  const [currentStatusMessage, setCurrentStatusMessage] = useState<string>('')
  const isInMeetingRef = useRef<boolean>(false)
  const isManuallySetRef = useRef<'active' | 'away' | 'dnd' | null>(null)
  const currentPresenceStatusRef = useRef<'active' | 'away' | 'dnd'>('active')
  const presenceChannelRef = useRef<any>(null)
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Smart Scrolling & Containers
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const threadEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mainInputRef = useRef<HTMLTextAreaElement>(null)
  const isInitialLoadRef = useRef(true)

  const touchStartPos = useRef<{ x: number; y: number; time: number } | null>(null)
  const isHorizontalSwipe = useRef<boolean>(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const lastTapRef = useRef<{ time: number; msgId: string } | null>(null)
  const hasTriggeredHaptic = useRef<boolean>(false)
  const actionSheetTouchStartRef = useRef<number | null>(null)

  // Audio Recording Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const waveformSamplesRef = useRef<number[]>([])

  const activeConv = conversations.find((c) => c.id === activeConvId)

  // Android Native Hardware Back Button Handler
  useEffect(() => {
    let unlisten: any = null
    const setupBackButton = async () => {
      try {
        // Dynamic import with fallback for browser / SSR
        // @ts-ignore
        const cap = await import('@capacitor/app').catch(() => null)
        if (!cap || !cap.App) return

        const listener = await cap.App.addListener('backButton', () => {
          if (isSettingsOpen) {
            setIsSettingsOpen(false)
          } else if (isBrowseSpacesOpen) {
            setIsBrowseSpacesOpen(false)
          } else if (isCodeModalOpen) {
            setIsCodeModalOpen(false)
          } else if (isMobileMoreOpen) {
            setIsMobileMoreOpen(false)
          } else if (showMobileMenuDrawer) {
            setShowMobileMenuDrawer(false)
          } else if (activeThreadParent) {
            setActiveThreadParent(null)
          } else if (activeConvId) {
            setActiveConvId('')
          } else {
            cap.App.minimizeApp()
          }
        })
        unlisten = listener
      } catch {
        // Fallback when running directly in browser
      }
    }
    setupBackButton()
    return () => {
      if (unlisten && typeof unlisten.remove === 'function') {
        unlisten.remove()
      }
    }
  }, [
    isSettingsOpen,
    isBrowseSpacesOpen,
    isCodeModalOpen,
    isMobileMoreOpen,
    showMobileMenuDrawer,
    activeThreadParent,
    activeConvId,
  ])

  // Action Sheet Pull Down Handlers
  const handleActionSheetTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      actionSheetTouchStartRef.current = e.touches[0].clientY
    }
  }

  const handleActionSheetTouchMove = (e: React.TouchEvent) => {
    if (actionSheetTouchStartRef.current !== null && e.touches.length === 1) {
      const deltaY = e.touches[0].clientY - actionSheetTouchStartRef.current
      if (deltaY > 0) {
        setActionSheetPullOffset(deltaY)
      }
    }
  }

  const handleActionSheetTouchEnd = () => {
    if (actionSheetPullOffset > 60) {
      setMobileActionMessage(null)
    }
    setActionSheetPullOffset(0)
    actionSheetTouchStartRef.current = null
  }

  // Voice Note Recording Handlers
  const handleStartVoiceRecording = async () => {
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        alert('Microphone access is not supported by your browser')
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioStreamRef.current = stream

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/webm'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []
      waveformSamplesRef.current = []

      // Audio analysis for live animated visualizer
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
        audioContextRef.current = audioCtx
        const source = audioCtx.createMediaStreamSource(stream)
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 64
        source.connect(analyser)
        analyserRef.current = analyser

        const dataArray = new Uint8Array(analyser.frequencyBinCount)

        const updateWaveform = () => {
          if (!analyserRef.current) return
          analyserRef.current.getByteFrequencyData(dataArray)
          
          let sum = 0
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i]
          }
          const avg = sum / dataArray.length / 255
          const normalized = Math.max(0.15, Math.min(1.0, avg * 2.2))

          waveformSamplesRef.current.push(normalized)
          if (waveformSamplesRef.current.length > 32) {
            waveformSamplesRef.current.shift()
          }

          setRecordingWaveformLevels((prev) => {
            return [...prev.slice(1), normalized]
          })

          animationFrameRef.current = requestAnimationFrame(updateWaveform)
        }

        animationFrameRef.current = requestAnimationFrame(updateWaveform)
      } catch (err) {
        console.warn('Audio analyser skipped:', err)
      }

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      recorder.start(100)
      setIsRecordingVoice(true)
      setRecordingDuration(0)

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1)
      }, 1000)
    } catch (err: any) {
      alert(err.message || 'Microphone access was denied')
    }
  }

  const handleStopVoiceRecording = async (shouldSend: boolean) => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }

    const stream = audioStreamRef.current
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      audioStreamRef.current = null
    }

    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
    }

    const duration = recordingDuration
    const recordedWaveform = [...waveformSamplesRef.current]

    setIsRecordingVoice(false)
    setRecordingDuration(0)

    if (shouldSend && activeConvId) {
      setTimeout(async () => {
        try {
          setSending(true)
          const chunks = audioChunksRef.current
          if (!chunks.length) return

          const mimeType = recorder?.mimeType || 'audio/webm'
          const audioBlob = new Blob(chunks, { type: mimeType })
          const fileName = `voice-${Date.now()}.webm`
          const audioFile = new File([audioBlob], fileName, { type: mimeType })

          const formData = new FormData()
          formData.append('file', audioFile)
          formData.append('conversationId', activeConvId)

          const uploadRes = await uploadChatAttachmentAction(formData)
          if (!uploadRes.success || !uploadRes.url) {
            throw new Error(uploadRes.error || 'Failed to upload voice note')
          }
          const fileUrl = uploadRes.url

          await sendMessageAction({
            conversationId: activeConvId,
            content: `🎤 Voice note (${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')})`,
            messageType: 'file',
            fileUrl,
            fileName: 'Voice Note',
            fileSizeBytes: audioBlob.size,
            fileType: mimeType,
            metadata: {
              isVoiceNote: true,
              duration,
              waveform: recordedWaveform.length >= 10 ? recordedWaveform : undefined,
              replyTo: replyingTo
                ? {
                    messageId: replyingTo.id,
                    senderName: replyingTo.senderName,
                    content: replyingTo.content,
                    messageType: replyingTo.messageType,
                  }
                : undefined,
            },
          })
          setReplyingTo(null)
          soundEffects.playMessageSentSound()

          const fresh = await getConversationMessagesAction(activeConvId)
          setMessages(fresh)
          broadcastChatActivity()
          broadcastTypingStatus(false)
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
        } catch (err: any) {
          alert(err.message || 'Failed to send voice note')
        } finally {
          setSending(false)
          audioChunksRef.current = []
        }
      }, 250)
    } else {
      audioChunksRef.current = []
    }
  }

  // Touch Gestures Handlers
  const handleTouchStart = (msg: ChatMessageItem, e: React.TouchEvent) => {
    if (e.touches.length !== 1) return
    const touch = e.touches[0]
    touchStartPos.current = { x: touch.clientX, y: touch.clientY, time: Date.now() }
    isHorizontalSwipe.current = false
    hasTriggeredHaptic.current = false

    // Long press timer (420ms) for action sheet
    longPressTimer.current = setTimeout(() => {
      try {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(25)
        }
      } catch {}
      setMobileActionMessage(msg)
      touchStartPos.current = null
    }, 420)
  }

  const handleTouchMove = (msg: ChatMessageItem, isMe: boolean, e: React.TouchEvent) => {
    if (!touchStartPos.current || e.touches.length !== 1) return
    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStartPos.current.x
    const deltaY = touch.clientY - touchStartPos.current.y

    // Cancel long press if finger moved
    if (Math.hypot(deltaX, deltaY) > 8 && longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }

    // Determine swipe direction
    if (!isHorizontalSwipe.current) {
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 8) {
        // Vertical scroll -> cancel swipe
        touchStartPos.current = null
        setSwipingMessageId(null)
        setSwipeOffset(0)
        return
      } else if (Math.abs(deltaX) > 8) {
        isHorizontalSwipe.current = true
      }
    }

    if (isHorizontalSwipe.current) {
      // Calculate responsive swipe offset
      // If received (left-aligned): swipe right (+deltaX)
      // If sent (right-aligned): swipe left (-deltaX)
      let offset = 0
      if (!isMe && deltaX > 0) {
        offset = Math.min(deltaX * 0.45, 60)
      } else if (isMe && deltaX < 0) {
        offset = Math.max(deltaX * 0.45, -60)
      }

      setSwipingMessageId(msg.id)
      setSwipeOffset(offset)

      // Haptic tick on threshold reached
      if (Math.abs(offset) >= 40 && !hasTriggeredHaptic.current) {
        hasTriggeredHaptic.current = true
        try {
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(12)
          }
        } catch {}
      }
    }
  }

  const handleTouchEnd = (msg: ChatMessageItem, isMe: boolean, e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }

    const currentOffset = swipingMessageId === msg.id ? swipeOffset : 0
    const passedThreshold = Math.abs(currentOffset) >= 40

    if (passedThreshold) {
      // Trigger Quote Reply
      setReplyingTo(msg)
      mainInputRef.current?.focus()
    } else if (touchStartPos.current) {
      // Check for Double-Tap Heart Reaction
      const now = Date.now()
      const touchDuration = now - touchStartPos.current.time
      if (touchDuration < 280) {
        if (
          lastTapRef.current &&
          now - lastTapRef.current.time < 320 &&
          lastTapRef.current.msgId === msg.id
        ) {
          // Double Tap Triggered!
          handleReaction(msg.id, '❤️')
          try {
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate([10, 30, 15])
            }
          } catch {}

          // Add floating heart particle burst
          const burstId = `burst-${Date.now()}`
          const touchX = touchStartPos.current?.x || (typeof window !== 'undefined' ? window.innerWidth / 2 : 100)
          const touchY = touchStartPos.current?.y || 200
          setHeartBursts((prev) => [
            ...prev,
            { id: burstId, msgId: msg.id, x: touchX, y: touchY },
          ])
          setTimeout(() => {
            setHeartBursts((prev) => prev.filter((b) => b.id !== burstId))
          }, 800)

          lastTapRef.current = null
        } else {
          lastTapRef.current = { time: now, msgId: msg.id }
        }
      }
    }

    // Reset touch and swipe
    touchStartPos.current = null
    setSwipingMessageId(null)
    setSwipeOffset(0)
    isHorizontalSwipe.current = false
    hasTriggeredHaptic.current = false
  }

  // Scroll to original message when quoted reply bubble is clicked
  const scrollToMessage = (targetId: string) => {
    if (!targetId) return
    const el = document.getElementById(`chat-msg-${targetId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('ring-2', 'ring-[var(--md-sys-color-primary)]', 'rounded-2xl', 'transition-all', 'duration-300')
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-[var(--md-sys-color-primary)]', 'rounded-2xl')
      }, 2000)
    }
  }

  // Close message reaction picker on outside click or Escape
  useEffect(() => {
    const handleGlobalClick = () => setReactingMessageId(null)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setReactingMessageId(null)
    }
    window.addEventListener('click', handleGlobalClick)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('click', handleGlobalClick)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Broadcast typing status (start/stop) to peers
  const broadcastTypingStatus = useCallback(
    (isTyping: boolean) => {
      if (!activeConvId || !currentUserId) return
      try {
        const supabase = createClient()
        supabase.channel(`chat-realtime-${activeConvId}`).send({
          type: 'broadcast',
          event: isTyping ? 'typing_start' : 'typing_stop',
          payload: {
            conversationId: activeConvId,
            userId: currentUserId,
            userName: currentUserName || 'Teammate',
            avatarUrl: currentUserAvatar,
            timestamp: Date.now(),
          },
        })
        isCurrentlyTypingRef.current = isTyping
      } catch {}
    },
    [activeConvId, currentUserId, currentUserName, currentUserAvatar]
  )

  // Broadcast seen/read receipt to peers
  const broadcastConversationRead = useCallback(() => {
    if (!activeConvId || !currentUserId) return
    try {
      const supabase = createClient()
      supabase.channel(`chat-realtime-${activeConvId}`).send({
        type: 'broadcast',
        event: 'conversation_read',
        payload: {
          conversationId: activeConvId,
          userId: currentUserId,
          readAt: new Date().toISOString(),
        },
      })
    } catch {}
  }, [activeConvId, currentUserId])

  // Handle typing debounce on input change
  const handleInputChange = (text: string) => {
    setInputText(text)
    if (!activeConvId) return

    if (text.trim().length > 0) {
      if (!isCurrentlyTypingRef.current) {
        broadcastTypingStatus(true)
      }
      if (typingDebounceTimer.current) clearTimeout(typingDebounceTimer.current)
      typingDebounceTimer.current = setTimeout(() => {
        broadcastTypingStatus(false)
      }, 2500)
    } else {
      if (typingDebounceTimer.current) clearTimeout(typingDebounceTimer.current)
      broadcastTypingStatus(false)
    }
  }

  // Clear stale typing indicators periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setTypingUsers((prev) => {
        const copy: typeof prev = {}
        let hasChanges = false
        for (const [id, user] of Object.entries(prev)) {
          if (now - user.timestamp < 3500) {
            copy[id] = user
          } else {
            hasChanges = true
          }
        }
        return hasChanges ? copy : prev
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Load messages whenever active conversation changes
  useEffect(() => {
    if (!activeConvId) return
    let isMounted = true
    setLoadingMessages(true)
    isInitialLoadRef.current = true

    // Optimistically zero out unreadCount on active conversation
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConvId ? { ...c, unreadCount: 0 } : c))
    )

    getConversationMessagesAction(activeConvId)
      .then((msgs) => {
        if (isMounted) {
          setMessages(msgs)
          setLoadingMessages(false)
          markConversationAsReadAction(activeConvId).then(() => {
            broadcastConversationRead()
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('unread-messages-count-updated'))
            }
          })

          // ONLY Auto-scroll to bottom once upon initial load of conversation
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
            isInitialLoadRef.current = false
          }, 80)
        }
      })
      .catch((err) => {
        console.error('Failed to load messages:', err)
        if (isMounted) setLoadingMessages(false)
      })

    return () => {
      isMounted = false
    }
  }, [activeConvId, broadcastConversationRead])

  // Refresh messages helper (0ms Optimistic UI Reconciliation + Smart Scrolling)
  const refreshMessages = useCallback(async (playIncomingSound = false) => {
    if (!activeConvId) return
    try {
      const freshMessages = await getConversationMessagesAction(activeConvId)

      // Reconcile and preserve pending optimistic messages (temp-...) that have not landed in DB yet
      setMessages((prev) => {
        const pendingOptimistic = prev.filter(
          (m) =>
            m.id.startsWith('temp-') &&
            !freshMessages.some(
              (f) =>
                f.id === m.id ||
                (f.senderId === m.senderId &&
                  f.content === m.content &&
                  Math.abs(new Date(f.createdAt).getTime() - new Date(m.createdAt).getTime()) < 20000)
            )
        )
        return [...freshMessages, ...pendingOptimistic]
      })

      if (playIncomingSound) {
        soundEffects.playNotificationSound()
        markConversationAsReadAction(activeConvId).then(() => {
          broadcastConversationRead()
        })
      }

      // Smart Scroll: ONLY scroll if user is already near bottom (within 150px); never interrupt reading history
      const container = messagesContainerRef.current
      if (container) {
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 160
        if (isNearBottom) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
          }, 50)
        }
      }

      if (activeThreadParent) {
        const threadMsgs = await getConversationMessagesAction(activeConvId, activeThreadParent.id)
        setThreadMessages(threadMsgs)
      }
    } catch (err) {
      console.error('Failed to refresh messages:', err)
    }
  }, [activeConvId, activeThreadParent, broadcastConversationRead])

  // Instant broadcast trigger to all active peers
  const broadcastChatActivity = useCallback(() => {
    if (!activeConvId) return
    try {
      const supabase = createClient()
      const channel = supabase.channel(`chat-realtime-${activeConvId}`)
      channel.send({
        type: 'broadcast',
        event: 'chat_activity',
        payload: { conversationId: activeConvId, timestamp: Date.now() },
      })
    } catch {}
  }, [activeConvId])

  // Helper to update presence across WebSocket channel & local state
  const trackPresenceState = useCallback(
    (status: 'active' | 'away' | 'dnd', statusMsg = '') => {
      currentPresenceStatusRef.current = status
      setCurrentUserPresenceStatus(status)
      setCurrentStatusMessage(statusMsg)
      if (presenceChannelRef.current) {
        presenceChannelRef.current.track({
          user_id: currentUserId,
          name: currentUserName,
          avatarUrl: currentUserAvatar,
          status: status === 'active' ? 'online' : status,
          statusMessage: statusMsg,
          onlineAt: new Date().toISOString(),
        })
      }
    },
    [currentUserId, currentUserName, currentUserAvatar]
  )

  // 100% Accurate Global Presence Subscription via Supabase WebSockets
  useEffect(() => {
    if (!currentUserId) return
    const supabase = createClient()
    const presenceChannel = supabase.channel('global-user-presence', {
      config: { presence: { key: currentUserId } },
    })
    presenceChannelRef.current = presenceChannel

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        const activeIds = new Set<string>()
        const presenceMap: Record<string, { status: string; statusMessage?: string }> = {}

        Object.keys(state).forEach((userId) => {
          activeIds.add(userId)
          const presences = state[userId] as any[]
          if (presences && presences.length > 0) {
            presenceMap[userId] = {
              status: presences[0].status || 'online',
              statusMessage: presences[0].statusMessage || '',
            }
          }
        })

        setOnlineUserIds(activeIds)
        setUserPresenceMap(presenceMap)
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUserIds((prev) => new Set([...prev, key]))
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUserIds((prev) => {
          const copy = new Set(prev)
          copy.delete(key)
          return copy
        })
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const curSt = currentPresenceStatusRef.current
          await presenceChannel.track({
            user_id: currentUserId,
            name: currentUserName,
            avatarUrl: currentUserAvatar,
            status: curSt === 'active' ? 'online' : curSt,
            statusMessage: currentStatusMessage,
            onlineAt: new Date().toISOString(),
          })
        }
      })

    return () => {
      presenceChannelRef.current = null
      supabase.removeChannel(presenceChannel)
    }
  }, [currentUserId, currentUserName, currentUserAvatar, currentStatusMessage])

  // 1-Minute Inactivity Auto-Away Engine & Activity Wakeup Listener
  useEffect(() => {
    if (!currentUserId) return

    const resetInactivityTimer = () => {
      // If currently in a meeting, stay in DND / In a meeting
      if (isInMeetingRef.current) return

      // If user was auto-marked away due to inactivity, immediately wake them back to Active!
      if (currentPresenceStatusRef.current === 'away' && !isManuallySetRef.current) {
        trackPresenceState('active', '')
      }

      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
      inactivityTimerRef.current = setTimeout(() => {
        // Exactly 60 seconds (1 minute) of inactivity -> transition to Away
        if (!isInMeetingRef.current && !isManuallySetRef.current) {
          trackPresenceState('away', 'Away')
        }
      }, 60 * 1000)
    }

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click']
    activityEvents.forEach((evt) => window.addEventListener(evt, resetInactivityTimer, { passive: true }))

    const handleVisibility = () => {
      if (document.hidden) {
        if (!isInMeetingRef.current && !isManuallySetRef.current) {
          trackPresenceState('away', 'Away')
        }
      } else {
        resetInactivityTimer()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    // Start initial 1-minute timer
    resetInactivityTimer()

    return () => {
      activityEvents.forEach((evt) => window.removeEventListener(evt, resetInactivityTimer))
      document.removeEventListener('visibilitychange', handleVisibility)
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
    }
  }, [currentUserId, trackPresenceState])

  // Real-time Meeting & Call State Detection (Meet -> Busy / DND, End -> Active)
  useEffect(() => {
    const handleMeetingStart = () => {
      isInMeetingRef.current = true
      trackPresenceState('dnd', 'In a meeting')
    }

    const handleMeetingEnd = () => {
      isInMeetingRef.current = false
      trackPresenceState('active', '')
    }

    window.addEventListener('start-outgoing-call' as any, handleMeetingStart)
    window.addEventListener('trigger-incoming-call' as any, handleMeetingStart)
    window.addEventListener('meeting-started' as any, handleMeetingStart)
    window.addEventListener('call-active' as any, handleMeetingStart)
    window.addEventListener('call-ended' as any, handleMeetingEnd)
    window.addEventListener('meeting-ended' as any, handleMeetingEnd)

    return () => {
      window.removeEventListener('start-outgoing-call' as any, handleMeetingStart)
      window.removeEventListener('trigger-incoming-call' as any, handleMeetingStart)
      window.removeEventListener('meeting-started' as any, handleMeetingStart)
      window.removeEventListener('call-active' as any, handleMeetingStart)
      window.removeEventListener('call-ended' as any, handleMeetingEnd)
      window.removeEventListener('meeting-ended' as any, handleMeetingEnd)
    }
  }, [trackPresenceState])

  // Real-time Supabase Subscription & Resilient Auto-Sync
  useEffect(() => {
    if (!activeConvId) return

    const supabase = createClient()

    // 1. Direct WebSocket Broadcast Channel (Instant 0ms latency between peers)
    const realtimeChannel = supabase
      .channel(`chat-realtime-${activeConvId}`)
      .on('broadcast', { event: 'chat_realtime_message' }, (payload: any) => {
        const incomingMsg: ChatMessageItem = payload?.payload?.message
        if (incomingMsg && incomingMsg.conversationId === activeConvId) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === incomingMsg.id)) return prev
            return [...prev, incomingMsg]
          })
          if (incomingMsg.parentId && activeThreadParent?.id === incomingMsg.parentId) {
            setThreadMessages((prev) => {
              if (prev.some((m) => m.id === incomingMsg.id)) return prev
              return [...prev, incomingMsg]
            })
          }
          if (incomingMsg.senderId !== currentUserId) {
            soundEffects.playNotificationSound()
          }
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 20)
        }
      })
      .on('broadcast', { event: 'chat_activity' }, async () => {
        await refreshMessages(true)
      })
      .on('broadcast', { event: 'typing_start' }, (payload: any) => {
        const data = payload?.payload
        if (data?.userId && data.userId !== currentUserId) {
          setTypingUsers((prev) => ({
            ...prev,
            [data.userId]: {
              userName: data.userName || 'Teammate',
              avatarUrl: data.avatarUrl,
              timestamp: Date.now(),
            },
          }))
        }
      })
      .on('broadcast', { event: 'typing_stop' }, (payload: any) => {
        const data = payload?.payload
        if (data?.userId) {
          setTypingUsers((prev) => {
            const copy = { ...prev }
            delete copy[data.userId]
            return copy
          })
        }
      })
      .on('broadcast', { event: 'conversation_read' }, (payload: any) => {
        const readerId = payload?.payload?.userId
        if (readerId && readerId !== currentUserId) {
          setMessages((prev) =>
            prev.map((m) =>
              m.senderId === currentUserId ? { ...m, status: 'seen' } : m
            )
          )
        }
      })
      .on('broadcast', { event: 'call_declined' }, async () => {
        await refreshMessages()
      })
      .on('broadcast', { event: 'call_cancelled' }, async () => {
        await refreshMessages()
      })
      .on('broadcast', { event: 'call_accepted' }, async () => {
        await refreshMessages()
      })
      .subscribe()

    // 2. Postgres Database Changes listener
    const dbChannel = supabase
      .channel(`chat-db-${activeConvId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
        },
        async (payload) => {
          const msgConvId = (payload.new as any)?.conversation_id || (payload.old as any)?.conversation_id
          if (!msgConvId || msgConvId === activeConvId) {
            const isIncoming = payload.eventType === 'INSERT' && (payload.new as any)?.sender_id !== currentUserId
            await refreshMessages(isIncoming)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_reactions',
        },
        async () => {
          await refreshMessages()
        }
      )
      .subscribe()

    // 3. Resilient Polling Heartbeat (every 3 seconds when tab is active)
    const pollInterval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        refreshMessages()
      }
    }, 3000)

    // 4. Instant Refresh on Tab Focus / Visibility Change
    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        refreshMessages()
      }
    }
    window.addEventListener('visibilitychange', handleVisibilityOrFocus)
    window.addEventListener('focus', handleVisibilityOrFocus)

    return () => {
      clearInterval(pollInterval)
      window.removeEventListener('visibilitychange', handleVisibilityOrFocus)
      window.removeEventListener('focus', handleVisibilityOrFocus)
      supabase.removeChannel(realtimeChannel)
      supabase.removeChannel(dbChannel)
    }
  }, [activeConvId, currentUserId, refreshMessages])

  // Real-time Conversation List unread count listener
  useEffect(() => {
    const supabase = createClient()
    const globalChannel = supabase
      .channel('chat-global-sidebar-unread')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        async (payload) => {
          const newMsg = payload.new as any
          if (newMsg && newMsg.conversation_id !== activeConvId && newMsg.sender_id !== currentUserId) {
            const freshConvs = await getConversationsListAction()
            setConversations(freshConvs)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(globalChannel)
    }
  }, [activeConvId, currentUserId])

  // Load thread replies when parent is selected
  useEffect(() => {
    if (!activeThreadParent || !activeConvId) return
    getConversationMessagesAction(activeConvId, activeThreadParent.id).then((tMsgs) => {
      setThreadMessages(tMsgs)
    })
  }, [activeThreadParent, activeConvId])

  // Send Main Message (Flash Speed / 0ms Optimistic + WebSocket Broadcast)
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputText.trim() || !activeConvId) return

    const content = inputText.trim()
    const replyMeta = replyingTo
      ? {
          replyTo: {
            messageId: replyingTo.id,
            senderName: replyingTo.senderName,
            content:
              replyingTo.messageType === 'file'
                ? `📎 ${replyingTo.fileName || 'Attachment'}`
                : replyingTo.messageType === 'meet_card'
                ? '📹 Video Meeting'
                : replyingTo.content,
            messageType: replyingTo.messageType,
          },
        }
      : undefined

    const targetUserId = activeConv?.type === 'direct' ? activeConv.otherParticipant?.userId : null
    const isTargetOnline = targetUserId ? onlineUserIds.has(targetUserId) : true
    const initialStatus: 'sent' | 'delivered' = isTargetOnline ? 'delivered' : 'sent'

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`
    const nowIso = new Date().toISOString()
    const optimisticMsg: ChatMessageItem = {
      id: tempId,
      conversationId: activeConvId,
      senderId: currentUserId,
      senderName: currentUserName,
      senderAvatarUrl: currentUserAvatar,
      senderRole: currentUserRole,
      content,
      messageType: 'text',
      isEdited: false,
      isPinned: false,
      status: initialStatus,
      replyTo: replyMeta?.replyTo,
      reactions: [],
      createdAt: nowIso,
      updatedAt: nowIso,
    }

    // 1. INSTANT (0ms) LOCAL APPEND & UI RESET
    setMessages((prev) => [...prev, optimisticMsg])
    setInputText('')
    setReplyingTo(null)
    soundEffects.playMessageSentSound()
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 10)

    // Update conversation snippet in local sidebar immediately
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId
          ? {
              ...c,
              lastMessageAt: nowIso,
              lastMessageSnippet: content,
              lastMessageSenderName: currentUserName,
            }
          : c
      )
    )

    // 2. INSTANT (<10ms) DIRECT WEBSOCKET BROADCAST TO PEERS
    try {
      const supabase = createClient()
      supabase.channel(`chat-realtime-${activeConvId}`).send({
        type: 'broadcast',
        event: 'chat_realtime_message',
        payload: { message: optimisticMsg },
      })
    } catch {}

    broadcastTypingStatus(false)

    // 3. BACKGROUND PERSIST TO DATABASE
    sendMessageAction({
      conversationId: activeConvId,
      content,
      messageType: 'text',
      metadata: replyMeta,
    })
      .then((newMsg) => {
        if (newMsg?.id) {
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? { ...m, id: newMsg.id } : m))
          )
        }
      })
      .catch((err) => {
        console.error('Failed to persist message to DB:', err)
      })
  }

  // Handle Select Emoji from Picker
  const handleSelectEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji)
    setShowEmojiPicker(false)
    mainInputRef.current?.focus()
  }

  // Handle Select & Send GIF from Picker (Flash Speed)
  const handleSelectGif = async (gifUrl: string, title: string) => {
    if (!activeConvId) return
    setShowEmojiPicker(false)
    soundEffects.playMessageSentSound()

    const replyMeta = replyingTo
      ? {
          replyTo: {
            messageId: replyingTo.id,
            senderName: replyingTo.senderName,
            content:
              replyingTo.messageType === 'file'
                ? `📎 ${replyingTo.fileName || 'Attachment'}`
                : replyingTo.messageType === 'meet_card'
                ? '📹 Video Meeting'
                : replyingTo.content,
            messageType: replyingTo.messageType,
          },
          isGif: true,
        }
      : { isGif: true }

    setReplyingTo(null)

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`
    const nowIso = new Date().toISOString()
    const optimisticMsg: ChatMessageItem = {
      id: tempId,
      conversationId: activeConvId,
      senderId: currentUserId,
      senderName: currentUserName,
      senderAvatarUrl: currentUserAvatar,
      senderRole: currentUserRole,
      content: '',
      messageType: 'file',
      fileUrl: gifUrl,
      fileName: 'GIF',
      fileType: 'image/gif',
      isEdited: false,
      isPinned: false,
      status: 'sent',
      replyTo: replyMeta?.replyTo,
      reactions: [],
      metadata: replyMeta,
      createdAt: nowIso,
      updatedAt: nowIso,
    }

    setMessages((prev) => [...prev, optimisticMsg])
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 10)

    try {
      const supabase = createClient()
      supabase.channel(`chat-realtime-${activeConvId}`).send({
        type: 'broadcast',
        event: 'chat_realtime_message',
        payload: { message: optimisticMsg },
      })
    } catch {}

    sendMessageAction({
      conversationId: activeConvId,
      content: '',
      messageType: 'file',
      fileUrl: gifUrl,
      fileName: 'GIF',
      fileType: 'image/gif',
      metadata: replyMeta,
    })
      .then((newMsg) => {
        if (newMsg?.id) {
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? { ...m, id: newMsg.id } : m))
          )
        }
      })
      .catch((err) => {
        console.error('Failed to send GIF:', err)
      })
  }

  // Handle Send Code Snippet (Flash Speed)
  const handleSendCodeSnippet = async (
    code: string,
    language: string,
    title?: string,
    note?: string
  ) => {
    if (!activeConvId) return
    setIsCodeModalOpen(false)
    soundEffects.playMessageSentSound()

    const replyMeta = replyingTo
      ? {
          replyTo: {
            messageId: replyingTo.id,
            senderName: replyingTo.senderName,
            content:
              replyingTo.messageType === 'file'
                ? `📎 ${replyingTo.fileName || 'Attachment'}`
                : replyingTo.messageType === 'meet_card'
                ? '📹 Video Meeting'
                : replyingTo.messageType === 'code'
                ? '💻 Code snippet'
                : replyingTo.content,
            messageType: replyingTo.messageType,
          },
          isCode: true,
          language,
          title,
          note,
        }
      : { isCode: true, language, title, note }

    setReplyingTo(null)

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`
    const nowIso = new Date().toISOString()
    const optimisticMsg: ChatMessageItem = {
      id: tempId,
      conversationId: activeConvId,
      senderId: currentUserId,
      senderName: currentUserName,
      senderAvatarUrl: currentUserAvatar,
      senderRole: currentUserRole,
      content: code,
      messageType: 'code',
      isEdited: false,
      isPinned: false,
      status: 'sent',
      replyTo: replyMeta?.replyTo,
      reactions: [],
      metadata: replyMeta,
      createdAt: nowIso,
      updatedAt: nowIso,
    }

    setMessages((prev) => [...prev, optimisticMsg])
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 10)

    try {
      const supabase = createClient()
      supabase.channel(`chat-realtime-${activeConvId}`).send({
        type: 'broadcast',
        event: 'chat_realtime_message',
        payload: { message: optimisticMsg },
      })
    } catch {}

    sendMessageAction({
      conversationId: activeConvId,
      content: code,
      messageType: 'code',
      metadata: replyMeta,
    })
      .then((newMsg) => {
        if (newMsg?.id) {
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? { ...m, id: newMsg.id } : m))
          )
        }
      })
      .catch((err) => {
        console.error('Failed to send code snippet:', err)
      })
  }

  // Send Thread Reply (Flash Speed)
  const handleSendThreadReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!threadInputText.trim() || !activeConvId || !activeThreadParent) return

    const content = threadInputText.trim()
    setThreadInputText('')
    soundEffects.playMessageSentSound()

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`
    const nowIso = new Date().toISOString()
    const optimisticMsg: ChatMessageItem = {
      id: tempId,
      conversationId: activeConvId,
      parentId: activeThreadParent.id,
      senderId: currentUserId,
      senderName: currentUserName,
      senderAvatarUrl: currentUserAvatar,
      senderRole: currentUserRole,
      content,
      messageType: 'text',
      isEdited: false,
      isPinned: false,
      status: 'sent',
      reactions: [],
      createdAt: nowIso,
      updatedAt: nowIso,
    }

    setThreadMessages((prev) => [...prev, optimisticMsg])
    setMessages((prev) => [...prev, optimisticMsg])

    try {
      const supabase = createClient()
      supabase.channel(`chat-realtime-${activeConvId}`).send({
        type: 'broadcast',
        event: 'chat_realtime_message',
        payload: { message: optimisticMsg },
      })
    } catch {}

    sendMessageAction({
      conversationId: activeConvId,
      content,
      parentId: activeThreadParent.id,
    })
      .then((newMsg) => {
        if (newMsg?.id) {
          setThreadMessages((prev) =>
            prev.map((m) => (m.id === tempId ? { ...m, id: newMsg.id } : m))
          )
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? { ...m, id: newMsg.id } : m))
          )
        }
      })
      .catch((err) => {
        console.error('Failed to send reply:', err)
      })
  }

  // Toggle Reaction
  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      await toggleReactionAction(messageId, emoji)
      const fresh = await getConversationMessagesAction(activeConvId)
      setMessages(fresh)
      broadcastChatActivity()
    } catch (err) {
      console.error('Failed to toggle reaction:', err)
    }
  }

  // Delete Message Handler
  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) return
    setMessages((prev) => prev.filter((m) => m.id !== messageId))
    setThreadMessages((prev) => prev.filter((m) => m.id !== messageId))
    try {
      const res = await deleteMessageAction(messageId)
      if (!res.success) {
        alert(res.error || 'Failed to delete message')
        const fresh = await getConversationMessagesAction(activeConvId)
        setMessages(fresh)
      } else {
        broadcastChatActivity()
      }
    } catch (err) {
      console.error('Failed to delete message:', err)
    }
  }

  // Edit Message Handlers
  const handleStartEdit = (msg: ChatMessageItem) => {
    setEditingMessageId(msg.id)
    setEditText(msg.content)
  }

  const handleCancelEdit = () => {
    setEditingMessageId(null)
    setEditText('')
  }

  const handleSaveEdit = async (messageId: string) => {
    if (!editText.trim()) return
    const newText = editText.trim()

    // Optimistic update
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, content: newText, isEdited: true, updatedAt: new Date().toISOString() }
          : m
      )
    )
    setThreadMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, content: newText, isEdited: true, updatedAt: new Date().toISOString() }
          : m
      )
    )
    setEditingMessageId(null)
    setEditText('')

    try {
      const res = await editMessageAction(messageId, newText)
      if (!res.success) {
        alert(res.error || 'Failed to save edited message')
        const fresh = await getConversationMessagesAction(activeConvId)
        setMessages(fresh)
      } else {
        broadcastChatActivity()
      }
    } catch (err: any) {
      console.error('Failed to edit message:', err)
    }
  }

  // Forward Message Handler
  const handleOpenForward = (msg: ChatMessageItem) => {
    setForwardingMessage(msg)
    setIsForwardOpen(true)
  }

  // Start Realtime Outgoing Ringing Call
  const handleStartCall = async (callType: 'video' | 'audio' = 'video') => {
    if (!activeConvId || startingMeet) return
    try {
      setStartingMeet(true)
      const targetUserId = activeConv?.type === 'direct' ? activeConv.otherParticipant?.userId : undefined
      const res = await initiateCallAction({
        conversationId: activeConvId,
        targetUserId,
        callType,
        title: `${callType === 'video' ? 'Live Video' : 'Voice'} Call with ${activeConv?.name || 'Teammate'}`,
      })

      if (!res.success || !res.callPayload) {
        throw new Error(res.error || 'Failed to initiate call')
      }

      // Dispatch outgoing ringing screen locally
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('start-outgoing-call', { detail: res.callPayload })
        )
      }

      // Broadcast to all clients in real-time
      const supabase = createClient()
      const callChannel = supabase.channel('global-call-signaling')
      callChannel.send({
        type: 'broadcast',
        event: 'incoming_call',
        payload: res.callPayload,
      })

      const fresh = await getConversationMessagesAction(activeConvId)
      setMessages(fresh)
    } catch (err: any) {
      alert(err.message || 'Failed to start call')
    } finally {
      setStartingMeet(false)
    }
  }

  // Handle File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeConvId) return

    try {
      setSending(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('conversationId', activeConvId)

      const uploadRes = await uploadChatAttachmentAction(formData)
      if (!uploadRes.success || !uploadRes.url) {
        throw new Error(uploadRes.error || 'Failed to upload attachment')
      }

      await sendMessageAction({
        conversationId: activeConvId,
        content: `Shared file: ${file.name}`,
        messageType: 'file',
        fileUrl: uploadRes.url,
        fileName: file.name,
        fileSizeBytes: file.size,
        fileType: file.type,
      })
      soundEffects.playMessageSentSound()

      const fresh = await getConversationMessagesAction(activeConvId)
      setMessages(fresh)
      broadcastChatActivity()
      broadcastTypingStatus(false)
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    } catch (err: any) {
      alert(err.message || 'Failed to upload attachment')
    } finally {
      setSending(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const filteredChannels = conversations.filter(
    (c) => c.type === 'channel' && c.name.toLowerCase().includes(convSearch.toLowerCase())
  )
  const filteredDMs = conversations.filter(
    (c) => c.type === 'direct' && c.name.toLowerCase().includes(convSearch.toLowerCase())
  )

  const formatMessageTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatMessageDateGroup = (isoString: string) => {
    const date = new Date(isoString)
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(today.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    }
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    })
  }

  const handleCopyMessage = (msgId: string, text: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedMessageId(msgId)
    setTimeout(() => setCopiedMessageId(null), 2000)
  }

  const getRoleColor = (role?: string) => {
    return 'text-[var(--md-sys-color-on-surface)]'
  }

  const getSmartReplySuggestions = (lastMsg?: ChatMessageItem, currentUserId?: string): string[] => {
    if (!lastMsg || !lastMsg.content) {
      return ['Hello!', 'Hi there!', 'How are you?']
    }

    const text = lastMsg.content.toLowerCase().trim()
    const isMe = lastMsg.senderId === currentUserId

    // If last message is from me, provide natural follow-up options
    if (isMe) {
      return ['Any update on this?', 'Please let me know when you check', 'Thanks!']
    }

    // 1. Greetings
    if (/^(hi|hello|hey|hola|good morning|good afternoon|good evening|namaste)\b/i.test(text)) {
      return ['Hello! How are you?', 'Hi there! What’s up?', 'Hey! How can I help?']
    }

    // 2. How are you / Status check
    if (/how are you|how’re you|how is it going|how are things|all good\?/i.test(text)) {
      return ['I am doing well, thanks!', 'All good here, how about you?', 'Doing great, thank you!']
    }

    // 3. Meeting / Video / Audio call invites (e.g. "join the meet", "are you free for call")
    if (/meet|call|join|google meet|video|zoom|link|meeting/i.test(text)) {
      return ['Joining now!', 'Give me 2 minutes', 'Sure, let’s connect', 'On my way!']
    }

    // 4. Thank you / Appreciation
    if (/thank|thanks|thx|appreciate/i.test(text)) {
      return ['You’re welcome!', 'Anytime! Glad to help', 'No problem at all!']
    }

    // 5. Questions / Availability ("Are you free?", "Can you...?", "Available?")
    if (/\b(free|available|can you|could you|are you there|there\?)\b/i.test(text)) {
      return ['Yes, I am available!', 'In a quick task, back in 5 mins', 'Yes, what’s up?']
    }

    // 6. Work / Tasks / Approvals ("Done?", "Finished?", "Is it ok?", "Check this", "Review")
    if (/check|review|look|done|finish|status|update|progress/i.test(text)) {
      return ['Checking it right now!', 'Looks great, approved!', 'Working on it now', 'Will update you shortly']
    }

    // 7. Goodnight / Bye / Leaving
    if (/bye|good night|goodnight|see you|take care|cya/i.test(text)) {
      return ['Good night! Have a great one', 'Take care! See you tomorrow', 'Bye! Talk soon']
    }

    // 8. Confirmations / Agreements ("ok", "okay", "sure", "fine", "yes")
    if (/^(ok|okay|sure|fine|yes|cool|great|got it|noted)\b/i.test(text)) {
      return ['Sounds like a plan!', 'Great, thank you!', 'Awesome, talk soon']
    }

    // 9. Default natural context-aware English responses
    return ['Sounds good!', 'Got it, thanks!', 'Will do!']
  }

  // Mention members list from conversations
  const mentionMembers = useMemo(() => {
    const map = new Map<string, { id: string; name: string; avatarUrl?: string; role?: string }>()
    conversations.forEach((c) => {
      if (c.otherParticipant && c.otherParticipant.userId) {
        map.set(c.otherParticipant.userId, {
          id: c.otherParticipant.userId,
          name: c.otherParticipant.fullName,
          avatarUrl: c.otherParticipant.avatarUrl,
          role: c.otherParticipant.role,
        })
      }
    })
    return Array.from(map.values())
  }, [conversations])

  // Formatter for rich @mentions inside message bubbles
  const renderMessageWithMentions = (content: string, currentUserName?: string, isMe?: boolean) => {
    if (!content) return null

    const mentionRegex = /(@[a-zA-Z0-9_.-]+(?:\s+[a-zA-Z0-9_.-]+)?)/g
    const parts = content.split(mentionRegex)

    return (
      <div className="whitespace-pre-wrap break-words [word-break:break-word] overflow-hidden max-w-full">
        {parts.map((part, idx) => {
          if (part.startsWith('@')) {
            const mentionText = part.slice(1).trim().toLowerCase()
            const myName = (currentUserName || '').toLowerCase()
            const isMentioningMe =
              mentionText === 'all' ||
              mentionText === 'everyone' ||
              mentionText === 'here' ||
              (myName && (myName.includes(mentionText) || mentionText.includes(myName)))

            if (isMe) {
              return (
                <span
                  key={idx}
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-bold text-xs bg-white/20 text-white ring-1 ring-white/30 mx-0.5 select-none"
                >
                  {part}
                </span>
              )
            }

            if (isMentioningMe) {
              return (
                <span
                  key={idx}
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-bold text-xs bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] ring-1 ring-[var(--md-sys-color-primary)]/40 mx-0.5 select-none"
                >
                  {part}
                </span>
              )
            }

            return (
              <span
                key={idx}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-semibold text-xs bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-primary)] mx-0.5 select-none"
              >
                {part}
              </span>
            )
          }

          return <React.Fragment key={idx}>{part}</React.Fragment>
        })}
      </div>
    )
  }

  const totalUnreadCount = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0)

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[var(--md-sys-color-surface-container-lowest)] text-[var(--md-sys-color-on-surface)] relative font-sans">
      {/* 1. TOP GOOGLE CHAT APP HEADER BAR */}
      <div className={activeConvId ? 'hidden md:block w-full shrink-0' : 'w-full shrink-0'}>
        <GoogleChatHeader
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          currentUserRole={currentUserRole}
          currentUserAvatar={currentUserAvatar}
          searchQuery={convSearch}
          onSearchChange={setConvSearch}
          currentPresenceStatus={currentUserPresenceStatus}
          statusMessage={currentStatusMessage}
          onStatusChange={(newSt) => {
            isManuallySetRef.current = newSt
            trackPresenceState(newSt, newSt === 'dnd' ? 'Do not disturb' : '')
          }}
          onToggleSidebar={() => {
            if (typeof window !== 'undefined' && window.innerWidth < 768) {
              setShowMobileMenuDrawer((prev) => !prev)
            } else {
              setIsFirstSidebarOpen((prev) => !prev)
            }
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      </div>

      {/* 2. MAIN 3-PANE + COMPANION RAIL BODY */}
      <div className="flex-1 flex min-h-0 w-full overflow-hidden relative">
        {/* 2.1 FIRST SIDEBAR (Desktop Only: Shortcuts, DMs, Spaces) */}
        <div className={`${isFirstSidebarOpen ? 'hidden md:flex' : 'hidden'} shrink-0 h-full transition-all duration-150`}>
          <ChatNavColumn
            conversations={conversations}
            activeConvId={activeConvId}
            activeNavShortcut={activeNavShortcut}
            onlineUserIds={onlineUserIds}
            userPresenceMap={userPresenceMap}
            onSelectShortcut={(s) => {
              setActiveNavShortcut(s)
            }}
            onSelectConversation={(id) => {
              setActiveConvId(id)
            }}
            onNewChat={() => setIsNewChatOpen(true)}
            onNewChannel={() => setIsNewChannelOpen(true)}
            onBrowseSpaces={() => setIsBrowseSpacesOpen(true)}
          />
        </div>

        {/* 2.2 SECOND SIDEBAR (Below Home: Unified Home Inbox, Unread Toggle) */}
        <div className={`${!activeConvId ? 'flex' : 'hidden md:flex'} shrink-0 h-full w-full md:w-auto`}>
          <HomeFeedPane
            conversations={conversations}
            activeConvId={activeConvId}
            searchQuery={convSearch}
            onlineUserIds={onlineUserIds}
            userPresenceMap={userPresenceMap}
            activeMobileTab={activeMobileTab}
            onSelectConversation={(id) => {
              setActiveConvId(id)
            }}
          />
        </div>

        {/* 2.3 RIGHT CHAT PANE (Active conversation OR Mentions / Starred OR Illustrated Empty State) */}
        <div className={`flex-1 flex min-w-0 h-full overflow-hidden relative ${!activeConvId && activeNavShortcut === 'home' ? 'hidden md:flex' : 'flex'}`}>
          {activeNavShortcut === 'mentions' ? (
            <MentionsView
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              messages={messages}
              onSelectConversation={(id) => {
                setActiveConvId(id)
                setActiveNavShortcut('home')
              }}
            />
          ) : activeNavShortcut === 'starred' ? (
            <StarredView
              messages={messages}
              onSelectConversation={(id) => {
                setActiveConvId(id)
                setActiveNavShortcut('home')
              }}
            />
          ) : !activeConv ? (
            <NoConversationSelected onClose={() => setActiveConvId('')} />
          ) : (
            <div className="flex-1 flex min-w-0 h-full overflow-hidden relative">
              {/* 2. MAIN ACTIVE CHAT STREAM */}
              <main className="flex-1 flex flex-col min-w-0 h-full max-h-full overflow-hidden bg-[var(--md-sys-color-surface-container-lowest)] relative">
        {/* Chat Top Header (Pinned & Fixed with Safe-Area Headroom) */}
        <header className="w-full px-3 sm:px-4 pt-[max(env(safe-area-inset-top,0px),0px)] border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]/95 backdrop-blur-md shrink-0 sticky top-0 z-20 select-none">
          <div className="h-14 w-full flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3 truncate min-w-0 flex-1">
              {/* Clean Mobile Back Button */}
              <button
                onClick={() => setActiveConvId('')}
                className="md:hidden p-2 -ml-1 rounded-full text-[var(--md-sys-color-on-surface)] hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all shrink-0 cursor-pointer"
                title="Back to conversations"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 min-w-0 truncate">
                {activeConv?.type === 'channel' ? (
                  <div className="w-8 h-8 rounded-xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center flex-shrink-0 border border-[var(--md-sys-color-outline-variant)]">
                    <Hash className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="relative flex-shrink-0">
                    {activeConv?.avatarUrl ? (
                      <img src={activeConv.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-[var(--md-sys-color-outline-variant)]" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border border-[var(--md-sys-color-outline-variant)] flex items-center justify-center font-bold text-xs">
                        {activeConv?.name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Header Real-time Presence Dot */}
                    {(() => {
                      const participantId = activeConv?.otherParticipant?.userId
                      const isOnline = participantId ? onlineUserIds.has(participantId) : activeConv?.otherParticipant?.presenceStatus === 'online'
                      const pStatus = (participantId && userPresenceMap[participantId]?.status) || (isOnline ? 'online' : 'offline')
                      if (pStatus === 'dnd') {
                        return (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-[var(--md-sys-color-surface-container)] flex items-center justify-center shadow-xs" title="In a meeting / Do not disturb">
                            <span className="w-1 h-0.5 bg-white rounded-full" />
                          </span>
                        )
                      }
                      if (pStatus === 'away') {
                        return <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-[var(--md-sys-color-surface-container)]" title="Away" />
                      }
                      if (isOnline) {
                        return <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#00AC47] ring-2 ring-[var(--md-sys-color-surface-container)] shadow-2xs" title="Active now" />
                      }
                      return null
                    })()}
                  </div>
                )}
                <div className="truncate min-w-0">
                  <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2 truncate">
                    <span>{activeConv?.name || 'Select Conversation'}</span>
                  </h3>
                </div>
              </div>
            </div>

            {/* Action Bar (Phone, Video, More) */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <button
                onClick={() => handleStartCall('audio')}
                disabled={startingMeet}
                title="Start Voice Call"
                className="p-2 rounded-full text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-all cursor-pointer disabled:opacity-50"
              >
                <Phone className="w-5 h-5" />
              </button>

              <button
                onClick={() => handleStartCall('video')}
                disabled={startingMeet}
                title="Start Video Call"
                className="p-2 rounded-full text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-all cursor-pointer disabled:opacity-50"
              >
                <Video className="w-5 h-5" />
              </button>

              <button
                type="button"
                className="p-2 rounded-full text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-all cursor-pointer"
                title="More options"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Space Tab Navigation Bar (Google Chat Signature 3 Tabs) */}
        {activeConv?.type === 'channel' && (
          <div className="flex items-center gap-1 px-4 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] shrink-0">
            <button
              type="button"
              onClick={() => setActiveSpaceTab('chat')}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeSpaceTab === 'chat'
                  ? 'border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-primary)]'
                  : 'border-transparent text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => setActiveSpaceTab('shared')}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeSpaceTab === 'shared'
                  ? 'border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-primary)]'
                  : 'border-transparent text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
            >
              Shared
            </button>
            <button
              type="button"
              onClick={() => setActiveSpaceTab('tasks')}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeSpaceTab === 'tasks'
                  ? 'border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-primary)]'
                  : 'border-transparent text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
            >
              Tasks
            </button>
          </div>
        )}

        {/* Conditionally Render Space Sub-tabs */}
        {activeConv?.type === 'channel' && activeSpaceTab === 'shared' ? (
          <SpaceSharedFilesTab
            messages={messages}
            onPreviewImage={(url, fileName, fileSize) =>
              setPreviewImage({ url, fileName, fileSize })
            }
          />
        ) : activeConv?.type === 'channel' && activeSpaceTab === 'tasks' ? (
          <SpaceTasksTab
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            spaceId={activeConvId}
            spaceName={activeConv?.name || 'Space'}
          />
        ) : (
          <>
        {/* Messages Feed (THE ONLY SCROLLABLE ELEMENT) */}
        <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3.5 sm:px-5 md:px-6 py-3 sm:py-4 space-y-1 overscroll-contain">
          {loadingMessages ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-xs text-[var(--md-sys-color-on-surface-variant)] dark:text-slate-400">
              <div className="w-6 h-6 border-2 border-[var(--md-sys-color-primary)] border-t-transparent rounded-full animate-spin" />
              <span>Loading messages...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[var(--md-sys-color-on-surface-variant)] dark:text-slate-400 gap-2">
              <div className="w-12 h-12 rounded-2xl bg-[var(--md-sys-color-primary-container)] border border-[var(--md-sys-color-outline-variant)] flex items-center justify-center text-[var(--md-sys-color-primary)] shadow-sm">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] dark:text-white">
                Welcome to #{activeConv?.name || 'Chat'}!
              </h4>
              <p className="text-xs max-w-sm text-[var(--md-sys-color-on-surface-variant)] dark:text-slate-400">
                This is the start of your real-time conversation. Send a message, share files, or start a video call.
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.senderId === currentUserId
              const isSystem = msg.messageType === 'system'

              const prevMsg = idx > 0 ? messages[idx - 1] : null
              const isSameDateAsPrev = prevMsg
                ? formatMessageDateGroup(msg.createdAt) === formatMessageDateGroup(prevMsg.createdAt)
                : false

              const isConsecutive = Boolean(
                prevMsg &&
                prevMsg.senderId === msg.senderId &&
                prevMsg.messageType !== 'system' &&
                msg.messageType !== 'system' &&
                isSameDateAsPrev &&
                (new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() < 5 * 60 * 1000)
              )

              const isGif =
                msg.messageType === 'file' &&
                (msg.fileType === 'image/gif' ||
                  msg.fileUrl?.includes('.gif') ||
                  msg.fileUrl?.includes('giphy.gif') ||
                  msg.metadata?.isGif)

              const isAudio =
                msg.messageType === 'file' &&
                (msg.fileType?.startsWith('audio/') ||
                  msg.metadata?.isVoiceNote ||
                  Boolean(msg.fileUrl?.match(/\.(webm|mp3|m4a|wav|ogg|aac)($|\?)/i)))

              const isImage =
                msg.messageType === 'file' &&
                !isGif &&
                (Boolean(msg.fileType?.startsWith('image/')) ||
                  Boolean(msg.fileName?.match(/\.(jpeg|jpg|png|webp|svg|gif|bmp|heic|avif)($|\?)/i)) ||
                  Boolean(msg.fileUrl?.match(/\.(jpeg|jpg|png|webp|svg|gif|bmp|heic|avif)($|\?)/i)) ||
                  Boolean(msg.metadata?.isImage))

              return (
                <React.Fragment key={msg.id}>
                  {/* Sticky Date Divider */}
                  {!isSameDateAsPrev && (
                    <div className="flex items-center my-3 sm:my-4 gap-3">
                      <div className="h-px bg-[var(--md-sys-color-outline-variant)]/60 flex-1" />
                      <span
                        suppressHydrationWarning
                        className="text-[10px] font-bold tracking-wider text-[var(--md-sys-color-on-surface-variant)] uppercase px-3 py-0.5 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] rounded-full shadow-xs"
                      >
                        {formatMessageDateGroup(msg.createdAt)}
                      </span>
                      <div className="h-px bg-[var(--md-sys-color-outline-variant)]/60 flex-1" />
                    </div>
                  )}

                  {/* System Message */}
                  {isSystem ? (
                    <div className="flex items-center justify-center my-2">
                      <span className="px-3 py-1 rounded-full text-[11px] bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] border border-[var(--md-sys-color-outline-variant)] shadow-xs">
                        {msg.senderName} {msg.content}
                      </span>
                    </div>
                  ) : (
                    /* User Message Row with Touch Gestures */
                    <div
                      id={`chat-msg-${msg.id}`}
                      onTouchStart={(e) => handleTouchStart(msg, e)}
                      onTouchMove={(e) => handleTouchMove(msg, isMe, e)}
                      onTouchEnd={(e) => handleTouchEnd(msg, isMe, e)}
                      onTouchCancel={(e) => handleTouchEnd(msg, isMe, e)}
                      onClick={() => {
                        if (typeof window !== 'undefined' && window.innerWidth < 768) {
                          setMobileActionMessage(msg)
                        }
                      }}
                      style={{
                        transform: swipingMessageId === msg.id ? `translateX(${swipeOffset}px)` : 'translateX(0px)',
                        transition: swipingMessageId === msg.id ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1)',
                      }}
                      className={`flex items-start gap-1.5 md:gap-2.5 group/row relative transition-all cursor-pointer md:cursor-default ${
                        isMe
                          ? 'flex-row-reverse pl-6 sm:pl-10 md:pl-0 pr-0.5 sm:pr-0'
                          : 'flex-row pr-6 sm:pr-10 md:pr-0 pl-1.5 sm:pl-0'
                      } ${isConsecutive ? 'mt-0.5' : 'mt-2.5 sm:mt-3.5'}`}
                    >
                      {/* Swipe-to-Reply Spring Indicator */}
                      {swipingMessageId === msg.id && Math.abs(swipeOffset) > 4 && (
                        <div
                          className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10 ${
                            isMe ? 'right-full mr-2' : 'left-full ml-2'
                          }`}
                        >
                          <div
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-75 ${
                              Math.abs(swipeOffset) >= 40
                                ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] scale-110'
                                : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)] scale-90 opacity-80'
                            }`}
                          >
                            <Reply className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                        </div>
                      )}

                      {/* Avatar Column (Hidden on mobile for ultra-compact screen real estate, visible on md+) */}
                      <div className="hidden md:flex w-8 flex-shrink-0 items-start justify-center">
                        {!isConsecutive ? (
                          msg.senderAvatarUrl ? (
                            <img
                              src={msg.senderAvatarUrl}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover border border-[var(--md-sys-color-outline-variant)] dark:border-slate-700 shadow-xs"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center text-xs font-bold border border-[var(--md-sys-color-outline-variant)] dark:border-slate-700 shadow-xs">
                              {msg.senderName.charAt(0).toUpperCase()}
                            </div>
                          )
                        ) : (
                          /* Hover timestamp on collapsed avatar gutter */
                          <span
                            suppressHydrationWarning
                            className="text-[9px] text-[var(--md-sys-color-on-surface-variant)] dark:text-slate-500 opacity-0 group-hover/row:opacity-100 transition-opacity select-none pt-1"
                          >
                            {formatMessageTime(msg.createdAt)}
                          </span>
                        )}
                      </div>

                      {/* Message Bubble Container */}
                      <div className={`max-w-[88%] sm:max-w-[78%] md:max-w-[65%] min-w-0 flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        {/* Header info (Only for first message in group) */}
                        {!isConsecutive && (
                          <div className={`flex items-center gap-1.5 mb-1 px-1.5 text-[10.5px] sm:text-[11px] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                            <span className={`font-bold ${getRoleColor(msg.senderRole)}`}>
                              {isMe ? 'You' : msg.senderName}
                            </span>
                            <span
                              suppressHydrationWarning
                              className="text-[9.5px] sm:text-[10px] text-[var(--md-sys-color-on-surface-variant)] dark:text-slate-500"
                            >
                              {formatMessageTime(msg.createdAt)}
                            </span>
                          </div>
                        )}

                        {/* Content Box */}
                        <div
                          className={`group/msg relative transition-all select-text max-w-full min-w-0 ${
                            msg.messageType === 'meet_card' || msg.messageType === 'code' || msg.metadata?.isCode || isGif || isImage || isAudio
                              ? 'p-0 bg-transparent border-0 shadow-none'
                              : isMe
                              ? 'px-3.5 sm:px-4 py-2 sm:py-2.5 text-[13px] sm:text-[13.5px] leading-relaxed bg-[#0B57D0] text-white dark:bg-[#004A77] dark:text-[#E8F0FE] font-normal rounded-2xl rounded-tr-xs shadow-xs border border-transparent dark:border-[#005c91]/40'
                              : 'px-3.5 sm:px-4 py-2 sm:py-2.5 text-[13px] sm:text-[13.5px] leading-relaxed bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl rounded-tl-xs shadow-xs font-normal'
                          }`}
                        >
                          {/* In-Chat Quoted Tagging / Reply Bubble */}
                          {(msg.replyTo || msg.metadata?.replyTo) && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation()
                                scrollToMessage((msg.replyTo || msg.metadata?.replyTo).messageId)
                              }}
                              className={`mb-2 p-2 sm:p-2.5 rounded-xl border cursor-pointer transition-all active:scale-[0.98] text-left select-none shadow-2xs max-w-full min-w-0 overflow-hidden ${
                                isMe
                                  ? 'bg-black/15 dark:bg-black/30 border-white/15 dark:border-white/10 text-white dark:text-[#E8F0FE]'
                                  : 'bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-highest)] border-[var(--md-sys-color-outline-variant)]/60 text-[var(--md-sys-color-on-surface)]'
                              }`}
                            >
                              <div className={`flex items-center gap-1 text-[11px] font-bold truncate ${isMe ? 'text-white/90 dark:text-[#A8C7FA]' : 'text-[var(--md-sys-color-primary)]'}`}>
                                <Reply className="w-3 h-3 shrink-0" />
                                <span className="truncate">{(msg.replyTo || msg.metadata?.replyTo).senderName}</span>
                              </div>
                              <p className="text-[11px] opacity-80 truncate mt-0.5 line-clamp-1">
                                {(msg.replyTo || msg.metadata?.replyTo).content}
                              </p>
                            </div>
                          )}

                          {/* Live Meet Card / Missed Call Card */}
                          {msg.messageType === 'meet_card' && <ChatMeetCard metadata={msg.metadata} />}

                          {/* Dedicated Rich IDE Code Snippet Card */}
                          {(msg.messageType === 'code' || msg.metadata?.isCode) && (
                            <div className="flex flex-col items-end w-full">
                              <ChatCodeCard
                                code={msg.content}
                                language={msg.metadata?.language}
                                title={msg.metadata?.title}
                                note={msg.metadata?.note}
                              />
                              {isMe && (
                                <div className="flex items-center justify-end gap-1.5 mt-0.5 mr-1 select-none text-[var(--md-sys-color-on-surface-variant)] text-[9.5px]">
                                  <span>{formatMessageTime(msg.createdAt)}</span>
                                  {(() => {
                                    const isDirect = activeConv?.type === 'direct'
                                    const otherId = activeConv?.otherParticipant?.userId
                                    const isOtherOnline = otherId ? onlineUserIds.has(otherId) : false

                                    let displayStatus: 'sent' | 'delivered' | 'seen' = 'sent'
                                    if (msg.status === 'seen' || (msg.readBy && msg.readBy.length > 0)) {
                                      displayStatus = 'seen'
                                    } else if (msg.status === 'delivered') {
                                      displayStatus = 'delivered'
                                    } else if (isDirect) {
                                      displayStatus = isOtherOnline ? 'delivered' : 'sent'
                                    }

                                    if (displayStatus === 'seen') {
                                      return <span title="Seen"><CheckCheck className="w-3 h-3 text-[var(--md-sys-color-primary)]" /></span>
                                    } else if (displayStatus === 'delivered') {
                                      return <span title="Delivered"><CheckCheck className="w-3 h-3 opacity-60" /></span>
                                    } else {
                                      return <span title="Sent"><Check className="w-3 h-3 opacity-60" /></span>
                                    }
                                  })()}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Pure Animated GIF Card (Click to preview fullscreen) */}
                          {isGif && msg.fileUrl && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation()
                                setPreviewImage({
                                  url: msg.fileUrl!,
                                  fileName: msg.fileName || 'GIF Animation',
                                  fileSize: msg.fileSizeBytes,
                                })
                              }}
                              className="relative group/gif overflow-hidden rounded-2xl shadow-md max-w-full sm:max-w-[280px] my-0.5 cursor-pointer"
                              title="Click to view full size"
                            >
                              <img
                                src={msg.fileUrl}
                                alt="GIF"
                                loading="lazy"
                                className="w-full max-h-[240px] object-cover rounded-2xl group-hover:scale-[1.02] transition-transform duration-200"
                              />
                            </div>
                          )}

                          {/* Rich Image Card (Click to open full Image Lightbox Preview) */}
                          {!isGif && isImage && msg.fileUrl && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation()
                                setPreviewImage({
                                  url: msg.fileUrl!,
                                  fileName: msg.fileName || 'Image Attachment',
                                  fileSize: msg.fileSizeBytes,
                                })
                              }}
                              className="relative group/img overflow-hidden rounded-2xl shadow-sm border border-[var(--md-sys-color-outline-variant)]/60 dark:border-white/10 max-w-full sm:max-w-[320px] my-1 cursor-pointer bg-black/5 dark:bg-black/20"
                              title="Click to open image preview"
                            >
                              <img
                                src={msg.fileUrl}
                                alt={msg.fileName || 'Image'}
                                loading="lazy"
                                onError={(e) => {
                                  const target = e.currentTarget
                                  target.style.display = 'none'
                                  const fallback = target.parentElement?.querySelector('.img-fallback')
                                  if (fallback) fallback.classList.remove('hidden')
                                }}
                                className="w-full max-h-[260px] object-cover rounded-2xl group-hover:scale-[1.02] transition-transform duration-200"
                              />
                              <div className="img-fallback hidden p-4 flex flex-col items-center justify-center gap-2 text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
                                <ImageIcon className="w-8 h-8 opacity-60 text-[var(--md-sys-color-primary)]" />
                                <span className="truncate max-w-[200px] font-semibold">{msg.fileName || 'Image Attachment'}</span>
                                <span className="text-[10.5px] font-bold text-[var(--md-sys-color-primary)] underline">Click to view image</span>
                              </div>
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
                                <span className="px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg">
                                  <Maximize2 className="w-3.5 h-3.5" />
                                  <span>Preview</span>
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Inbuilt Voice Notes / Audio Player */}
                          {!isGif && isAudio && msg.fileUrl && (
                            <VoiceNotePlayer
                              audioUrl={msg.fileUrl}
                              fileName={msg.fileName || 'Voice Note'}
                              durationSec={msg.metadata?.duration}
                              waveform={msg.metadata?.waveform}
                              isMe={isMe}
                            />
                          )}

                          {/* Regular File Attachment Card */}
                          {msg.messageType === 'file' && !isGif && !isImage && !isAudio && (
                            <div className={`my-1 p-2.5 sm:p-3 rounded-2xl border flex items-center justify-between gap-2 sm:gap-3 shadow-2xs max-w-full min-w-0 overflow-hidden ${
                              isMe
                                ? 'bg-[var(--md-sys-color-primary-container)]/30 border-[var(--md-sys-color-on-primary)]/20 text-[var(--md-sys-color-on-primary)]'
                                : 'bg-[var(--md-sys-color-surface-container)] border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)]'
                            }`}>
                              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 overflow-hidden">
                                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                                  isMe ? 'bg-[var(--md-sys-color-on-primary)]/20 text-[var(--md-sys-color-on-primary)]' : 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)]'
                                }`}>
                                  <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                                <div className="min-w-0 flex-1 overflow-hidden">
                                  <span className="font-bold text-xs truncate block max-w-full">{msg.fileName || 'Attachment Document'}</span>
                                  <span className="text-[10px] block opacity-80 uppercase font-medium mt-0.5 truncate">
                                    {msg.fileType ? msg.fileType.split('/')[1] || 'File' : 'File'}
                                  </span>
                                </div>
                              </div>
                              {msg.fileUrl && (
                                <a
                                  href={msg.fileUrl}
                                  download
                                  target="_blank"
                                  rel="noreferrer"
                                  className={`p-1.5 sm:p-2 rounded-xl transition-all active:scale-95 shadow-2xs shrink-0 cursor-pointer ${
                                    isMe
                                      ? 'bg-[var(--md-sys-color-on-primary)]/20 hover:bg-[var(--md-sys-color-on-primary)]/30 text-[var(--md-sys-color-on-primary)]'
                                      : 'bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)]'
                                  }`}
                                  title="Download file"
                                >
                                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </a>
                              )}
                            </div>
                          )}

                          {/* Regular Text & Inline Edit Mode */}
                          {editingMessageId === msg.id ? (
                            <div className="w-full min-w-0 max-w-md py-1">
                              <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSaveEdit(msg.id)
                                  } else if (e.key === 'Escape') {
                                    e.preventDefault()
                                    handleCancelEdit()
                                  }
                                }}
                                autoFocus
                                rows={2}
                                className="w-full p-2 text-xs rounded-xl bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)] focus:outline-none focus:ring-1 focus:ring-[var(--md-sys-color-primary)] resize-none"
                              />
                              <div className="flex items-center justify-end gap-1.5 mt-1.5 text-[11px]">
                                <button
                                  type="button"
                                  onClick={handleCancelEdit}
                                  className="px-2.5 py-1 rounded-lg bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface-variant)] font-semibold transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(msg.id)}
                                  className="px-3 py-1 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            msg.content &&
                            msg.messageType !== 'meet_card' &&
                            msg.messageType !== 'code' &&
                            msg.messageType !== 'file' &&
                            !isGif &&
                            !isImage &&
                            !isAudio &&
                            renderMessageWithMentions(msg.content, currentUserName, isMe)
                          )}

                          {/* Inline Time & Read Status for Sent text & file messages */}
                          {isMe && msg.messageType !== 'meet_card' && msg.messageType !== 'code' && !msg.metadata?.isCode && !isGif && !isImage && !isAudio && (
                            <div className="flex items-center justify-end gap-1.5 mt-1 -mb-0.5 select-none text-white/80 dark:text-[#D3E3FD]/80">
                              {(msg.isEdited || msg.metadata?.isEdited) && (
                                <span className="text-[9px] opacity-70 italic font-medium mr-0.5">(edited)</span>
                              )}
                              <span suppressHydrationWarning className="text-[9.5px] opacity-80">{formatMessageTime(msg.createdAt)}</span>
                              
                              {/* 100% Accurate Dynamic Delivery Status (Sent vs Delivered vs Seen) */}
                              {(() => {
                                const isDirect = activeConv?.type === 'direct'
                                const otherId = activeConv?.otherParticipant?.userId
                                const isOtherOnline = otherId ? onlineUserIds.has(otherId) : false

                                let displayStatus: 'sent' | 'delivered' | 'seen' = 'sent'
                                if (msg.status === 'seen' || (msg.readBy && msg.readBy.length > 0)) {
                                  displayStatus = 'seen'
                                } else if (msg.status === 'delivered') {
                                  displayStatus = 'delivered'
                                } else if (isDirect) {
                                  displayStatus = isOtherOnline ? 'delivered' : 'sent'
                                } else {
                                  displayStatus = onlineUserIds.size > 1 ? 'delivered' : 'sent'
                                }

                                if (displayStatus === 'seen') {
                                  return (
                                    <span
                                      className="inline-flex items-center gap-0.5 text-white dark:text-[#A8C7FA] font-medium"
                                      title={
                                        msg.readBy && msg.readBy.length > 0
                                          ? `Seen by ${msg.readBy.map((u) => u.fullName).join(', ')}`
                                          : 'Seen'
                                      }
                                    >
                                      <CheckCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                                    </span>
                                  )
                                }

                                if (displayStatus === 'delivered') {
                                  return (
                                    <span
                                      className="inline-flex items-center gap-0.5 opacity-80"
                                      title="Delivered to recipient"
                                    >
                                      <CheckCheck className="w-3.5 h-3.5" />
                                    </span>
                                  )
                                }

                                return (
                                  <span
                                    className="inline-flex items-center gap-0.5 opacity-70"
                                    title="Sent"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </span>
                                )
                              })()}
                            </div>
                          )}

                          {/* Quick Action Floating Toolbar (Desktop Only - Mobile uses native Long-Press sheet) */}
                          <div
                            className={`hidden md:flex absolute -top-7 ${
                              isMe ? 'right-0' : 'left-0'
                            } opacity-0 group-hover/msg:opacity-100 pointer-events-none group-hover/msg:pointer-events-auto transition-all duration-150 items-center gap-0.5 px-2 py-1 rounded-full bg-[var(--md-sys-color-surface-container-highest)]/95 backdrop-blur-md border border-[var(--md-sys-color-outline-variant)] shadow-md text-xs z-30 whitespace-nowrap`}
                          >
                            {COMMON_EMOJIS.slice(0, 3).map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => handleReaction(msg.id, emoji)}
                                className="p-1 hover:scale-125 transition-transform cursor-pointer"
                                title={`React ${emoji}`}
                              >
                                {emoji}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setReactingMessageId(reactingMessageId === msg.id ? null : msg.id)
                              }}
                              title="React with any emoji"
                              className="p-1 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] hover:scale-120 transition-all cursor-pointer"
                            >
                              <SmilePlus className="w-3.5 h-3.5" />
                            </button>
                            <div className="w-px h-3 bg-[var(--md-sys-color-outline-variant)] mx-0.5" />
                            <button
                              onClick={() => {
                                setReplyingTo(msg)
                                mainInputRef.current?.focus()
                              }}
                              title="Quote Reply in Chat"
                              className="p-1 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] transition-colors"
                            >
                              <Reply className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setActiveThreadParent(msg)}
                              title="Reply in thread"
                              className="p-1 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                            {isMe && msg.messageType === 'text' && (
                              <button
                                onClick={() => handleStartEdit(msg)}
                                title="Edit message"
                                className="p-1 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenForward(msg)}
                              title="Forward message"
                              className="p-1 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] transition-colors"
                            >
                              <Forward className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleCopyMessage(msg.id, msg.content || '')}
                              title="Copy text"
                              className="p-1 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] transition-colors"
                            >
                              {copiedMessageId === msg.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            {(isMe || currentUserRole === 'admin' || currentUserRole === 'superadmin') && (
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                title="Delete message"
                                className="p-1 text-[var(--md-sys-color-on-surface-variant)] hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Full Emoji Picker Popover Anchored to Message for Reactions */}
                          {reactingMessageId === msg.id && (
                            <div
                              className={`absolute bottom-full ${
                                isMe ? 'right-0' : 'left-0'
                              } mb-3 z-50 animate-in fade-in zoom-in-95`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <EmojiAndGifPicker
                                onSelectEmoji={(emoji) => {
                                  handleReaction(msg.id, emoji)
                                  setReactingMessageId(null)
                                }}
                                onClose={() => setReactingMessageId(null)}
                                hideGifTab
                                title="React with Any Emoji"
                              />
                            </div>
                          )}
                        </div>

                        {/* Reactions List */}
                        {msg.reactions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5 px-1">
                            {msg.reactions.map((r) => (
                              <button
                                key={r.emoji}
                                onClick={() => handleReaction(msg.id, r.emoji)}
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all ${
                                  r.hasReacted
                                    ? 'bg-[var(--md-sys-color-primary-container)] border-[var(--md-sys-color-primary)]/40 text-[var(--md-sys-color-on-primary-container)]'
                                    : 'bg-[var(--md-sys-color-surface-container)] border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] hover:border-[var(--md-sys-color-primary)]'
                                }`}
                              >
                                <span>{r.emoji}</span>
                                <span>{r.count}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Thread Replies Indicator */}
                        {(msg.replyCount || 0) > 0 && (
                          <button
                            onClick={() => setActiveThreadParent(msg)}
                            className="mt-1 px-1 flex items-center gap-1.5 text-[11px] font-bold text-[var(--md-sys-color-primary)] hover:underline"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>
                              {msg.replyCount} {msg.replyCount === 1 ? 'reply' : 'replies'}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </React.Fragment>
              )
            })
          )}

          {/* Real-time Typing Indicator in Feed */}
          {Object.keys(typingUsers).length > 0 && (
            <div className="flex items-center gap-2 py-1 px-1 text-xs text-[var(--md-sys-color-on-surface-variant)] animate-in fade-in slide-in-from-bottom-2 duration-150 select-none">
              <div className="flex items-center gap-1.5 bg-[var(--md-sys-color-surface-container)] px-3 py-1 rounded-full border border-[var(--md-sys-color-outline-variant)] shadow-2xs">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--md-sys-color-primary)] animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--md-sys-color-primary)] animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--md-sys-color-primary)] animate-bounce" />
                </div>
                <span className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface)]">
                  {Object.values(typingUsers).map((u) => u.userName).join(', ')} {Object.keys(typingUsers).length > 1 ? 'are' : 'is'} typing...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Dynamic Smart Reply Contextual Suggestion Chips (Screenshot 2) */}
        {(() => {
          const lastMsg = messages.length > 0 ? messages[messages.length - 1] : undefined
          const suggestions = getSmartReplySuggestions(lastMsg, currentUserId)
          if (!suggestions || suggestions.length === 0) return null

          return (
            <div className="px-4 py-1.5 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 bg-[var(--md-sys-color-surface-container-lowest)]">
              {suggestions.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    setInputText(chip)
                    mainInputRef.current?.focus()
                  }}
                  className="px-4 py-1.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] hover:bg-[var(--md-sys-color-surface-container-high)] text-xs font-medium text-[var(--md-sys-color-on-surface)] transition-all active:scale-95 whitespace-nowrap cursor-pointer shadow-2xs"
                >
                  {chip}
                </button>
              ))}
            </div>
          )
        })()}

        {/* Google Chat Style Rich Composer */}
        <GoogleChatComposer
          inputText={inputText}
          setInputText={setInputText}
          onSendMessage={handleSendMessage}
          sending={sending}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          onOpenFilePicker={() => fileInputRef.current?.click()}
          onOpenEmojiPicker={() => setShowEmojiPicker(!showEmojiPicker)}
          onOpenCodeModal={() => setIsCodeModalOpen(true)}
          onStartMeet={() => handleStartCall('video')}
          isRecordingVoice={isRecordingVoice}
          recordingDuration={recordingDuration}
          recordingWaveformLevels={recordingWaveformLevels}
          onStartVoiceRecording={handleStartVoiceRecording}
          onStopVoiceRecording={handleStopVoiceRecording}
          placeholderText={replyingTo ? `Reply to ${replyingTo.senderName}...` : `Send a message to #${activeConv?.name || 'chat'}...`}
          mainInputRef={mainInputRef}
          members={mentionMembers}
        />

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Full Emoji & Animated GIF Picker Popover */}
        {showEmojiPicker && (
          <div className="absolute bottom-20 left-4 z-50 animate-in fade-in zoom-in-95">
            <EmojiAndGifPicker
              onSelectEmoji={handleSelectEmoji}
              onSelectGif={handleSelectGif}
              onClose={() => setShowEmojiPicker(false)}
            />
          </div>
        )}

        </>
        )}

        {/* Floating Heart Particle Bursts */}
        {heartBursts.map((b) => (
          <div
            key={b.id}
            className="fixed z-[99999] pointer-events-none -translate-x-1/2 -translate-y-1/2 animate-in zoom-in-50 fade-out-0 duration-700 text-3xl select-none"
            style={{ left: b.x, top: b.y }}
          >
            ❤️
          </div>
        ))}
      </main>

      {/* 3. DEDICATED THREAD SIDE DRAWER */}
      {activeThreadParent && (
        <ThreadSideDrawer
          parentMessage={activeThreadParent}
          threadReplies={threadMessages}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          currentUserAvatar={currentUserAvatar}
          onClose={() => setActiveThreadParent(null)}
          onSendReply={async (text) => {
            await sendMessageAction({
              conversationId: activeConvId,
              content: text,
              parentId: activeThreadParent.id,
            })
            const fresh = await getConversationMessagesAction(activeConvId)
            setMessages(fresh)
            setThreadMessages(fresh.filter((m) => m.parentId === activeThreadParent.id))
          }}
          onReact={handleReaction}
          onPreviewImage={(url, name, size) =>
            setPreviewImage({ url, fileName: name, fileSize: size })
          }
          onOpenEmojiPicker={() => setShowEmojiPicker(true)}
        />
      )}
            </div>
          )}
        </div>

        {/* 2.4 FAR-RIGHT COMPANION RAIL (Google Calendar 31, Keep, Tasks, Contacts) */}
        <div className="hidden lg:flex shrink-0 h-full">
          <CompanionRail
            currentUserId={currentUserId}
            currentUserName={currentUserName}
          />
        </div>
      </div>

      {/* 4. NATIVE-GRADE MOBILE MESSAGE ACTION BOTTOM SHEET */}
      {mobileActionMessage && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 md:hidden animate-in fade-in duration-150"
            onClick={() => setMobileActionMessage(null)}
          />
          <div
            style={{
              transform: actionSheetPullOffset > 0 ? `translateY(${actionSheetPullOffset}px)` : undefined,
              transition: actionSheetPullOffset > 0 ? 'none' : 'transform 0.2s ease-out',
            }}
            className="fixed inset-x-0 bottom-0 z-50 md:hidden bg-[var(--md-sys-color-surface-container-highest)]/98 backdrop-blur-xl border-t border-[var(--md-sys-color-outline-variant)] shadow-2xl rounded-t-3xl p-4 animate-in slide-in-from-bottom duration-200 select-none pb-safe"
          >
            {/* Pull-to-Dismiss Drag Handle Area */}
            <div
              onTouchStart={handleActionSheetTouchStart}
              onTouchMove={handleActionSheetTouchMove}
              onTouchEnd={handleActionSheetTouchEnd}
              className="w-full py-1 mb-2.5 flex items-center justify-center cursor-grab active:cursor-grabbing"
            >
              <div className="w-10 h-1.5 rounded-full bg-black/25 dark:bg-white/25" />
            </div>

            {/* Quick Emoji Reaction Bar */}
            <div className="flex items-center justify-around py-2 px-1 bg-[var(--md-sys-color-surface-container-high)] rounded-2xl border border-[var(--md-sys-color-outline-variant)] mb-3">
              {['👍', '❤️', '😂', '🔥', '🎉', '👏'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    handleReaction(mobileActionMessage.id, emoji)
                    setMobileActionMessage(null)
                  }}
                  className="p-1.5 text-2xl hover:scale-125 active:scale-95 transition-transform"
                >
                  {emoji}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  const targetId = mobileActionMessage.id
                  setMobileActionMessage(null)
                  setReactingMessageId(targetId)
                }}
                className="p-1.5 text-xs font-bold text-[var(--md-sys-color-primary)] flex items-center justify-center w-9 h-9 rounded-full bg-[var(--md-sys-color-surface-container-highest)]"
              >
                <SmilePlus className="w-4 h-4" />
              </button>
            </div>

            {/* Action Items List with 44px+ Touch Ergonomics */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setReplyingTo(mobileActionMessage)
                  setMobileActionMessage(null)
                  mainInputRef.current?.focus()
                }}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] active:opacity-80 transition-colors"
              >
                <Reply className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                <span>Reply in Chat</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveThreadParent(mobileActionMessage)
                  setMobileActionMessage(null)
                }}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] active:opacity-80 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                <span>Reply in Thread</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleCopyMessage(mobileActionMessage.id, mobileActionMessage.content || '')
                  setMobileActionMessage(null)
                }}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] active:opacity-80 transition-colors"
              >
                <Copy className="w-4 h-4 text-emerald-500" />
                <span>Copy Message Text</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleOpenForward(mobileActionMessage)
                  setMobileActionMessage(null)
                }}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] active:opacity-80 transition-colors"
              >
                <Forward className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                <span>Forward Message</span>
              </button>

              {mobileActionMessage.senderId === currentUserId && mobileActionMessage.messageType === 'text' && (
                <button
                  type="button"
                  onClick={() => {
                    handleStartEdit(mobileActionMessage)
                    setMobileActionMessage(null)
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] active:opacity-80 transition-colors"
                >
                  <Pencil className="w-4 h-4 text-amber-500" />
                  <span>Edit Message</span>
                </button>
              )}

              {(mobileActionMessage.senderId === currentUserId || currentUserRole === 'admin' || currentUserRole === 'superadmin') && (
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteMessage(mobileActionMessage.id)
                    setMobileActionMessage(null)
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/10 active:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Message</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
      {/* Modals */}
      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onSelectConversation={async (convId) => {
          const fresh = await getConversationsListAction()
          setConversations(fresh)
          setActiveConvId(convId)
        }}
      />

      <NewChannelModal
        isOpen={isNewChannelOpen}
        onClose={() => setIsNewChannelOpen(false)}
        onChannelCreated={async (convId) => {
          const fresh = await getConversationsListAction()
          setConversations(fresh)
          setActiveConvId(convId)
        }}
      />

      <ForwardMessageModal
        isOpen={isForwardOpen}
        onClose={() => {
          setIsForwardOpen(false)
          setForwardingMessage(null)
        }}
        message={forwardingMessage}
        conversations={conversations}
        onForwarded={async () => {
          const fresh = await getConversationMessagesAction(activeConvId)
          setMessages(fresh)
        }}
      />

      {/* 5. INBUILT IMAGE PREVIEW LIGHTBOX MODAL */}
      <ImagePreviewModal
        isOpen={Boolean(previewImage)}
        imageUrl={previewImage?.url || ''}
        fileName={previewImage?.fileName}
        fileSize={previewImage?.fileSize}
        onClose={() => setPreviewImage(null)}
      />

      {/* 6. BROWSE SPACES DIRECTORY MODAL */}
      <BrowseSpacesModal
        isOpen={isBrowseSpacesOpen}
        onClose={() => setIsBrowseSpacesOpen(false)}
        spaces={conversations.filter((c) => c.type === 'channel')}
        onSelectSpace={(spaceId) => {
          setActiveConvId(spaceId)
          setActiveSpaceTab('chat')
        }}
        onCreateSpace={() => setIsNewChannelOpen(true)}
      />

      {/* 7. DEDICATED CODE SNIPPET SHARING MODAL */}
      <CodeSnippetModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        onSendCode={handleSendCodeSnippet}
      />

      {/* 8. SETTINGS MODAL DIALOG */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between bg-[var(--md-sys-color-surface-container)]">
              <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">Chat Settings</h3>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="p-1.5 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SettingsPanel />
            </div>
          </div>
        </div>
      )}
      {/* 9. MOBILE FLOATING BOTTOM NAVIGATION BAR & FAB (Screenshots 1, 3, 4) */}
      {!activeConvId && (
        <div className="md:hidden fixed bottom-[calc(1.25rem+max(env(safe-area-inset-bottom,0px),0px))] inset-x-0 z-40 px-4 flex items-center justify-between pointer-events-none select-none">
          {/* Floating Pill Nav Bar */}
          <div className="pointer-events-auto bg-[var(--md-sys-color-surface-container-highest)]/95 dark:bg-slate-900/95 backdrop-blur-xl border border-[var(--md-sys-color-outline-variant)] shadow-2xl rounded-full px-2 py-1.5 flex items-center gap-1.5">
            {/* Tab 1: Home */}
            <button
              type="button"
              onClick={() => {
                setActiveMobileTab('home')
                setActiveNavShortcut('home')
              }}
              className={`flex items-center justify-center p-2 rounded-full transition-all cursor-pointer ${
                activeMobileTab === 'home'
                  ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] px-4'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
              title="Home"
            >
              <Home className="w-5 h-5" />
            </button>

            {/* Tab 2: Direct Messages */}
            <button
              type="button"
              onClick={() => {
                setActiveMobileTab('dms')
                setActiveNavShortcut('home')
              }}
              className={`flex items-center justify-center p-2 rounded-full transition-all cursor-pointer ${
                activeMobileTab === 'dms'
                  ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] px-4'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
              title="Direct messages"
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            {/* Tab 3: Spaces */}
            <button
              type="button"
              onClick={() => {
                setActiveMobileTab('spaces')
                setActiveNavShortcut('home')
              }}
              className={`relative flex items-center justify-center p-2 rounded-full transition-all cursor-pointer ${
                activeMobileTab === 'spaces'
                  ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] px-4'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
              title="Spaces"
            >
              <Layers className="w-5 h-5" />
              {conversations.filter((c) => c.type === 'channel' && c.unreadCount && c.unreadCount > 0).length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[var(--md-sys-color-primary)] text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                  {conversations.filter((c) => c.type === 'channel' && c.unreadCount && c.unreadCount > 0).length}
                </span>
              )}
            </button>

            {/* Tab 4: More ... */}
            <button
              type="button"
              onClick={() => setIsMobileMoreOpen(true)}
              className="flex items-center justify-center p-2 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-all cursor-pointer"
              title="More options"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>

          {/* Floating Action Button (FAB +) */}
          <button
            type="button"
            onClick={() => (activeMobileTab === 'spaces' ? setIsNewChannelOpen(true) : setIsNewChatOpen(true))}
            className="pointer-events-auto w-14 h-14 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-xl hover:shadow-2xl active:scale-95 transition-all flex items-center justify-center cursor-pointer border border-[var(--md-sys-color-outline-variant)]/50"
            title="New Chat"
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* 10. MOBILE MORE OPTIONS BOTTOM SHEET MODAL (Screenshot 5) */}
      {isMobileMoreOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsMobileMoreOpen(false)}
        >
          <div
            className="bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-slate-900 rounded-t-3xl p-5 pb-[calc(2rem+max(env(safe-area-inset-bottom,0px),0px))] shadow-2xl border-t border-[var(--md-sys-color-outline-variant)] animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag pill handle */}
            <div className="w-10 h-1 rounded-full bg-slate-400/40 mx-auto mb-5" />

            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setActiveNavShortcut('mentions')
                  setIsMobileMoreOpen(false)
                }}
                className="w-full flex items-center gap-3.5 px-3 py-3 rounded-2xl text-sm font-semibold text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer"
              >
                <AtSign className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
                <span>Mentions</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveNavShortcut('starred')
                  setIsMobileMoreOpen(false)
                }}
                className="w-full flex items-center gap-3.5 px-3 py-3 rounded-2xl text-sm font-semibold text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer"
              >
                <Star className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
                <span>Starred</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileMoreOpen(false)
                }}
                className="w-full flex items-center gap-3.5 px-3 py-3 rounded-2xl text-sm font-semibold text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer"
              >
                <FileText className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
                <span>Drafts</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. MOBILE SLIDE-OVER NAVIGATION DRAWER (Closed by default, opened via hamburger menu) */}
      {showMobileMenuDrawer && (
        <div
          className="md:hidden fixed inset-0 z-50 flex bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowMobileMenuDrawer(false)}
        >
          <div
            className="w-72 max-w-[85vw] h-full bg-[var(--md-sys-color-surface-container-lowest)] shadow-2xl border-r border-[var(--md-sys-color-outline-variant)] pt-[max(env(safe-area-inset-top,0px),0px)] pb-[max(env(safe-area-inset-bottom,0px),0px)] animate-in slide-in-from-left duration-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <ChatNavColumn
              conversations={conversations}
              activeConvId={activeConvId}
              activeNavShortcut={activeNavShortcut}
              onlineUserIds={onlineUserIds}
              userPresenceMap={userPresenceMap}
              showHeader={true}
              onClose={() => setShowMobileMenuDrawer(false)}
              onSelectShortcut={(s) => {
                setActiveNavShortcut(s)
                setShowMobileMenuDrawer(false)
              }}
              onSelectConversation={(id) => {
                setActiveConvId(id)
                setShowMobileMenuDrawer(false)
              }}
              onNewChat={() => {
                setIsNewChatOpen(true)
                setShowMobileMenuDrawer(false)
              }}
              onNewChannel={() => {
                setIsNewChannelOpen(true)
                setShowMobileMenuDrawer(false)
              }}
              onBrowseSpaces={() => {
                setIsBrowseSpacesOpen(true)
                setShowMobileMenuDrawer(false)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
