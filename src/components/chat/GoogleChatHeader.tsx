'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Menu,
  Search,
  ChevronDown,
  HelpCircle,
  Settings,
  LayoutGrid,
  X,
  Sparkles,
  Check,
  LogOut,
  Moon,
  Sun,
  Shield,
  Calendar,
  Video,
  FileSpreadsheet,
  CheckSquare,
  Clock,
  ExternalLink,
  MessageSquare,
  FolderSync,
  UserCheck,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface GoogleChatHeaderProps {
  currentUserId: string
  currentUserName: string
  currentUserRole: string
  currentUserAvatar?: string
  searchQuery: string
  onSearchChange: (query: string) => void
  onToggleSidebar?: () => void
  onOpenSettings?: () => void
  currentPresenceStatus?: 'active' | 'away' | 'dnd'
  onStatusChange?: (status: 'active' | 'away' | 'dnd') => void
  statusMessage?: string
}

type UserStatus = 'active' | 'away' | 'dnd'

export const GoogleChatHeader: React.FC<GoogleChatHeaderProps> = ({
  currentUserId,
  currentUserName,
  currentUserRole,
  currentUserAvatar,
  searchQuery,
  onSearchChange,
  onToggleSidebar,
  onOpenSettings,
  currentPresenceStatus = 'active',
  onStatusChange,
  statusMessage = '',
}) => {
  const [status, setStatus] = useState<UserStatus>(currentPresenceStatus)
  const [customStatusText, setCustomStatusText] = useState(statusMessage)

  // Sync internal status with prop if updated from workspace (e.g. 1min inactivity or meet)
  useEffect(() => {
    if (currentPresenceStatus) {
      setStatus(currentPresenceStatus)
    }
  }, [currentPresenceStatus])

  useEffect(() => {
    if (statusMessage !== undefined) {
      setCustomStatusText(statusMessage)
    }
  }, [statusMessage])
  const [customStatusEmoji, setCustomStatusEmoji] = useState('💬')
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false)
  const [isCustomStatusModalOpen, setIsCustomStatusModalOpen] = useState(false)
  const [isAppLauncherOpen, setIsAppLauncherOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  const statusRef = useRef<HTMLDivElement>(null)
  const appLauncherRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const helpRef = useRef<HTMLDivElement>(null)

  // Click outside listener for all popovers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setIsStatusDropdownOpen(false)
      }
      if (appLauncherRef.current && !appLauncherRef.current.contains(e.target as Node)) {
        setIsAppLauncherOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false)
      }
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) {
        setIsHelpOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const DARION_APPS = [
    { name: 'Attendance', desc: 'Clock-in & Roster Management', icon: UserCheck, color: 'bg-blue-500', href: '/' },
    { name: 'Darion Meet', desc: 'HD Video & Audio Meetings', icon: Video, color: 'bg-emerald-500', href: '/meet' },
    { name: 'Payroll', desc: 'Pay Slips & Daily Wages', icon: FileSpreadsheet, color: 'bg-purple-500', href: '/admin/payroll' },
    { name: 'Darion Tasks', desc: 'Team Action Items & Todos', icon: CheckSquare, color: 'bg-amber-500', href: '#' },
    { name: 'Darion Calendar', desc: 'Shifts & Meeting Agenda', icon: Calendar, color: 'bg-sky-500', href: '#' },
    { name: 'Darion Drive', desc: 'Cloud Documents & Storage', icon: FolderSync, color: 'bg-teal-500', href: '#' },
  ]

  return (
    <header className="w-full bg-[var(--md-sys-color-surface-container-lowest)] border-b border-[var(--md-sys-color-outline-variant)] px-3 sm:px-4 pt-[max(env(safe-area-inset-top,0px),0px)] flex flex-col justify-center min-h-[calc(3.5rem+max(env(safe-area-inset-top,0px),0px))] shrink-0 z-40 select-none">
      <div className="h-14 w-full flex items-center justify-between gap-2 sm:gap-4">
        {/* 1. LEFT BRANDING */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
          title="Main menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2.5 cursor-pointer" onClick={() => (window.location.href = '/')}>
          {/* Darion Brand Logo */}
          <div className="w-8 h-8 rounded-xl bg-[#0B57D0] flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0 select-none">
            <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div className="flex items-baseline select-none">
            <span className="text-base sm:text-lg font-bold text-[var(--md-sys-color-on-surface)] tracking-tight font-sans">
              Darion Chat
            </span>
          </div>
        </div>
      </div>

      {/* 2. CENTER CAPSULE OMNIBOX SEARCH BAR */}
      <div className="flex-1 max-w-2xl px-2">
        <div className="relative w-full flex items-center">
          <Search className="w-4 h-4 absolute left-4 text-[var(--md-sys-color-on-surface-variant)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search in chat"
            className="w-full pl-11 pr-9 py-2 rounded-full bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container-highest)] focus:bg-[var(--md-sys-color-surface-container-lowest)] border border-transparent focus:border-[var(--md-sys-color-outline-variant)] text-xs sm:text-sm text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)] shadow-2xs focus:shadow-md transition-all outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 p-1 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. RIGHT STATUS & CONTROLS */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Status Dropdown */}
        <div className="relative" ref={statusRef}>
          <button
            type="button"
            onClick={() => setIsStatusDropdownOpen((prev) => !prev)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)] text-xs font-semibold text-[var(--md-sys-color-on-surface)] transition-all cursor-pointer"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                status === 'active'
                  ? 'bg-emerald-500 ring-2 ring-emerald-500/20'
                  : status === 'away'
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
            />
            <span className="capitalize">{customStatusText || status}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)]" />
          </button>

          {isStatusDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-52 rounded-2xl bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)] shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider border-b border-[var(--md-sys-color-outline-variant)]/40 mb-1">
                Presence Status
              </div>
              {(['active', 'away', 'dnd'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setStatus(s)
                    onStatusChange?.(s)
                    setIsStatusDropdownOpen(false)
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer ${
                    status === s ? 'bg-[var(--md-sys-color-surface-container)] font-bold' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        s === 'active'
                          ? 'bg-emerald-500'
                          : s === 'away'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                    />
                    <span className="capitalize">
                      {s === 'dnd' ? 'Do not disturb' : s}
                    </span>
                  </div>
                  {status === s && <Check className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />}
                </button>
              ))}

              <div className="border-t border-[var(--md-sys-color-outline-variant)]/40 my-1" />

              <button
                type="button"
                onClick={() => {
                  setIsStatusDropdownOpen(false)
                  setIsCustomStatusModalOpen(true)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer"
              >
                <span>💬</span>
                <span>Set a custom status...</span>
              </button>
            </div>
          )}
        </div>

        {/* Custom Status Modal */}
        {isCustomStatusModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)] shadow-2xl p-5 text-[var(--md-sys-color-on-surface)] animate-in fade-in duration-150">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold">Set Custom Status</h4>
                <button
                  onClick={() => setIsCustomStatusModalOpen(false)}
                  className="p-1 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)]">
                  <span className="text-lg">{customStatusEmoji}</span>
                  <input
                    type="text"
                    value={customStatusText}
                    onChange={(e) => setCustomStatusText(e.target.value)}
                    placeholder="What's your status?"
                    autoFocus
                    className="w-full text-xs bg-transparent border-0 focus:outline-none text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)]"
                  />
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)]">
                    Quick Presets:
                  </div>
                  {[
                    { emoji: '🗓️', text: 'In a meeting' },
                    { emoji: '🚗', text: 'Commuting' },
                    { emoji: '🤒', text: 'Out sick' },
                    { emoji: '🌴', text: 'On vacation' },
                  ].map((p) => (
                    <button
                      key={p.text}
                      type="button"
                      onClick={() => {
                        setCustomStatusEmoji(p.emoji)
                        setCustomStatusText(p.text)
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-[var(--md-sys-color-surface-container-high)] text-left cursor-pointer"
                    >
                      <span>{p.emoji}</span>
                      <span>{p.text}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-[var(--md-sys-color-outline-variant)]/40">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomStatusText('')
                      setIsCustomStatusModalOpen(false)
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCustomStatusModalOpen(false)}
                    className="px-4 py-1.5 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Save Status
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Help */}
        <div className="relative" ref={helpRef}>
          <button
            type="button"
            onClick={() => setIsHelpOpen((prev) => !prev)}
            className="p-2 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer hidden sm:block"
            title="Help & Shortcuts"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {isHelpOpen && (
            <div className="absolute right-0 mt-1.5 w-64 rounded-2xl bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)] shadow-xl p-3 z-50 text-xs text-[var(--md-sys-color-on-surface)] animate-in fade-in zoom-in-95 duration-150">
              <h5 className="font-bold mb-2 text-[var(--md-sys-color-on-surface)]">
                Keyboard Shortcuts
              </h5>
              <div className="space-y-1.5 text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                <div className="flex justify-between">
                  <span>Send message:</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-[var(--md-sys-color-surface-container-high)] font-mono">Enter</kbd>
                </div>
                <div className="flex justify-between">
                  <span>New line:</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-[var(--md-sys-color-surface-container-high)] font-mono">Shift+Enter</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Search chat:</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-[var(--md-sys-color-surface-container-high)] font-mono">Ctrl+K</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Bold text:</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-[var(--md-sys-color-surface-container-high)] font-mono">*text*</kbd>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="p-2 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer hidden sm:block"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* 9-dot launcher grid */}
        <div className="relative" ref={appLauncherRef}>
          <button
            type="button"
            onClick={() => setIsAppLauncherOpen((prev) => !prev)}
            className="p-2 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer hidden sm:block"
            title="Darion Workspace apps"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>

          {isAppLauncherOpen && (
            <div className="absolute right-0 mt-1.5 w-72 rounded-3xl bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)] shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-1 mb-3 text-xs font-bold text-[var(--md-sys-color-on-surface)]">
                Darion Workspace Suite
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {DARION_APPS.map((app) => {
                  const Icon = app.icon
                  return (
                    <a
                      key={app.name}
                      href={app.href}
                      className="p-2 rounded-2xl hover:bg-[var(--md-sys-color-surface-container-high)] transition-all flex flex-col items-center gap-1.5 group cursor-pointer"
                    >
                      <div className={`w-10 h-10 rounded-2xl ${app.color} text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)] truncate w-full">
                        {app.name}
                      </span>
                    </a>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar with Popover */}
        <div className="relative ml-1" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            className="cursor-pointer rounded-full p-0.5 hover:ring-2 hover:ring-[var(--md-sys-color-primary)] transition-all"
          >
            {currentUserAvatar ? (
              <img
                src={currentUserAvatar}
                alt={currentUserName}
                className="w-8 h-8 rounded-full object-cover border border-[var(--md-sys-color-outline-variant)]"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border border-[var(--md-sys-color-outline-variant)] flex items-center justify-center font-bold text-xs shadow-xs">
                {currentUserName.charAt(0).toUpperCase()}
              </div>
            )}
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-72 rounded-3xl bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)] shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150 text-[var(--md-sys-color-on-surface)]">
              <div className="flex items-center gap-3 pb-3 border-b border-[var(--md-sys-color-outline-variant)]/50">
                <div className="w-12 h-12 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                  {currentUserName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold truncate">{currentUserName}</h4>
                  <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] capitalize block">
                    {currentUserRole}
                  </span>
                </div>
              </div>

              <div className="py-2 space-y-1">
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[var(--md-sys-color-surface-container-high)] text-xs transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
                  <span>Account & Chat Settings</span>
                </button>
              </div>

              <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)]/50">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-500/10 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
