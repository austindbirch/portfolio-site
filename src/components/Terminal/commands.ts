// src/components/Terminal/commands.ts
import { resolvePath, getNode } from './filesystem'
import { renderTerminalMarkdown, escapeHtml } from './terminalMarkdown'
import type { VFS, WindowId } from '@/types'

interface CommandResult {
  output: string
  cwd: string
  clear?: boolean
  openWindow?: WindowId
}

export function executeCommand(
  cmd: string,
  args: string[],
  cwd: string,
  vfs: VFS
): CommandResult {
  switch (cmd.toLowerCase()) {
    case 'ls':    return cmdLs(args, cwd, vfs)
    case 'cd':    return cmdCd(args, cwd, vfs)
    case 'pwd':   return { output: `<span class="t-text">${cwd.replace('~', '/home/austin')}</span>`, cwd }
    case 'cat':   return cmdCat(args, cwd, vfs)
    case 'clear': return { output: '', cwd, clear: true }
    case 'help':  return { output: cmdHelp(), cwd }
    case 'open':  return cmdOpen(args, cwd)
    case 'whoami': return { output: `<span class="t-ok">austin</span>`, cwd }
    case 'echo':  return { output: `<span class="t-text">${escapeHtml(args.join(' '))}</span>`, cwd }
    case 'uname': return { output: `<span class="t-text">Portfolio OS 1.0.0</span>`, cwd }
    default:
      return {
        output: `<span class="t-err">zsh: command not found: ${escapeHtml(cmd)}</span>\n` +
                `<span class="t-dim">type <span class="t-yellow">help</span> to see available commands</span>`,
        cwd,
      }
  }
}

function cmdLs(args: string[], cwd: string, vfs: VFS): CommandResult {
  const targetPath = args[0] ? resolvePath(cwd, args[0]) : cwd
  const node = getNode(vfs, targetPath)

  if (!node) {
    return { output: `<span class="t-err">ls: ${escapeHtml(args[0] ?? cwd)}: No such file or directory</span>`, cwd }
  }
  if (node.type === 'file') {
    return { output: `<span class="t-text">${escapeHtml(targetPath.split('/').pop() ?? '')}</span>`, cwd }
  }

  const items = node.children.map((name) => {
    const childPath = targetPath === '~' ? `~/${name}` : `${targetPath}/${name}`
    const isDir = getNode(vfs, childPath)?.type === 'dir'
    return isDir
      ? `<span class="t-dir">${escapeHtml(name)}/</span>`
      : `<span class="t-text">${escapeHtml(name)}</span>`
  })

  return {
    output: `<div class="ls-output">${items.join('')}</div>`,
    cwd,
  }
}

function cmdCd(args: string[], cwd: string, vfs: VFS): CommandResult {
  if (!args[0] || args[0] === '~') return { output: '', cwd: '~' }
  const target = resolvePath(cwd, args[0])
  const node = getNode(vfs, target)

  if (!node) return { output: `<span class="t-err">cd: no such file or directory: ${escapeHtml(args[0])}</span>`, cwd }
  if (node.type === 'file') return { output: `<span class="t-err">cd: not a directory: ${escapeHtml(args[0])}</span>`, cwd }

  return { output: '', cwd: target }
}

function cmdCat(args: string[], cwd: string, vfs: VFS): CommandResult {
  if (!args[0]) return { output: `<span class="t-err">cat: missing operand</span>`, cwd }

  const target = resolvePath(cwd, args[0])
  const node = getNode(vfs, target)

  if (!node) return { output: `<span class="t-err">cat: ${escapeHtml(args[0])}: No such file or directory</span>`, cwd }
  if (node.type === 'dir') return { output: `<span class="t-err">cat: ${escapeHtml(args[0])}: Is a directory</span>`, cwd }

  const rendered = renderTerminalMarkdown(node.content)
  return {
    output: `<div class="cat-output">${rendered}</div>`,
    cwd,
  }
}

function cmdOpen(args: string[], cwd: string): CommandResult {
  const valid: WindowId[] = ['terminal', 'projects', 'about', 'contact']
  const app = args[0]?.toLowerCase() as WindowId

  if (!app || !valid.includes(app)) {
    return {
      output: `<span class="t-err">open: unknown app: ${escapeHtml(args[0] ?? '')}</span>\n` +
              `<span class="t-dim">available: ${valid.join(', ')}</span>`,
      cwd,
    }
  }

  return {
    output: `<span class="t-ok">opening ${app}...</span>`,
    cwd,
    openWindow: app,
  }
}

function cmdHelp(): string {
  const cmds: [string, string][] = [
    ['ls [path]',  'list directory contents'],
    ['cd <path>',  'change directory'],
    ['pwd',        'print working directory'],
    ['cat <file>', 'display file contents'],
    ['clear',      'clear terminal'],
    ['open <app>', 'open a window (terminal/projects/about/contact)'],
    ['whoami',     'display current user'],
    ['echo <text>','print text'],
    ['uname',      'system information'],
    ['help',       'show this message'],
  ]

  const rows = cmds
    .map(([c, d]) => `<div class="help-row"><span class="t-cyan">${escapeHtml(c)}</span><span class="t-dim">${d}</span></div>`)
    .join('')

  return `<div class="help-output"><div class="t-yellow help-header">Available commands</div>${rows}</div>`
}
