'use client'

import React, { useState, useMemo } from 'react'
import { X, Search, Forward, Hash, Check, Loader2, FileText, Video } from 'lucide-react'
import { ChatConversationItem, ChatMessageItem, forwardMessageAction } from '@/app/actions/messages'

interface ForwardMessageModalProps {
  isOpen: boolean
  onClose: () => void
  message: ChatMessageItem | null
  conversations: ChatConversationItem[]
  onForwarded: () => void
}

export const ForwardMessageModal: React.FC<ForwardMessageModalProps> = ({
  isOpen,
  onClose,
  message,
  conversations,
  onForwarded,
}) => {
  const [search, setSearch] = useState('')
  const [selectedConvIds, setSelectedConvIds] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const filteredConversations = useMemo(() => {
    return conversations.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [conversations, search])

  if (!isOpen || !message) return null

  const toggleSelect = (id: string) => {
    setSelectedConvIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleForward = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedConvIds.length === 0) {
      setError('Please select at least one channel or chat to forward to.')
      return
    }

    try {
      setLoading(true)
      setError('')
      const res = await forwardMessageAction({
        messageId: message.id,
        targetConversationIds: selectedConvIds,
        additionalComment: comment.trim() || undefined,
      })

      if (!res.success) {
        throw new Error(res.error || 'Failed to forward message')
      }

      onForwarded()
      onClose()
      setSelectedConvIds([])
      setComment('')
    } catch (err: any) {
      setError(err.message || 'Failed to forward message')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between bg-[var(--md-sys-color-surface-container)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center">
              <Forward className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                Forward Message
              </h3>
              <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                Share this message to other channels or team members
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Preview Box */}
        <div className="p-4 bg-[var(--md-sys-color-surface-container-lowest)] border-b border-[var(--md-sys-color-outline-variant)]">
          <div className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-[var(--md-sys-color-on-surface)]">
                {message.senderName}
              </span>
              <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {message.messageType === 'file' ? (
              <div className="flex items-center gap-1.5 text-xs text-[var(--md-sys-color-on-surface)]">
                <FileText className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                <span className="truncate">{message.fileName || 'Attachment'}</span>
              </div>
            ) : message.messageType === 'meet_card' ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-semibold">
                <Video className="w-3.5 h-3.5" />
                <span>Live Video Meeting</span>
              </div>
            ) : (
              <p className="text-[var(--md-sys-color-on-surface)] line-clamp-3">
                {message.content}
              </p>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleForward} className="p-4 flex-1 overflow-hidden flex flex-col gap-3">
          {error && (
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-500 font-medium">
              {error}
            </div>
          )}

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search channels or people..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-xs text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)] focus:outline-none focus:border-[var(--md-sys-color-primary)]"
            />
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto max-h-48 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] divide-y divide-[var(--md-sys-color-outline-variant)]/40">
            {filteredConversations.length === 0 ? (
              <div className="py-6 text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
                No chats found.
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isSelected = selectedConvIds.includes(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleSelect(c.id)}
                    className={`w-full flex items-center justify-between p-2.5 text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--md-sys-color-primary-container)]/50 text-[var(--md-sys-color-on-primary-container)]'
                        : 'hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {c.type === 'channel' ? (
                        <div className="w-6 h-6 rounded-lg bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center flex-shrink-0">
                          <Hash className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-semibold truncate">{c.name}</span>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-[var(--md-sys-color-primary)] border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                          : 'border-[var(--md-sys-color-outline-variant)] bg-transparent'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Optional Message / Comment */}
          <div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add an optional comment..."
              rows={2}
              className="w-full p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-xs text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)] focus:outline-none focus:border-[var(--md-sys-color-primary)] resize-none"
            />
          </div>

          {/* Footer CTA */}
          <div className="pt-2 flex items-center justify-between border-t border-[var(--md-sys-color-outline-variant)]">
            <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
              {selectedConvIds.length} recipient{selectedConvIds.length === 1 ? '' : 's'} selected
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || selectedConvIds.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-semibold text-xs hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all shadow-xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Forwarding...</span>
                  </>
                ) : (
                  <>
                    <Forward className="w-3.5 h-3.5" />
                    <span>Forward</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
