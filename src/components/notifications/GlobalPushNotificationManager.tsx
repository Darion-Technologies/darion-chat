'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { NotificationItem, NotificationType } from '@/lib/utils/notifications'
import {
  Bell,
  MessageSquare,
  Video,
  Calendar,
  Banknote,
  Clock,
  Palmtree,
  X,
  Sparkles,
} from 'lucide-react'
import { soundEffects } from '@/lib/utils/soundEffects'
import { richHaptics } from '@/lib/utils/richHaptics'

interface ToastNotification extends NotificationItem {
  toastId: string
  dismissed?: boolean
}

interface GlobalPushNotificationManagerProps {
  userId?: string
}

export const GlobalPushNotificationManager: React.FC<GlobalPushNotificationManagerProps> = ({ userId }) => {
  const router = useRouter()
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(userId)
  const [toasts, setToasts] = useState<ToastNotification[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default')
  const [showPermissionBanner, setShowPermissionBanner] = useState(false)
  const isListeningRef = useRef(false)

  // Initialize permission and sound settings
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedSound = localStorage.getItem('push_sound_enabled')
      if (storedSound !== null) {
        setSoundEnabled(storedSound === 'true')
      }

      if ('Notification' in window) {
        setPermissionState(Notification.permission)
        if (Notification.permission === 'default') {
          const dismissedAt = localStorage.getItem('push_perm_dismissed_at')
          const isRecentlyDismissed = dismissedAt && Date.now() - Number(dismissedAt) < 24 * 60 * 60 * 1000
          if (!isRecentlyDismissed) {
            setShowPermissionBanner(true)
          }
        }
      }
    }
  }, [])

  // Resolve current user ID
  useEffect(() => {
    if (userId) {
      setCurrentUserId(userId)
      return
    }

    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.id) {
        setCurrentUserId(data.user.id)
      }
    })
  }, [userId])

  // Initialize Android Native Notification Channels
  useEffect(() => {
    try {
      const cap = (window as any).Capacitor
      const localNotif = cap?.Plugins?.LocalNotifications
      if (localNotif) {
        localNotif.createChannel({
          id: 'darion_chat_high_priority',
          name: 'Chat & Meeting Notifications',
          description: 'High-priority heads-up push notifications with sound and vibration',
          importance: 5,
          visibility: 1,
          vibration: true,
        }).catch(() => {})

        localNotif.addListener('localNotificationActionPerformed', (notification: any) => {
          const link = notification?.notification?.extra?.link
          if (link) {
            router.push(link)
          }
        })
      }
    } catch {}
  }, [router])

  const triggerNotification = useCallback(
    (notif: NotificationItem) => {
      // 1. Play high-fidelity Apple-inspired sound and haptic pulse
      if (soundEnabled) {
        if (notif.type === 'meet_started') {
          soundEffects.playMeetingAlertSound()
        } else {
          soundEffects.playNotificationSound()
        }
      } else {
        richHaptics.success()
      }

      // 2. Spawn in-app floating toast
      const toastId = `${notif.id || Math.random().toString(36).slice(2, 9)}_${Date.now()}`
      const newToast: ToastNotification = { ...notif, toastId }

      setToasts((prev) => [newToast, ...prev.slice(0, 3)]) // keep max 4 toasts on screen

      // Auto dismiss: 4.5s for chat messages, 6.5s for others
      const dismissDuration = notif.type === 'chat_message' ? 4500 : 6500
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.toastId !== toastId))
      }, dismissDuration)

      // 3. Trigger Native Capacitor / Android Push Notification (Heads-up banner + sound)
      try {
        const cap = (window as any).Capacitor
        const localNotif = cap?.Plugins?.LocalNotifications
        if (localNotif) {
          localNotif.schedule({
            notifications: [
              {
                title: notif.title || 'Darion Chat',
                body: notif.message,
                id: Math.floor(Math.random() * 1000000),
                channelId: 'darion_chat_high_priority',
                extra: { link: notif.link },
                schedule: { at: new Date(Date.now() + 50) },
              },
            ],
          }).catch(() => {})
        }
      } catch {}

      // 4. Trigger Real Native OS Web Push Notification
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          const browserNotif = new Notification(notif.title || 'Darion Chat', {
            body: notif.message,
            icon: '/icon.svg',
            badge: '/icon.svg',
            tag: notif.id || notif.type,
          })

          browserNotif.onclick = () => {
            window.focus()
            if (notif.link) {
              router.push(notif.link)
            }
            browserNotif.close()
          }
        } catch {
          // Native push fallback
        }
      }
    },
    [router, soundEnabled]
  )

  // Realtime Supabase listener
  useEffect(() => {
    if (!currentUserId || isListeningRef.current) return
    isListeningRef.current = true

    const supabase = createClient()
    const channelName = `global-push-${currentUserId}-${Math.random().toString(36).slice(2, 7)}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => {
          const item = payload.new as NotificationItem
          if (item.type === 'chat_message') return // Chat messages use direct ephemeral toasts
          triggerNotification(item)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        async (payload) => {
          const newMsg = payload.new as any
          if (!newMsg || newMsg.sender_id === currentUserId) return

          // If current window is already inside this active conversation, skip toast
          if (typeof window !== 'undefined') {
            const currentUrl = window.location.href
            if (currentUrl.includes(`c=${newMsg.conversation_id}`)) {
              return
            }
          }

          // Verify user is a participant of this conversation
          const { data: part } = await supabase
            .from('chat_participants')
            .select('user_id')
            .eq('conversation_id', newMsg.conversation_id)
            .eq('user_id', currentUserId)
            .maybeSingle()

          if (!part) return

          // Fetch sender full name
          const { data: senderProf } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', newMsg.sender_id)
            .maybeSingle()

          const senderName = senderProf?.full_name || 'Teammate'
          let snippet = newMsg.content || 'Sent an attachment'
          if (newMsg.message_type === 'file') {
            snippet = `📎 ${newMsg.file_name || 'Shared a file'}`
          } else if (newMsg.message_type === 'meet_card') {
            snippet = '📹 Live video meeting'
          }

          const targetLink =
            typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
              ? `/admin/messages?c=${newMsg.conversation_id}`
              : `/candidate/messages?c=${newMsg.conversation_id}`

          triggerNotification({
            id: newMsg.id,
            user_id: currentUserId,
            title: `Message from ${senderName}`,
            message: snippet.slice(0, 95),
            type: 'chat_message',
            link: targetLink,
            read: false,
            created_at: newMsg.created_at,
          })
        }
      )
      .subscribe()

    return () => {
      isListeningRef.current = false
      supabase.removeChannel(channel)
    }
  }, [currentUserId, triggerNotification])

  // Request browser & Android native notification permission
  const handleRequestPermission = async () => {
    // 1. Android Capacitor Native Permission
    try {
      const cap = (window as any).Capacitor
      const localNotif = cap?.Plugins?.LocalNotifications
      if (localNotif) {
        const perm = await localNotif.requestPermissions()
        if (perm.display === 'granted') {
          setPermissionState('granted')
          setShowPermissionBanner(false)
          soundEffects.playNotificationSound()
          return
        }
      }
    } catch {}

    // 2. Web Browser Notification Permission
    if (typeof window === 'undefined' || !('Notification' in window)) return
    try {
      const result = await Notification.requestPermission()
      setPermissionState(result)
      setShowPermissionBanner(false)
      if (result === 'granted') {
        soundEffects.playNotificationSound()
        new Notification('🔔 Notifications Enabled!', {
          body: 'You will receive real-time push alerts for messages, shifts, video meetings, and payments.',
          icon: '/icon.svg',
        })
      }
    } catch {
      setShowPermissionBanner(false)
    }
  }

  const handleDismissPermission = () => {
    setShowPermissionBanner(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('push_perm_dismissed_at', String(Date.now()))
    }
  }

  const dismissToast = (toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.toastId !== toastId))
  }

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case 'chat_message':
      case 'chat_mention':
        return <MessageSquare className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
      case 'meet_started':
        return <Video className="w-4 h-4 text-emerald-500" />
      case 'calendar_event':
        return <Calendar className="w-4 h-4 text-sky-500" />
      case 'payroll_settled':
        return <Banknote className="w-4 h-4 text-emerald-600" />
      case 'shift_approved':
      case 'shift_assigned':
      case 'timer_started':
      case 'timer_stopped':
        return <Clock className="w-4 h-4 text-indigo-500" />
      case 'leave_requested':
      case 'leave_status':
        return <Palmtree className="w-4 h-4 text-amber-500" />
      default:
        return <Bell className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
    }
  }

  return (
    <>
      {/* 1. Browser Notification Permission Request Banner */}
      {showPermissionBanner && permissionState === 'default' && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[92%] rounded-2xl bg-[var(--md-sys-color-surface-container)] dark:bg-[#141b2b] border border-[var(--md-sys-color-primary)]/30 shadow-2xl p-3.5 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center flex-shrink-0">
              <Bell className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-[var(--md-sys-color-on-surface)] dark:text-white truncate">
                Enable Instant Push Notifications
              </h4>
              <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] dark:text-slate-400 truncate">
                Get real-time desktop alerts for chats, meetings, and shifts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleRequestPermission}
              className="px-3 py-1.5 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold text-xs hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              Enable
            </button>
            <button
              onClick={handleDismissPermission}
              className="p-1.5 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Floating Top-Right Push Notification Toasts */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.toastId}
            onClick={() => {
              if (toast.link) {
                router.push(toast.link)
                dismissToast(toast.toastId)
              }
            }}
            className={`pointer-events-auto rounded-2xl bg-[var(--md-sys-color-surface-container)] dark:bg-[#141b2b] border border-[var(--md-sys-color-outline-variant)] dark:border-[#24324c] shadow-2xl p-3.5 transition-all hover:scale-[1.02] cursor-pointer flex items-start gap-3 animate-in fade-in slide-in-from-right-8 duration-200 ${
              toast.link ? 'hover:border-[var(--md-sys-color-primary)]' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-[var(--md-sys-color-surface-container-high)] dark:bg-[#1c263c] border border-[var(--md-sys-color-outline-variant)]/60 flex items-center justify-center flex-shrink-0 mt-0.5">
              {getIconForType(toast.type)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)]">
                  {toast.type?.replace('_', ' ') || 'Notification'}
                </span>
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] dark:text-slate-500">
                  Just now
                </span>
              </div>
              <h5 className="text-xs font-bold text-[var(--md-sys-color-on-surface)] dark:text-white truncate mt-0.5">
                {toast.title}
              </h5>
              <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] dark:text-slate-300 line-clamp-2 mt-0.5">
                {toast.message}
              </p>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                dismissToast(toast.toastId)
              }}
              className="p-1 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </>
  )
}
