'use client'

import React from 'react'
import { AtSign, MessageSquare, Clock, ArrowRight } from 'lucide-react'
import { ChatMessageItem } from '@/app/actions/messages'

interface MentionsViewProps {
  currentUserId: string
  currentUserName: string
  messages: ChatMessageItem[]
  onSelectConversation: (convId: string) => void
}

export const MentionsView: React.FC<MentionsViewProps> = ({
  currentUserName,
  messages,
  onSelectConversation,
}) => {
  const mentionMatches = messages.filter((m) => {
    if (!m.content) return false
    const text = m.content.toLowerCase()
    return (
      text.includes(`@${currentUserName.toLowerCase()}`) ||
      text.includes('@all') ||
      text.includes('@everyone') ||
      text.includes('@here') ||
      text.includes('@channel') ||
      text.includes('@team')
    )
  })

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--md-sys-color-surface-container-lowest)] select-none">
      {/* Top Title Bar */}
      <div className="px-5 py-3.5 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] flex items-center justify-center">
          <AtSign className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">Mentions</h2>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Messages where you or your group were mentioned</p>
        </div>
      </div>

      {/* Content List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
        {mentionMatches.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] flex items-center justify-center mb-3">
              <AtSign className="w-8 h-8 opacity-60" />
            </div>
            <h4 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] mb-1">No mentions yet</h4>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] max-w-sm">
              When teammates mention you with @{currentUserName}, you'll see those messages gathered here.
            </p>
          </div>
        ) : (
          mentionMatches.map((msg) => (
            <div
              key={msg.id}
              onClick={() => onSelectConversation(msg.conversationId)}
              className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] transition-all cursor-pointer shadow-2xs hover:shadow-md group flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3 min-w-0">
                {msg.senderAvatarUrl ? (
                  <img src={msg.senderAvatarUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] font-bold text-xs flex items-center justify-center shrink-0">
                    {msg.senderName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">{msg.senderName}</span>
                    <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--md-sys-color-on-surface)] line-clamp-2 leading-relaxed">{msg.content}</p>
                </div>
              </div>

              <div className="p-2 rounded-full text-[var(--md-sys-color-on-surface-variant)] group-hover:text-[var(--md-sys-color-primary)] group-hover:bg-[var(--md-sys-color-surface-container-highest)] transition-colors shrink-0">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
