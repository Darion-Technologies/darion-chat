'use client'

import React from 'react'
import { ReactionItem } from '@/lib/meet/useMeetRoom'

export interface FloatingReactionsProps {
  reactions: ReactionItem[]
}

export const FloatingReactions: React.FC<FloatingReactionsProps> = ({ reactions }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {reactions.map((r, idx) => {
        // Pseudo-random horizontal position across the lower bottom-left quadrant
        const leftPercent = 15 + ((idx * 17) % 55)
        return (
          <div
            key={r.id}
            className="absolute bottom-20 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-700 px-3 py-1.5 rounded-full shadow-2xl animate-float-up"
            style={{
              left: `${leftPercent}%`,
              animation: 'floatUp 3.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
            }}
          >
            <span className="text-2xl">{r.emoji}</span>
            <span className="text-xs font-semibold text-slate-200">{r.senderName}</span>
          </div>
        )
      })}

      <style jsx global>{`
        @keyframes floatUp {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.7);
          }
          15% {
            opacity: 1;
            transform: translateY(0px) scale(1.1);
          }
          30% {
            transform: translateY(-40px) scale(1);
          }
          70% {
            opacity: 1;
            transform: translateY(-160px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-260px) scale(0.8);
          }
        }
      `}</style>
    </div>
  )
}
