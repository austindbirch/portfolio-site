// src/components/WindowManager/WindowManagerContext.tsx
'use client'

import React, { createContext, useCallback, useReducer } from 'react'
import type { WindowId, WindowRect, WindowsState } from '@/types'

const DEFAULT_RECTS: Record<WindowId, WindowRect> = {
  terminal: { x: 220, y: 80,  width: 640, height: 420 },
  projects: { x: 320, y: 60,  width: 500, height: 520 },
  about:    { x: 360, y: 100, width: 460, height: 420 },
  contact:  { x: 400, y: 120, width: 380, height: 280 },
}

function makeInitialState(): WindowsState {
  let z = 100
  return (Object.keys(DEFAULT_RECTS) as WindowId[]).reduce((acc, id) => {
    acc[id] = {
      id,
      isOpen: id === 'terminal',
      isMaximized: false,
      isFocused: id === 'terminal',
      rect: DEFAULT_RECTS[id],
      preMaxRect: null,
      zIndex: id === 'terminal' ? ++z : z,
    }
    return acc
  }, {} as WindowsState)
}

type Action =
  | { type: 'OPEN';     id: WindowId }
  | { type: 'CLOSE';    id: WindowId }
  | { type: 'FOCUS';    id: WindowId }
  | { type: 'MAXIMIZE'; id: WindowId }
  | { type: 'UPDATE_RECT'; id: WindowId; rect: WindowRect }

let zCounter = 101

function reducer(state: WindowsState, action: Action): WindowsState {
  switch (action.type) {
    case 'OPEN': {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
      const base = isMobile
        // Close all other windows on mobile
        ? Object.fromEntries(
            Object.keys(state).map((k) => [k, { ...state[k as WindowId], isOpen: false, isFocused: false }])
          ) as WindowsState
        : Object.fromEntries(
            Object.keys(state).map((k) => [k, { ...state[k as WindowId], isFocused: false }])
          ) as WindowsState
      return {
        ...base,
        [action.id]: {
          ...state[action.id],
          isOpen: true,
          isFocused: true,
          zIndex: ++zCounter,
        },
      }
    }
    case 'CLOSE':
      return { ...state, [action.id]: { ...state[action.id], isOpen: false, isFocused: false } }
    case 'FOCUS':
      return {
        ...state,
        ...Object.fromEntries(Object.keys(state).map((k) => [k, { ...state[k as WindowId], isFocused: false }])),
        [action.id]: { ...state[action.id], zIndex: ++zCounter, isFocused: true },
      }
    case 'MAXIMIZE': {
      const win = state[action.id]
      if (win.isMaximized) {
        return {
          ...state,
          [action.id]: {
            ...win,
            isMaximized: false,
            rect: win.preMaxRect ?? win.rect,
            preMaxRect: null,
          },
        }
      }
      return {
        ...state,
        [action.id]: {
          ...win,
          isMaximized: true,
          preMaxRect: win.rect,
        },
      }
    }
    case 'UPDATE_RECT':
      return { ...state, [action.id]: { ...state[action.id], rect: action.rect } }
    default:
      return state
  }
}

interface WindowManagerContextValue {
  windows: WindowsState
  openWindow:     (id: WindowId) => void
  closeWindow:    (id: WindowId) => void
  focusWindow:    (id: WindowId) => void
  toggleMaximize: (id: WindowId) => void
  updateRect:     (id: WindowId, rect: WindowRect) => void
}

export const WindowManagerContext = createContext<WindowManagerContextValue | null>(null)

export function WindowManagerProvider({ children }: { children: React.ReactNode }) {
  const [windows, dispatch] = useReducer(reducer, undefined, makeInitialState)

  const openWindow     = useCallback((id: WindowId) => dispatch({ type: 'OPEN',     id }), [])
  const closeWindow    = useCallback((id: WindowId) => dispatch({ type: 'CLOSE',    id }), [])
  const focusWindow    = useCallback((id: WindowId) => dispatch({ type: 'FOCUS',    id }), [])
  const toggleMaximize = useCallback((id: WindowId) => dispatch({ type: 'MAXIMIZE', id }), [])
  const updateRect     = useCallback((id: WindowId, rect: WindowRect) => dispatch({ type: 'UPDATE_RECT', id, rect }), [])

  return (
    <WindowManagerContext.Provider value={{ windows, openWindow, closeWindow, focusWindow, toggleMaximize, updateRect }}>
      {children}
    </WindowManagerContext.Provider>
  )
}
