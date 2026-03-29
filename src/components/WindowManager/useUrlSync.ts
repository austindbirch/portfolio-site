// src/components/WindowManager/useUrlSync.ts
'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useWindowManager } from './useWindowManager'
import type { WindowId } from '@/types'

const PATH_TO_WINDOW: Record<string, WindowId> = {
  '/':         'terminal',
  '/projects': 'projects',
  '/about':    'about',
  '/contact':  'contact',
}

export const WINDOW_TO_PATH: Record<WindowId, string> = {
  terminal: '/',
  projects: '/projects',
  about:    '/about',
  contact:  '/contact',
}

export function useUrlSync() {
  const { windows, openWindow, focusWindow } = useWindowManager()
  const pathname = usePathname()
  const router = useRouter()

  // Inbound: URL → window state on mount / pathname change
  useEffect(() => {
    const windowId = PATH_TO_WINDOW[pathname]
    if (windowId && !windows[windowId]?.isOpen) {
      openWindow(windowId)
      focusWindow(windowId)
    }
    if (pathname.startsWith('/projects/')) {
      if (!windows.projects?.isOpen) {
        openWindow('projects')
        focusWindow('projects')
      }
    }
  // Only run on pathname changes (not on window state changes)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Outbound: focused window → URL push
  useEffect(() => {
    const focusedWindow = Object.values(windows).find(w => w.isFocused && w.isOpen)
    if (!focusedWindow) return
    const targetPath = WINDOW_TO_PATH[focusedWindow.id]
    if (targetPath && targetPath !== pathname) {
      router.push(targetPath)
    }
  }, [windows, pathname, router])

  return { WINDOW_TO_PATH }
}
