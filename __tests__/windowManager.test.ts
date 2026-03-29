// __tests__/windowManager.test.ts
import { renderHook, act } from '@testing-library/react'
import { WindowManagerProvider } from '@/components/WindowManager/WindowManagerContext'
import { useWindowManager } from '@/components/WindowManager/useWindowManager'
import type { WindowId } from '@/types'
import React from 'react'

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(WindowManagerProvider, null, children)

describe('useWindowManager', () => {
  it('terminal is open by default, others closed', () => {
    const { result } = renderHook(() => useWindowManager(), { wrapper })
    expect(result.current.windows.terminal.isOpen).toBe(true)
    expect(result.current.windows.projects.isOpen).toBe(false)
  })

  it('openWindow opens a window', () => {
    const { result } = renderHook(() => useWindowManager(), { wrapper })
    act(() => result.current.openWindow('projects'))
    expect(result.current.windows.projects.isOpen).toBe(true)
  })

  it('closeWindow closes a window', () => {
    const { result } = renderHook(() => useWindowManager(), { wrapper })
    act(() => result.current.closeWindow('terminal'))
    expect(result.current.windows.terminal.isOpen).toBe(false)
  })

  it('focusWindow increments zIndex', () => {
    const { result } = renderHook(() => useWindowManager(), { wrapper })
    const initialZ = result.current.windows.terminal.zIndex
    act(() => result.current.focusWindow('projects'))
    expect(result.current.windows.projects.zIndex).toBeGreaterThan(initialZ)
  })

  it('toggleMaximize sets isMaximized', () => {
    const { result } = renderHook(() => useWindowManager(), { wrapper })
    act(() => result.current.toggleMaximize('terminal'))
    expect(result.current.windows.terminal.isMaximized).toBe(true)
  })

  it('toggleMaximize twice restores', () => {
    const { result } = renderHook(() => useWindowManager(), { wrapper })
    act(() => result.current.toggleMaximize('terminal'))
    act(() => result.current.toggleMaximize('terminal'))
    expect(result.current.windows.terminal.isMaximized).toBe(false)
  })

  it('updateRect updates position and size', () => {
    const { result } = renderHook(() => useWindowManager(), { wrapper })
    act(() => result.current.updateRect('terminal', { x: 100, y: 200, width: 500, height: 400 }))
    expect(result.current.windows.terminal.rect.x).toBe(100)
  })
})
