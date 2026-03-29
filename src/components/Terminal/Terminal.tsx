// src/components/Terminal/Terminal.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useWindowManager } from '@/components/WindowManager/useWindowManager'
import { useTerminal } from './useTerminal'
import type { VFS, WindowId } from '@/types'
import styles from './Terminal.module.css'

interface TerminalProps {
  vfs: VFS
}

export function Terminal({ vfs }: TerminalProps) {
  const { openWindow, focusWindow } = useWindowManager()
  const inputRef = useRef<HTMLInputElement>(null)
  const outputRef = useRef<HTMLDivElement>(null)
  const [inputValue, setInputValue] = useState('')

  const onOpenWindow = (id: WindowId) => { openWindow(id); focusWindow(id) }
  const term = useTerminal(vfs, onOpenWindow)

  // Boot message
  useEffect(() => {
    const delay = setTimeout(() => {
      term.appendLine(
        `<span style="color:var(--c5);font-weight:700;font-size:15px;letter-spacing:-0.3px">austin's portfolio</span>`
      )
      term.appendLine(
        `<span class="t-dim" style="font-size:12px">type <span style="color:var(--c11)">help</span> for commands · double-click desktop icons to open windows</span>`
      )
      term.appendLine(
        `<span class="t-dim">Last login: ${new Date().toDateString()} on ttys000</span>`
      )
      term.appendLine('')
    }, 100)
    return () => clearTimeout(delay)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Scroll to bottom on new output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [term.output])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      term.runCommand(inputValue)
      setInputValue('')
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setInputValue(term.historyUp())
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setInputValue(term.historyDown())
    }
  }

  return (
    <div className={styles.terminal} onClick={() => inputRef.current?.focus()}>
      <div className={styles.output} ref={outputRef}>
        {term.output.map((line) => (
          <div
            key={line.id}
            className={styles.line}
            dangerouslySetInnerHTML={{ __html: line.html }}
          />
        ))}
      </div>
      <div className={styles.inputRow}>
        <span
          className={styles.prompt}
          dangerouslySetInnerHTML={{ __html: term.buildPromptHtml(term.cwd) + ' ' }}
        />
        <input
          ref={inputRef}
          className={styles.input}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-label="Terminal input"
        />
      </div>
    </div>
  )
}
