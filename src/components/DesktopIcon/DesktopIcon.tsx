// src/components/DesktopIcon/DesktopIcon.tsx
'use client'

import React, { useState } from 'react'
import { useWindowManager } from '@/components/WindowManager/useWindowManager'
import type { WindowId } from '@/types'
import styles from './DesktopIcon.module.css'

interface DesktopIconProps {
  id: WindowId
  label: string
  icon: React.ReactNode
  iconStyle?: React.CSSProperties
}

export function DesktopIcon({ id, label, icon, iconStyle }: DesktopIconProps) {
  const { openWindow, focusWindow } = useWindowManager()
  const [selected, setSelected] = useState(false)

  // Desktop: double-click. Mobile/tablet: single tap (pointer: coarse)
  const handleClick = () => setSelected(true)
  const handleDoubleClick = () => { openWindow(id); focusWindow(id) }

  // Single tap on touch opens on pointerup (after confirming not a scroll gesture)
  const pointerDownPos = React.useRef<{ x: number; y: number } | null>(null)

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') {
      pointerDownPos.current = { x: e.clientX, y: e.clientY }
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch' && pointerDownPos.current) {
      const dx = Math.abs(e.clientX - pointerDownPos.current.x)
      const dy = Math.abs(e.clientY - pointerDownPos.current.y)
      if (dx < 8 && dy < 8) {  // movement < 8px = tap, not scroll
        openWindow(id)
        focusWindow(id)
      }
      pointerDownPos.current = null
    }
  }

  return (
    <div
      className={`${styles.icon} ${selected ? styles.selected : ''}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onBlur={() => setSelected(false)}
      tabIndex={0}
      role="button"
      aria-label={`Open ${label}`}
    >
      <div className={styles.visual} style={iconStyle}>{icon}</div>
      <span className={styles.label}>{label}</span>
    </div>
  )
}
