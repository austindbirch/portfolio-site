// src/components/Terminal/terminalMarkdown.ts

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderInline(text: string): string {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, '<span class="tm-code">$1</span>')
    .replace(/\*\*([^*]+)\*\*/g, '<span class="tm-bold">$1</span>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/→/g, '<span class="tm-arrow">→</span>')
}

export function renderTerminalMarkdown(raw: string): string {
  const lines = raw.split('\n')

  return lines
    .map((line) => {
      if (/^### (.+)/.test(line)) {
        return `<span class="tm-h3">${escapeHtml(line.slice(4))}</span>`
      }
      if (/^## (.+)/.test(line)) {
        return `<span class="tm-h2">${escapeHtml(line.slice(3))}</span>`
      }
      if (/^# (.+)/.test(line)) {
        return `<span class="tm-h1">${escapeHtml(line.slice(2))}</span>`
      }
      if (/^```/.test(line)) {
        return `<span class="tm-dim">${escapeHtml(line)}</span>`
      }
      if (/^- (.+)/.test(line)) {
        return `<span class="tm-text">  • ${renderInline(line.slice(2))}</span>`
      }
      if (line.trim() === '') {
        return ''
      }
      return `<span class="tm-text">${renderInline(line)}</span>`
    })
    .join('\n')
}
