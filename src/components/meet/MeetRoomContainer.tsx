'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LobbyView } from '@/components/meet/LobbyView'
import { MeetingStage } from '@/components/meet/MeetingStage'
import { MeetingControls } from '@/components/meet/MeetingControls'
import { MeetingSidebar } from '@/components/meet/MeetingSidebar'
import { HostControlsModal } from '@/components/meet/HostControlsModal'
import { FloatingReactions } from '@/components/meet/FloatingReactions'
import { useMeetRoom } from '@/lib/meet/useMeetRoom'
import { ShieldAlert, LogOut, Radio } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export interface MeetRoomContainerProps {
  room: {
    id: string
    room_code: string
    title: string
    description?: string
    is_locked: boolean
    waiting_room_enabled: boolean
    host_id?: string
    host_name: string
  }
  initialUser: {
    id: string
    name: string
    role: 'host' | 'co-host' | 'participant'
  }
}

interface ActiveMeetingRoomProps {
  room: MeetRoomContainerProps['room']
  initialUser: MeetRoomContainerProps['initialUser']
  userName: string
  initialMuted: boolean
  initialVideoOff: boolean
  initialStream: MediaStream | null
  audioDeviceId?: string
  videoDeviceId?: string
  onLeaveMeeting: () => void
}

const ActiveMeetingRoom: React.FC<ActiveMeetingRoomProps> = ({
  room,
  initialUser,
  userName,
  initialMuted,
  initialVideoOff,
  initialStream,
  audioDeviceId,
  videoDeviceId,
  onLeaveMeeting,
}) => {
  // Sidebar & Host Modals
  const [activeSidebarTab, setActiveSidebarTab] = useState<'chat' | 'participants' | 'whiteboard' | 'info' | null>(null)
  const [isHostControlsOpen, setIsHostControlsOpen] = useState(false)

  // Join Meet Room Hook - strictly mounts after user joins from Lobby
  const {
    roomStatus,
    isLocked,
    isWaitingRoomEnabled,
    permissions,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    isHandRaised,
    localAudioLevel,
    localStream,
    activeVideoStream,
    localVideoRef,
    participants,
    waitingList,
    pinnedPeerId,
    activeSpeakerId,
    setPinnedPeerId,
    messages,
    reactions,
    whiteboardStrokes,
    sendMessage,
    sendReaction,
    addWhiteboardStroke,
    clearWhiteboard,
    isRecording,
    recordingSeconds,
    isUploadingRecording,
    startRecording,
    stopRecording,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    toggleHandRaise,
    muteAll,
    muteUser,
    kickUser,
    toggleLockRoom,
    toggleWaitingRoom,
    updatePermissions,
    admitWaitingUser,
    rejectWaitingUser,
    endMeetingForAll,
  } = useMeetRoom({
    roomId: room.id,
    roomCode: room.room_code,
    roomTitle: room.title,
    userId: initialUser.id,
    userName: userName,
    userRole: initialUser.role,
    initialMuted,
    initialVideoOff,
    initialStream,
    audioDeviceId,
    videoDeviceId,
  })

  // Waiting Room Knock Screen for candidate
  if (roomStatus === 'waiting') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 animate-pulse">
          <Radio className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Waiting for Host to Admit You...</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          The host has been notified that you are waiting. Please hold on, you will join automatically once admitted.
        </p>
        <Button onClick={onLeaveMeeting} variant="outlined" className="text-slate-300">
          Leave Waiting Room
        </Button>
      </div>
    )
  }

  // Kicked / Removed Screen
  if (roomStatus === 'kicked') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">You were removed from the meeting</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          The host has removed you from this session or entry was denied.
        </p>
        <Button onClick={onLeaveMeeting} className="bg-blue-600 hover:bg-blue-500">
          Return to Dashboard
        </Button>
      </div>
    )
  }

  // Meeting Ended Screen
  if (roomStatus === 'ended') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4">
          <LogOut className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">This meeting has ended</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          The host has ended this meeting for all participants.
        </p>
        <Button onClick={onLeaveMeeting} className="bg-blue-600 hover:bg-blue-500">
          Return to Dashboard
        </Button>
      </div>
    )
  }

  // Active Meeting Room UI
  return (
    <div className="relative w-screen h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none">
      {/* Top Header Bar */}
      <header className="h-14 px-6 border-b border-slate-900/80 bg-slate-950/70 backdrop-blur-md flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-sm font-bold text-white tracking-wide">{room.title}</h1>
          </div>
          <span className="text-slate-600">•</span>
          <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
            {room.room_code}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isLocked && (
            <span className="text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
              🔒 Locked
            </span>
          )}
          {isRecording && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-600 text-white rounded-full text-xs font-bold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-white" />
              <span>REC</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Video Stage */}
      <main className="flex-1 relative min-h-0">
        <MeetingStage
          localStream={activeVideoStream}
          userName={userName}
          userRole={initialUser.role}
          isAudioEnabled={isAudioEnabled}
          isVideoEnabled={isVideoEnabled}
          isScreenSharing={isScreenSharing}
          isHandRaised={isHandRaised}
          localAudioLevel={localAudioLevel}
          participants={participants}
          pinnedPeerId={pinnedPeerId}
          activeSpeakerId={activeSpeakerId}
          onPin={(id) => setPinnedPeerId(id)}
          onMuteUser={muteUser}
          onKickUser={kickUser}
        />
      </main>

      {/* Floating Reaction Animation Particles */}
      <FloatingReactions reactions={reactions} />

      {/* Floating Bottom Toolbar */}
      <MeetingControls
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        isScreenSharing={isScreenSharing}
        isHandRaised={isHandRaised}
        isRecording={isRecording}
        recordingSeconds={recordingSeconds}
        isUploadingRecording={isUploadingRecording}
        unreadChatCount={0}
        participantsCount={participants.size + 1}
        waitingCount={waitingList.length}
        userRole={initialUser.role}
        activeSidebarTab={activeSidebarTab}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={toggleScreenShare}
        onToggleHandRaise={toggleHandRaise}
        onSendReaction={sendReaction}
        onToggleRecording={isRecording ? stopRecording : startRecording}
        onToggleSidebarTab={(tab) => setActiveSidebarTab(activeSidebarTab === tab ? null : tab)}
        onOpenHostControls={() => setIsHostControlsOpen(true)}
        onLeaveMeeting={onLeaveMeeting}
        onEndMeetingForAll={endMeetingForAll}
      />

      {/* Sliding Sidebar (Chat / Participants / Whiteboard / Info) */}
      <MeetingSidebar
        activeTab={activeSidebarTab}
        roomCode={room.room_code}
        roomTitle={room.title}
        userId={initialUser.id}
        userName={userName}
        userRole={initialUser.role}
        participants={participants}
        waitingList={waitingList}
        messages={messages}
        whiteboardStrokes={whiteboardStrokes}
        allowChat={permissions.allowChat}
        onClose={() => setActiveSidebarTab(null)}
        onTabChange={(tab) => setActiveSidebarTab(tab)}
        onSendMessage={sendMessage}
        onAddWhiteboardStroke={addWhiteboardStroke}
        onClearWhiteboard={clearWhiteboard}
        onAdmitUser={admitWaitingUser}
        onRejectUser={rejectWaitingUser}
        onMuteUser={muteUser}
        onKickUser={kickUser}
      />

      {/* Host Controls & Security Modal */}
      <HostControlsModal
        isOpen={isHostControlsOpen}
        isLocked={isLocked}
        isWaitingRoom={isWaitingRoomEnabled}
        permissions={permissions}
        waitingList={waitingList}
        onClose={() => setIsHostControlsOpen(false)}
        onToggleLock={toggleLockRoom}
        onToggleWaitingRoom={toggleWaitingRoom}
        onUpdatePermissions={updatePermissions}
        onMuteAll={muteAll}
        onAdmitUser={admitWaitingUser}
        onRejectUser={rejectWaitingUser}
      />
    </div>
  )
}

export const MeetRoomContainer: React.FC<MeetRoomContainerProps> = ({ room, initialUser }) => {
  const router = useRouter()

  // Lobby vs Meeting State
  const [hasJoined, setHasJoined] = useState(false)
  const [userName, setUserName] = useState(initialUser.name)
  const [initialMuted, setInitialMuted] = useState(false)
  const [initialVideoOff, setInitialVideoOff] = useState(false)
  const [lobbyStream, setLobbyStream] = useState<MediaStream | null>(null)
  const [audioDeviceId, setAudioDeviceId] = useState<string | undefined>()
  const [videoDeviceId, setVideoDeviceId] = useState<string | undefined>()

  // Handle joining from Lobby
  const handleJoinFromLobby = (
    name: string,
    muted: boolean,
    videoOff: boolean,
    stream: MediaStream | null,
    audioId?: string,
    videoId?: string
  ) => {
    setUserName(name)
    setInitialMuted(muted)
    setInitialVideoOff(videoOff)
    setLobbyStream(stream)
    setAudioDeviceId(audioId)
    setVideoDeviceId(videoId)
    setHasJoined(true)
  }

  // Handle leaving meeting
  const handleLeaveMeeting = () => {
    if (initialUser.role === 'host') {
      router.push('/admin/meets')
    } else {
      router.push('/candidate/meets')
    }
  }

  // Lobby Screen
  if (!hasJoined) {
    return (
      <LobbyView
        roomCode={room.room_code}
        roomTitle={room.title}
        isWaitingRoom={room.waiting_room_enabled}
        isLocked={room.is_locked}
        initialName={initialUser.name}
        onJoin={handleJoinFromLobby}
      />
    )
  }

  return (
    <ActiveMeetingRoom
      room={room}
      initialUser={initialUser}
      userName={userName}
      initialMuted={initialMuted}
      initialVideoOff={initialVideoOff}
      initialStream={lobbyStream}
      audioDeviceId={audioDeviceId}
      videoDeviceId={videoDeviceId}
      onLeaveMeeting={handleLeaveMeeting}
    />
  )
}

