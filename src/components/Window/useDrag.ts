// src/components/Window/useDrag.ts
'use client'

import { useCallback, useRef } from 'react'
import type { WindowRect } from '@/types'

interface UseDragOptions {
  onMove: (x: number, y: number) => void
}

export function useDrag({ onMove }: UseDragOptions) {
  const dragging = useRef(false)
  const start = useRef({ px: 0, py: 0, wx: 0, wy: 0 })

  const onPointerDown = useCallback((e: React.PointerEvent, currentRect: WindowRect) => {
    if ((e.target as HTMLElement).closest('[data-no-drag]')) return
    dragging.current = true
    start.current = { px: e.clientX, py: e.clientY, wx: currentRect.x, wy: currentRect.y }
    e.currentTarget.setPointerCapture(e.pointerId)
    e.preventDefault()
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    const dx = e.clientX - start.current.px
    const dy = e.clientY - start.current.py
    const vw = window.innerWidth
    const isTablet = vw >= 640 && vw < 1024

    let newX = start.current.wx + dx
    let newY = Math.max(0, start.current.wy + dy)

    if (isTablet) {
      // Keep title bar within viewport on tablet
      newX = Math.max(0, Math.min(newX, vw - 100))
    } else {
      // Desktop: allow ~100px off each side
      newX = Math.max(-100, Math.min(newX, vw - 100))
    }

    onMove(newX, newY)
  }, [onMove])

  const onPointerUp = useCallback(() => {
    dragging.current = false
  }, [])

  return { onPointerDown, onPointerMove, onPointerUp }
}
