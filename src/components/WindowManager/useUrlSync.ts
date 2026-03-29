// src/components/WindowManager/useUrlSync.ts
'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
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

  // Inbound: URL → window state on mount / direct navigation (back button, deep link)
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

  // Outbound: focused window → URL bar update WITHOUT triggering navigation.
  // router.push() would remount DesktopShell (it lives in the page, not layout),
  // so we use replaceState directly to keep the URL in sync without a route change.
  useEffect(() => {
    const focusedWindow = Object.values(windows).find(w => w.isFocused && w.isOpen)
    if (!focusedWindow) return
    const targetPath = WINDOW_TO_PATH[focusedWindow.id]
    if (targetPath && targetPath !== window.location.pathname) {
      window.history.replaceState(null, '', targetPath)
    }
  }, [windows])

  return { WINDOW_TO_PATH }
}
