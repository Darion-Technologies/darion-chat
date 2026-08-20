'use client'

import React, { useState, useEffect } from 'react'
import {
  Lightbulb,
  CheckCircle2,
  User,
  ChevronRight,
  ChevronLeft,
  X,
  Calendar,
  CalendarDays,
  StickyNote,
  CheckSquare,
  Users,
  Sparkles,
  Plus,
  Trash2,
  Check,
  Phone,
  Video,
  Mail,
  Search,
} from 'lucide-react'
import { getUserDirectoryAction, ChatParticipantInfo } from '@/app/actions/messages'
import { CalendarPanel } from './CalendarPanel'

interface CompanionRailProps {
  currentUserId: string
  currentUserName: string
  onStartChatWithUser?: (userId: string) => void
}

type CompanionTool = 'calendar' | 'keep' | 'tasks' | 'contacts' | null

export const CompanionRail: React.FC<CompanionRailProps> = ({
  currentUserId,
  currentUserName,
  onStartChatWithUser,
}) => {
  const [activeTool, setActiveTool] = useState<CompanionTool>(null)
  const [collapsed, setCollapsed] = useState(false)

  // Keep Notes State (starts empty)
  const [notes, setNotes] = useState<Array<{ id: string; title: string; body: string; color: string }>>([])
  const [newNoteText, setNewNoteText] = useState('')
  const [newNoteTitle, setNewNoteTitle] = useState('')

  // Tasks State (starts empty)
  const [tasks, setTasks] = useState<Array<{ id: string; title: string; done: boolean }>>([])
  const [newTaskInput, setNewTaskInput] = useState('')

  // Real Directory / Contacts State
  const [contactSearch, setContactSearch] = useState('')
  const [contacts, setContacts] = useState<ChatParticipantInfo[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)

  useEffect(() => {
    if (activeTool === 'contacts') {
      setLoadingContacts(true)
      getUserDirectoryAction(contactSearch)
        .then((data) => setContacts(data))
        .catch(() => setContacts([]))
        .finally(() => setLoadingContacts(false))
    }
  }, [activeTool, contactSearch])

  const toggleTool = (tool: CompanionTool) => {
    setActiveTool((prev) => (prev === tool ? null : tool))
  }

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNoteText.trim() && !newNoteTitle.trim()) return
    setNotes([
      {
        id: `note-${Date.now()}`,
        title: newNoteTitle.trim() || 'Untitled Note',
        body: newNoteText.trim(),
        color: 'bg-[var(--md-sys-color-surface-container-high)] border-[var(--md-sys-color-outline-variant)]',
      },
      ...notes,
    ])
    setNewNoteTitle('')
    setNewNoteText('')
  }

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskInput.trim()) return
    setTasks([{ id: `t-${Date.now()}`, title: newTaskInput.trim(), done: false }, ...tasks])
    setNewTaskInput('')
  }

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  }

  return (
    <div className="flex h-full shrink-0 relative z-30 select-none">
      {/* Active Companion Tool Drawer (Slide-out panel) */}
      {activeTool && (
        <aside className="w-80 h-full bg-[var(--md-sys-color-surface-container-low)] border-l border-[var(--md-sys-color-outline-variant)] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
          {/* Drawer Header */}
          <div className="px-4 py-3 border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between bg-[var(--md-sys-color-surface-container)] shrink-0">
            <div className="flex items-center gap-2">
              {activeTool === 'calendar' ? (
                <div className="w-6 h-6 rounded-md bg-blue-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                  31
                </div>
              ) : activeTool === 'keep' ? (
                <div className="w-6 h-6 rounded-md bg-amber-500 text-white flex items-center justify-center shadow-2xs">
                  <Lightbulb className="w-3.5 h-3.5" />
                </div>
              ) : activeTool === 'tasks' ? (
                <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
              <h4 className="text-xs font-bold text-[var(--md-sys-color-on-surface)] capitalize">
                {activeTool === 'calendar'
                  ? 'Calendar'
                  : activeTool === 'keep'
                  ? 'Keep Notes'
                  : activeTool === 'tasks'
                  ? 'Tasks'
                  : 'Contacts & Directory'}
              </h4>
            </div>
            <button
              onClick={() => setActiveTool(null)}
              className="p-1 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto">
            {activeTool === 'calendar' ? (
              <CalendarPanel currentUserId={currentUserId} currentUserName={currentUserName} />
            ) : activeTool === 'keep' ? (
              <div className="p-4 space-y-3">
                {/* Add Note Form */}
                <form
                  onSubmit={handleAddNote}
                  className="p-3 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] shadow-xs space-y-2"
                >
                  <input
                    type="text"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    placeholder="Title..."
                    className="w-full text-xs font-bold bg-transparent border-0 focus:outline-none text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)]"
                  />
                  <textarea
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Take a note..."
                    rows={2}
                    className="w-full text-xs bg-transparent border-0 focus:outline-none text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)] resize-none"
                  />
                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={!newNoteText.trim() && !newNoteTitle.trim()}
                      className="px-3 py-1 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-bold disabled:opacity-40"
                    >
                      Add Note
                    </button>
                  </div>
                </form>

                {/* Notes List */}
                <div className="space-y-2">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className={`p-3 rounded-2xl border text-xs relative group ${note.color}`}
                    >
                      <span className="font-bold text-[var(--md-sys-color-on-surface)] block mb-1">
                        {note.title}
                      </span>
                      <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                        {note.body}
                      </p>
                      <button
                        type="button"
                        onClick={() => setNotes(notes.filter((n) => n.id !== note.id))}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-[var(--md-sys-color-on-surface-variant)] hover:text-rose-500 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : activeTool === 'tasks' ? (
              <div className="p-4 space-y-3">
                {/* Add Task Form */}
                <form
                  onSubmit={handleAddTask}
                  className="flex items-center gap-2 p-2.5 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] shadow-xs"
                >
                  <Plus className="w-4 h-4 text-[var(--md-sys-color-primary)] shrink-0" />
                  <input
                    type="text"
                    value={newTaskInput}
                    onChange={(e) => setNewTaskInput(e.target.value)}
                    placeholder="Add a task..."
                    className="w-full text-xs bg-transparent border-0 focus:outline-none text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)]"
                  />
                  <button
                    type="submit"
                    disabled={!newTaskInput.trim()}
                    className="px-2.5 py-1 rounded-lg bg-[var(--md-sys-color-primary)] text-white text-[10px] font-bold disabled:opacity-40"
                  >
                    Add
                  </button>
                </form>

                {/* Tasks List */}
                <div className="space-y-1.5">
                  {tasks.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-xs group"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => toggleTask(t.id)}
                          className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors cursor-pointer shrink-0 ${
                            t.done
                              ? 'bg-[var(--md-sys-color-primary)] border-[var(--md-sys-color-primary)] text-white'
                              : 'border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-lowest)]'
                          }`}
                        >
                          {t.done && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>
                        <span
                          className={`truncate ${
                            t.done
                              ? 'line-through text-[var(--md-sys-color-on-surface-variant)]'
                              : 'text-[var(--md-sys-color-on-surface)]'
                          }`}
                        >
                          {t.title}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setTasks(tasks.filter((item) => item.id !== t.id))}
                        className="opacity-0 group-hover:opacity-100 p-1 text-[var(--md-sys-color-on-surface-variant)] hover:text-rose-500 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)]" />
                  <input
                    type="text"
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    placeholder="Search contacts..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-xs text-[var(--md-sys-color-on-surface)] focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  {loadingContacts ? (
                    <div className="p-4 text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
                      Loading directory...
                    </div>
                  ) : contacts.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
                      No matching contacts found.
                    </div>
                  ) : (
                    contacts
                      .filter((c) => c.fullName.toLowerCase().includes(contactSearch.toLowerCase()))
                      .map((c) => (
                        <div
                          key={c.userId}
                          className="p-3 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-xs space-y-2"
                        >
                          <div className="flex items-center gap-2.5">
                            {c.avatarUrl ? (
                              <img src={c.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center font-bold text-xs">
                                {c.fullName.charAt(0)}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <h5 className="font-bold text-[var(--md-sys-color-on-surface)] truncate">{c.fullName}</h5>
                              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block capitalize">
                                {c.role || 'Member'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 pt-1 border-t border-[var(--md-sys-color-outline-variant)]/40">
                            <button
                              type="button"
                              onClick={() => onStartChatWithUser?.(c.userId)}
                              className="flex-1 py-1 px-2 rounded-lg bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-primary-container)] text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] text-center transition-colors cursor-pointer"
                            >
                              Chat
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Extreme Right 48px Companion Button Strip */}
      {!collapsed ? (
        <aside className="w-12 h-full bg-[var(--md-sys-color-surface-container-lowest)] border-l border-[var(--md-sys-color-outline-variant)] flex flex-col items-center py-3 justify-between">
          <div className="flex flex-col items-center gap-3 w-full">
            {/* 1. Darion Calendar */}
            <button
              type="button"
              onClick={() => toggleTool('calendar')}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                activeTool === 'calendar'
                  ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-xs'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
              title="Darion Calendar"
            >
              <Calendar className="w-4 h-4" />
            </button>

            {/* 2. Darion Notes */}
            <button
              type="button"
              onClick={() => toggleTool('keep')}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                activeTool === 'keep'
                  ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-xs'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
              title="Darion Notes"
            >
              <StickyNote className="w-4 h-4" />
            </button>

            {/* 3. Darion Tasks */}
            <button
              type="button"
              onClick={() => toggleTool('tasks')}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                activeTool === 'tasks'
                  ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-xs'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
              title="Darion Tasks"
            >
              <CheckSquare className="w-4 h-4" />
            </button>

            {/* 4. Team Directory */}
            <button
              type="button"
              onClick={() => toggleTool('contacts')}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                activeTool === 'contacts'
                  ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-xs'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
              title="Team Directory"
            >
              <Users className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom Collapse Toggle Arrow */}
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] transition-all cursor-pointer"
            title="Collapse companion rail"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </aside>
      ) : (
        /* Collapsed minimal tab */
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="absolute right-0 bottom-3 w-5 h-8 bg-[var(--md-sys-color-surface-container)] border-l border-y border-[var(--md-sys-color-outline-variant)] rounded-l-md flex items-center justify-center text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] shadow-xs transition-colors cursor-pointer"
          title="Expand companion rail"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
