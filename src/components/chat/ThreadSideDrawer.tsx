'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  X,
  Send,
  Smile,
  Paperclip,
  Video,
  Mic,
  SmilePlus,
  Reply,
  Check,
  CheckCheck,
  Download,
  FileText,
  Clock,
  Radio,
  Image as ImageIcon,
} from 'lucide-react'
import { ChatMessageItem } from '@/app/actions/messages'
import { ChatCodeCard } from './ChatCodeCard'

interface ThreadSideDrawerProps {
  parentMessage: ChatMessageItem
  threadReplies: ChatMessageItem[]
  currentUserId: string
  currentUserName: string
  currentUserAvatar?: string
  onClose: () => void
  onSendReply: (text: string) => Promise<void>
  onReact: (messageId: string, emoji: string) => void
  onPreviewImage: (url: string, fileName?: string, fileSize?: number) => void
  onOpenEmojiPicker: (target: 'thread', messageId?: string) => void
}

export const ThreadSideDrawer: React.FC<ThreadSideDrawerProps> = ({
  parentMessage,
  threadReplies,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  onClose,
  onSendReply,
  onReact,
  onPreviewImage,
  onOpenEmojiPicker,
}) => {
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const threadEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [threadReplies])

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputText.trim() || sending) return

    try {
      setSending(true)
      const text = inputText
      setInputText('')
      await onSendReply(text)
    } catch (err) {
      console.error('Failed to send thread reply:', err)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <aside className="w-full sm:w-96 md:w-[420px] h-full bg-[var(--md-sys-color-surface-container-lowest)] border-l border-[var(--md-sys-color-outline-variant)] shadow-2xl flex flex-col z-30 shrink-0 select-none animate-in slide-in-from-right-4 duration-200">
      {/* 1. Header */}
      <div className="px-4 py-3 border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between bg-[var(--md-sys-color-surface-container)] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center shadow-xs">
            <Reply className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
              Thread Replies
            </h3>
            <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
              {threadReplies.length} {threadReplies.length === 1 ? 'reply' : 'replies'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
          title="Close thread"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Messages List (Pinned root + Replies) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Pinned Parent Root Message */}
        <div className="p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] shadow-xs">
          <div className="flex items-start gap-3">
            {parentMessage.senderAvatarUrl ? (
              <img
                src={parentMessage.senderAvatarUrl}
                alt={parentMessage.senderName}
                className="w-8 h-8 rounded-full object-cover border border-[var(--md-sys-color-outline-variant)] shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border border-[var(--md-sys-color-outline-variant)] flex items-center justify-center font-bold text-xs shrink-0">
                {parentMessage.senderName.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
                  {parentMessage.senderName}
                </span>
                <span
                  suppressHydrationWarning
                  className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]"
                >
                  {new Date(parentMessage.createdAt).toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {parentMessage.messageType === 'code' || parentMessage.metadata?.isCode ? (
                <ChatCodeCard
                  code={parentMessage.content}
                  language={parentMessage.metadata?.language}
                  title={parentMessage.metadata?.title}
                  note={parentMessage.metadata?.note}
                />
              ) : (
                <div className="text-xs text-[var(--md-sys-color-on-surface)] whitespace-pre-wrap break-words leading-relaxed">
                  {parentMessage.content}
                </div>
              )}

              {/* Attachment if any */}
              {parentMessage.fileUrl && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)] text-xs">
                    <FileText className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                    <span className="truncate flex-1 font-medium">{parentMessage.fileName || 'Attachment'}</span>
                    <a href={parentMessage.fileUrl} download target="_blank" rel="noreferrer">
                      <Download className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)]" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="flex items-center gap-3">
          <div className="h-px bg-[var(--md-sys-color-outline-variant)] flex-1" />
          <span className="text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
            Replies
          </span>
          <div className="h-px bg-[var(--md-sys-color-outline-variant)] flex-1" />
        </div>

        {/* Chronological Replies */}
        {threadReplies.length === 0 ? (
          <div className="py-8 text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
            No replies yet. Start the conversation!
          </div>
        ) : (
          threadReplies.map((reply) => (
            <div key={reply.id} className="flex items-start gap-2.5 group">
              {reply.senderAvatarUrl ? (
                <img
                  src={reply.senderAvatarUrl}
                  alt={reply.senderName}
                  className="w-7 h-7 rounded-full object-cover border border-[var(--md-sys-color-outline-variant)] shrink-0 mt-0.5"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border border-[var(--md-sys-color-outline-variant)] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  {reply.senderName.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
                    {reply.senderName}
                  </span>
                  <span
                    suppressHydrationWarning
                    className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]"
                  >
                    {new Date(reply.createdAt).toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {reply.messageType === 'code' || reply.metadata?.isCode ? (
                  <ChatCodeCard
                    code={reply.content}
                    language={reply.metadata?.language}
                    title={reply.metadata?.title}
                    note={reply.metadata?.note}
                  />
                ) : (
                  <div className="p-2.5 rounded-2xl rounded-tl-xs bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-xs text-[var(--md-sys-color-on-surface)] whitespace-pre-wrap break-words leading-relaxed shadow-2xs">
                    {reply.content}
                  </div>
                )}

                {/* Reactions */}
                {reply.reactions && reply.reactions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {reply.reactions.map((rg) => (
                      <button
                        key={rg.emoji}
                        type="button"
                        onClick={() => onReact(reply.id, rg.emoji)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border transition-colors cursor-pointer ${
                          rg.hasReacted
                            ? 'bg-[var(--md-sys-color-primary-container)] border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary-container)] font-bold'
                            : 'bg-[var(--md-sys-color-surface-container-high)] border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)]'
                        }`}
                      >
                        <span>{rg.emoji}</span>
                        <span>{rg.count}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        <div ref={threadEndRef} />
      </div>

      {/* 3. Bottom Composer */}
      <div className="p-3 border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]">
        <form onSubmit={handleSend} className="relative flex flex-col rounded-2xl bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)] focus-within:border-[var(--md-sys-color-primary)]/70 focus-within:ring-1 focus-within:ring-[var(--md-sys-color-primary)]/20 shadow-xs transition-all">
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Reply in thread..."
            rows={2}
            className="w-full px-3.5 py-2 text-xs bg-transparent border-0 focus:outline-none text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)] resize-none"
          />

          <div className="px-3 py-1.5 flex items-center justify-between border-t border-[var(--md-sys-color-outline-variant)]/40 bg-[var(--md-sys-color-surface-container-high)]/40 rounded-b-2xl">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onOpenEmojiPicker('thread')}
                className="p-1 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer"
                title="Add emoji"
              >
                <Smile className="w-4 h-4" />
              </button>
            </div>

            <button
              type="submit"
              disabled={!inputText.trim() || sending}
              className="p-1.5 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </aside>
  )
}
