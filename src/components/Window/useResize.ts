// src/components/Window/useResize.ts
'use client'

import { useCallback, useRef } from 'react'
import type { WindowRect } from '@/types'

const MIN_W = 280
const MIN_H = 180

interface UseResizeOptions {
  onResize: (width: number, height: number) => void
}

export function useResize({ onResize }: UseResizeOptions) {
  const resizing = useRef(false)
  const start = useRef({ px: 0, py: 0, w: 0, h: 0 })

  const onPointerDown = useCallback((e: React.PointerEvent, currentRect: WindowRect) => {
    resizing.current = true
    start.current = { px: e.clientX, py: e.clientY, w: currentRect.width, h: currentRect.height }
    e.currentTarget.setPointerCapture(e.pointerId)
    e.stopPropagation()
    e.preventDefault()
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!resizing.current) return
    const newW = Math.max(MIN_W, start.current.w + (e.clientX - start.current.px))
    const newH = Math.max(MIN_H, start.current.h + (e.clientY - start.current.py))
    onResize(newW, newH)
  }, [onResize])

  const onPointerUp = useCallback(() => {
    resizing.current = false
  }, [])

  return { onPointerDown, onPointerMove, onPointerUp }
}
