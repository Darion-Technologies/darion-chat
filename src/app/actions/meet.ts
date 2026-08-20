'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Helper to get supabase client with admin fallback
function getSupabase() {
  try {
    return createAdminClient()
  } catch {
    return createClient()
  }
}

// Helper to validate UUID format
function sanitizeUuid(id?: string | null): string | null {
  if (!id) return null
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id) ? id : null
}

// Helper to generate readable meeting codes e.g. "dar-meet-7392"
function generateRoomCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const part1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  const part3 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `${part1}-${part2}-${part3}`
}

/**
 * Creates an instant meeting room and returns its room code
 */
export async function createInstantMeetingAction(hostName = 'Host', hostId?: string, title = 'Instant Meeting') {
  const supabase = await getSupabase()
  const roomCode = generateRoomCode()
  const validHostId = sanitizeUuid(hostId)

  const { data, error } = await supabase
    .from('meet_rooms')
    .insert({
      room_code: roomCode,
      title: title || 'Instant Meeting',
      host_name: hostName || 'Host',
      host_id: validHostId,
      status: 'active',
      started_at: new Date().toISOString(),
      waiting_room_enabled: false,
      allow_screen_share: true,
      allow_chat: true,
      allow_unmute: true,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating instant meeting:', error)
    throw new Error(error.message || 'Failed to create instant meeting')
  }

  revalidatePath('/admin/meets')
  revalidatePath('/candidate/meets')

  return { roomId: data.id, roomCode: data.room_code }
}

/**
 * Schedules an upcoming meeting
 */
export async function scheduleMeetingAction(formData: FormData) {
  const supabase = await getSupabase()

  const title = (formData.get('title') as string) || 'Scheduled Meeting'
  const description = (formData.get('description') as string) || ''
  const scheduledStartAt = formData.get('scheduled_start_at') as string
  const scheduledEndAt = formData.get('scheduled_end_at') as string
  const hostName = (formData.get('host_name') as string) || 'Host'
  const rawHostId = formData.get('host_id') as string
  const validHostId = sanitizeUuid(rawHostId)
  const waitingRoom = formData.get('waiting_room_enabled') === 'true'

  const roomCode = generateRoomCode()

  const { data, error } = await supabase
    .from('meet_rooms')
    .insert({
      room_code: roomCode,
      title,
      description,
      host_name: hostName,
      host_id: validHostId,
      status: 'scheduled',
      scheduled_start_at: scheduledStartAt ? new Date(scheduledStartAt).toISOString() : null,
      scheduled_end_at: scheduledEndAt ? new Date(scheduledEndAt).toISOString() : null,
      waiting_room_enabled: waitingRoom,
      allow_screen_share: true,
      allow_chat: true,
      allow_unmute: true,
    })
    .select()
    .single()

  if (error) {
    console.error('Error scheduling meeting:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/meets')
  revalidatePath('/candidate/meets')

  return { success: true, room: data }
}

/**
 * Fetches meeting room details by room_code or UUID
 */
export async function getMeetingByCodeOrId(identifier: string) {
  const supabase = await getSupabase()

  // Try matching room_code first, then UUID id
  let query = supabase.from('meet_rooms').select('*, meet_recordings(*)').eq('room_code', identifier)
  let { data, error } = await query.maybeSingle()

  if (!data && sanitizeUuid(identifier)) {
    const uuidQuery = supabase.from('meet_rooms').select('*, meet_recordings(*)').eq('id', identifier)
    const result = await uuidQuery.maybeSingle()
    data = result.data
    error = result.error
  }

  if (error || !data) {
    return null
  }

  return data
}

/**
 * Fetches all upcoming and active meetings
 */
export async function getUpcomingMeetings() {
  const supabase = await getSupabase()

  const { data, error } = await supabase
    .from('meet_rooms')
    .select('*')
    .in('status', ['active', 'scheduled'])
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching upcoming meetings:', error)
    return []
  }

  return data
}

/**
 * Fetches past meetings with their recordings
 */
export async function getPastMeetingsWithRecordings() {
  const supabase = await getSupabase()

  const { data, error } = await supabase
    .from('meet_rooms')
    .select('*, meet_recordings(*), meet_participants(count)')
    .order('created_at', { ascending: false })
    .limit(25)

  if (error) {
    console.error('Error fetching past meetings:', error)
    return []
  }

  return data
}

/**
 * Deletes or cancels a meeting room
 */
export async function deleteMeetingAction(roomId: string) {
  const supabase = await getSupabase()

  const { error } = await supabase.from('meet_rooms').delete().eq('id', roomId)

  if (error) {
    console.error('Error deleting meeting:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/meets')
  revalidatePath('/candidate/meets')

  return { success: true }
}

import { uploadBufferToGoogleDrive } from '@/lib/meet/googleDrive'

/**
 * Ends a meeting for all participants and marks it ended in the database
 */
export async function endMeetingAction(roomId: string) {
  const supabase = await getSupabase()
  const validId = sanitizeUuid(roomId)

  let query = supabase.from('meet_rooms').update({
    status: 'ended',
    ended_at: new Date().toISOString(),
  })

  if (validId) {
    query = query.eq('id', validId)
  } else {
    query = query.eq('room_code', roomId)
  }

  const { error } = await query

  if (error) {
    console.error('Error ending meeting in DB:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/meets')
  revalidatePath('/candidate/meets')

  return { success: true }
}

/**
 * Saves a meeting recording to Supabase Storage and automatically uploads to Google Drive
 */
export async function uploadMeetingRecordingAction(formData: FormData) {
  const supabase = await getSupabase()

  const file = formData.get('file') as File | null
  const roomId = formData.get('room_id') as string
  const roomTitle = (formData.get('room_title') as string) || 'Meeting'
  const recordedByName = (formData.get('recorded_by_name') as string) || 'Host'
  const durationSeconds = parseInt((formData.get('duration_seconds') as string) || '0', 10)

  if (!file || !roomId) {
    return { success: false, error: 'Missing file or room ID' }
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const storagePath = `${roomId}/${timestamp}_recording.webm`

    // 1. Upload to Supabase Storage
    const { data: storageData, error: storageErr } = await supabase.storage
      .from('meet-recordings')
      .upload(storagePath, buffer, {
        contentType: file.type || 'video/webm',
        upsert: true,
      })

    let publicUrl = ''
    if (!storageErr && storageData) {
      const { data: urlData } = supabase.storage
        .from('meet-recordings')
        .getPublicUrl(storageData.path)
      publicUrl = urlData.publicUrl
    }

    // 2. Upload to Google Drive
    const gdriveRes = await uploadBufferToGoogleDrive({
      buffer,
      fileName: `${roomTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_${timestamp}.webm`,
      mimeType: file.type || 'video/webm',
    })

    // 3. Look up valid room UUID
    let actualRoomId = sanitizeUuid(roomId)
    if (!actualRoomId) {
      const { data: roomRecord } = await supabase
        .from('meet_rooms')
        .select('id')
        .eq('room_code', roomId)
        .maybeSingle()
      actualRoomId = roomRecord?.id || null
    }

    if (actualRoomId) {
      // 4. Save record to meet_recordings
      const { error: insertErr } = await supabase.from('meet_recordings').insert({
        room_id: actualRoomId,
        file_url: publicUrl || gdriveRes.webViewLink || '',
        duration_seconds: durationSeconds,
        file_size_bytes: buffer.length,
        recorded_by_name: recordedByName,
        google_drive_file_id: gdriveRes.fileId || null,
        google_drive_url: gdriveRes.webViewLink || null,
        google_drive_status: gdriveRes.success ? 'uploaded' : 'not_configured',
      })

      if (insertErr) {
        console.error('Database Insert Error:', insertErr)
        throw new Error('Failed to save recording to database: ' + insertErr.message)
      }
    }

    revalidatePath('/admin/meets')
    revalidatePath('/candidate/meets')

    return {
      success: true,
      publicUrl,
      googleDriveUrl: gdriveRes.webViewLink || null,
      googleDriveStatus: gdriveRes.success ? 'uploaded' : 'not_configured',
    }
  } catch (err: any) {
    console.error('Failed to process meeting recording:', err)
    return { success: false, error: err?.message || 'Upload failed' }
  }
}
