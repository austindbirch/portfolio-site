// src/components/Desktop/Desktop.tsx
'use client'

import styles from './Desktop.module.css'

export function Desktop({ children }: { children: React.ReactNode }) {
  return <div className={styles.desktop}>{children}</div>
}
