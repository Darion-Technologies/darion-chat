import { useState, useRef, useCallback } from 'react'
import { richHaptics } from '@/lib/utils/richHaptics'

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void
  threshold?: number
  maxPull?: number
}

export function usePullToRefresh({
  onRefresh,
  threshold = 65,
  maxPull = 120,
}: UsePullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const touchStartY = useRef<number | null>(null)
  const hasTriggeredHaptic = useRef(false)
  const isPulling = useRef(false)

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (isRefreshing) return
      // Only initiate pull-to-refresh if scroll is at the top
      const target = e.currentTarget as HTMLElement
      if (target.scrollTop <= 0) {
        touchStartY.current = e.touches[0].clientY
        hasTriggeredHaptic.current = false
        isPulling.current = true
      }
    },
    [isRefreshing]
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isPulling.current || touchStartY.current === null || isRefreshing) return

      const currentY = e.touches[0].clientY
      const rawDiff = currentY - touchStartY.current

      if (rawDiff > 0) {
        // Apply elastic cubic resistance
        const damped = Math.min(maxPull, rawDiff * 0.45)
        setPullDistance(damped)

        // Haptic snap tick once crossing threshold
        if (damped >= threshold && !hasTriggeredHaptic.current) {
          richHaptics.swipeSnap()
          hasTriggeredHaptic.current = true
        } else if (damped < threshold && hasTriggeredHaptic.current) {
          hasTriggeredHaptic.current = false
        }
      } else {
        setPullDistance(0)
      }
    },
    [isRefreshing, maxPull, threshold]
  )

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return
    isPulling.current = false
    touchStartY.current = null

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      setPullDistance(threshold)
      try {
        await onRefresh()
        richHaptics.success()
      } catch (err) {
        console.error('Refresh error:', err)
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      setPullDistance(0)
    }
  }, [isRefreshing, onRefresh, pullDistance, threshold])

  return {
    pullDistance,
    isRefreshing,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  }
}
