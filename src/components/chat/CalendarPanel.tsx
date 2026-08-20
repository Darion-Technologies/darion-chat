'use client'

import React, { useState } from 'react'
import { CalendarDays, Clock, Video, Sparkles, User, ChevronRight } from 'lucide-react'

interface CalendarPanelProps {
  currentUserId: string
  currentUserName: string
}

export const CalendarPanel: React.FC<CalendarPanelProps> = ({ currentUserId, currentUserName }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  const [events, setEvents] = useState<Array<{ id: string; title: string; time: string; type: string; roomCode: string; host: string }>>([])

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 sm:p-6 bg-[var(--md-sys-color-surface-container-lowest)] flex flex-col justify-between max-w-3xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--md-sys-color-outline-variant)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-primary)]/15 text-[var(--md-sys-color-primary)] flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                Team Calendar & Schedule
                <Sparkles className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
              </h2>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                Track upcoming meetings, 1:1 calls, and team milestones
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
              {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <div className="text-[10px] text-[var(--md-sys-color-primary)] font-medium">All times in local timezone</div>
          </div>
        </div>

        {/* Schedule List */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
            Today's Scheduled Video Syncs
          </div>

          {events.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--md-sys-color-surface-container-high)] flex items-center justify-center mx-auto mb-3 text-[var(--md-sys-color-on-surface-variant)]">
                <CalendarDays className="w-6 h-6 opacity-60" />
              </div>
              <h4 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] mb-1">No scheduled meetings today</h4>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] max-w-sm mx-auto mb-4">
                You have a clear schedule. Start an instant video huddle anytime directly from your chat.
              </p>
            </div>
          ) : (
            events.map((evt) => (
              <div
                key={evt.id}
                className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)]/40 transition-all flex items-center justify-between group shadow-xs"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[var(--md-sys-color-primary)]/15 text-[var(--md-sys-color-primary)] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Video className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-[var(--md-sys-color-on-surface)] truncate">{evt.title}</h4>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 opacity-70" />
                        <span>{evt.time}</span>
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <User className="w-3.5 h-3.5 opacity-70" />
                        <span>Hosted by {evt.host}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <a
                  href={`/meet/${evt.roomCode}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--md-sys-color-primary)] hover:opacity-90 text-[var(--md-sys-color-on-primary)] font-bold text-xs shadow-sm shadow-[var(--md-sys-color-primary)]/20 active:scale-95 transition-all flex-shrink-0"
                >
                  <span>Join</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-6 text-center text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
        Calendar automatically synchronized with Darion Enterprise Scheduler
      </div>
    </div>
  )
}
