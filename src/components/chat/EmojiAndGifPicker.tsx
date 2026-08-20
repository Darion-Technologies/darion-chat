'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  Search,
  Smile,
  Film,
  Sparkles,
  Flame,
  ThumbsUp,
  PartyPopper,
  Coffee,
  Heart,
  Briefcase,
  X,
  Loader2,
  TrendingUp,
} from 'lucide-react'
import { searchGiphyAction, GiphyGifItem } from '@/app/actions/giphy'

interface EmojiAndGifPickerProps {
  onSelectEmoji: (emoji: string) => void
  onSelectGif?: (gifUrl: string, title: string) => void
  onClose: () => void
  initialTab?: 'emoji' | 'gif'
  hideGifTab?: boolean
  title?: string
}

// 1. Comprehensive Categorized Emoji Packs
const EMOJI_CATEGORIES = [
  {
    id: 'smileys',
    name: 'Smileys & Emotion',
    icon: '😀',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🥹', '☺️',
      '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗',
      '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭',
      '🤫', '🤔', '🫡', '🤐', '🤨', '😐', '😑', '😶', '🫥', '😏',
      '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷',
      '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯',
      '🤠', '🥳', '🥸', '😎', '🤓', '🧐', '😕', '🫤', '😟', '🙁',
      '😮', '😯', '😲', '🥱', '😫', '😩', '🥺', '😢', '😭', '😤',
      '😠', '😡', '🤬', '💀', '☠️', '💩', '🤡', '👻', '👽', '🤖'
    ],
  },
  {
    id: 'gestures',
    name: 'Hands & People',
    icon: '👋',
    emojis: [
      '👋', '🤚', '🖐️', '✋', '🖖', '🫱', '🫲', '🫳', '🫴', '🫵',
      '👉', '👈', '☝️', '👆', '👇', '✌️', '🤞', '🫰', '🤟', '🤘',
      '🤙', '👌', '🤌', '🤏', '👍', '👎', '✊', '👊', '🤛', '🤜',
      '👏', '🙌', '🫶', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳',
      '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '👀',
      '👁️', '👅', '👄', '🫦', '🧑‍💻', '👨‍💻', '👩‍💻', '🧑‍💼', '👨‍💼', '👩‍💼',
      '🧑‍🔬', '👨‍🚀', '🦸', '🦹', '🧙', '🧝', '🧑‍🎄', '🎅', '🤶', '🧑‍🎨'
    ],
  },
  {
    id: 'celebration',
    name: 'Activities & Celebration',
    icon: '🎉',
    emojis: [
      '🎉', '🎊', '🎈', '🎂', '🎁', '🎄', '🎃', '🎆', '🎇', '🧨',
      '✨', '⚡', '💥', '🪄', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️',
      '🏵️', '🎫', '🎟️', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼',
      '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '🎯', '🎳',
      '🎮', '🎰', '🧩', '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉'
    ],
  },
  {
    id: 'work',
    name: 'Work & Tools',
    icon: '💻',
    emojis: [
      '🔥', '🚀', '💯', '💻', '🖥️', '🖨️', '📱', '📲', '☎️', '📞',
      '🔋', '🔌', '💡', '🔦', '🪙', '💵', '💸', '💳', '💎', '⚖️',
      '🧰', '🔧', '🔨', '🛠️', '⛏️', '🔩', '⚙️', '🧱', '⛓️', '🧲',
      '📦', '📫', '📬', '📮', '🗳️', '✉️', '📩', '📨', '📧', '💌',
      '📥', '📤', '📊', '📈', '📉', '📋', '📌', '📍', '📎', '🔒'
    ],
  },
  {
    id: 'symbols',
    name: 'Hearts & Symbols',
    icon: '❤️',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
      '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐',
      '✅', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '⚠️', '🔔', '🔕',
      '🎯', '🚩', '🏁', '⭐', '🌟', '✨', '⚡', '🔥', '☀️', '🌈'
    ],
  },
  {
    id: 'food_nature',
    name: 'Food & Nature',
    icon: '☕',
    emojis: [
      '☕', '🍵', '🧃', '🥤', '🧋', '🥛', '🍺', '🍻', '🥂', '🍷',
      '🍕', '🍔', '🍟', '🌭', '🍿', '🥓', '🥪', '🥙', '🌮', '🌯',
      '🥗', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🍰', '🍩',
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
      '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆',
      '🪴', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁'
    ],
  },
]

const GIPHY_TAGS = [
  '🔥 Trending',
  '🎉 Party',
  '👏 Applause',
  '😂 Laugh',
  '🙌 High Five',
  '❤️ Love',
  '👍 Yes',
  '💃 Dance',
  '☕ Coffee',
  '🤯 Shocked',
  '👋 Bye',
  '🐱 Cats',
  '💯 Agree',
]

export const EmojiAndGifPicker: React.FC<EmojiAndGifPickerProps> = ({
  onSelectEmoji,
  onSelectGif,
  onClose,
  initialTab = 'emoji',
  hideGifTab = false,
  title,
}) => {
  const [activeTab, setActiveTab] = useState<'emoji' | 'gif'>(initialTab)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('smileys')
  const [recentEmojis, setRecentEmojis] = useState<string[]>([])
  
  // Real-time GIPHY state
  const [giphyGifs, setGiphyGifs] = useState<GiphyGifItem[]>([])
  const [loadingGifs, setLoadingGifs] = useState(false)
  const [selectedTag, setSelectedTag] = useState('🔥 Trending')
  const containerRef = useRef<HTMLDivElement>(null)

  // Load recently used emojis from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('chat_recent_emojis')
      if (stored) {
        setRecentEmojis(JSON.parse(stored))
      } else {
        setRecentEmojis(['👍', '❤️', '🚀', '😂', '🔥', '🎉', '👏', '👀'])
      }
    } catch {
      setRecentEmojis(['👍', '❤️', '🚀', '😂', '🔥', '🎉', '👏', '👀'])
    }
  }, [])

  // Save selected emoji to recents
  const handleEmojiClick = (emoji: string) => {
    onSelectEmoji(emoji)
    setRecentEmojis((prev) => {
      const filtered = prev.filter((e) => e !== emoji)
      const next = [emoji, ...filtered].slice(0, 16)
      try {
        localStorage.setItem('chat_recent_emojis', JSON.stringify(next))
      } catch {}
      return next
    })
  }

  // Real-time GIPHY search query & trending fetch with debounce
  useEffect(() => {
    if (activeTab !== 'gif') return
    let isMounted = true
    setLoadingGifs(true)

    const timer = setTimeout(async () => {
      try {
        const cleanQuery = searchQuery.trim() || selectedTag.replace(/^[^\w\s]+/, '').trim() || 'trending'
        const results = await searchGiphyAction(cleanQuery, 36)
        if (isMounted) {
          setGiphyGifs(results)
        }
      } catch (err) {
        console.error('Failed to search GIPHY:', err)
      } finally {
        if (isMounted) setLoadingGifs(false)
      }
    }, 250)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [activeTab, searchQuery, selectedTag])

  // Filtered Emojis based on search
  const filteredEmojis = useMemo(() => {
    if (!searchQuery.trim() || activeTab !== 'emoji') return null
    const q = searchQuery.toLowerCase()
    const all = EMOJI_CATEGORIES.flatMap((c) => c.emojis)
    return all.filter((e) => e.includes(q))
  }, [searchQuery, activeTab])

  return (
    <>
      <div
        ref={containerRef}
        className="w-[340px] sm:w-[420px] h-[480px] max-h-[82vh] rounded-2xl bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)] shadow-2xl flex flex-col p-3.5 z-50 text-[var(--md-sys-color-on-surface)] select-none animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md"
      >
        {/* Header Tabs & Close */}
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[var(--md-sys-color-outline-variant)]/40 shrink-0">
          <div className="flex items-center gap-1.5 bg-[var(--md-sys-color-surface-container-high)] p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab('emoji')
                setSearchQuery('')
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'emoji'
                  ? 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-primary)] shadow-2xs'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
            >
              <Smile className="w-4 h-4" />
              <span>Emojis</span>
            </button>

            {!hideGifTab && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('gif')
                  setSearchQuery('')
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'gif'
                    ? 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-primary)] shadow-2xs'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                <Film className="w-4 h-4 text-purple-400" />
                <span>GIPHY</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {title && <span className="text-xs font-bold text-[var(--md-sys-color-on-surface-variant)]">{title}</span>}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-2.5 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'emoji' ? 'Search emojis...' : 'Search GIPHY GIFs...'}
            autoFocus
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] text-xs text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]/40 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 1. EMOJI TAB CONTENT */}
        {activeTab === 'emoji' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Category Quick Nav */}
            {!filteredEmojis && (
              <div className="flex items-center justify-between px-1 pb-2 border-b border-[var(--md-sys-color-outline-variant)]/30 shrink-0 overflow-x-auto no-scrollbar">
                {EMOJI_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.id)
                      const el = document.getElementById(`cat-section-${cat.id}`)
                      if (el) el.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className={`p-1.5 rounded-lg text-base transition-transform hover:scale-125 cursor-pointer ${
                      selectedCategory === cat.id ? 'bg-[var(--md-sys-color-primary)]/20' : ''
                    }`}
                    title={cat.name}
                  >
                    {cat.icon}
                  </button>
                ))}
              </div>
            )}

            {/* Scrollable Emojis List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 pt-1">
              {filteredEmojis ? (
                <div>
                  <div className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] mb-1.5">
                    Search Results ({filteredEmojis.length})
                  </div>
                  <div className="grid grid-cols-8 gap-1.5">
                    {filteredEmojis.map((emoji, idx) => (
                      <button
                        key={`${emoji}-${idx}`}
                        type="button"
                        onClick={() => handleEmojiClick(emoji)}
                        className="w-9 h-9 flex items-center justify-center text-xl rounded-lg hover:bg-black/10 dark:hover:bg-white/10 hover:scale-125 active:scale-95 transition-all cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {/* Frequently Used */}
                  {recentEmojis.length > 0 && (
                    <div>
                      <div className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] mb-1.5 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-amber-500" />
                        <span>Frequently Used</span>
                      </div>
                      <div className="grid grid-cols-8 gap-1.5">
                        {recentEmojis.map((emoji, idx) => (
                          <button
                            key={`recent-${emoji}-${idx}`}
                            type="button"
                            onClick={() => handleEmojiClick(emoji)}
                            className="w-9 h-9 flex items-center justify-center text-xl rounded-lg hover:bg-black/10 dark:hover:bg-white/10 hover:scale-125 active:scale-95 transition-all cursor-pointer"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category Sections */}
                  {EMOJI_CATEGORIES.map((cat) => (
                    <div key={cat.id} id={`cat-section-${cat.id}`}>
                      <div className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] mb-1.5 sticky top-0 bg-[var(--md-sys-color-surface-container-highest)]/90 backdrop-blur-xs py-0.5">
                        {cat.name}
                      </div>
                      <div className="grid grid-cols-8 gap-1.5">
                        {cat.emojis.map((emoji, idx) => (
                          <button
                            key={`${cat.id}-${emoji}-${idx}`}
                            type="button"
                            onClick={() => handleEmojiClick(emoji)}
                            className="w-9 h-9 flex items-center justify-center text-xl rounded-lg hover:bg-black/10 dark:hover:bg-white/10 hover:scale-125 active:scale-95 transition-all cursor-pointer"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {/* 2. REAL GIPHY GIF TAB CONTENT */}
        {activeTab === 'gif' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* GIPHY Tag Filters */}
            <div className="flex items-center gap-1.5 pb-2.5 overflow-x-auto no-scrollbar shrink-0">
              {GIPHY_TAGS.map((tag) => {
                const isSelected = selectedTag === tag && !searchQuery
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setSelectedTag(tag)
                      setSearchQuery('')
                    }}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs'
                        : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)]'
                    }`}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>

            {/* GIPHY GIFs Grid with fixed auto-rows and explicit height */}
            <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 gap-2.5 content-start auto-rows-[125px]">
              {loadingGifs ? (
                <div className="col-span-2 flex flex-col items-center justify-center py-20 text-[var(--md-sys-color-on-surface-variant)] gap-2.5">
                  <Loader2 className="w-7 h-7 animate-spin text-[var(--md-sys-color-primary)]" />
                  <span className="text-xs font-semibold">Loading from GIPHY...</span>
                </div>
              ) : giphyGifs.length === 0 ? (
                <div className="col-span-2 py-16 text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  No GIFs found for &ldquo;{searchQuery || selectedTag}&rdquo;
                </div>
              ) : (
                giphyGifs.map((gif, idx) => (
                  <button
                    key={`${gif.id}-${idx}`}
                    type="button"
                    onClick={() => onSelectGif?.(gif.url, '')}
                    className="group relative w-full h-[125px] rounded-xl overflow-hidden bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/60 hover:border-[var(--md-sys-color-primary)] hover:shadow-md transition-all active:scale-[0.98] cursor-pointer block shrink-0"
                  >
                    <img
                      src={gif.previewUrl || gif.url}
                      alt="GIF"
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                    />
                  </button>
                ))
              )}
            </div>

            {/* GIPHY Official Attribution Footer */}
            <div className="pt-2 mt-1.5 border-t border-[var(--md-sys-color-outline-variant)]/30 flex items-center justify-between text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-bold shrink-0">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>GIPHY Live Feed</span>
              </span>
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded font-black text-[9px] tracking-wider uppercase shadow-xs">
                GIPHY
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
