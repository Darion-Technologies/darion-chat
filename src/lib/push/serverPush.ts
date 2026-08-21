import { createAdminClient } from '@/lib/supabase/server'

export interface PushPayload {
  userId: string
  title: string
  body: string
  type: 'chat_message' | 'incoming_call' | 'meet_started' | 'shift_approved' | 'payroll_settled' | 'system_alert'
  icon?: string
  data?: Record<string, any>
  link?: string
}

/**
 * Dispatch real-time push notification to target user
 */
export async function sendPushNotificationToUser(payload: PushPayload) {
  try {
    const admin = createAdminClient()

    // 1. Insert into Supabase notifications table
    await admin.from('notifications').insert({
      user_id: payload.userId,
      title: payload.title,
      message: payload.body,
      type: payload.type,
      link: payload.link || payload.data?.url,
      metadata: payload.data || {},
      read: false,
    })

    // 2. Broadcast high-priority realtime event to user channel
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

    return { success: true }
  } catch (err: any) {
    console.error('Error sending push notification:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Dispatch high-priority incoming call push to all recipients
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
        title: `📞 Incoming ${params.callType === 'audio' ? 'Audio' : 'Video'} Call: ${params.callerName}`,
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
