'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Plus,
  Home,
  AtSign,
  Star,
  ChevronDown,
  ChevronRight,
  Pin,
  MessageSquare,
  Hash,
  Users,
  Globe,
  Compass,
  MoreVertical,
  BellOff,
  Bell,
  Link,
  LogOut,
  Trash2,
  Sparkles,
  Maximize2,
  Ban,
  EyeOff,
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

interface ChatNavColumnProps {
  conversations: ChatConversationItem[]
  activeConvId: string
  activeNavShortcut: 'home' | 'mentions' | 'starred'
  onSelectShortcut: (shortcut: 'home' | 'mentions' | 'starred') => void
  onSelectConversation: (convId: string) => void
  onNewChat: () => void
  onNewChannel: () => void
  onBrowseSpaces?: () => void
  onlineUserIds?: Set<string>
  userPresenceMap?: Record<string, { status: string; statusMessage?: string }>
}

export const ChatNavColumn: React.FC<ChatNavColumnProps> = ({
  conversations,
  activeConvId,
  activeNavShortcut,
  onSelectShortcut,
  onSelectConversation,
  onNewChat,
  onNewChannel,
  onBrowseSpaces,
  onlineUserIds,
  userPresenceMap,
}) => {
  const [shortcutsOpen, setShortcutsOpen] = useState(true)
  const [dmsOpen, setDmsOpen] = useState(true)
  const [spacesOpen, setSpacesOpen] = useState(true)
  const [showAllDms, setShowAllDms] = useState(false)
  const [activeMenuConvId, setActiveMenuConvId] = useState<string | null>(null)
  const navMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navMenuRef.current && !navMenuRef.current.contains(e.target as Node)) {
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

  const directMessages = conversations.filter((c) => c.type === 'direct')
  const spaces = conversations.filter((c) => c.type === 'channel')

  const displayedDms = showAllDms ? directMessages : directMessages.slice(0, 8)

  const handleToggleRead = async (convId: string, currentlyUnread: boolean) => {
    setActiveMenuConvId(null)
    if (currentlyUnread) {
      await markConversationAsReadAction(convId)
    } else {
      await markConversationAsUnreadAction(convId)
    }
  }

  const handleToggleMute = async (convId: string, currentlyMuted: boolean) => {
    setActiveMenuConvId(null)
    await toggleMuteConversationAction(convId, !currentlyMuted)
  }

  const handleHide = async (convId: string) => {
    setActiveMenuConvId(null)
    await hideConversationAction(convId)
  }

  const handleDelete = async (convId: string) => {
    setActiveMenuConvId(null)
    if (confirm('Are you sure you want to delete this conversation?')) {
      await deleteConversationAction(convId)
    }
  }

  const handleLeaveSpace = async (convId: string) => {
    setActiveMenuConvId(null)
    if (confirm('Are you sure you want to leave this space?')) {
      await leaveSpaceAction(convId)
    }
  }

  const handleBlock = async (dm: ChatConversationItem) => {
    setActiveMenuConvId(null)
    const targetUserId = dm.otherParticipant?.userId
    if (targetUserId) {
      if (confirm(`Block ${dm.name}?`)) {
        await blockUserAction(targetUserId)
      }
    }
  }

  return (
    <aside className="w-60 lg:w-64 h-full shrink-0 bg-[var(--md-sys-color-surface-container-low)] border-r border-[var(--md-sys-color-outline-variant)] flex flex-col select-none overflow-y-auto">
      {/* 1. TOP '+ New chat' PILL BUTTON */}
      <div className="p-3">
        <button
          type="button"
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-[var(--md-sys-color-surface-container-highest)] hover:bg-[var(--md-sys-color-primary-container)] border border-[var(--md-sys-color-outline-variant)] shadow-xs hover:shadow-md text-xs sm:text-sm font-bold text-[var(--md-sys-color-on-surface)] transition-all cursor-pointer group"
        >
          <div className="w-6 h-6 rounded-full bg-[var(--md-sys-color-primary)] text-white flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
            <Plus className="w-4 h-4 stroke-[3]" />
          </div>
          <span>New chat</span>
        </button>
      </div>

      <div className="flex-1 px-2 space-y-4 pb-6">
        {/* 2. SHORTCUTS SECTION */}
        <div>
          <button
            type="button"
            onClick={() => setShortcutsOpen(!shortcutsOpen)}
            className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
          >
            <span>Shortcuts</span>
            {shortcutsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {shortcutsOpen && (
            <div className="space-y-0.5 mt-1">
              {/* Home */}
              <button
                type="button"
                onClick={() => onSelectShortcut('home')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeNavShortcut === 'home'
                    ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-2xs font-bold'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Home className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                  <span>Home</span>
                </div>
              </button>

              {/* Mentions */}
              <button
                type="button"
                onClick={() => onSelectShortcut('mentions')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeNavShortcut === 'mentions'
                    ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-2xs font-bold'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <AtSign className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                  <span>Mentions</span>
                </div>
              </button>

              {/* Starred */}
              <button
                type="button"
                onClick={() => onSelectShortcut('starred')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeNavShortcut === 'starred'
                    ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-2xs font-bold'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Star className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                  <span>Starred</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* 3. DIRECT MESSAGES SECTION */}
        <div>
          <div className="flex items-center justify-between px-2 py-1">
            <button
              type="button"
              onClick={() => setDmsOpen(!dmsOpen)}
              className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
            >
              {dmsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <span>Direct messages</span>
            </button>

            <button
              type="button"
              onClick={onNewChat}
              className="p-1 rounded-md text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
              title="Start a direct message"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {dmsOpen && (
            <div className="space-y-0.5 mt-1">
              {displayedDms.map((dm) => {
                const isSelected = activeConvId === dm.id
                const isUnread = Boolean(dm.unreadCount && dm.unreadCount > 0)
                const isMuted = Boolean(dm.isMuted)
                const isMenuOpen = activeMenuConvId === dm.id

                return (
                  <div key={dm.id} className="relative group">
                    <div
                      onClick={() => onSelectConversation(dm.id)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-bold shadow-2xs'
                          : isUnread
                          ? 'font-bold text-[var(--md-sys-color-on-surface)] bg-[var(--md-sys-color-surface-container-high)]/60'
                          : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-1">
                        <div className="relative shrink-0">
                          {dm.avatarUrl ? (
                            <img
                              src={dm.avatarUrl}
                              alt=""
                              className="w-5 h-5 rounded-full object-cover border border-[var(--md-sys-color-outline-variant)]"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center font-bold text-[10px]">
                              {dm.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {/* 100% Accurate Real-time Presence Indicator */}
                          {(() => {
                            const participantId = dm.otherParticipant?.userId
                            const isOnline = participantId ? onlineUserIds?.has(participantId) : dm.otherParticipant?.presenceStatus === 'online'
                            const pStatus = (participantId && userPresenceMap?.[participantId]?.status) || (isOnline ? 'online' : 'offline')

                            if (pStatus === 'dnd') {
                              return (
                                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-rose-500 ring-1 ring-[var(--md-sys-color-surface-container-low)]" title="Do not disturb" />
                              )
                            }
                            if (pStatus === 'away') {
                              return (
                                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-amber-500 ring-1 ring-[var(--md-sys-color-surface-container-low)]" title="Away" />
                              )
                            }
                            if (isOnline) {
                              return (
                                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#00AC47] ring-1 ring-[var(--md-sys-color-surface-container-low)]" title="Active now" />
                              )
                            }
                            return null
                          })()}
                        </div>
                        <span className="truncate">{dm.name}</span>
                      </div>

                      {/* Right End: Unread badge or Hover 3-Dots */}
                      <div className="flex items-center gap-1 shrink-0">
                        {isUnread && (
                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[var(--md-sys-color-primary)] text-white shadow-2xs ${isMenuOpen ? 'hidden' : 'group-hover:hidden'}`}>
                            {dm.unreadCount}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveMenuConvId(isMenuOpen ? null : dm.id)
                          }}
                          className={`p-0.5 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-black/10 dark:hover:bg-white/10 hover:text-[var(--md-sys-color-on-surface)] transition-all cursor-pointer ${
                            isMenuOpen ? 'flex bg-black/10' : 'hidden group-hover:flex'
                          }`}
                          title="More options"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 1:1 Direct Message Popup Menu */}
                    {isMenuOpen && (
                      <div
                        ref={navMenuRef}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute left-10 top-7 w-56 rounded-2xl bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 backdrop-blur-md"
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleRead(dm.id, isUnread)}
                          className="w-full flex items-center gap-3 px-3.5 py-2 text-xs text-[var(--md-sys-color-on-surface)] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)]" />
                          <span>{isUnread ? 'Mark as read' : 'Mark as unread'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuConvId(null)
                            window.open(`/?convId=${dm.id}`, '_blank', 'width=600,height=700')
                          }}
                          className="w-full flex items-center gap-3 px-3.5 py-2 text-xs text-[var(--md-sys-color-on-surface)] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left"
                        >
                          <Maximize2 className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)]" />
                          <span>Open in a pop-up</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleMute(dm.id, isMuted)}
                          className="w-full flex items-start gap-3 px-3.5 py-2 text-xs text-[var(--md-sys-color-on-surface)] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left"
                        >
                          <BellOff className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)] mt-0.5" />
                          <div>
                            <div className="font-medium leading-tight">{isMuted ? 'Unmute' : 'Mute'}</div>
                            <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Pause notifications</div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveMenuConvId(null)}
                          className="w-full flex items-start gap-3 px-3.5 py-2 text-xs text-[var(--md-sys-color-on-surface)] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left"
                        >
                          <Bell className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)] mt-0.5" />
                          <div>
                            <div className="font-medium leading-tight">Notifications</div>
                            <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">All</div>
                          </div>
                        </button>
                        <div className="my-1 border-t border-[var(--md-sys-color-outline-variant)]/50" />
                        <button
                          type="button"
                          onClick={() => handleBlock(dm)}
                          className="w-full flex items-center gap-3 px-3.5 py-2 text-xs text-[var(--md-sys-color-on-surface)] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left"
                        >
                          <Ban className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)]" />
                          <span>Blocking & reporting</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleHide(dm.id)}
                          className="w-full flex items-center gap-3 px-3.5 py-2 text-xs text-[var(--md-sys-color-on-surface)] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left"
                        >
                          <EyeOff className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)]" />
                          <span>Hide conversation</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(dm.id)}
                          className="w-full flex items-center gap-3 px-3.5 py-2 text-xs text-[var(--md-sys-color-on-surface)] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)]" />
                          <span>Delete conversation</span>
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}

              {directMessages.length > 8 && (
                <button
                  type="button"
                  onClick={() => setShowAllDms(!showAllDms)}
                  className="w-full text-left px-3 py-1 text-[11px] font-bold text-[var(--md-sys-color-primary)] hover:underline cursor-pointer"
                >
                  {showAllDms ? 'Show less' : `+${directMessages.length - 8} more`}
                </button>
              )}
            </div>
          )}
        </div>

        {/* 4. SPACES SECTION */}
        <div>
          <div className="flex items-center justify-between px-2 py-1">
            <button
              type="button"
              onClick={() => setSpacesOpen(!spacesOpen)}
              className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
            >
              {spacesOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <span>Spaces</span>
            </button>

            <div className="flex items-center gap-0.5">
              {onBrowseSpaces && (
                <button
                  type="button"
                  onClick={onBrowseSpaces}
                  className="p-1 rounded-md text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
                  title="Browse open spaces"
                >
                  <Compass className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={onNewChannel}
                className="p-1 rounded-md text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
                title="Create a new space"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {spacesOpen && (
            <div className="space-y-0.5 mt-1">
              {spaces.map((space) => {
                const isSelected = activeConvId === space.id
                const isUnread = Boolean(space.unreadCount && space.unreadCount > 0)
                const isMuted = Boolean(space.isMuted)
                const isMenuOpen = activeMenuConvId === space.id

                return (
                  <div key={space.id} className="relative group">
                    <div
                      onClick={() => onSelectConversation(space.id)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-bold shadow-2xs'
                          : isUnread
                          ? 'font-bold text-[var(--md-sys-color-on-surface)] bg-[var(--md-sys-color-surface-container-high)]/60'
                          : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-1">
                        <Hash className="w-4 h-4 text-[var(--md-sys-color-primary)] shrink-0" />
                        <span className="truncate">{space.name}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {isUnread && (
                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[var(--md-sys-color-primary)] text-white shadow-2xs ${isMenuOpen ? 'hidden' : 'group-hover:hidden'}`}>
                            {space.unreadCount}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveMenuConvId(isMenuOpen ? null : space.id)
                          }}
                          className={`p-0.5 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-black/10 dark:hover:bg-white/10 hover:text-[var(--md-sys-color-on-surface)] transition-all cursor-pointer ${
                            isMenuOpen ? 'flex bg-black/10' : 'hidden group-hover:flex'
                          }`}
                          title="More options"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Space Popup Menu */}
                    {isMenuOpen && (
                      <div
                        ref={navMenuRef}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute left-10 top-7 w-56 rounded-2xl bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 backdrop-blur-md"
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleRead(space.id, isUnread)}
                          className="w-full flex items-center gap-3 px-3.5 py-2 text-xs text-[var(--md-sys-color-on-surface)] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)]" />
                          <span>{isUnread ? 'Mark as read' : 'Mark as unread'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuConvId(null)
                            window.open(`/?convId=${space.id}`, '_blank', 'width=600,height=700')
                          }}
                          className="w-full flex items-center gap-3 px-3.5 py-2 text-xs text-[var(--md-sys-color-on-surface)] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left"
                        >
                          <Maximize2 className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)]" />
                          <span>Open in a pop-up</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleMute(space.id, isMuted)}
                          className="w-full flex items-start gap-3 px-3.5 py-2 text-xs text-[var(--md-sys-color-on-surface)] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left"
                        >
                          <BellOff className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)] mt-0.5" />
                          <div>
                            <div className="font-medium leading-tight">{isMuted ? 'Unmute space' : 'Mute space'}</div>
                            <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Pause notifications</div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveMenuConvId(null)}
                          className="w-full flex items-start gap-3 px-3.5 py-2 text-xs text-[var(--md-sys-color-on-surface)] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left"
                        >
                          <Bell className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)] mt-0.5" />
                          <div>
                            <div className="font-medium leading-tight">Notifications</div>
                            <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Main conversations</div>
                          </div>
                        </button>
                        <div className="my-1 border-t border-[var(--md-sys-color-outline-variant)]/50" />
                        <button
                          type="button"
                          onClick={() => setActiveMenuConvId(null)}
                          className="w-full flex items-center gap-3 px-3.5 py-2 text-xs text-[var(--md-sys-color-on-surface)] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left"
                        >
                          <Ban className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)]" />
                          <span>Blocking & reporting</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleHide(space.id)}
                          className="w-full flex items-center gap-3 px-3.5 py-2 text-xs text-[var(--md-sys-color-on-surface)] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left"
                        >
                          <EyeOff className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)]" />
                          <span>Hide conversation</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLeaveSpace(space.id)}
                          className="w-full flex items-center gap-3 px-3.5 py-2 text-xs text-red-500 hover:bg-red-500/10 cursor-pointer text-left"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Leave space</span>
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Browse Spaces Button */}
              {onBrowseSpaces && (
                <button
                  type="button"
                  onClick={onBrowseSpaces}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-full text-xs text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] transition-all cursor-pointer"
                >
                  <Compass className="w-4 h-4 text-emerald-500" />
                  <span>Browse spaces</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
