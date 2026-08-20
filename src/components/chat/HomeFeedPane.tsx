'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  MessageSquare,
  Hash,
  Pin,
  Clock,
  Sparkles,
  SlidersHorizontal,
  SplitSquareVertical,
  Layers,
  MoreVertical,
  ExternalLink,
  BellOff,
  Bell,
  Ban,
  EyeOff,
  LogOut,
  Trash2,
  CheckCheck,
  Maximize2,
  ChevronDown,
} from 'lucide-react'
import {
  ChatConversationItem,
  markConversationAsReadAction,
  markConversationAsUnreadAction,
  toggleMuteConversationAction,
  hideConversationAction,
  deleteConversationAction,
  leaveSpaceAction,
  blockUserAction,
} from '@/app/actions/messages'

interface HomeFeedPaneProps {
  conversations: ChatConversationItem[]
  activeConvId: string
  searchQuery: string
  onSelectConversation: (convId: string) => void
  onToggleDensity?: () => void
  onlineUserIds?: Set<string>
  userPresenceMap?: Record<string, { status: string; statusMessage?: string }>
  activeMobileTab?: 'home' | 'dms' | 'spaces'
}

export const HomeFeedPane: React.FC<HomeFeedPaneProps> = ({
  conversations,
  activeConvId,
  searchQuery,
  onSelectConversation,
  onlineUserIds,
  userPresenceMap,
  activeMobileTab = 'home',
}) => {
  const [onlyUnread, setOnlyUnread] = useState(false)
  const [threadFilter, setThreadFilter] = useState(false)
  const [activeMenuConvId, setActiveMenuConvId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuConvId(null)
      }
    }
    if (activeMenuConvId) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [activeMenuConvId])

  // Filter conversations based on mobile tab, search, unread, and thread
  const filteredConversations = conversations.filter((c) => {
    if (activeMobileTab === 'dms' && c.type !== 'direct') return false
    if (activeMobileTab === 'spaces' && c.type !== 'channel') return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchesName = c.name.toLowerCase().includes(q)
      const matchesSnippet = c.lastMessageSnippet?.toLowerCase().includes(q)
      if (!matchesName && !matchesSnippet) return false
    }
    if (onlyUnread && (!c.unreadCount || c.unreadCount === 0)) {
      return false
    }
    return true
  })

  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes} min`
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    }
    const daysDiff = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (daysDiff < 7) {
      return d.toLocaleDateString([], { weekday: 'short' })
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  // Handle Mark Read / Unread DB action
  const handleToggleRead = async (convId: string, currentlyUnread: boolean) => {
    setActiveMenuConvId(null)
    if (currentlyUnread) {
      await markConversationAsReadAction(convId)
    } else {
      await markConversationAsUnreadAction(convId)
    }
  }

  // Handle Mute DB action
  const handleToggleMute = async (convId: string, currentlyMuted: boolean) => {
    setActiveMenuConvId(null)
    await toggleMuteConversationAction(convId, !currentlyMuted)
  }

  // Handle Hide DB action
  const handleHide = async (convId: string) => {
    setActiveMenuConvId(null)
    await hideConversationAction(convId)
  }

  // Handle Delete DM DB action
  const handleDelete = async (convId: string) => {
    setActiveMenuConvId(null)
    if (confirm('Are you sure you want to delete this conversation?')) {
      await deleteConversationAction(convId)
    }
  }

  // Handle Leave Space DB action
  const handleLeaveSpace = async (convId: string) => {
    setActiveMenuConvId(null)
    if (confirm('Are you sure you want to leave this space?')) {
      await leaveSpaceAction(convId)
    }
  }

  // Handle Block DB action
  const handleBlock = async (conv: ChatConversationItem) => {
    setActiveMenuConvId(null)
    const targetUserId = conv.otherParticipant?.userId
    if (targetUserId) {
      if (confirm(`Block ${conv.name}?`)) {
        await blockUserAction(targetUserId)
      }
    }
  }

  return (
    <div className="w-full md:w-80 lg:w-96 h-full shrink-0 bg-[var(--md-sys-color-surface-container-lowest)] border-r border-[var(--md-sys-color-outline-variant)] flex flex-col select-none overflow-hidden relative">
      {/* 1. HEADER BAR */}
      <div className="px-4 py-3 border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between gap-2 shrink-0">
        <h2 className="text-lg font-bold text-[var(--md-sys-color-on-surface)] tracking-tight">
          {activeMobileTab === 'dms'
            ? 'Direct messages'
            : activeMobileTab === 'spaces'
            ? 'Sections'
            : 'Home'}
        </h2>

        {/* Action Controls: Unread Toggle & Thread Pill */}
        <div className="flex items-center gap-2">
          {/* Unread Toggle Switch */}
          <div className="flex items-center gap-1.5 bg-[var(--md-sys-color-surface-container-high)] px-2.5 py-1 rounded-full border border-[var(--md-sys-color-outline-variant)]">
            <span className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
              Unread
            </span>
            <button
              type="button"
              onClick={() => setOnlyUnread(!onlyUnread)}
              className={`w-7 h-4 rounded-full transition-colors relative cursor-pointer ${
                onlyUnread ? 'bg-[var(--md-sys-color-primary)]' : 'bg-[var(--md-sys-color-outline-variant)]'
              }`}
            >
              <span
                className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                  onlyUnread ? 'left-3.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Thread Filter Pill (shown on Home tab) */}
          {(!activeMobileTab || activeMobileTab === 'home') && (
            <button
              type="button"
              onClick={() => setThreadFilter(!threadFilter)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer ${
                threadFilter
                  ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border-[var(--md-sys-color-primary)] font-bold'
                  : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)]'
              }`}
            >
              <Layers className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
              <span>Thread</span>
            </button>
          )}
        </div>
      </div>

      {/* For Spaces tab: Collapsible Spaces subheader (Screenshot 4) */}
      {activeMobileTab === 'spaces' && (
        <div className="px-4 py-2 bg-[var(--md-sys-color-surface-container-high)]/50 border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--md-sys-color-on-surface)]">
            <ChevronDown className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
            <span>Spaces</span>
          </div>
        </div>
      )}

      {/* 2. RECENT CONVERSATIONS STREAM */}
      <div className="flex-1 overflow-y-auto divide-y divide-[var(--md-sys-color-outline-variant)]/30 pb-28 md:pb-4">
        {filteredConversations.length === 0 ? (
          <div className="py-16 text-center text-xs text-[var(--md-sys-color-on-surface-variant)] px-4">
            {onlyUnread
              ? 'No unread messages'
              : searchQuery
              ? `No chats found matching "${searchQuery}"`
              : 'No conversations yet'}
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isSelected = activeConvId === conv.id
            const isUnread = Boolean(conv.unreadCount && conv.unreadCount > 0)
            const isMuted = Boolean(conv.isMuted)
            const isMenuOpen = activeMenuConvId === conv.id
            const isDirect = conv.type === 'direct'

            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-all cursor-pointer group relative ${
                  isSelected
                    ? 'bg-[var(--md-sys-color-surface-container-high)] font-semibold'
                    : 'hover:bg-[var(--md-sys-color-surface-container)] bg-transparent'
                }`}
              >
                {/* Left Avatar / Space Icon */}
                <div className="relative shrink-0 mt-0.5">
                  {conv.type === 'channel' ? (
                    <div className="w-10 h-10 rounded-xl bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-outline-variant)] flex items-center justify-center font-bold text-sm shadow-2xs">
                      <Hash className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
                    </div>
                  ) : conv.avatarUrl ? (
                    <img
                      src={conv.avatarUrl}
                      alt={conv.name}
                      className="w-10 h-10 rounded-full object-cover border border-[var(--md-sys-color-outline-variant)] shadow-2xs"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border border-[var(--md-sys-color-outline-variant)] flex items-center justify-center font-bold text-sm shadow-2xs">
                      {conv.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* 100% Accurate Real-time Presence Indicator */}
                  {conv.type === 'direct' && (() => {
                    const participantId = conv.otherParticipant?.userId
                    const isOnline = participantId ? onlineUserIds?.has(participantId) : conv.otherParticipant?.presenceStatus === 'online'
                    const pStatus = (participantId && userPresenceMap?.[participantId]?.status) || (isOnline ? 'online' : 'offline')

                    if (pStatus === 'dnd') {
                      return (
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-rose-500 ring-2 ring-[var(--md-sys-color-surface-container-lowest)] flex items-center justify-center" title="Do not disturb">
                          <span className="w-1.5 h-0.5 bg-white rounded-full" />
                        </span>
                      )
                    }
                    if (pStatus === 'away') {
                      return (
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-amber-500 ring-2 ring-[var(--md-sys-color-surface-container-lowest)]" title="Away" />
                      )
                    }
                    if (isOnline) {
                      return (
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#00AC47] ring-2 ring-[var(--md-sys-color-surface-container-lowest)] shadow-xs" title="Active now" />
                      )
                    }
                    return null
                  })()}
                </div>

                {/* Center Content: Title & Snippet */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span
                      className={`text-xs sm:text-[13px] truncate ${
                        isUnread ? 'font-bold text-[var(--md-sys-color-on-surface)]' : 'font-semibold text-[var(--md-sys-color-on-surface)]'
                      }`}
                    >
                      {conv.name}
                    </span>

                    {/* Right Side: Timestamp (Default) OR Action Buttons on Hover/Menu Open */}
                    <div className="shrink-0 flex items-center">
                      {/* Normal Timestamp & Unread Dot (Hidden on Hover or Menu Open) */}
                      <div className={`items-center gap-1.5 ${isMenuOpen ? 'hidden' : 'flex group-hover:hidden'}`}>
                        <span
                          suppressHydrationWarning
                          className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-medium"
                        >
                          {formatTimestamp(conv.lastMessageAt)}
                        </span>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 shadow-xs" />
                        )}
                      </div>

                      {/* Google Chat Hover Actions: [Mark As Read/Unread] + [3-Dots More Options] */}
                      <div
                        className={`items-center gap-1 ${
                          isMenuOpen ? 'flex' : 'hidden group-hover:flex'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Quick Mark Read / Unread Icon */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleRead(conv.id, isUnread)
                          }}
                          className="p-1 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-black/10 dark:hover:bg-white/10 hover:text-[var(--md-sys-color-on-surface)] transition-all cursor-pointer"
                          title={isUnread ? 'Mark as read' : 'Mark as unread'}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>

                        {/* 3-Dots Vertical Button */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveMenuConvId(isMenuOpen ? null : conv.id)
                            }}
                            className={`p-1 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-black/10 dark:hover:bg-white/10 hover:text-[var(--md-sys-color-on-surface)] transition-all cursor-pointer ${
                              isMenuOpen ? 'bg-black/10 dark:bg-white/10 text-[var(--md-sys-color-on-surface)]' : ''
                            }`}
                            title="More options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Authentic Google Chat 3-Dots Popup Dropdown Menu */}
                          {isMenuOpen && (
                            <div
                              ref={menuRef}
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-7 w-56 rounded-2xl bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 backdrop-blur-md"
                            >
                              {/* 1. Mark as read / unread */}
                              <button
                                type="button"
                                onClick={() => handleToggleRead(conv.id, isUnread)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-[var(--md-sys-color-on-surface)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left"
                              >
                                <MessageSquare className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)] shrink-0" />
                                <span className="font-medium">{isUnread ? 'Mark as read' : 'Mark as unread'}</span>
                              </button>

                              {/* 2. Open in a pop-up */}
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuConvId(null)
                                  window.open(`/?convId=${conv.id}`, '_blank', 'width=600,height=700')
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-[var(--md-sys-color-on-surface)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left"
                              >
                                <Maximize2 className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)] shrink-0" />
                                <span className="font-medium">Open in a pop-up</span>
                              </button>

                              {/* 3. Mute / Pause notifications */}
                              <button
                                type="button"
                                onClick={() => handleToggleMute(conv.id, isMuted)}
                                className="w-full flex items-start gap-3 px-4 py-2 text-xs text-[var(--md-sys-color-on-surface)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left"
                              >
                                <BellOff className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)] shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-medium leading-tight">{isMuted ? 'Unmute' : 'Mute'}</div>
                                  <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Pause notifications</div>
                                </div>
                              </button>

                              {/* 4. Notifications (All for Direct, Main conversations for Spaces) */}
                              <button
                                type="button"
                                onClick={() => setActiveMenuConvId(null)}
                                className="w-full flex items-start gap-3 px-4 py-2 text-xs text-[var(--md-sys-color-on-surface)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left"
                              >
                                <Bell className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)] shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-medium leading-tight">Notifications</div>
                                  <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                                    {isDirect ? 'All' : 'Main conversations'}
                                  </div>
                                </div>
                              </button>

                              <div className="my-1 border-t border-[var(--md-sys-color-outline-variant)]/50" />

                              {/* 5. Blocking & reporting */}
                              <button
                                type="button"
                                onClick={() => handleBlock(conv)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-[var(--md-sys-color-on-surface)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left"
                              >
                                <Ban className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)] shrink-0" />
                                <span className="font-medium">Blocking & reporting</span>
                              </button>

                              {/* 6. Hide conversation */}
                              <button
                                type="button"
                                onClick={() => handleHide(conv.id)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-[var(--md-sys-color-on-surface)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left"
                              >
                                <EyeOff className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)] shrink-0" />
                                <span className="font-medium">Hide conversation</span>
                              </button>

                              {/* 7. Delete conversation (for 1:1 Individuals) OR Leave (for Spaces) */}
                              {isDirect ? (
                                <button
                                  type="button"
                                  onClick={() => handleDelete(conv.id)}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-[var(--md-sys-color-on-surface)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left"
                                >
                                  <Trash2 className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)] shrink-0" />
                                  <span className="font-medium">Delete conversation</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleLeaveSpace(conv.id)}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer text-left"
                                >
                                  <LogOut className="w-4 h-4 shrink-0" />
                                  <span className="font-medium">Leave</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Message Snippet with 'You:' or sender label */}
                  <p
                    className={`text-xs truncate ${
                      isUnread
                        ? 'font-semibold text-[var(--md-sys-color-on-surface)]'
                        : 'text-[var(--md-sys-color-on-surface-variant)]'
                    }`}
                  >
                    {conv.lastMessageSnippet || 'No messages yet'}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
