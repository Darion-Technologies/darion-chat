/**
 * In-Browser Multi-Stream Composite Meeting Recorder
 * Combines active video tiles, screen shares, and audio tracks onto an offscreen Canvas + MediaRecorder
 */

import { createClient } from '@/lib/supabase/client'

export interface ParticipantStreamInfo {
  id: string
  name: string
  stream?: MediaStream
  isScreenShare?: boolean
  videoElement?: HTMLVideoElement | null
}

export class MeetRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private recordedChunks: Blob[] = []
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private animationFrameId: number | null = null
  private audioContext: AudioContext | null = null
  private audioDestination: MediaStreamAudioDestinationNode | null = null
  private audioSources: Map<string, MediaStreamAudioSourceNode> = new Map()
  private videoPool: Map<string, HTMLVideoElement> = new Map()
  private isRecording = false
  private startTime = 0
  private timerInterval: NodeJS.Timeout | null = null
  private onTimeUpdate?: (seconds: number) => void

  constructor(onTimeUpdate?: (seconds: number) => void) {
    this.onTimeUpdate = onTimeUpdate
  }

  /**
   * Helper: Get or create a headless HTMLVideoElement for a MediaStream
   */
  private getOrCreateVideoElement(id: string, stream?: MediaStream): HTMLVideoElement | null {
    if (!stream || stream.getVideoTracks().length === 0) {
      return null
    }

    let video = this.videoPool.get(id)
    if (!video) {
      video = document.createElement('video')
      video.autoplay = true
      video.muted = true
      video.playsInline = true
      video.style.position = 'fixed'
      video.style.left = '-9999px'
      video.style.width = '640px'
      video.style.height = '360px'
      video.style.pointerEvents = 'none'
      video.style.opacity = '0'
      document.body.appendChild(video)
      this.videoPool.set(id, video)
    }

    if (video.srcObject !== stream) {
      video.srcObject = stream
      video.play().catch((e) => console.warn('Recorder video play error:', e))
    }

    return video
  }

  /**
   * Starts recording the given participant streams & local streams
   */
  public start(
    getStreams: () => ParticipantStreamInfo[],
    meetingTitle = 'Meeting'
  ): boolean {
    try {
      this.recordedChunks = []
      this.canvas = document.createElement('canvas')
      this.canvas.width = 1280
      this.canvas.height = 720
      this.ctx = this.canvas.getContext('2d')
      if (!this.ctx) return false

      // Setup audio mixing
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.audioContext = new AudioContextClass()
      this.audioDestination = this.audioContext.createMediaStreamDestination()

      // Canvas render loop
      const drawFrame = () => {
        if (!this.isRecording || !this.ctx || !this.canvas) return

        const streams = getStreams()
        const width = this.canvas.width
        const height = this.canvas.height

        // Dark Studio background
        this.ctx.fillStyle = '#090d16'
        this.ctx.fillRect(0, 0, width, height)

        // Check if any participant (local or remote) is screen sharing
        const screenShareParticipant = streams.find((s) => s.isScreenShare && s.stream)
        const screenVideoEl = screenShareParticipant
          ? this.getOrCreateVideoElement(screenShareParticipant.id, screenShareParticipant.stream) || screenShareParticipant.videoElement
          : null

        if (screenShareParticipant && screenVideoEl && screenVideoEl.readyState >= 2) {
          // 1. Screen Share in Spotlight (Full Canvas)
          this.ctx.drawImage(screenVideoEl, 0, 0, width, height)

          // 2. Camera Feeds as Picture-in-Picture Badges at Top Right
          const cameraStreams = streams.filter((s) => !s.isScreenShare)
          let pipIndex = 0

          cameraStreams.forEach((s) => {
            const videoEl = this.getOrCreateVideoElement(s.id, s.stream) || s.videoElement
            const pipW = 220
            const pipH = 124
            const pipX = width - pipW - 20
            const pipY = 20 + pipIndex * (pipH + 12)

            // PiP Background & Glass Border
            this.ctx!.fillStyle = '#1e293b'
            this.ctx!.beginPath()
            this.ctx!.roundRect(pipX, pipY, pipW, pipH, 10)
            this.ctx!.fill()

            if (videoEl && videoEl.readyState >= 2 && !videoEl.paused) {
              this.ctx!.save()
              this.ctx!.beginPath()
              this.ctx!.roundRect(pipX, pipY, pipW, pipH, 10)
              this.ctx!.clip()
              this.ctx!.drawImage(videoEl, pipX, pipY, pipW, pipH)
              this.ctx!.restore()
            } else {
              // Avatar Fallback for Camera PiP
              this.ctx!.fillStyle = '#3b82f6'
              this.ctx!.beginPath()
              this.ctx!.arc(pipX + pipW / 2, pipY + pipH / 2 - 8, 24, 0, Math.PI * 2)
              this.ctx!.fill()

              this.ctx!.fillStyle = '#ffffff'
              this.ctx!.font = 'bold 16px Inter, sans-serif'
              this.ctx!.textAlign = 'center'
              this.ctx!.fillText((s.name[0] || 'U').toUpperCase(), pipX + pipW / 2, pipY + pipH / 2 - 2)
            }

            // PiP Border
            this.ctx!.strokeStyle = 'rgba(59, 130, 246, 0.7)'
            this.ctx!.lineWidth = 2
            this.ctx!.beginPath()
            this.ctx!.roundRect(pipX, pipY, pipW, pipH, 10)
            this.ctx!.stroke()

            // Name Pill inside PiP
            this.ctx!.fillStyle = 'rgba(15, 23, 42, 0.8)'
            this.ctx!.beginPath()
            this.ctx!.roundRect(pipX + 8, pipY + pipH - 24, pipW - 16, 18, 4)
            this.ctx!.fill()

            this.ctx!.fillStyle = '#f8fafc'
            this.ctx!.font = 'bold 10px Inter, sans-serif'
            this.ctx!.textAlign = 'left'
            this.ctx!.fillText(s.name, pipX + 14, pipY + pipH - 11)

            pipIndex++
          })
        } else {
          // 3. Regular Grid Layout (No Screen Share)
          const count = Math.max(1, streams.length)
          let cols = 1
          let rows = 1
          if (count === 2) { cols = 2; rows = 1 }
          else if (count <= 4) { cols = 2; rows = 2 }
          else if (count <= 6) { cols = 3; rows = 2 }
          else { cols = 3; rows = 3 }

          const cellW = width / cols
          const cellH = height / rows

          streams.forEach((s, idx) => {
            if (idx >= cols * rows) return
            const c = idx % cols
            const r = Math.floor(idx / cols)
            const x = c * cellW + 8
            const y = r * cellH + 8
            const w = cellW - 16
            const h = cellH - 16

            // Tile Background
            this.ctx!.fillStyle = '#131b2e'
            this.ctx!.beginPath()
            this.ctx!.roundRect(x, y, w, h, 14)
            this.ctx!.fill()

            const videoEl = this.getOrCreateVideoElement(s.id, s.stream) || s.videoElement

            if (videoEl && videoEl.readyState >= 2 && !videoEl.paused) {
              this.ctx!.save()
              this.ctx!.beginPath()
              this.ctx!.roundRect(x, y, w, h, 14)
              this.ctx!.clip()
              this.ctx!.drawImage(videoEl, x, y, w, h)
              this.ctx!.restore()
            } else {
              // Avatar Placeholder
              this.ctx!.fillStyle = '#2563eb'
              this.ctx!.beginPath()
              this.ctx!.arc(x + w / 2, y + h / 2 - 12, 40, 0, Math.PI * 2)
              this.ctx!.fill()

              this.ctx!.fillStyle = '#ffffff'
              this.ctx!.font = 'bold 28px Inter, sans-serif'
              this.ctx!.textAlign = 'center'
              this.ctx!.fillText((s.name[0] || 'U').toUpperCase(), x + w / 2, y + h / 2 - 2)
            }

            // Tile Border
            this.ctx!.strokeStyle = 'rgba(255, 255, 255, 0.08)'
            this.ctx!.lineWidth = 1.5
            this.ctx!.beginPath()
            this.ctx!.roundRect(x, y, w, h, 14)
            this.ctx!.stroke()

            // Name Badge
            this.ctx!.fillStyle = 'rgba(15, 23, 42, 0.85)'
            this.ctx!.beginPath()
            this.ctx!.roundRect(x + 14, y + h - 38, Math.min(220, w - 28), 24, 6)
            this.ctx!.fill()

            this.ctx!.fillStyle = '#ffffff'
            this.ctx!.font = 'bold 12px Inter, sans-serif'
            this.ctx!.textAlign = 'left'
            this.ctx!.fillText(s.name, x + 24, y + h - 22)
          })
        }

        // Top Left Watermark / Recording Badge
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.85)'
        this.ctx.beginPath()
        this.ctx.roundRect(20, 20, 240, 36, 10)
        this.ctx.fill()
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
        this.ctx.lineWidth = 1
        this.ctx.stroke()

        // Red pulse dot
        this.ctx.fillStyle = '#ef4444'
        this.ctx.beginPath()
        this.ctx.arc(38, 38, 5, 0, Math.PI * 2)
        this.ctx.fill()

        this.ctx.fillStyle = '#ffffff'
        this.ctx.font = 'bold 12px Inter, sans-serif'
        this.ctx.textAlign = 'left'
        this.ctx.fillText(`${meetingTitle} • REC`, 52, 42)

        this.animationFrameId = requestAnimationFrame(drawFrame)
      }

      // Continuously connect new audio tracks to audioDestination
      const mixAudioTracks = () => {
        if (!this.audioContext || !this.audioDestination) return
        const streams = getStreams()
        streams.forEach((s) => {
          if (s.stream && s.stream.getAudioTracks().length > 0 && !this.audioSources.has(s.id)) {
            try {
              const source = this.audioContext!.createMediaStreamSource(s.stream)
              source.connect(this.audioDestination!)
              this.audioSources.set(s.id, source)
            } catch (e) {
              console.warn('Audio stream mix failed for participant', s.name, e)
            }
          }
        })
      }

      mixAudioTracks()

      // Capture 30 FPS Canvas Stream
      const canvasStream = this.canvas.captureStream(30)
      const combinedTracks = [...canvasStream.getVideoTracks()]

      if (this.audioDestination && this.audioDestination.stream.getAudioTracks().length > 0) {
        combinedTracks.push(this.audioDestination.stream.getAudioTracks()[0])
      }

      const combinedStream = new MediaStream(combinedTracks)

      // MediaRecorder initialization with broad codec support
      let mimeType = 'video/webm;codecs=vp9,opus'
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus'
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm'
      }

      this.mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 3000000, // 3.0 Mbps crystal clear
      })

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data)
        }
      }

      this.mediaRecorder.start(1000)
      this.isRecording = true
      this.startTime = Date.now()

      // Start render loop
      drawFrame()

      // Update timer & dynamic audio mixing
      this.timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000)
        this.onTimeUpdate?.(elapsed)
        mixAudioTracks()
      }, 1000)

      return true
    } catch (err) {
      console.error('Failed to start recording:', err)
      return false
    }
  }

  /**
   * Stops recording and cleans up all offscreen video pipelines & audio context
   */
  public async stop(): Promise<{ blob: Blob; durationSeconds: number; sizeBytes: number } | null> {
    if (!this.isRecording || !this.mediaRecorder) return null

    this.isRecording = false
    if (this.timerInterval) clearInterval(this.timerInterval)
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId)

    const durationSeconds = Math.max(1, Math.floor((Date.now() - this.startTime) / 1000))

    return new Promise((resolve) => {
      this.mediaRecorder!.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' })
        const sizeBytes = blob.size

        // Clean audio sources
        this.audioSources.forEach((source) => source.disconnect())
        this.audioSources.clear()

        if (this.audioContext && this.audioContext.state !== 'closed') {
          this.audioContext.close()
        }

        // Clean headless video elements
        this.videoPool.forEach((video) => {
          video.srcObject = null
          if (video.parentNode) {
            video.parentNode.removeChild(video)
          }
        })
        this.videoPool.clear()

        resolve({ blob, durationSeconds, sizeBytes })
      }

      this.mediaRecorder!.stop()
    })
  }

  /**
   * Helper: Trigger browser download for recorded file
   */
  public static downloadLocally(blob: Blob, filename = 'meeting-recording.webm') {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 100)
  }

  /**
   * Helper: Upload recorded video directly to Supabase Storage bucket
   */
  public static async uploadToStorage(
    blob: Blob,
    roomId: string,
    meetingTitle = 'Meeting'
  ): Promise<string | null> {
    try {
      const supabase = createClient()
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const fileName = `${roomId}/${timestamp}_recording.webm`

      const { data, error } = await supabase.storage
        .from('meet-recordings')
        .upload(fileName, blob, {
          contentType: 'video/webm',
          upsert: true,
        })

      if (error) {
        console.error('Recording upload error:', error)
        return null
      }

      const { data: publicUrlData } = supabase.storage
        .from('meet-recordings')
        .getPublicUrl(data.path)

      return publicUrlData.publicUrl
    } catch (err) {
      console.error('Failed to upload recording:', err)
      return null
    }
  }
}
