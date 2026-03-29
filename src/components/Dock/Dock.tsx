// src/components/Dock/Dock.tsx
'use client'

import React from 'react'
import { useWindowManager } from '@/components/WindowManager/useWindowManager'
import type { WindowId } from '@/types'
import styles from './Dock.module.css'

interface DockItemDef {
  id: WindowId
  label: string
  icon: React.ReactNode
  iconStyle?: React.CSSProperties
}

interface DockProps {
  items: DockItemDef[]
}

export function Dock({ items }: DockProps) {
  const { windows, openWindow, focusWindow } = useWindowManager()

  const handleClick = (id: WindowId) => {
    const win = windows[id]
    if (!win) return
    if (win.isOpen) {
      focusWindow(id)
    } else {
      openWindow(id)
      focusWindow(id)
    }
  }

  return (
    <div className={styles.dock}>
      {items.map((item, i) => (
        <React.Fragment key={item.id}>
          {i === 1 && <div key="sep" className={styles.sep} />}
          <div className={styles.item} onClick={() => handleClick(item.id)}>
            <div className={styles.iconWrap} style={item.iconStyle}>{item.icon}</div>
            {windows[item.id]?.isOpen && <div className={styles.dot} />}
            <span className={styles.tooltip}>{item.label}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  )
}
