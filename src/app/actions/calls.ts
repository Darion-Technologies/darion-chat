'use server'

import { createClient, createAdminClient, getCurrentUserFast } from '@/lib/supabase/server'
import { sendNotification, sendBulkNotification } from '@/lib/utils/notifications'
import { sendIncomingCallPush } from '@/lib/push/serverPush'
import { revalidatePath } from 'next/cache'

async function getSupabase() {
  return await createClient()
}

export interface CallSessionPayload {
  callId: string
  roomCode: string
  callerId: string
  callerName: string
  callerAvatar?: string
  callerRole?: string
  conversationId: string
  conversationName?: string
  callType: 'video' | 'audio'
  recipientIds: string[]
  meetUrl: string
  startedAt: string
}

/**
 * Initiate an enterprise video or audio call with ringing signaling
 */
export async function initiateCallAction(params: {
  conversationId: string
  targetUserId?: string
  callType?: 'video' | 'audio'
  title?: string
}): Promise<{
  success: boolean
  callPayload?: CallSessionPayload
  error?: string
}> {
  try {
    const user = await getCurrentUserFast()
    if (!user) throw new Error('Unauthorized')

    const supabase = await getSupabase()
    const adminClient = createAdminClient()
    const callType = params.callType || 'video'

    // 1. Fetch caller profile details
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url, role')
      .eq('id', user.id)
      .single()

    const callerName = profile?.full_name || 'Team Member'
    const callerAvatar = profile?.avatar_url || ''
    const callerRole = profile?.role || 'member'

    // 2. Generate room code and create meet room in meet_rooms table
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    const roomCode = `dar-${callType}-${randomSuffix}`
    const callTitle = params.title || `Call with ${callerName}`

    const { data: room, error: roomError } = await adminClient
      .from('meet_rooms')
      .insert({
        title: callTitle,
        room_code: roomCode,
        host_id: user.id,
        status: 'active',
        started_at: new Date().toISOString(),
        waiting_room_enabled: false,
        allow_screen_share: true,
        allow_chat: true,
        allow_unmute: true,
      })
      .select()
      .single()

    if (roomError || !room) {
      console.error('Error creating call room:', roomError)
      throw new Error('Failed to create call room')
    }

    let effectiveConvId = params.conversationId
    let conversationName = 'Direct Chat'

    if (effectiveConvId.startsWith('default-')) {
      const slug = effectiveConvId.replace('default-', '')
      const { data: existingChannel } = await adminClient
        .from('chat_conversations')
        .select('id, name')
        .eq('slug', slug)
        .maybeSingle()
      if (existingChannel) {
        effectiveConvId = existingChannel.id
        conversationName = existingChannel.name
      }
    } else {
      const { data: convData } = await adminClient
        .from('chat_conversations')
        .select('name')
        .eq('id', effectiveConvId)
        .maybeSingle()
      if (convData?.name) conversationName = convData.name
    }

    // 3. Resolve recipient users STRICTLY (Only target users in this conversation)
    let recipientIds: string[] = []
    if (params.targetUserId && params.targetUserId !== user.id) {
      recipientIds = [params.targetUserId]
    } else {
      const { data: participants } = await adminClient
        .from('chat_participants')
        .select('user_id')
        .eq('conversation_id', effectiveConvId)
        .neq('user_id', user.id)

      if (participants && participants.length > 0) {
        recipientIds = participants.map((p) => p.user_id)
      }
    }

    // 4. Insert interactive call card into conversation message feed (initial status: calling)
    await adminClient.from('chat_messages').insert({
      conversation_id: effectiveConvId,
      sender_id: user.id,
      message_type: 'meet_card',
      content: `calling... (${callType})`,
      metadata: {
        roomId: room.id,
        roomCode: room.room_code,
        title: callTitle,
        hostName: callerName,
        callerId: user.id,
        callType,
        status: 'calling',
        recipientIds,
        startedAt: room.started_at,
        meetUrl: `/meet/${room.room_code}`,
      },
    })

    const callPayload: CallSessionPayload = {
      callId: room.id,
      roomCode: room.room_code,
      callerId: user.id,
      callerName,
      callerAvatar,
      callerRole,
      conversationId: effectiveConvId,
      conversationName,
      callType,
      recipientIds,
      meetUrl: `/meet/${room.room_code}`,
      startedAt: room.started_at,
    }

    // 5. Send high-priority ringing push notification ONLY to resolved recipient IDs
    if (recipientIds.length > 0) {
      await sendIncomingCallPush({
        recipientIds,
        callerName,
        callerId: user.id,
        callType,
        callId: room.id,
        roomCode: room.room_code,
        meetUrl: `/meet/${room.room_code}`,
      })
    }

    revalidatePath('/admin/messages')
    revalidatePath('/candidate/messages')

    return { success: true, callPayload }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to start call' }
  }
}

/**
 * Respond to an incoming ringing call (accept, decline, missed, cancelled)
 */
export async function respondToCallAction(params: {
  roomCode: string
  callerId?: string
  response: 'accept' | 'decline' | 'missed' | 'cancelled'
}): Promise<{ success: boolean; meetUrl?: string; error?: string }> {
  try {
    const user = await getCurrentUserFast()
    if (!user) throw new Error('Unauthorized')

    const adminClient = createAdminClient()

    // 1. Update matching chat_messages status based on call outcome using adminClient (bypasses RLS)
    const { data: msgs } = await adminClient
      .from('chat_messages')
      .select('id, metadata')
      .filter('metadata->>roomCode', 'eq', params.roomCode)

    if (msgs && msgs.length > 0) {
      for (const m of msgs) {
        const prevMeta = m.metadata || {}
        let updatedContent = 'connected live call'
        let updatedStatus = 'connected'

        if (params.response === 'accept') {
          updatedContent = `started a live ${prevMeta.callType || 'video'} meeting`
          updatedStatus = 'connected'
        } else if (params.response === 'decline') {
          updatedContent = `declined ${prevMeta.callType || 'video'} call`
          updatedStatus = 'declined'
        } else if (params.response === 'missed') {
          updatedContent = `missed ${prevMeta.callType || 'video'} call`
          updatedStatus = 'missed'
        } else if (params.response === 'cancelled') {
          updatedContent = `cancelled ${prevMeta.callType || 'video'} call`
          updatedStatus = 'cancelled'
        }

        await adminClient
          .from('chat_messages')
          .update({
            content: updatedContent,
            metadata: {
              ...prevMeta,
              status: updatedStatus,
              endedAt: new Date().toISOString(),
            },
          })
          .eq('id', m.id)
      }
    }

    if (params.response === 'accept') {
      revalidatePath('/admin/messages')
      revalidatePath('/candidate/messages')
      return { success: true, meetUrl: `/meet/${params.roomCode}` }
    }

    if (params.response === 'decline' && params.callerId) {
      await sendNotification({
        userId: params.callerId,
        type: 'chat_message',
        title: 'Call Declined',
        message: 'The recipient is currently unavailable.',
      })
    }

    if (params.response === 'missed') {
      let callerName = 'a teammate'
      if (params.callerId) {
        const { data: profile } = await adminClient
          .from('profiles')
          .select('full_name')
          .eq('id', params.callerId)
          .single()
        if (profile?.full_name) callerName = profile.full_name
      }

      await sendNotification({
        userId: user.id,
        type: 'chat_message',
        title: 'Missed Call',
        message: `You missed a call from ${callerName}.`,
      })
    }

    revalidatePath('/admin/messages')
    revalidatePath('/candidate/messages')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Update active call status (e.g. from calling to ringing)
 */
export async function updateCallStatusAction(
  roomCode: string,
  status: 'calling' | 'ringing'
): Promise<{ success: boolean }> {
  try {
    const adminClient = createAdminClient()
    const { data: msgs } = await adminClient
      .from('chat_messages')
      .select('id, metadata')
      .filter('metadata->>roomCode', 'eq', roomCode)

    if (msgs && msgs.length > 0) {
      for (const m of msgs) {
        const prevMeta = m.metadata || {}
        if (
          prevMeta.status !== 'connected' &&
          prevMeta.status !== 'declined' &&
          prevMeta.status !== 'missed' &&
          prevMeta.status !== 'cancelled'
        ) {
          await adminClient
            .from('chat_messages')
            .update({
              content: `${status}... (${prevMeta.callType || 'video'})`,
              metadata: { ...prevMeta, status },
            })
            .eq('id', m.id)
        }
      }
    }
    return { success: true }
  } catch {
    return { success: false }
  }
}
