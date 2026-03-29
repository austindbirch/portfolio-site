// src/components/WindowManager/useWindowManager.ts
'use client'

import { useContext } from 'react'
import { WindowManagerContext } from './WindowManagerContext'

export function useWindowManager() {
  const ctx = useContext(WindowManagerContext)
  if (!ctx) throw new Error('useWindowManager must be used inside WindowManagerProvider')
  return ctx
}
