'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Play, Pause } from 'lucide-react'

export interface VoiceNotePlayerProps {
  audioUrl: string
  fileName?: string
  durationSec?: number
  waveform?: number[]
  isMe?: boolean
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({
  audioUrl,
  fileName = 'Voice Note',
  durationSec: initialDuration,
  waveform: customWaveform,
  isMe = false,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [duration, setDuration] = useState<number>(initialDuration || 0)
  const [playbackRate, setPlaybackRate] = useState<number>(1)
  const [isMuted, setIsMuted] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const instanceId = useMemo(() => Math.random().toString(36).substring(7), [])

  // Generate a deterministic aesthetic waveform bar array if none provided
  const waveformBars = useMemo(() => {
    if (customWaveform && customWaveform.length >= 20) {
      return customWaveform.slice(0, 32)
    }
    // Deterministic pseudo-random heights based on URL string
    const bars: number[] = []
    let seed = 0
    for (let i = 0; i < audioUrl.length; i++) {
      seed = (seed + audioUrl.charCodeAt(i) * (i + 1)) % 1000
    }
    for (let i = 0; i < 28; i++) {
      const val = Math.abs(Math.sin((seed + i * 13) * 0.45))
      bars.push(Math.max(0.2, Math.min(1.0, 0.25 + val * 0.75)))
    }
    return bars
  }, [audioUrl, customWaveform])

  // Global audio listener to pause when another voice note plays
  useEffect(() => {
    const handleGlobalPlay = (e: CustomEvent<{ id: string }>) => {
      if (e.detail?.id !== instanceId && audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause()
        setIsPlaying(false)
      }
    }

    window.addEventListener('custom-voice-play' as any, handleGlobalPlay as any)
    return () => {
      window.removeEventListener('custom-voice-play' as any, handleGlobalPlay as any)
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [instanceId])

  // Playback handlers
  const togglePlay = () => {
    if (!audioRef.current) {
      const audio = new Audio(audioUrl)
      audioRef.current = audio

      audio.addEventListener('loadedmetadata', () => {
        if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
          setDuration(audio.duration)
        }
      })

      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime)
      })

      audio.addEventListener('ended', () => {
        setIsPlaying(false)
        setCurrentTime(0)
      })

      audio.addEventListener('waiting', () => setIsLoading(true))
      audio.addEventListener('playing', () => setIsLoading(false))
      audio.addEventListener('canplay', () => setIsLoading(false))
    }

    const audio = audioRef.current

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      // Notify other voice note players to pause
      window.dispatchEvent(
        new CustomEvent('custom-voice-play', { detail: { id: instanceId } })
      )
      audio.playbackRate = playbackRate
      audio.muted = isMuted
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false))
    }
  }

  // Seek by clicking waveform
  const handleSeek = (index: number) => {
    const totalBars = waveformBars.length
    const ratio = (index + 0.5) / totalBars
    const targetTime = (duration || initialDuration || 0) * ratio

    if (!audioRef.current) {
      togglePlay()
    }
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime
      setCurrentTime(targetTime)
    }
  }

  // Playback rate cycle (1x -> 1.5x -> 2x -> 1x)
  const togglePlaybackRate = (e: React.MouseEvent) => {
    e.stopPropagation()
    const rates = [1, 1.5, 2]
    const nextIndex = (rates.indexOf(playbackRate) + 1) % rates.length
    const nextRate = rates[nextIndex]
    setPlaybackRate(nextRate)
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate
    }
  }

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs) || secs < 0) return '0:00'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const progressRatio = duration > 0 ? currentTime / duration : 0

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`my-1.5 p-2.5 sm:p-3 rounded-2xl border flex flex-col gap-2 shadow-2xs max-w-full min-w-0 sm:min-w-[270px] select-none ${
        isMe
          ? 'bg-black/20 border-white/20 text-white'
          : 'bg-[var(--md-sys-color-surface-container)] border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)]'
      }`}
    >
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Circular Play / Pause Action Button */}
        <button
          type="button"
          onClick={togglePlay}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 shadow-xs transition-all active:scale-95 cursor-pointer ${
            isMe
              ? 'bg-white text-[var(--md-sys-color-primary)] hover:bg-white/90'
              : 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-90'
          }`}
          title={isPlaying ? 'Pause voice note' : 'Play voice note'}
        >
          {isLoading ? (
            <div className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${isMe ? 'border-[var(--md-sys-color-primary)]' : 'border-white'}`} />
          ) : isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        {/* Dynamic Waveform Visualizer */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div
            className="flex items-center gap-[2.5px] sm:gap-[3px] h-7 cursor-pointer py-1"
            title="Click to seek"
          >
            {waveformBars.map((heightFactor, idx) => {
              const barRatio = (idx + 1) / waveformBars.length
              const isPassed = progressRatio >= barRatio

              return (
                <div
                  key={idx}
                  onClick={() => handleSeek(idx)}
                  className="flex-1 rounded-full transition-all duration-75 hover:opacity-100"
                  style={{
                    height: `${Math.max(18, heightFactor * 100)}%`,
                    backgroundColor: isPassed
                      ? isMe
                        ? '#ffffff'
                        : 'var(--md-sys-color-primary)'
                      : isMe
                      ? 'rgba(255, 255, 255, 0.35)'
                      : 'rgba(100, 116, 139, 0.35)',
                    transform: isPlaying && isPassed ? 'scaleY(1.05)' : 'scaleY(1)',
                  }}
                />
              )
            })}
          </div>

          {/* Time & Speed Multiplier */}
          <div className="flex items-center justify-between text-[10px] opacity-85 font-mono">
            <span>
              {isPlaying || currentTime > 0
                ? `${formatTime(currentTime)} / ${formatTime(duration || initialDuration || 0)}`
                : formatTime(duration || initialDuration || 0)}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlaybackRate}
                className={`px-1.5 py-0.5 rounded-md font-bold text-[9px] transition-all active:scale-90 cursor-pointer ${
                  isMe
                    ? 'bg-white/20 hover:bg-white/30 text-white'
                    : 'bg-[var(--md-sys-color-surface-container-highest)] hover:bg-[var(--md-sys-color-surface-container-high)] text-inherit'
                }`}
                title="Change speed"
              >
                {playbackRate}x
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
