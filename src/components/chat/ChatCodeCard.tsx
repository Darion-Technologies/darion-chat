'use client'

import React, { useState } from 'react'
import {
  Code2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  FileCode,
  Sparkles,
} from 'lucide-react'

interface ChatCodeCardProps {
  code: string
  language?: string
  title?: string
  note?: string
}

export const ChatCodeCard: React.FC<ChatCodeCardProps> = ({
  code,
  language = 'typescript',
  title,
  note,
}) => {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const lines = code ? code.split('\n') : []
  const isLong = lines.length > 14
  const displayLines = isLong && !expanded ? lines.slice(0, 12) : lines

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation()
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = title || `snippet.${language || 'txt'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="w-full max-w-2xl my-1.5 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-lg text-slate-100 font-sans text-xs">
      {/* Optional Note Above Snippet */}
      {note && (
        <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800/80 text-slate-300 font-sans text-xs flex items-center gap-2">
          <span className="text-cyan-400">💬</span>
          <span>{note}</span>
        </div>
      )}

      {/* Code Window Header */}
      <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mac window dots */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <FileCode className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-mono font-bold text-xs text-slate-200 truncate">
              {title || 'snippet'}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold uppercase tracking-wider shrink-0">
              {language}
            </span>
          </div>
        </div>

        {/* Action buttons: Copy & Download */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-[11px] font-semibold active:scale-95 cursor-pointer shadow-xs"
            title="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Download snippet file"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Code Editor Body with Line Numbers */}
      <div className="p-3 bg-slate-950 font-mono text-xs overflow-x-auto leading-relaxed">
        <table className="w-full border-collapse">
          <tbody>
            {displayLines.map((line, idx) => (
              <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                <td className="w-8 pr-3 text-right text-slate-600 select-none text-[11px] align-top font-mono">
                  {idx + 1}
                </td>
                <td className="text-slate-100 whitespace-pre font-mono text-xs sm:text-[13px] pl-2 break-all sm:break-normal">
                  {line || ' '}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expand / Collapse Footer for Long Snippets */}
      {isLong && (
        <div className="px-3 py-1.5 bg-slate-900 border-t border-slate-800/80 flex items-center justify-between select-none">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 font-semibold transition-colors cursor-pointer"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Show less</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Expand {lines.length - 12} more lines</span>
              </>
            )}
          </button>

          <span className="text-[10px] text-slate-500 font-mono">
            {lines.length} total lines
          </span>
        </div>
      )}
    </div>
  )
}
