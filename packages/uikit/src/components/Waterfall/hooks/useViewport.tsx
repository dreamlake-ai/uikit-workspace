import { useState, useMemo, useRef, useCallback, useEffect } from 'react'

import { type LogItemWithMeta } from '../types'
import { formatDuration, TOTAL_DURATION } from '../utils'

interface UseViewportProps {
  visibleLogData: LogItemWithMeta[]
  onTemporalCursorChange?: (time: number) => void
  temporalCursor?: number
}

export function useViewport({
  visibleLogData,
  onTemporalCursorChange,
  temporalCursor,
}: UseViewportProps) {
  const [viewStart, setViewStart] = useState(-TOTAL_DURATION * 0.25)
  const [viewDuration, setViewDuration] = useState(TOTAL_DURATION * 1.5)
  const [isDragging, setIsDragging] = useState(false)
  const [internalTemporalCursor, setInternalTemporalCursor] = useState<number | null>(null)

  const timelineContainerRef = useRef<HTMLDivElement>(null)
  const lastClientX = useRef(0)
  const isMouseOver = useRef(false)
  const animationFrameRef = useRef<number | null>(null)

  // Cursor state
  const [cursorVisible, setCursorVisible] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [cursorLabel, setCursorLabel] = useState('')
  const [showMagnet, setShowMagnet] = useState(false)

  const activeTemporalCursor = temporalCursor ?? internalTemporalCursor

  const timeToPercent = useCallback(
    (time: number) => ((time - viewStart) / viewDuration) * 100,
    [viewStart, viewDuration],
  )

  const ticks = useMemo(() => {
    const markers: { time: number; label: string }[] = []
    const niceIntervals = [
      0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100,
    ]
    const targetMarkerCount = 10
    const rawInterval = viewDuration / targetMarkerCount
    const interval =
      niceIntervals.find((i) => i > rawInterval) || niceIntervals[niceIntervals.length - 1]

    const viewEnd = viewStart + viewDuration
    const shownSeconds = new Set<number>()

    const formatTickLabel = (seconds: number) => {
      const sign = seconds < 0 ? '-' : ''
      const absSeconds = Math.abs(seconds)

      let s = Math.floor(absSeconds)
      let ms = Math.round((absSeconds - s) * 1000)

      if (ms >= 1000) {
        s += 1
        ms -= 1000
      }

      if (absSeconds < 1 && absSeconds > -1) {
        return `${sign}${ms}ms`
      }

      const baseSecond = s * (sign === '-' ? -1 : 1)
      if (shownSeconds.has(baseSecond)) {
        return ms > 0 ? `+${ms}ms` : ''
      }

      shownSeconds.add(baseSecond)
      if (ms === 0) {
        return `${sign}${s}s`
      }

      return `${sign}${s}s`
    }

    const firstMarkerTime = Math.floor(viewStart / interval) * interval
    const lastMarkerTime = Math.ceil(viewEnd / interval) * interval

    for (let time = firstMarkerTime; time <= lastMarkerTime; time += interval) {
      const roundedTime = Number.parseFloat(time.toPrecision(15))
      const label = formatTickLabel(roundedTime)
      if (label) {
        markers.push({ time: roundedTime, label })
      }
    }
    return markers
  }, [viewStart, viewDuration])

  const eventDots = useMemo(() => {
    const events: { time: number; type: string }[] = []
    const timeSet = new Set<string>()

    const addEvent = (time: number, type: string) => {
      const key = `${time.toFixed(6)}-${type}`
      if (!timeSet.has(key)) {
        events.push({ time, type })
        timeSet.add(key)
      }
    }

    visibleLogData.forEach((item) => {
      if (item.createTime !== undefined) addEvent(item.createTime, 'create')
      if (item.startTime !== undefined) addEvent(item.startTime, 'start')
      if (item.startTime !== undefined && item.duration !== undefined) {
        addEvent(item.startTime + item.duration, 'end')
      }
      if (item.time !== undefined) addEvent(item.time, 'event')
    })
    return events.sort((a, b) => a.time - b.time)
  }, [visibleLogData])

  const updateCursor = useCallback(() => {
    if (!isMouseOver.current) return

    const timelineEl = timelineContainerRef.current
    if (!timelineEl) return

    const rect = timelineEl.getBoundingClientRect()
    const cursorX = lastClientX.current - rect.left
    const rawHoverTime = viewStart + (cursorX / timelineEl.offsetWidth) * viewDuration

    // Snapping logic
    const snapThresholdInPixels = 8
    const snapThresholdInTime = (snapThresholdInPixels / timelineEl.offsetWidth) * viewDuration

    let closestSnap: { time: number; type: string } | null = null
    let minDistance = Number.POSITIVE_INFINITY

    for (const event of eventDots) {
      const distance = Math.abs(event.time - rawHoverTime)
      if (distance < minDistance && distance < snapThresholdInTime) {
        minDistance = distance
        closestSnap = event
      }
    }

    const displayTime = closestSnap?.time ?? rawHoverTime
    const percent = timeToPercent(displayTime)

    setCursorPosition(percent)
    setCursorLabel(formatDuration(displayTime))
    setShowMagnet(!!closestSnap)
    setCursorVisible(true)
  }, [viewStart, viewDuration, eventDots, timeToPercent])

  const handlePan = (direction: 'left' | 'right') => {
    const panAmount = viewDuration * 0.1
    if (direction === 'left') {
      setViewStart((s) => s - panAmount)
    } else {
      setViewStart((s) => s + panAmount)
    }
  }

  const handleZoomDragStart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const startX = e.clientX
    const startDuration = viewDuration
    const centerTime = viewStart + viewDuration / 2
    let isDraggingLocal = true

    setIsDragging(true)

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingLocal) return

      const deltaX = e.clientX - startX
      const sensitivity = 0.05
      const zoomFactor = Math.pow(1.1, deltaX * sensitivity)
      const newDuration = startDuration * zoomFactor

      const minDuration = 0.01
      const maxDuration = TOTAL_DURATION * 10

      if (newDuration >= minDuration && newDuration <= maxDuration) {
        const newViewStart = centerTime - newDuration / 2
        setViewDuration(newDuration)
        setViewStart(newViewStart)
      }
    }

    const handleMouseUp = () => {
      isDraggingLocal = false
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleTimelineClick = (e: React.MouseEvent) => {
    const container = timelineContainerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickedTime = viewStart + (clickX / container.offsetWidth) * viewDuration

    // Snap to nearest key event if close enough
    const snapThresholdInPixels = 8
    const snapThresholdInTime = (snapThresholdInPixels / container.offsetWidth) * viewDuration

    let closestSnap: { time: number; type: string } | null = null
    let minDistance = Number.POSITIVE_INFINITY

    for (const event of eventDots) {
      const distance = Math.abs(event.time - clickedTime)
      if (distance < minDistance && distance < snapThresholdInTime) {
        minDistance = distance
        closestSnap = event
      }
    }

    const finalTime = closestSnap?.time ?? clickedTime

    if (onTemporalCursorChange) {
      onTemporalCursorChange(finalTime)
    } else {
      setInternalTemporalCursor(finalTime)
    }
  }

  useEffect(() => {
    const timelineEl = timelineContainerRef.current
    if (!timelineEl) return

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) return

      lastClientX.current = e.clientX
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = requestAnimationFrame(updateCursor)
    }

    const handleMouseEnter = () => {
      isMouseOver.current = true
    }

    const handleMouseLeave = () => {
      isMouseOver.current = false
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      setCursorVisible(false)
    }

    timelineEl.addEventListener('mousemove', handleMouseMove)
    timelineEl.addEventListener('mouseenter', handleMouseEnter)
    timelineEl.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      timelineEl.removeEventListener('mousemove', handleMouseMove)
      timelineEl.removeEventListener('mouseenter', handleMouseEnter)
      timelineEl.removeEventListener('mouseleave', handleMouseLeave)
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [updateCursor, isDragging])

  useEffect(() => {
    if (isMouseOver.current) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = requestAnimationFrame(updateCursor)
    }
  }, [viewStart, viewDuration, updateCursor])

  return {
    viewStart,
    viewDuration,
    timelineContainerRef,
    activeTemporalCursor,
    timeToPercent,
    ticks,
    eventDots,
    handlePan,
    handleZoomDragStart,
    handleTimelineClick,
    setViewStart,
    setViewDuration,
    // Cursor state
    cursorVisible,
    cursorPosition,
    cursorLabel,
    showMagnet,
  }
}
