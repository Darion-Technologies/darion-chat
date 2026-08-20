'use client'

import React, { useState } from 'react'
import {
  Code2,
  X,
  Sparkles,
  FileCode,
  Check,
  WrapText,
  Send,
  Terminal,
} from 'lucide-react'

export const SUPPORTED_LANGUAGES = [
  { id: 'typescript', name: 'TypeScript', ext: 'ts' },
  { id: 'javascript', name: 'JavaScript', ext: 'js' },
  { id: 'python', name: 'Python', ext: 'py' },
  { id: 'sql', name: 'SQL', ext: 'sql' },
  { id: 'html', name: 'HTML', ext: 'html' },
  { id: 'css', name: 'CSS', ext: 'css' },
  { id: 'json', name: 'JSON', ext: 'json' },
  { id: 'bash', name: 'Bash / Shell', ext: 'sh' },
  { id: 'go', name: 'Go', ext: 'go' },
  { id: 'rust', name: 'Rust', ext: 'rs' },
  { id: 'java', name: 'Java', ext: 'java' },
  { id: 'cpp', name: 'C++', ext: 'cpp' },
  { id: 'csharp', name: 'C#', ext: 'cs' },
  { id: 'php', name: 'PHP', ext: 'php' },
  { id: 'yaml', name: 'YAML', ext: 'yaml' },
  { id: 'markdown', name: 'Markdown', ext: 'md' },
  { id: 'dockerfile', name: 'Dockerfile', ext: 'dockerfile' },
  { id: 'plaintext', name: 'Plain Text', ext: 'txt' },
]

interface CodeSnippetModalProps {
  isOpen: boolean
  onClose: () => void
  onSendCode: (code: string, language: string, title?: string, note?: string) => void
}

export const CodeSnippetModal: React.FC<CodeSnippetModalProps> = ({
  isOpen,
  onClose,
  onSendCode,
}) => {
  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [language, setLanguage] = useState('typescript')
  const [note, setNote] = useState('')
  const [wrapLines, setWrapLines] = useState(true)

  if (!isOpen) return null

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Intercept Tab key to insert 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newCode = code.substring(0, start) + '  ' + code.substring(end)
      setCode(newCode)
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      }, 0)
    } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleSubmit = () => {
    if (!code.trim()) return
    const langObj = SUPPORTED_LANGUAGES.find((l) => l.id === language)
    const finalTitle =
      title.trim() ||
      (langObj ? `snippet.${langObj.ext}` : 'snippet.txt')

    onSendCode(code.trim(), language, finalTitle, note.trim() || undefined)
    setCode('')
    setTitle('')
    setNote('')
    onClose()
  }

  const lineCount = code ? code.split('\n').length : 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[var(--md-sys-color-on-surface)] select-none">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between bg-[var(--md-sys-color-surface-container)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shadow-xs">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                Share Code Snippet
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              </h3>
              <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                Syntax-highlighted code block with line numbers and copy tools
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Options Toolbar: Title & Language */}
        <div className="p-4 bg-[var(--md-sys-color-surface-container-lowest)] border-b border-[var(--md-sys-color-outline-variant)]/60 grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
          {/* File Name / Title Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider block">
              Snippet Title or File Name
            </label>
            <div className="relative">
              <FileCode className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)]" />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. authMiddleware.ts, query.sql"
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] text-xs text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)] focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Language Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider block">
              Language
            </label>
            <div className="relative">
              <Terminal className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)] pointer-events-none" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 rounded-xl bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] text-xs text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-1 focus:ring-cyan-500 appearance-none cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name} (.{lang.ext})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Code Editor Body */}
        <div className="flex-1 flex flex-col min-h-[220px] max-h-[360px] bg-slate-950 text-slate-100 relative font-mono text-xs overflow-hidden">
          {/* Editor Header Status */}
          <div className="px-4 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400 select-none shrink-0">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="capitalize font-bold text-slate-300">{language}</span>
              </span>
              <span>•</span>
              <span>{lineCount} {lineCount === 1 ? 'line' : 'lines'}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setWrapLines(!wrapLines)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-sans font-semibold transition-colors cursor-pointer ${
                  wrapLines
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Toggle word wrap"
              >
                <WrapText className="w-3 h-3" />
                <span>Wrap</span>
              </button>
              <span className="text-[10px] opacity-60">Tab = 2 spaces</span>
            </div>
          </div>

          {/* Textarea with Line Numbers effect */}
          <div className="flex-1 flex overflow-hidden relative">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="// Paste or write your code here..."
              autoFocus
              spellCheck={false}
              className={`flex-1 w-full h-full p-4 bg-transparent border-0 focus:outline-none text-slate-100 placeholder-slate-600 font-mono text-xs sm:text-sm leading-relaxed resize-none overflow-y-auto ${
                wrapLines ? 'whitespace-pre-wrap' : 'whitespace-pre overflow-x-auto'
              }`}
            />
          </div>
        </div>

        {/* Optional Note & Footer Actions */}
        <div className="p-4 bg-[var(--md-sys-color-surface-container)] border-t border-[var(--md-sys-color-outline-variant)] space-y-3 shrink-0">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add an optional comment (e.g. 'Check out this refactored function')..."
            className="w-full px-3.5 py-2 rounded-xl bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] text-xs text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)] focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] font-medium">
              Press <kbd className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">Ctrl+Enter</kbd> to share instantly
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full hover:bg-[var(--md-sys-color-surface-container-high)] text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!code.trim()}
                className="px-5 py-2 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20 active:scale-95 disabled:opacity-40 disabled:hover:bg-cyan-600 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Share Code</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
