'use client'

import { useState, useRef, useCallback } from 'react'
import { richHaptics } from '../utils/richHaptics'

interface UseSwipeGestureProps {
  onSwipeTrigger?: () => void
  threshold?: number
  maxDistance?: number
}

export function useSwipeGesture({
  onSwipeTrigger,
  threshold = 55,
  maxDistance = 85,
}: UseSwipeGestureProps = {}) {
  const [offset, setOffset] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const startXRef = useRef<number | null>(null)
  const startYRef = useRef<number | null>(null)
  const hasTriggeredHapticRef = useRef(false)
  const isHorizontalGestureRef = useRef<boolean | null>(null)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return
    const touch = e.touches[0]
    startXRef.current = touch.clientX
    startYRef.current = touch.clientY
    hasTriggeredHapticRef.current = false
    isHorizontalGestureRef.current = null
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (startXRef.current === null || startYRef.current === null) return
    const touch = e.touches[0]
    const deltaX = touch.clientX - startXRef.current
    const deltaY = touch.clientY - startYRef.current

    // Determine direction on first 10px of movement
    if (isHorizontalGestureRef.current === null) {
      if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          isHorizontalGestureRef.current = true
        } else {
          isHorizontalGestureRef.current = false
        }
      }
    }

    if (isHorizontalGestureRef.current === false) {
      return
    }

    // Only allow swipe to the right (positive deltaX) for reply gesture
    if (deltaX > 0) {
      setIsSwiping(true)
      // Elastic resistance
      const resistedDistance = Math.min(deltaX * 0.55, maxDistance)
      setOffset(resistedDistance)

      if (resistedDistance >= threshold && !hasTriggeredHapticRef.current) {
        hasTriggeredHapticRef.current = true
        richHaptics.impact('light')
      } else if (resistedDistance < threshold && hasTriggeredHapticRef.current) {
        hasTriggeredHapticRef.current = false
      }
    }
  }, [maxDistance, threshold])

  const onTouchEnd = useCallback(() => {
    if (offset >= threshold) {
      richHaptics.impact('medium')
      if (onSwipeTrigger) {
        onSwipeTrigger()
      }
    }
    setOffset(0)
    setIsSwiping(false)
    startXRef.current = null
    startYRef.current = null
    hasTriggeredHapticRef.current = false
    isHorizontalGestureRef.current = null
  }, [offset, threshold, onSwipeTrigger])

  return {
    offset,
    isSwiping,
    isTriggerReady: offset >= threshold,
    touchHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel: onTouchEnd,
    },
  }
}
