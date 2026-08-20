'use client'

import React from 'react'
import { X } from 'lucide-react'

interface NoConversationSelectedProps {
  onClose?: () => void
}

export const NoConversationSelected: React.FC<NoConversationSelectedProps> = ({ onClose }) => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center relative bg-[var(--md-sys-color-surface-container-lowest)] p-6 select-none animate-in fade-in duration-200">
      {/* Top right close button if applicable */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer"
          title="Close pane"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Stylized Google Chat Collaboration Graphic */}
      <div className="w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center relative mb-4">
        <svg viewBox="0 0 320 320" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Subtle Background Glow */}
          <circle cx="160" cy="160" r="110" fill="currentColor" className="text-[var(--md-sys-color-primary)]/5" />

          {/* Main Large White/Dark Speech Bubble */}
          <path
            d="M80 90C80 73.4315 93.4315 60 110 60H230C246.569 60 260 73.4315 260 90V180C260 196.569 246.569 210 230 210H140L95 245V210H110C93.4315 210 80 196.569 80 180V90Z"
            fill="var(--md-sys-color-surface-container-high)"
            stroke="var(--md-sys-color-outline-variant)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Overlapping Floating Document Card */}
          <rect
            x="180"
            y="75"
            width="55"
            height="70"
            rx="10"
            fill="#7FCFFF"
            fillOpacity="0.45"
            stroke="#0284C7"
            strokeWidth="2.5"
            transform="rotate(6 180 75)"
          />
          <line x1="192" y1="95" x2="222" y2="98" stroke="#0369A1" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="190" y1="108" x2="220" y2="111" stroke="#0369A1" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="188" y1="121" x2="210" y2="123" stroke="#0369A1" strokeWidth="2.5" strokeLinecap="round" />

          {/* Secondary Floating Mini Card (Yellow Note) */}
          <rect
            x="70"
            y="145"
            width="46"
            height="46"
            rx="8"
            fill="#FBBF24"
            stroke="#D97706"
            strokeWidth="2.5"
          />
          <line x1="80" y1="160" x2="104" y2="160" stroke="#92400E" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="80" y1="172" x2="98" y2="172" stroke="#92400E" strokeWidth="2.5" strokeLinecap="round" />

          {/* Green Bubble Accent */}
          <circle cx="210" cy="195" r="18" fill="#10B981" stroke="#047857" strokeWidth="2.5" />

          {/* Left Stylized Outline Hand */}
          <path
            d="M50 170L75 145C78 142 83 142 86 145C89 148 89 153 86 156L75 167M72 135L88 120C91 117 96 117 99 120C102 123 102 128 99 131L80 150M82 118L98 105C101 102 106 102 109 105C112 108 112 113 109 116L85 138M94 110L108 98C111 95 116 95 119 98C122 101 122 106 119 109L95 130"
            stroke="var(--md-sys-color-on-surface)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="35" y="160" width="30" height="20" rx="4" fill="#0EA5E9" />

          {/* Right Stylized Pointing Hand */}
          <path
            d="M210 190L215 155C215 148 222 148 225 155L227 185M227 170C230 165 237 165 240 170L241 190M241 175C244 171 250 171 253 175L254 195M254 182C257 179 262 179 265 183L260 215C255 235 240 245 220 245H200L190 215L210 190Z"
            fill="#B45309"
            stroke="#78350F"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M195 240L180 275H230L220 240" fill="#1E293B" />
        </svg>
      </div>

      {/* Main Title */}
      <h3 className="text-base sm:text-lg font-bold text-[var(--md-sys-color-on-surface)] text-center tracking-tight mb-1.5">
        No conversation selected
      </h3>

      {/* Subtitle */}
      <p className="text-xs sm:text-[13px] text-[var(--md-sys-color-on-surface-variant)] text-center max-w-sm leading-relaxed">
        Use the toggle to switch between single and split pane modes
      </p>
    </div>
  )
}
