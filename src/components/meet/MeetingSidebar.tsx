'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  X,
  MessageSquare,
  Users,
  PenTool,
  Info,
  Send,
  Paperclip,
  Download,
  Trash2,
  Check,
  Copy,
  Shield,
  Mic,
  MicOff,
  UserX,
  VolumeX,
  CheckCircle2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  ChatMessage,
  RemoteParticipant,
  WaitingParticipant,
  WhiteboardStroke,
} from '@/lib/meet/useMeetRoom'

export interface MeetingSidebarProps {
  activeTab: 'chat' | 'participants' | 'whiteboard' | 'info' | null
  roomCode: string
  roomTitle: string
  userId: string
  userName: string
  userRole: 'host' | 'co-host' | 'participant'
  participants: Map<string, RemoteParticipant>
  waitingList: WaitingParticipant[]
  messages: ChatMessage[]
  whiteboardStrokes: WhiteboardStroke[]
  allowChat: boolean
  onClose: () => void
  onTabChange: (tab: 'chat' | 'participants' | 'whiteboard' | 'info') => void
  onSendMessage: (text: string, fileInfo?: { url: string; name: string }, recipientId?: string) => void
  onAddWhiteboardStroke: (stroke: WhiteboardStroke) => void
  onClearWhiteboard: () => void
  onAdmitUser: (id: string) => void
  onRejectUser: (id: string) => void
  onMuteUser: (id: string) => void
  onKickUser: (id: string) => void
}

const COLORS = ['#ffffff', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#000000']

export const MeetingSidebar: React.FC<MeetingSidebarProps> = ({
  activeTab,
  roomCode,
  roomTitle,
  userId,
  userName,
  userRole,
  participants,
  waitingList,
  messages,
  whiteboardStrokes,
  allowChat,
  onClose,
  onTabChange,
  onSendMessage,
  onAddWhiteboardStroke,
  onClearWhiteboard,
  onAdmitUser,
  onRejectUser,
  onMuteUser,
  onKickUser,
}) => {
  const [chatInput, setChatInput] = useState('')
  const [recipientId, setRecipientId] = useState<string>('everyone')
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const [copied, setCopied] = useState(false)
  const [participantSearch, setParticipantSearch] = useState('')

  // Whiteboard State
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [brushColor, setBrushColor] = useState('#3b82f6')
  const [brushSize, setBrushSize] = useState(3)
  const [tool, setTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen')
  const currentStrokeRef = useRef<{ x: number; y: number }[]>([])

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const isHost = userRole === 'host' || userRole === 'co-host'
  const remoteList = Array.from(participants.values())

  // Scroll to bottom on new chat messages
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, activeTab])

  // Redraw whiteboard on strokes update
  useEffect(() => {
    if (activeTab !== 'whiteboard' || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    whiteboardStrokes.forEach((stroke) => {
      if (stroke.points.length < 2) return
      ctx.beginPath()
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
      }
      ctx.strokeStyle = stroke.tool === 'eraser' ? '#0f172a' : stroke.color
      ctx.lineWidth = stroke.size
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.globalAlpha = stroke.tool === 'highlighter' ? 0.35 : 1
      ctx.stroke()
      ctx.globalAlpha = 1
    })
  }, [whiteboardStrokes, activeTab])

  if (!activeTab) return null

  // Handle Send Chat
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    onSendMessage(
      chatInput.trim(),
      undefined,
      recipientId === 'everyone' ? undefined : recipientId
    )
    setChatInput('')
  }

  // Handle File Upload to Supabase Storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploadingFile(true)
      const supabase = createClient()
      const timestamp = Date.now()
      const filePath = `chat/${roomCode}/${timestamp}_${file.name}`

      const { data, error } = await supabase.storage.from('meet-files').upload(filePath, file, {
        upsert: true,
      })

      if (error) {
        console.error('File upload error:', error)
        return
      }

      const { data: publicUrlData } = supabase.storage.from('meet-files').getPublicUrl(data.path)

      onSendMessage(
        `Shared file: ${file.name}`,
        { url: publicUrlData.publicUrl, name: file.name },
        recipientId === 'everyone' ? undefined : recipientId
      )
    } catch (err) {
      console.error('Failed to upload file:', err)
    } finally {
      setIsUploadingFile(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Whiteboard Drawing Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    setIsDrawing(true)
    currentStrokeRef.current = [{ x, y }]
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    currentStrokeRef.current.push({ x, y })

    // Draw live stroke on canvas
    const ctx = canvas.getContext('2d')
    if (ctx && currentStrokeRef.current.length >= 2) {
      const len = currentStrokeRef.current.length
      ctx.beginPath()
      ctx.moveTo(currentStrokeRef.current[len - 2].x, currentStrokeRef.current[len - 2].y)
      ctx.lineTo(x, y)
      ctx.strokeStyle = tool === 'eraser' ? '#0f172a' : brushColor
      ctx.lineWidth = tool === 'highlighter' ? brushSize * 4 : tool === 'eraser' ? brushSize * 3 : brushSize
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.globalAlpha = tool === 'highlighter' ? 0.35 : 1
      ctx.stroke()
      ctx.globalAlpha = 1
    }
  }

  const handleMouseUp = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    if (currentStrokeRef.current.length > 1) {
      onAddWhiteboardStroke({
        points: [...currentStrokeRef.current],
        color: brushColor,
        size: tool === 'highlighter' ? brushSize * 4 : tool === 'eraser' ? brushSize * 3 : brushSize,
        tool,
      })
    }
    currentStrokeRef.current = []
  }

  const handleDownloadWhiteboard = () => {
    if (!canvasRef.current) return
    const url = canvasRef.current.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `whiteboard_${roomCode}.png`
    a.click()
  }

  const handleCopyLink = () => {
    const meetUrl = `${window.location.origin}/meet/${roomCode}`
    navigator.clipboard.writeText(meetUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const filteredParticipants = remoteList.filter((p) =>
    p.name.toLowerCase().includes(participantSearch.toLowerCase())
  )

  return (
    <div className="fixed top-0 right-0 bottom-0 w-full sm:w-96 bg-slate-900/95 backdrop-blur-2xl border-l border-slate-800 z-50 flex flex-col shadow-2xl animate-slide-in-right">
      {/* Header Tabs */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => onTabChange('chat')}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('participants')}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'participants'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>People ({remoteList.length + 1})</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('whiteboard')}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'whiteboard'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>Board</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('info')}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'info'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tab 1: In-Meeting Chat */}
      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <MessageSquare className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm font-semibold">No messages yet</p>
                <p className="text-xs">Send a message or share a document with the room.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === userId
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[11px] font-bold text-slate-400">
                        {isMe ? 'You' : msg.senderName}
                      </span>
                      {msg.senderRole === 'host' && (
                        <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1 py-0.2 rounded font-bold">
                          HOST
                        </span>
                      )}
                      {msg.isPrivate && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-bold">
                          DIRECT
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                    </div>

                    <div
                      className={`p-3 rounded-2xl text-xs max-w-[85%] break-words ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                      }`}
                    >
                      <p>{msg.message}</p>

                      {/* Attached File */}
                      {msg.fileUrl && (
                        <a
                          href={msg.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 flex items-center gap-2 p-2 bg-black/20 hover:bg-black/30 rounded-xl text-xs text-white border border-white/10 transition-all"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          <span className="truncate flex-1 font-semibold">{msg.fileName || 'Attachment'}</span>
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          {allowChat || isHost ? (
            <form onSubmit={handleSendChat} className="p-3 border-t border-slate-800 flex flex-col gap-2">
              {/* Recipient Selector */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>Send to:</span>
                <select
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-0.5 text-[11px] text-slate-200 focus:outline-none"
                >
                  <option value="everyone">Everyone</option>
                  {remoteList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Direct)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingFile}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                  title="Share document or image"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />

                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            <div className="p-4 border-t border-slate-800 text-center text-xs text-slate-500">
              Host has disabled chat messages for participants.
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Participants List */}
      {activeTab === 'participants' && (
        <div className="flex-1 flex flex-col min-h-0 p-4 gap-4 overflow-y-auto">
          {/* Waiting Room Queue for Host */}
          {isHost && waitingList.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex flex-col gap-2">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Waiting to join ({waitingList.length})
              </span>
              {waitingList.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between bg-slate-900 p-2 rounded-xl border border-slate-800"
                >
                  <span className="text-xs font-medium text-slate-200">{w.name}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onAdmitUser(w.id)}
                      className="px-2 py-1 bg-emerald-500 text-slate-950 rounded-lg text-xs font-bold hover:bg-emerald-400 cursor-pointer"
                    >
                      Admit
                    </button>
                    <button
                      onClick={() => onRejectUser(w.id)}
                      className="px-2 py-1 bg-rose-500/20 text-rose-300 rounded-lg text-xs hover:bg-rose-500/30 cursor-pointer"
                    >
                      Deny
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Search bar */}
          <input
            type="text"
            value={participantSearch}
            onChange={(e) => setParticipantSearch(e.target.value)}
            placeholder="Search participants..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
          />

          {/* In-Call List */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              In this meeting ({filteredParticipants.length + 1})
            </span>

            {/* Local User Tile */}
            <div className="flex items-center justify-between p-2.5 bg-slate-800/40 rounded-xl border border-slate-700/40">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white">
                  {(userName[0] || 'U').toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-200">{userName} (You)</span>
                  <span className="text-[10px] text-slate-400">{userRole}</span>
                </div>
              </div>
              {userRole === 'host' && (
                <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                  HOST
                </span>
              )}
            </div>

            {/* Remote Participants */}
            {filteredParticipants.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2.5 bg-slate-800/40 rounded-xl border border-slate-700/40"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-white">
                    {(p.name[0] || 'P').toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-200">{p.name}</span>
                    <span className="text-[10px] text-slate-400">{p.role}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {p.isHandRaised && <span className="text-xs">✋</span>}
                  {p.hasAudio ? (
                    <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <MicOff className="w-3.5 h-3.5 text-rose-400" />
                  )}

                  {isHost && (
                    <div className="flex items-center gap-1 ml-1">
                      {p.hasAudio && (
                        <button
                          onClick={() => onMuteUser(p.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700 cursor-pointer"
                          title="Mute participant"
                        >
                          <VolumeX className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onKickUser(p.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700 cursor-pointer"
                        title="Remove participant"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Interactive Collaborative Whiteboard */}
      {activeTab === 'whiteboard' && (
        <div className="flex-1 flex flex-col min-h-0 p-3 gap-3">
          {/* Tool Selector Bar */}
          <div className="flex items-center justify-between bg-slate-800/80 p-2 rounded-2xl">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTool('pen')}
                className={`p-2 rounded-xl text-xs font-semibold cursor-pointer ${
                  tool === 'pen' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                Pen
              </button>
              <button
                onClick={() => setTool('highlighter')}
                className={`p-2 rounded-xl text-xs font-semibold cursor-pointer ${
                  tool === 'highlighter' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                Highlighter
              </button>
              <button
                onClick={() => setTool('eraser')}
                className={`p-2 rounded-xl text-xs font-semibold cursor-pointer ${
                  tool === 'eraser' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                Eraser
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleDownloadWhiteboard}
                className="p-2 rounded-xl text-slate-300 hover:bg-slate-700 cursor-pointer"
                title="Download Whiteboard PNG"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={onClearWhiteboard}
                className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                title="Clear Whiteboard"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Color & Size Palette */}
          {tool !== 'eraser' && (
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setBrushColor(c)}
                    className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                      brushColor === c ? 'scale-125 border-white ring-2 ring-blue-500' : 'border-slate-700'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">Size</span>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-16 accent-blue-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Canvas Board */}
          <div className="flex-1 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 relative">
            <canvas
              ref={canvasRef}
              width={800}
              height={1000}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="w-full h-full cursor-crosshair touch-none"
            />
          </div>
        </div>
      )}

      {/* Tab 4: Meeting Info */}
      {activeTab === 'info' && (
        <div className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto">
          <div>
            <h3 className="text-lg font-bold text-white">{roomTitle}</h3>
            <p className="text-xs text-slate-400 mt-1">Darion Workforce Realtime Meet</p>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 flex flex-col gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Room Code
              </span>
              <span className="text-lg font-mono font-bold text-slate-100">{roomCode}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Shareable Link
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={typeof window !== 'undefined' ? `${window.location.origin}/meet/${roomCode}` : ''}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-all cursor-pointer shrink-0 flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/40 flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-300">Features Active</span>
            <ul className="text-xs text-slate-400 flex flex-col gap-1.5">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                <span>WebRTC Mesh Audio & Video</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                <span>High-Definition Screen Sharing</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Multi-Stream In-Browser Recording</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Realtime Collaborative Whiteboard</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
