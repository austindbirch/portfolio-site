// src/components/Window/Window.tsx
'use client'

import { useCallback } from 'react'
import { useWindowManager } from '@/components/WindowManager/useWindowManager'
import { useDrag } from './useDrag'
import { useResize } from './useResize'
import type { WindowId } from '@/types'
import styles from './Window.module.css'

interface WindowProps {
  id: WindowId
  title: string
  children: React.ReactNode
}

export function Window({ id, title, children }: WindowProps) {
  const { windows, closeWindow, focusWindow, toggleMaximize, updateRect } = useWindowManager()
  const win = windows[id]

  const onMove = useCallback((x: number, y: number) => {
    updateRect(id, { ...win.rect, x, y })
  }, [id, win.rect, updateRect])

  const onResize = useCallback((width: number, height: number) => {
    updateRect(id, { ...win.rect, width, height })
  }, [id, win.rect, updateRect])

  const drag = useDrag({ onMove })
  const resize = useResize({ onResize })

  const style = win.isMaximized
    ? { left: 0, top: 0, width: '100vw', height: 'calc(100vh - 80px)', zIndex: win.zIndex }
    : { left: win.rect.x, top: win.rect.y, width: win.rect.width, height: win.rect.height, zIndex: win.zIndex }

  return (
    <div
      className={`${styles.window} ${styles[id] ?? ''} ${win.isOpen ? '' : styles.hidden} ${win.isFocused ? styles.focused : ''}`}
      style={style}
      onPointerDown={() => focusWindow(id)}
      onPointerMove={drag.onPointerMove}
      onPointerUp={drag.onPointerUp}
    >
      {/* Title bar */}
      <div
        className={styles.titlebar}
        onPointerDown={(e) => drag.onPointerDown(e, win.rect)}
      >
        <div className={styles.trafficLights} data-no-drag>
          <button className={`${styles.tl} ${styles.tlClose}`} onClick={() => closeWindow(id)} aria-label="Close" />
          <button className={`${styles.tl} ${styles.tlMin}`}   onClick={() => closeWindow(id)} aria-label="Minimize" />
          <button className={`${styles.tl} ${styles.tlMax}`}   onClick={() => toggleMaximize(id)} aria-label="Maximize" />
        </div>
        <span className={styles.title}>{title}</span>
      </div>

      {/* Content */}
      <div className={styles.body}>{children}</div>

      {/* Resize handle */}
      <div
        className={styles.resizeHandle}
        onPointerDown={(e) => resize.onPointerDown(e, win.rect)}
        onPointerMove={resize.onPointerMove}
        onPointerUp={resize.onPointerUp}
      />
    </div>
  )
}
