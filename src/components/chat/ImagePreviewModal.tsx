'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  ExternalLink,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react'

export interface ImagePreviewModalProps {
  isOpen: boolean
  imageUrl: string
  imageAlt?: string
  fileName?: string
  fileSize?: number
  onClose: () => void
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  imageUrl,
  imageAlt = 'Image preview',
  fileName,
  fileSize,
  onClose,
}) => {
  const [zoom, setZoom] = useState<number>(1)
  const [rotation, setRotation] = useState<number>(0)
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [copied, setCopied] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [hasError, setHasError] = useState<boolean>(false)
  const [pullDownY, setPullDownY] = useState<number>(0)

  const imageContainerRef = useRef<HTMLDivElement>(null)
  const touchStartRef = useRef<{ x: number; y: number; dist?: number; time: number } | null>(null)
  const lastTapRef = useRef<number>(0)

  // Reset state on open or image change
  useEffect(() => {
    if (isOpen) {
      setZoom(1)
      setRotation(0)
      setPosition({ x: 0, y: 0 })
      setIsLoading(true)
      setHasError(false)
      setPullDownY(0)
    }
  }, [isOpen, imageUrl])

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.35, 4))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => {
      const next = Math.max(prev - 0.35, 0.5)
      if (next <= 1) setPosition({ x: 0, y: 0 })
      return next
    })
  }, [])

  const handleResetZoom = useCallback(() => {
    setZoom(1)
    setRotation(0)
    setPosition({ x: 0, y: 0 })
  }, [])

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360)
  }, [])

  // Copy Image Link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(imageUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  // Direct Download Trigger
  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = fileName || `image-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
    } catch {
      // Direct anchor download fallback
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = fileName || 'download'
      link.target = '_blank'
      link.rel = 'noreferrer'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  // Keyboard Navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn()
      } else if (e.key === '-') {
        handleZoomOut()
      } else if (e.key === '0') {
        handleResetZoom()
      } else if (e.key === 'r' || e.key === 'R') {
        handleRotate()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, handleZoomIn, handleZoomOut, handleResetZoom, handleRotate])

  // Mouse Drag to Pan when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      handleZoomIn()
    } else {
      handleZoomOut()
    }
  }

  // Touch Gesture Handling: Pinch-to-Zoom, Pan & Pull-to-Dismiss
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch to zoom start
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY)
      touchStartRef.current = { x: 0, y: 0, dist, time: Date.now() }
    } else if (e.touches.length === 1) {
      const touch = e.touches[0]
      touchStartRef.current = { x: touch.clientX - position.x, y: touch.clientY - position.y, time: Date.now() }

      // Double tap to zoom toggle
      const now = Date.now()
      if (now - lastTapRef.current < 300) {
        if (zoom > 1) {
          handleResetZoom()
        } else {
          setZoom(2)
        }
        lastTapRef.current = 0
      } else {
        lastTapRef.current = now
      }
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartRef.current?.dist) {
      // Pinching
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const currentDist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY)
      const scaleDelta = currentDist / touchStartRef.current.dist
      setZoom((prev) => Math.min(Math.max(prev * scaleDelta, 0.75), 4))
      touchStartRef.current.dist = currentDist
    } else if (e.touches.length === 1 && touchStartRef.current) {
      const touch = e.touches[0]
      if (zoom > 1) {
        // Pan
        setPosition({
          x: touch.clientX - touchStartRef.current.x,
          y: touch.clientY - touchStartRef.current.y,
        })
      } else {
        // Pull to dismiss when not zoomed
        const deltaY = touch.clientY - (touchStartRef.current.y + position.y)
        if (deltaY > 0) {
          setPullDownY(deltaY * 0.7)
        }
      }
    }
  }

  const handleTouchEnd = () => {
    if (pullDownY > 100) {
      onClose()
    }
    setPullDownY(0)
    touchStartRef.current = null
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[99999] flex flex-col bg-black/92 backdrop-blur-xl animate-in fade-in duration-200 select-none overflow-hidden"
      style={{
        opacity: pullDownY > 0 ? Math.max(0.2, 1 - pullDownY / 400) : 1,
      }}
    >
      {/* Top Action Bar */}
      <header className="flex items-center justify-between px-3 sm:px-6 py-3 border-b border-white/10 bg-black/40 backdrop-blur-md shrink-0 z-10">
        {/* Left: Metadata info */}
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-semibold text-white truncate max-w-[160px] sm:max-w-xs md:max-w-md">
              {fileName || 'Image Attachment'}
            </h4>
            <div className="flex items-center gap-2 text-[10px] text-white/60">
              {fileSize && <span>{formatFileSize(fileSize)}</span>}
              {fileSize && <span>•</span>}
              <span>{Math.round(zoom * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Center & Right Toolbar Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Zoom Out */}
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 active:scale-95 disabled:opacity-30 transition-all cursor-pointer"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Zoom Level Reset Button */}
          <button
            type="button"
            onClick={handleResetZoom}
            className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer hidden sm:block"
            title="Reset Zoom (0)"
          >
            {zoom === 1 ? '100%' : 'Fit'}
          </button>

          {/* Zoom In */}
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= 4}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 active:scale-95 disabled:opacity-30 transition-all cursor-pointer"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Rotate 90deg */}
          <button
            type="button"
            onClick={handleRotate}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            title="Rotate 90° (R)"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-white/15 mx-0.5" />

          {/* Copy Image Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            title="Copy image link"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Open in New Tab */}
          <a
            href={imageUrl}
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            title="Open original in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Direct Download */}
          <button
            type="button"
            onClick={handleDownload}
            className="p-2 rounded-xl bg-white/15 text-white hover:bg-white/25 active:scale-95 transition-all cursor-pointer"
            title="Download image"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Close Modal */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-red-500/80 text-white active:scale-95 transition-all cursor-pointer ml-1"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Image Viewport Area */}
      <div
        ref={imageContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`flex-1 flex items-center justify-center p-2 sm:p-6 overflow-hidden relative ${
          zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
        }`}
      >
        {/* Loading Spinner */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/80 z-0">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span className="text-xs font-medium">Loading high-res preview...</span>
          </div>
        )}

        {/* Error State */}
        {hasError ? (
          <div className="flex flex-col items-center justify-center gap-3 text-center p-6 text-white/70 max-w-sm">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white/80">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-white">Unable to preview image</p>
            <p className="text-xs text-white/60">
              The image URL could not be loaded or the format is unsupported.
            </p>
            <button
              onClick={handleDownload}
              className="mt-2 px-4 py-2 rounded-xl bg-white text-black font-bold text-xs hover:opacity-90 active:scale-95 transition-all"
            >
              Download Image File
            </button>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={imageAlt}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false)
              setHasError(true)
            }}
            draggable={false}
            style={{
              transform: `translate(${position.x}px, ${position.y + pullDownY}px) scale(${zoom}) rotate(${rotation}deg)`,
              transition: isDragging || pullDownY > 0 ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
              maxHeight: 'calc(100vh - 120px)',
              maxWidth: 'calc(100vw - 32px)',
            }}
            className="object-contain rounded-lg shadow-2xl transition-opacity duration-200 pointer-events-auto select-none"
          />
        )}
      </div>

      {/* Bottom Floating Hint Bar */}
      <footer className="px-4 py-2.5 bg-black/40 border-t border-white/5 text-center text-[11px] text-white/50 shrink-0 hidden sm:flex items-center justify-center gap-6">
        <span>🖱️ Scroll wheel to zoom</span>
        <span>✋ Drag to pan when zoomed</span>
        <span>⌨️ Esc to close • R to rotate</span>
      </footer>
    </div>
  )
}
