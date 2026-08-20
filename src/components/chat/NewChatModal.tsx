'use client'

import React, { useState, useEffect } from 'react'
import { X, Search, MessageSquare, Loader2, ShieldCheck } from 'lucide-react'
import { getUserDirectoryAction, createDirectMessageAction, ChatParticipantInfo } from '@/app/actions/messages'

interface NewChatModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectConversation: (convId: string) => void
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose, onSelectConversation }) => {
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<ChatParticipantInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    let isMounted = true
    setLoading(true)

    const timer = setTimeout(async () => {
      try {
        const list = await getUserDirectoryAction(search)
        if (isMounted) {
          setUsers(list)
        }
      } catch (err) {
        console.error('Failed to load user directory:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }, 200)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [isOpen, search])

  if (!isOpen) return null

  const handleStartChat = async (targetUserId: string) => {
    try {
      setCreating(true)
      const convId = await createDirectMessageAction(targetUserId)
      onSelectConversation(convId)
      onClose()
    } catch (err: any) {
      alert(err.message || 'Failed to start chat')
    } finally {
      setCreating(false)
    }
  }

  const getStatusDot = (status?: string) => {
    switch (status) {
      case 'online':
        return 'bg-emerald-500'
      case 'in_meeting':
        return 'bg-rose-500 ring-2 ring-rose-400/40'
      case 'busy':
        return 'bg-amber-500'
      case 'dnd':
        return 'bg-purple-500'
      default:
        return 'bg-slate-400'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-[var(--md-sys-color-on-surface)]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between bg-[var(--md-sys-color-surface-container)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center shadow-xs">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">New Direct Message</h3>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Search team members & candidates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input */}
        <div className="p-4 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, role, or team..."
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] text-sm text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]/40 transition-all"
            />
          </div>
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 divide-y divide-[var(--md-sys-color-outline-variant)]/40 bg-[var(--md-sys-color-surface-container-lowest)]">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-[var(--md-sys-color-on-surface-variant)] gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--md-sys-color-primary)]" />
              <span className="text-xs">Loading directory...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
              No team members found matching &quot;{search}&quot;
            </div>
          ) : (
            users.map((u) => (
              <button
                key={u.userId}
                onClick={() => handleStartChat(u.userId)}
                disabled={creating}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt={u.fullName} className="w-10 h-10 rounded-full object-cover border border-[var(--md-sys-color-outline-variant)]" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[var(--md-sys-color-primary-container)] border border-[var(--md-sys-color-outline-variant)] flex items-center justify-center font-bold text-sm text-[var(--md-sys-color-on-primary-container)]">
                        {u.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[var(--md-sys-color-surface-container-highest)] ${getStatusDot(u.status)}`} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] transition-colors flex items-center gap-1.5">
                      <span>{u.fullName}</span>
                      {u.role === 'admin' && (
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-500 inline" />
                      )}
                    </div>
                    <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] capitalize">
                      {u.role ? u.role.replace('_', ' ') : 'Member'}
                    </div>
                  </div>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="px-2.5 py-1 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-bold shadow-xs">
                    Chat
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
