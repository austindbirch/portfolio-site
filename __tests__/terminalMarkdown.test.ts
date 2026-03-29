// __tests__/terminalMarkdown.test.ts
import { renderTerminalMarkdown, escapeHtml } from '@/components/Terminal/terminalMarkdown'

describe('escapeHtml', () => {
  it('escapes < and >', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;')
  })
  it('escapes &', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b')
  })
  it('leaves safe text alone', () => {
    expect(escapeHtml('hello world')).toBe('hello world')
  })
  it('escapes "', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;')
  })
})

describe('renderTerminalMarkdown', () => {
  it('renders h1 with tm-h1 class', () => {
    const html = renderTerminalMarkdown('# Hello')
    expect(html).toContain('class="tm-h1"')
    expect(html).toContain('Hello')
  })
  it('renders h2', () => {
    expect(renderTerminalMarkdown('## World')).toContain('class="tm-h2"')
  })
  it('renders h3', () => {
    expect(renderTerminalMarkdown('### Section')).toContain('class="tm-h3"')
  })
  it('renders list item with bullet', () => {
    expect(renderTerminalMarkdown('- item')).toContain('•')
  })
  it('renders inline code', () => {
    const html = renderTerminalMarkdown('use `npm install`')
    expect(html).toContain('class="tm-code"')
    expect(html).toContain('npm install')
  })
  it('renders bold', () => {
    const html = renderTerminalMarkdown('this is **bold** text')
    expect(html).toContain('class="tm-bold"')
  })
  it('escapes html in plain text', () => {
    const html = renderTerminalMarkdown('<script>alert(1)</script>')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })
  it('preserves blank lines', () => {
    const html = renderTerminalMarkdown('line1\n\nline2')
    expect(html).toContain('\n\n')
  })
})
