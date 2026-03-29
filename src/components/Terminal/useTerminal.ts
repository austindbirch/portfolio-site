// src/components/Terminal/useTerminal.ts
'use client'

import { useCallback, useReducer } from 'react'
import { executeCommand } from './commands'
import type { VFS, TerminalOutputLine, WindowId } from '@/types'

interface TerminalState {
  cwd: string
  output: TerminalOutputLine[]
  history: string[]
  histIdx: number
}

type Action =
  | { type: 'APPEND'; line: TerminalOutputLine }
  | { type: 'CLEAR' }
  | { type: 'SET_CWD'; cwd: string }
  | { type: 'PUSH_HISTORY'; cmd: string }
  | { type: 'SET_HIST_IDX'; idx: number }

function reducer(state: TerminalState, action: Action): TerminalState {
  switch (action.type) {
    case 'APPEND':      return { ...state, output: [...state.output, action.line] }
    case 'CLEAR':       return { ...state, output: [] }
    case 'SET_CWD':     return { ...state, cwd: action.cwd }
    case 'PUSH_HISTORY': return { ...state, history: [action.cmd, ...state.history], histIdx: -1 }
    case 'SET_HIST_IDX': return { ...state, histIdx: action.idx }
    default:            return state
  }
}

let lineId = 0
const nextId = () => String(++lineId)

export function useTerminal(vfs: VFS, onOpenWindow: (id: WindowId) => void) {
  const [state, dispatch] = useReducer(reducer, {
    cwd: '~',
    output: [],
    history: [],
    histIdx: -1,
  })

  const appendLine = useCallback((html: string, isPromptLine = false) => {
    dispatch({ type: 'APPEND', line: { id: nextId(), html, isPromptLine } })
  }, [])

  const buildPromptHtml = useCallback((cwd: string) =>
    `<span class="t-ok" style="font-weight:500">austin</span>` +
    `<span class="t-dim">@</span>` +
    `<span style="color:var(--c6)">portfolio</span> ` +
    `<span style="color:var(--c12)">${cwd}</span> ` +
    `<span style="color:var(--c5);font-weight:700">❯</span>`,
  [])

  const runCommand = useCallback((raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed) return

    dispatch({ type: 'PUSH_HISTORY', cmd: trimmed })

    // Echo prompt + command
    appendLine(`${buildPromptHtml(state.cwd)} <span class="t-text">${trimmed}</span>`, true)

    const parts = trimmed.split(/\s+/)
    const result = executeCommand(parts[0], parts.slice(1), state.cwd, vfs)

    if (result.clear) {
      dispatch({ type: 'CLEAR' })
    } else if (result.output) {
      appendLine(result.output)
    }

    if (result.cwd !== state.cwd) {
      dispatch({ type: 'SET_CWD', cwd: result.cwd })
    }

    if (result.openWindow) {
      onOpenWindow(result.openWindow)
    }
  }, [state.cwd, vfs, appendLine, buildPromptHtml, onOpenWindow])

  const historyUp = useCallback(() => {
    const next = Math.min(state.histIdx + 1, state.history.length - 1)
    dispatch({ type: 'SET_HIST_IDX', idx: next })
    return state.history[next] ?? ''
  }, [state.history, state.histIdx])

  const historyDown = useCallback(() => {
    const next = Math.max(state.histIdx - 1, -1)
    dispatch({ type: 'SET_HIST_IDX', idx: next })
    return next === -1 ? '' : (state.history[next] ?? '')
  }, [state.history, state.histIdx])

  return {
    cwd: state.cwd,
    output: state.output,
    runCommand,
    historyUp,
    historyDown,
    buildPromptHtml,
    appendLine,
  }
}
