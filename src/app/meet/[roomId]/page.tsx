import { createClient, getCurrentUserFast } from '@/lib/supabase/server'
import { MeetRoomContainer } from '@/components/meet/MeetRoomContainer'

interface MeetPageProps {
  params: Promise<{
    roomId: string
  }>
}

export default async function MeetRoomPage(props: MeetPageProps) {
  const { roomId } = await props.params
  const user = await getCurrentUserFast()
  const supabase = await createClient()

  // Fetch user profile if logged in
  let userName = 'Guest Participant'
  let userAvatarUrl = ''
  let userRole: 'host' | 'co-host' | 'participant' = 'participant'

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, role, avatar_url')
      .eq('id', user.id)
      .single()

    if (profile?.full_name) {
      userName = profile.full_name
    }
    userAvatarUrl = profile?.avatar_url || ''
    if (user.role === 'admin') {
      userRole = 'host'
    }
  }

  // Helper to validate UUID
  const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)

  // Fetch or Auto-create room record
  let query = supabase.from('meet_rooms').select('*').eq('room_code', roomId).maybeSingle()
  let { data: room } = await query

  if (!room && isUuid(roomId)) {
    const uuidQuery = supabase.from('meet_rooms').select('*').eq('id', roomId).maybeSingle()
    const res = await uuidQuery
    room = res.data
  }

  // If room doesn't exist yet, auto-provision it
  if (!room) {
    const validHostId = user?.id && isUuid(user.id) ? user.id : null
    const { data: newRoom } = await supabase
      .from('meet_rooms')
      .insert({
        room_code: roomId,
        title: `Meeting ${roomId}`,
        host_id: validHostId,
        host_name: userName,
        status: 'active',
        started_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle()

    room = newRoom || {
      id: roomId,
      room_code: roomId,
      title: `Meeting ${roomId}`,
      host_id: validHostId,
      host_name: userName,
      is_locked: false,
      waiting_room_enabled: false,
      status: 'active',
    }
  }

  // If user is room creator/host, grant host role
  if (room.host_id && user && room.host_id === user.id) {
    userRole = 'host'
  }

  // Generate anonymous user id if not logged in
  const effectiveUserId = user?.id || `guest-${Math.random().toString(36).substring(2, 9)}`

  return (
    <MeetRoomContainer
      room={{
        id: room.id,
        room_code: room.room_code,
        title: room.title || 'Live Meeting',
        description: room.description,
        is_locked: room.is_locked || false,
        waiting_room_enabled: room.waiting_room_enabled || false,
        host_id: room.host_id,
        host_name: room.host_name || 'Host',
      }}
      initialUser={{
        id: effectiveUserId,
        name: userName,
        role: userRole,
      }}
    />
  )
}
