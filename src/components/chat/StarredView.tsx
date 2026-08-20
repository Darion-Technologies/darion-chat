'use client'

import React from 'react'
import { Star, MessageSquare, ArrowRight } from 'lucide-react'
import { ChatMessageItem } from '@/app/actions/messages'

interface StarredViewProps {
  messages: ChatMessageItem[]
  onSelectConversation: (convId: string) => void
}

export const StarredView: React.FC<StarredViewProps> = ({
  messages,
  onSelectConversation,
}) => {
  const starredMessages = messages.filter((m) => m.isPinned || m.metadata?.isStarred)

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--md-sys-color-surface-container-lowest)] select-none">
      {/* Top Title Bar */}
      <div className="px-5 py-3.5 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center">
          <Star className="w-4 h-4 fill-amber-500" />
        </div>
        <div>
          <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">Starred Messages</h2>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Important messages bookmarked across your spaces</p>
        </div>
      </div>

      {/* Content List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
        {starredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-[var(--md-sys-color-surface-container-high)] text-amber-500/70 flex items-center justify-center mb-3">
              <Star className="w-8 h-8" />
            </div>
            <h4 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] mb-1">No starred messages</h4>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] max-w-sm">
              Hover over any message and click the Star icon to bookmark it for quick access here.
            </p>
          </div>
        ) : (
          starredMessages.map((msg) => (
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

              <div className="p-2 rounded-full text-amber-500 group-hover:bg-[var(--md-sys-color-surface-container-highest)] transition-colors shrink-0">
                <Star className="w-4 h-4 fill-amber-500" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
