'use client'

import React, { useState } from 'react'
import {
  FileText,
  Image as ImageIcon,
  Download,
  Search,
  ExternalLink,
  Filter,
  Eye,
  FileSpreadsheet,
  FileCode,
  Film,
  Music,
} from 'lucide-react'
import { ChatMessageItem } from '@/app/actions/messages'

interface SpaceSharedFilesTabProps {
  messages: ChatMessageItem[]
  onPreviewImage: (url: string, fileName?: string, fileSize?: number) => void
}

type FileFilterType = 'all' | 'documents' | 'images' | 'media'

export const SpaceSharedFilesTab: React.FC<SpaceSharedFilesTabProps> = ({
  messages,
  onPreviewImage,
}) => {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<FileFilterType>('all')

  // Extract all file attachments from messages
  const sharedItems = React.useMemo(() => {
    const items: Array<{
      id: string
      name: string
      url: string
      size?: number
      type: 'image' | 'document' | 'video' | 'audio' | 'other'
      senderName: string
      senderAvatar?: string
      createdAt: string
    }> = []

    messages.forEach((msg) => {
      if (msg.fileUrl) {
        let itemType: 'image' | 'document' | 'video' | 'audio' | 'other' = 'document'
        const name = msg.fileName || 'Shared_File'
        const nameLower = name.toLowerCase()

        if (nameLower.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) itemType = 'image'
        else if (nameLower.match(/\.(mp4|webm|mov|mkv)$/)) itemType = 'video'
        else if (nameLower.match(/\.(mp3|wav|ogg|m4a|weba)$/)) itemType = 'audio'

        items.push({
          id: `${msg.id}-file`,
          name,
          url: msg.fileUrl,
          size: msg.fileSizeBytes,
          type: itemType,
          senderName: msg.senderName,
          senderAvatar: msg.senderAvatarUrl,
          createdAt: msg.createdAt,
        })
      }
    })

    return items.reverse()
  }, [messages])

  const filteredItems = sharedItems.filter((item) => {
    if (search.trim()) {
      const q = search.toLowerCase()
      if (!item.name.toLowerCase().includes(q) && !item.senderName.toLowerCase().includes(q)) {
        return false
      }
    }
    if (filterType === 'images' && item.type !== 'image') return false
    if (filterType === 'documents' && item.type !== 'document') return false
    if (filterType === 'media' && item.type !== 'video' && item.type !== 'audio') return false
    return true
  })

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (name: string, type: string) => {
    if (type === 'image') return <ImageIcon className="w-5 h-5 text-blue-500" />
    if (type === 'video') return <Film className="w-5 h-5 text-purple-500" />
    if (type === 'audio') return <Music className="w-5 h-5 text-amber-500" />
    if (name.endsWith('.csv') || name.endsWith('.xlsx') || name.endsWith('.xls')) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
    }
    if (name.endsWith('.js') || name.endsWith('.ts') || name.endsWith('.json') || name.endsWith('.html')) {
      return <FileCode className="w-5 h-5 text-amber-600" />
    }
    return <FileText className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--md-sys-color-surface-container-lowest)] select-none">
      {/* Search and Filters Bar */}
      <div className="p-4 border-b border-[var(--md-sys-color-outline-variant)] flex flex-col sm:flex-row items-center justify-between gap-3 bg-[var(--md-sys-color-surface-container)]">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search shared files..."
            className="w-full pl-10 pr-4 py-2 rounded-full bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] text-xs sm:text-sm text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]/40 transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar">
          {(['all', 'documents', 'images', 'media'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all cursor-pointer whitespace-nowrap ${
                filterType === type
                  ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border border-[var(--md-sys-color-primary)] shadow-2xs font-bold'
                  : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] border border-transparent'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Content List / Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {filteredItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] flex items-center justify-center mb-3">
              <FileText className="w-8 h-8 opacity-60" />
            </div>
            <h4 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] mb-1">
              No files shared yet
            </h4>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] max-w-sm">
              Files, documents, screenshots, and media shared in this space will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] transition-all shadow-2xs hover:shadow-md group"
              >
                {/* Top preview / Icon */}
                <div className="flex items-start gap-3 mb-3">
                  {item.type === 'image' ? (
                    <div
                      onClick={() => onPreviewImage(item.url, item.name, item.size)}
                      className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 cursor-pointer border border-[var(--md-sys-color-outline-variant)] relative group/img"
                    >
                      <img src={item.url} alt={item.name} className="w-full h-full object-cover group-hover/img:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                        <Eye className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)] flex items-center justify-center shrink-0">
                      {getFileIcon(item.name, item.type)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h5
                      className="text-xs font-bold text-[var(--md-sys-color-on-surface)] truncate hover:underline cursor-pointer"
                      title={item.name}
                      onClick={() => {
                        if (item.type === 'image') onPreviewImage(item.url, item.name, item.size)
                        else window.open(item.url, '_blank')
                      }}
                    >
                      {item.name}
                    </h5>
                    <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block mt-0.5">
                      {formatFileSize(item.size)}
                    </span>
                  </div>
                </div>

                {/* Footer Sender and Download action */}
                <div className="pt-2.5 border-t border-[var(--md-sys-color-outline-variant)]/40 flex items-center justify-between">
                  <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] truncate">
                    Shared by {item.senderName}
                  </span>

                  <a
                    href={item.url}
                    download={item.name}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)] hover:text-[var(--md-sys-color-primary)] transition-colors cursor-pointer"
                    title="Download file"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
