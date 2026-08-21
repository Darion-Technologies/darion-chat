import { createAdminClient } from '@/lib/supabase/server'
import {
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY,
  VAPID_SUBJECT,
} from './vapidConfig'
import {
  getPushSubscriptionsForUser,
  removePushSubscriptionAction,
} from '@/app/actions/pushSubscriptions'

export interface PushPayload {
  userId: string
  title: string
  body: string
  type:
    | 'chat_message'
    | 'incoming_call'
    | 'meet_started'
    | 'shift_approved'
    | 'payroll_settled'
    | 'system_alert'
  icon?: string
  data?: Record<string, any>
  link?: string
}

let isVapidConfigured = false

function getWebPush() {
  try {
    // Dynamic require/import for web-push
    const webPush = require('web-push')
    if (!isVapidConfigured && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
      webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
      isVapidConfigured = true
    }
    return webPush
  } catch (err) {
    console.error('web-push module load error:', err)
    return null
  }
}

/**
 * Dispatch real hardware push notification to target user even if app is completely closed
 */
export async function sendPushNotificationToUser(payload: PushPayload) {
  try {
    const admin = createAdminClient()

    // 1. Insert into Supabase notifications table for in-app record
    await admin.from('notifications').insert({
      user_id: payload.userId,
      title: payload.title,
      message: payload.body,
      type: payload.type,
      link: payload.link || payload.data?.url,
      metadata: payload.data || {},
      read: false,
    })

    // 2. Broadcast high-priority realtime event to user channel (for open foreground clients)
    try {
      const channel = admin.channel(`global-push-${payload.userId}`)
      await channel.send({
        type: 'broadcast',
        event: 'push_notification',
        payload: {
          title: payload.title,
          message: payload.body,
          type: payload.type,
          link: payload.link || payload.data?.url,
          metadata: payload.data || {},
          created_at: new Date().toISOString(),
        },
      })
    } catch {}

    // 3. Dispatch Real Standard Web Push (Wakes up closed Android devices & browsers!)
    const webPush = getWebPush()
    if (webPush) {
      const subscriptions = await getPushSubscriptionsForUser(payload.userId)

      const pushNotificationBody = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/icon.svg',
        badge: '/icon.svg',
        type: payload.type,
        link: payload.link || payload.data?.url || '/',
        data: {
          ...payload.data,
          type: payload.type,
          url: payload.link || payload.data?.url || '/',
          timestamp: Date.now(),
        },
      })

      const options = {
        TTL: payload.type === 'incoming_call' ? 45 : 3600, // Short TTL for call ringing
        urgency: payload.type === 'incoming_call' ? 'high' : 'normal',
      }

      await Promise.allSettled(
        subscriptions.map(async (sub) => {
          try {
            await webPush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: {
                  p256dh: sub.keys.p256dh,
                  auth: sub.keys.auth,
                },
              },
              pushNotificationBody,
              options
            )
          } catch (pushErr: any) {
            // Prune expired / invalid push endpoints (410 Gone / 404 Not Found)
            if (pushErr?.statusCode === 410 || pushErr?.statusCode === 404) {
              await removePushSubscriptionAction(sub.endpoint).catch(() => {})
            }
          }
        })
      )
    }

    return { success: true }
  } catch (err: any) {
    console.error('Error sending push notification:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Dispatch high-priority incoming call push to all recipients to ring closed devices
 */
export async function sendIncomingCallPush(params: {
  recipientIds: string[]
  callerName: string
  callerId: string
  callType: 'video' | 'audio'
  callId: string
  roomCode: string
  meetUrl: string
}) {
  try {
    const promises = params.recipientIds.map((recipientId) =>
      sendPushNotificationToUser({
        userId: recipientId,
        title: `📞 Incoming ${params.callType === 'audio' ? 'Voice' : 'Video'} Call`,
        body: `${params.callerName} is calling you. Tap to answer.`,
        type: 'incoming_call',
        link: params.meetUrl,
        data: {
          callerName: params.callerName,
          callerId: params.callerId,
          callType: params.callType,
          callId: params.callId,
          roomCode: params.roomCode,
          meetUrl: params.meetUrl,
        },
      })
    )

    await Promise.allSettled(promises)
    return { success: true }
  } catch (err: any) {
    console.error('Error broadcasting incoming call push:', err)
    return { success: false, error: err.message }
  }
}
