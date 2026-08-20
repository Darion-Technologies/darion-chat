'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import {
  Send,
  Smile,
  Paperclip,
  Video,
  Mic,
  MicOff,
  Clock,
  Sparkles,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Code2,
  Quote,
  List,
  ListOrdered,
  Type,
  FolderSync,
  X,
  Radio,
  Trash2,
  Plus,
  Image as ImageIcon,
  AtSign,
} from 'lucide-react'
import { ChatMessageItem } from '@/app/actions/messages'

interface GoogleChatComposerProps {
  inputText: string
  setInputText: (text: string | ((prev: string) => string)) => void
  onSendMessage: () => void
  sending: boolean
  replyingTo: ChatMessageItem | null
  onCancelReply: () => void
  onOpenFilePicker: () => void
  onOpenEmojiPicker: () => void
  onOpenCodeModal?: () => void
  onStartMeet: () => void
  isRecordingVoice: boolean
  recordingDuration: number
  recordingWaveformLevels: number[]
  onStartVoiceRecording: () => void
  onStopVoiceRecording: (shouldSend: boolean) => void
  placeholderText?: string
  mainInputRef?: React.RefObject<HTMLTextAreaElement | null>
  members?: Array<{ id: string; name: string; avatarUrl?: string; role?: string }>
}

export const GoogleChatComposer: React.FC<GoogleChatComposerProps> = ({
  inputText,
  setInputText,
  onSendMessage,
  sending,
  replyingTo,
  onCancelReply,
  onOpenFilePicker,
  onOpenEmojiPicker,
  onOpenCodeModal,
  onStartMeet,
  isRecordingVoice,
  recordingDuration,
  recordingWaveformLevels,
  onStartVoiceRecording,
  onStopVoiceRecording,
  placeholderText = 'Send a message...',
  mainInputRef,
  members = [],
}) => {
  const [showFormatting, setShowFormatting] = useState(false)
  const [slashMenuOpen, setSlashMenuOpen] = useState(false)
  const [slashFilter, setSlashFilter] = useState('')
  const [mentionMenuOpen, setMentionMenuOpen] = useState(false)
  const [mentionFilter, setMentionFilter] = useState('')
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0)

  const SLASH_COMMANDS = [
    { cmd: '/code', desc: 'Share formatted code snippet with syntax highlighting', icon: '💻' },
    { cmd: '/meet', desc: 'Start an instant Darion Meet video room', icon: '📹' },
    { cmd: '/task', desc: 'Create a new team task in this space', icon: '✅' },
    { cmd: '/poll', desc: 'Create an instant interactive poll', icon: '📊' },
    { cmd: '/shrug', desc: 'Append ¯\\_(ツ)_/¯ to message', icon: '🤷' },
    { cmd: '/clear', desc: 'Clear the input field', icon: '🧹' },
  ]

  // Team & Space members list with special tags
  const allAvailableMembers = useMemo(() => {
    const list: Array<{ id: string; name: string; avatarUrl?: string; role?: string }> = [
      { id: 'all', name: 'all', role: 'Notify everyone in this space' },
      { id: 'here', name: 'here', role: 'Notify active members' },
    ]
    if (members && members.length > 0) {
      members.forEach((m) => {
        if (!list.some((existing) => existing.id === m.id || existing.name.toLowerCase() === m.name.toLowerCase())) {
          list.push(m)
        }
      })
    }
    return list
  }, [members])

  const filteredMembers = useMemo(() => {
    if (!mentionFilter) return allAvailableMembers
    const q = mentionFilter.toLowerCase()
    return allAvailableMembers.filter(
      (m) => m.name.toLowerCase().includes(q) || (m.role && m.role.toLowerCase().includes(q))
    )
  }, [allAvailableMembers, mentionFilter])

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setInputText(val)

    // Slash command trigger
    if (val.startsWith('/')) {
      setSlashMenuOpen(true)
      setSlashFilter(val.toLowerCase())
    } else {
      setSlashMenuOpen(false)
    }

    // Mention trigger (@name)
    const cursor = e.target.selectionStart || val.length
    const textBeforeCursor = val.slice(0, cursor)
    const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_\s]{0,20})$/)

    if (mentionMatch) {
      setMentionMenuOpen(true)
      setMentionFilter(mentionMatch[1].toLowerCase())
      setMentionSelectedIndex(0)
    } else {
      setMentionMenuOpen(false)
    }
  }

  const applyMention = (member: { id: string; name: string }) => {
    const textarea = mainInputRef?.current
    const cursor = textarea?.selectionStart ?? inputText.length
    const textBeforeCursor = inputText.slice(0, cursor)
    const textAfterCursor = inputText.slice(cursor)

    const match = textBeforeCursor.match(/@([a-zA-Z0-9_\s]{0,20})$/)
    if (match) {
      const startIndex = match.index ?? 0
      const replacement = `@${member.name} `
      const newText = inputText.slice(0, startIndex) + replacement + textAfterCursor
      setInputText(newText)
      setMentionMenuOpen(false)
      setTimeout(() => {
        if (textarea) {
          textarea.focus()
          const newPos = startIndex + replacement.length
          textarea.setSelectionRange(newPos, newPos)
        }
      }, 10)
    } else {
      setInputText((prev) => prev + `@${member.name} `)
      setMentionMenuOpen(false)
    }
  }

  const applySlashCommand = (cmd: string) => {
    if (cmd === '/code') {
      setInputText('')
      setSlashMenuOpen(false)
      onOpenCodeModal?.()
    } else if (cmd === '/meet') {
      setInputText('')
      setSlashMenuOpen(false)
      onStartMeet()
    } else if (cmd === '/shrug') {
      setInputText((prev) => prev.replace('/shrug', '') + ' ¯\\_(ツ)_/¯')
      setSlashMenuOpen(false)
    } else if (cmd === '/clear') {
      setInputText('')
      setSlashMenuOpen(false)
    } else {
      setInputText(cmd + ' ')
      setSlashMenuOpen(false)
    }
  }

  const applyFormat = (prefix: string, suffix: string = prefix) => {
    const textarea = mainInputRef?.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = inputText.substring(start, end)

    const replacement = `${prefix}${selected || 'text'}${suffix}`
    const newText = inputText.substring(0, start) + replacement + inputText.substring(end)
    setInputText(newText)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected.length || 4))
    }, 10)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 1. Mention Menu Key Navigation
    if (mentionMenuOpen && filteredMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setMentionSelectedIndex((prev) => (prev + 1) % filteredMembers.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setMentionSelectedIndex((prev) => (prev - 1 + filteredMembers.length) % filteredMembers.length)
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        applyMention(filteredMembers[mentionSelectedIndex] || filteredMembers[0])
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setMentionMenuOpen(false)
        return
      }
    }

    // 2. Slash Menu Navigation
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (slashMenuOpen) {
        const match = SLASH_COMMANDS.find((c) => c.cmd.startsWith(slashFilter))
        if (match) {
          applySlashCommand(match.cmd)
          return
        }
      }
      onSendMessage()
    }
  }

  const formatVoiceDuration = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  return (
    <div className="p-3 sm:p-4 pb-[calc(0.75rem+max(env(safe-area-inset-bottom,0px),0px))] bg-[var(--md-sys-color-surface-container-lowest)] border-t border-[var(--md-sys-color-outline-variant)] relative shrink-0">
      {/* 1. SLASH COMMANDS POPUP */}
      {slashMenuOpen && (
        <div className="absolute bottom-full left-4 mb-2 w-72 rounded-2xl bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)] shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
            Quick Commands
          </div>
          {SLASH_COMMANDS.filter((c) => c.cmd.includes(slashFilter)).map((c) => (
            <button
              key={c.cmd}
              type="button"
              onClick={() => applySlashCommand(c.cmd)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-[var(--md-sys-color-surface-container-high)] text-xs transition-colors cursor-pointer"
            >
              <span className="text-base">{c.icon}</span>
              <div>
                <span className="font-mono font-bold text-[var(--md-sys-color-primary)]">
                  {c.cmd}
                </span>
                <span className="block text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                  {c.desc}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 1.5 DEDICATED @ MENTION AUTOCOMPLETE POPOVER */}
      {mentionMenuOpen && filteredMembers.length > 0 && (
        <div className="absolute bottom-full left-4 mb-2 w-72 sm:w-80 rounded-2xl bg-[var(--md-sys-color-surface-container-highest)]/95 backdrop-blur-xl border border-[var(--md-sys-color-outline-variant)] shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-60 overflow-y-auto no-scrollbar">
          <div className="px-3 py-1.5 text-[10.5px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider flex items-center gap-1.5 border-b border-[var(--md-sys-color-outline-variant)]/40 mb-1">
            <AtSign className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            <span>Mention teammate</span>
          </div>

          <div className="space-y-0.5">
            {filteredMembers.map((m, idx) => (
              <button
                key={m.id}
                type="button"
                onClick={() => applyMention(m)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                  idx === mentionSelectedIndex
                    ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-bold'
                    : 'hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                {/* Avatar / Special Mention Badge */}
                {m.id === 'all' || m.id === 'here' ? (
                  <div className="w-7 h-7 rounded-full bg-[var(--md-sys-color-primary)] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                    @
                  </div>
                ) : m.avatarUrl ? (
                  <img src={m.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover shrink-0 border border-[var(--md-sys-color-outline-variant)]" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center text-xs font-bold shrink-0 border border-[var(--md-sys-color-outline-variant)]">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="text-xs truncate flex items-center gap-1.5">
                    <span className="font-bold">@{m.name}</span>
                    {m.id === 'all' && (
                      <span className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-[var(--md-sys-color-primary)] text-white font-medium">Space</span>
                    )}
                  </div>
                  {m.role && (
                    <p className="text-[10.5px] opacity-75 truncate">{m.role}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. REPLYING-TO BANNER */}
      {replyingTo && (
        <div className="mb-2 p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] flex items-center justify-between gap-2 animate-in fade-in duration-150">
          <div className="min-w-0 flex-1 text-xs">
            <span className="font-bold text-[var(--md-sys-color-on-surface)] block">
              Replying to {replyingTo.senderName}
            </span>
            <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] truncate">
              {replyingTo.content || 'Attachment'}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="p-1 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2.5 MOBILE SIGNATURE CAPSULE COMPOSER (Screenshot 2) */}
      <div className="md:hidden flex items-center gap-2 w-full select-none">
        {/* Left + Button */}
        <button
          type="button"
          onClick={onOpenFilePicker}
          className="w-10 h-10 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center shrink-0 active:scale-95 transition-all shadow-xs cursor-pointer"
          title="Add attachment or action"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Capsule Input Bar */}
        <div className="flex-1 min-w-0 flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]/60 focus-within:border-[var(--md-sys-color-primary)] transition-all">
          <input
            type="text"
            value={inputText}
            onChange={(e) => {
              const val = e.target.value
              setInputText(val)
              const cursor = e.target.selectionStart || val.length
              const textBeforeCursor = val.slice(0, cursor)
              const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_\s]{0,20})$/)
              if (mentionMatch) {
                setMentionMenuOpen(true)
                setMentionFilter(mentionMatch[1].toLowerCase())
                setMentionSelectedIndex(0)
              } else {
                setMentionMenuOpen(false)
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (mentionMenuOpen && filteredMembers.length > 0) {
                  applyMention(filteredMembers[mentionSelectedIndex] || filteredMembers[0])
                  return
                }
                onSendMessage()
              }
            }}
            placeholder="History is on"
            className="flex-1 min-w-0 text-sm bg-transparent border-0 focus:outline-none text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)]"
          />

          {/* Emoji button */}
          <button
            type="button"
            onClick={onOpenEmojiPicker}
            className="text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-colors shrink-0 cursor-pointer"
            title="Emoji"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Image button */}
          <button
            type="button"
            onClick={onOpenFilePicker}
            className="text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-colors shrink-0 cursor-pointer"
            title="Add photo"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {/* Voice note mic button / Send button */}
          {inputText.trim() ? (
            <button
              type="button"
              onClick={onSendMessage}
              disabled={sending}
              className="text-[var(--md-sys-color-primary)] hover:opacity-80 transition-opacity shrink-0 cursor-pointer"
              title="Send"
            >
              <Send className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onStartVoiceRecording}
              className="text-[var(--md-sys-color-on-surface-variant)] hover:text-rose-500 transition-colors shrink-0 cursor-pointer"
              title="Voice recording"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. MAIN DESKTOP RICH INPUT CONTAINER */}
      <div className="hidden md:flex flex-col rounded-3xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] focus-within:border-[var(--md-sys-color-outline)] shadow-xs hover:shadow-md transition-all overflow-hidden">
        {/* Optional Rich Text Formatting Bar */}
        {showFormatting && (
          <div className="px-3 py-1.5 border-b border-[var(--md-sys-color-outline-variant)] flex items-center gap-1 overflow-x-auto no-scrollbar bg-[var(--md-sys-color-surface-container-high)]">
            <button
              type="button"
              onClick={() => applyFormat('**')}
              className="p-1.5 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)] hover:text-[var(--md-sys-color-on-surface)] transition-colors"
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat('*')}
              className="p-1.5 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)] hover:text-[var(--md-sys-color-on-surface)] transition-colors"
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat('~')}
              className="p-1.5 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)] hover:text-[var(--md-sys-color-on-surface)] transition-colors"
              title="Strikethrough"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-[var(--md-sys-color-outline-variant)] mx-1" />
            <button
              type="button"
              onClick={() => applyFormat('`')}
              className="p-1.5 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)] hover:text-[var(--md-sys-color-on-surface)] transition-colors"
              title="Inline Code"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat('```\n', '\n```')}
              className="p-1.5 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)] hover:text-[var(--md-sys-color-on-surface)] transition-colors"
              title="Code Block"
            >
              <Type className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat('> ')}
              className="p-1.5 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)] hover:text-[var(--md-sys-color-on-surface)] transition-colors"
              title="Quote"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat('- ')}
              className="p-1.5 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)] hover:text-[var(--md-sys-color-on-surface)] transition-colors"
              title="Bulleted list"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat('1. ')}
              className="p-1.5 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)] hover:text-[var(--md-sys-color-on-surface)] transition-colors"
              title="Numbered list"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Text Input Area OR Live Voice Recording Display */}
        {isRecordingVoice ? (
          <div className="p-4 flex items-center justify-between gap-4 bg-rose-500/10 animate-in fade-in duration-150">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-xs font-mono font-bold text-rose-500">
                {formatVoiceDuration(recordingDuration)}
              </span>

              {/* Animated Waveform Visualizer */}
              <div className="flex items-center gap-0.5 h-6 px-2">
                {recordingWaveformLevels.map((lvl, idx) => (
                  <div
                    key={idx}
                    className="w-1 bg-rose-500 rounded-full transition-all duration-75"
                    style={{ height: `${Math.max(4, lvl * 24)}px` }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onStopVoiceRecording(false)}
                className="p-2 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-rose-500/20 hover:text-rose-500 transition-colors"
                title="Cancel recording"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onStopVoiceRecording(true)}
                className="px-3.5 py-1.5 rounded-full bg-rose-500 text-white text-xs font-bold shadow-xs hover:bg-rose-600 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Voice Note</span>
              </button>
            </div>
          </div>
        ) : (
          <textarea
            ref={mainInputRef as any}
            value={inputText}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholderText}
            rows={1}
            className="w-full px-4 pt-3 pb-2 text-xs sm:text-sm bg-transparent border-0 focus:outline-none text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)] resize-none min-h-[44px] max-h-36 overflow-y-auto leading-relaxed"
          />
        )}

        {/* Bottom Action Bar */}
        {!isRecordingVoice && (
          <div className="px-3 pb-2 pt-1 flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 sm:gap-1.5">
              {/* Formatting Toggle 'A' */}
              <button
                type="button"
                onClick={() => setShowFormatting(!showFormatting)}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  showFormatting
                    ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)]'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                }`}
                title="Format options"
              >
                <span className="font-serif font-bold text-xs px-0.5">A</span>
              </button>

              {/* Emoji Picker */}
              <button
                type="button"
                onClick={onOpenEmojiPicker}
                className="p-1.5 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
                title="Add emoji or GIF"
              >
                <Smile className="w-4 h-4" />
              </button>

              {/* Attach File */}
              <button
                type="button"
                onClick={onOpenFilePicker}
                className="p-1.5 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Share Code Snippet */}
              <button
                type="button"
                onClick={onOpenCodeModal}
                className="p-1.5 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-cyan-400 transition-colors cursor-pointer"
                title="Share code snippet (</> or /code)"
              >
                <Code2 className="w-4 h-4" />
              </button>

              {/* Instant Darion Meet Link */}
              <button
                type="button"
                onClick={onStartMeet}
                className="p-1.5 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-emerald-500 transition-colors cursor-pointer"
                title="Add Darion video meeting (/meet)"
              >
                <Video className="w-4 h-4" />
              </button>

              {/* Voice Note Recorder */}
              <button
                type="button"
                onClick={onStartVoiceRecording}
                className="p-1.5 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-rose-500 transition-colors cursor-pointer"
                title="Record voice note"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>

            {/* Blue Send Arrow Button */}
            <button
              type="button"
              onClick={onSendMessage}
              disabled={!inputText.trim() || sending}
              className="p-2 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-90 disabled:opacity-30 disabled:hover:opacity-30 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
              title="Send message (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
