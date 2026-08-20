'use client'

import React, { useState } from 'react'
import {
  X,
  Search,
  Users,
  Hash,
  Lock,
  Globe,
  ArrowRight,
  Sparkles,
  Check,
} from 'lucide-react'
import { ChatConversationItem } from '@/app/actions/messages'

interface BrowseSpacesModalProps {
  isOpen: boolean
  onClose: () => void
  spaces: ChatConversationItem[]
  onSelectSpace: (spaceId: string) => void
  onCreateSpace: () => void
}

export const BrowseSpacesModal: React.FC<BrowseSpacesModalProps> = ({
  isOpen,
  onClose,
  spaces,
  onSelectSpace,
  onCreateSpace,
}) => {
  const [search, setSearch] = useState('')

  if (!isOpen) return null

  const filteredSpaces = spaces.filter((s) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      s.name.toLowerCase().includes(q) ||
      (s.description && s.description.toLowerCase().includes(q))
    )
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-[var(--md-sys-color-on-surface)]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between bg-[var(--md-sys-color-surface-container)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                Browse Spaces
              </h3>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                Discover and join open team collaboration spaces
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Action Bar */}
        <div className="p-4 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)] pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search spaces by name or topic..."
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] text-xs sm:text-sm text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]/40 transition-all"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              onClose()
              onCreateSpace()
            }}
            className="px-4 py-2.5 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-bold hover:opacity-95 active:scale-95 transition-all shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create Space</span>
          </button>
        </div>

        {/* Space List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-[var(--md-sys-color-surface-container-lowest)]">
          {filteredSpaces.length === 0 ? (
            <div className="py-16 text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
              {search
                ? `No spaces found matching "${search}"`
                : 'No open spaces found. Create the first team space!'}
            </div>
          ) : (
            filteredSpaces.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] transition-all group"
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1 pr-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 text-emerald-600 border border-[var(--md-sys-color-outline-variant)] flex items-center justify-center font-bold text-base shrink-0 shadow-2xs">
                    <Hash className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] transition-colors truncate">
                        {s.name}
                      </h4>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]">
                        <Globe className="w-2.5 h-2.5" />
                        <span>Public</span>
                      </span>
                    </div>
                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] line-clamp-1">
                      {s.description || 'General discussions and updates for the team.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onSelectSpace(s.id)
                    onClose()
                  }}
                  className="px-4 py-2 rounded-full bg-[var(--md-sys-color-surface-container-highest)] hover:bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-surface)] hover:text-[var(--md-sys-color-on-primary-container)] text-xs font-bold border border-[var(--md-sys-color-outline-variant)] transition-all flex items-center gap-1.5 cursor-pointer shrink-0 group-hover:border-[var(--md-sys-color-primary)]"
                >
                  <span>Open</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
