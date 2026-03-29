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
    case 'uname': return { output: `<span class="t-text">Portfolio OS 1.19.2038</span>`, cwd }
    default: {
      const egg = EASTER_EGGS[cmd.toLowerCase()]
      if (egg) return { output: egg(args), cwd }
      return {
        output: `<span class="t-err">zsh: command not found: ${escapeHtml(cmd)}</span>\n` +
                `<span class="t-dim">type <span class="t-yellow">help</span> to see available commands</span>`,
        cwd,
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Easter eggs — developer-flavoured responses for commands that don't exist
// ---------------------------------------------------------------------------

const EASTER_EGGS: Record<string, (args: string[]) => string> = {
  // text editors
  vim: () =>
    `<span class="t-text">Entering vim...</span>\n` +
    `<span class="t-dim">Tip: type <span class="t-yellow">:q!</span> to exit.\n\n` +
    `...just kidding. This isn't vim. You're safe.</span>`,
  vi: () =>
    `<span class="t-text">Entering vim...</span>\n` +
    `<span class="t-dim">Tip: type <span class="t-yellow">:q!</span> to exit.\n\n` +
    `...just kidding. This isn't vim. You're safe.</span>`,
  nano: () =>
    `<span class="t-dim">nano: a reasonable choice. Unavailable, but reasonable.</span>`,
  emacs: () =>
    `<span class="t-dim">An OS masquerading as a text editor,\n` +
    `in a text editor masquerading as an OS.\n\nRespect.</span>`,

  // networking
  ifconfig: () => `<span class="t-dim">This isn't a real terminal, you know...</span>`,
  ipconfig: () => `<span class="t-dim">Wrong OS, wrong terminal, wrong dimension.</span>`,
  ping: (args) => {
    const host = escapeHtml(args[0] ?? 'portfolio.dev')
    return (
      `<span class="t-ok">PONG!</span>\n` +
      `<span class="t-dim">64 bytes from ${host}: icmp_seq=0 ttl=255 time=0.0 ms\n` +
      `64 bytes from ${host}: icmp_seq=1 ttl=255 time=0.0 ms\n\n` +
      `round-trip min/avg/max = 0/0/0 ms</span>`
    )
  },
  ssh: () =>
    `<span class="t-err">ssh: connect to host portfolio.dev port 22: Connection refused.</span>\n` +
    `<span class="t-dim">You're in a browser tab.</span>`,
  curl: () =>
    `<span class="t-err">curl: (6) Could not resolve host.</span>\n` +
    `<span class="t-dim">You're already on the page. Try using your eyes.</span>`,
  wget: () =>
    `<span class="t-err">wget: unsupported scheme.</span>\n` +
    `<span class="t-dim">Have you tried... scrolling?</span>`,

  // processes
  htop: () =>
    `<span class="t-dim">  PID  USER         %CPU %MEM  COMMAND</span>\n` +
    `<span class="t-text">    1  you           0.0  0.0  reading-portfolio</span>\n` +
    `<span class="t-text">    2  you           0.0  0.0  contemplating-hire</span>\n` +
    `<span class="t-text">    3  austin       99.9 99.9  writing-cool-code</span>\n` +
    `<span class="t-dim">\nPress q to quit. (there is no q)</span>`,
  top: () =>
    `<span class="t-dim">Processes: 3 total  |  CPU usage: 0.0%  |  RAM: vibes</span>\n\n` +
    `<span class="t-dim">  PID  COMMAND          %CPU</span>\n` +
    `<span class="t-text">    1  your-eyes         0.0\n` +
    `    2  your-brain        2.3\n` +
    `    3  this-site        97.7</span>`,
  ps: () =>
    `<span class="t-dim">  PID TTY      TIME     CMD</span>\n` +
    `<span class="t-text">    1 browser  0:00.01  stare-at-portfolio</span>`,
  kill: () =>
    `<span class="t-err">kill: operation not permitted.</span>\n` +
    `<span class="t-dim">You can't kill a vibe.</span>`,

  // package managers
  brew: () =>
    `<span class="t-ok">☕  Your coffee is ready.</span>\n` +
    `<span class="t-dim">(brew: command not found in browser environments)</span>`,
  npm: (args) => {
    if (args[0] === 'install' || args[0] === 'i')
      return (
        `<span class="t-dim">added 847 packages in 0ms\n\n` +
        `found 0 vulnerabilities\n\n` +
        `(there is no node_modules here. it's better this way.)</span>`
      )
    if (args[0] === 'run' && args[1])
      return `<span class="t-dim">npm run ${escapeHtml(args[1])}: script not found.\n(but the instinct was correct)</span>`
    return `<span class="t-dim">npm: not available here.\n(props for the muscle memory)</span>`
  },
  yarn: () => `<span class="t-dim">yarn: command not found.\n(valid package manager choice, though)</span>`,
  pnpm: () => `<span class="t-dim">pnpm: command not found.\n(based. genuinely based.)</span>`,

  // containers & orchestration
  docker: () =>
    `<span class="t-err">Cannot connect to the Docker daemon.</span>\n` +
    `<span class="t-dim">Are you running Docker in a browser tab? Because I am.</span>`,
  kubectl: () =>
    `<span class="t-err">The connection to the server localhost:8080 was refused.</span>\n` +
    `<span class="t-dim">Kubernetes. In a portfolio. Bold.</span>`,

  // source control
  git: (args) => {
    if (args[0] === 'blame')
      return `<span class="t-text">^cafebabe (austin  2024-01-01 00:00:00) all of it. every line.</span>`
    if (args[0] === 'log')
      return (
        `<span class="t-text">commit cafebabe</span>\n` +
        `<span class="t-dim">Author: Austin &lt;austin@portfolio.dev&gt;\n` +
        `Date:   Just now\n\n    feat: add every feature ever</span>`
      )
    if (args[0] === 'push' && args.includes('--force'))
      return `<span class="t-err">error: --force rejected.\n<span class="t-dim">No.</span></span>`
    if (args[0] === 'status')
      return (
        `<span class="t-ok">On branch main</span>\n` +
        `<span class="t-dim">nothing to commit, working tree clean\n` +
        `(this is a compiled static site — there's no git here)</span>`
      )
    return (
      `<span class="t-err">fatal: not a git repository.</span>\n` +
      `<span class="t-dim">(It's a Next.js app. Close enough.)</span>`
    )
  },

  // runtimes
  python: () =>
    `<span class="t-text">Python 3.12.0 (main)</span>\n` +
    `<span class="t-dim">Type "help" for more information.\n` +
    `&gt;&gt;&gt; _\n\n(no Python here. just JavaScript all the way down.)</span>`,
  python3: () =>
    `<span class="t-text">Python 3.12.0 (main)</span>\n` +
    `<span class="t-dim">Type "help" for more information.\n` +
    `&gt;&gt;&gt; _\n\n(no Python here. just JavaScript all the way down.)</span>`,
  node: () =>
    `<span class="t-text">Welcome to Node.js v20.11.0.</span>\n` +
    `<span class="t-dim">Type ".help" for more information.\n` +
    `&gt; _\n\n(no REPL here either. turtles all the way down.)</span>`,

  // fun / classic
  sl: () =>
    `<span class="t-yellow">🚂  choo choo</span>\n` +
    `<span class="t-dim">(did you mean: <span class="t-cyan">ls</span>?)</span>`,
  fortune: () => {
    const quotes = [
      '"Any fool can write code that a computer can understand.\nGood programmers write code that humans can understand."\n  — Martin Fowler',
      '"Debugging is twice as hard as writing the code in\nthe first place. Therefore, if you write the code as\ncleverly as possible, you are, by definition, not\nsmart enough to debug it."\n  — Brian Kernighan',
      '"It works on my machine."\n  — every developer, always',
      '"There are only two hard things in Computer Science:\ncache invalidation, naming things, and off-by-one errors."\n  — Phil Karlton (amended)',
      '"The best code is no code at all."\n  — Jeff Atwood',
      '"First, solve the problem. Then, write the code."\n  — John Johnson',
    ]
    return `<span class="t-cyan">${quotes[Math.floor(Math.random() * quotes.length)]}</span>`
  },
  hack: () =>
    `<span class="t-err">[INITIATING HACK SEQUENCE]</span>\n` +
    `<span class="t-dim">accessing mainframe...</span>\n` +
    `<span class="t-dim">bypassing firewall...</span>\n` +
    `<span class="t-dim">decrypting AES-256...</span>\n` +
    `<span class="t-ok">ACCESS GRANTED</span>\n\n` +
    `<span class="t-dim">...nothing happened. there's nothing to hack here.</span>`,

  // man pages
  man: (args) => {
    if (!args[0]) return `<span class="t-dim">What manual? I'm winging it.</span>`
    if (args[0] === 'man')
      return (
        `<span class="t-text">MAN(1)  Portfolio Manual  MAN(1)\n\n` +
        `NAME\n    man — an ouroboros. A manual for the manual.\n\n` +
        `SEE ALSO\n    man man, man man man</span>`
      )
    return (
      `<span class="t-dim">No manual entry for ${escapeHtml(args[0])}.\n` +
      `Have you tried reading the source code?</span>`
    )
  },
  which: (args) => {
    if (!args[0]) return `<span class="t-err">which: missing argument</span>`
    const real: Record<string, string> = {
      ls: '/usr/bin/ls', cd: '/usr/bin/cd', cat: '/usr/bin/cat',
      pwd: '/usr/bin/pwd', echo: '/usr/bin/echo',
    }
    if (real[args[0]])
      return `<span class="t-dim">${real[args[0]]} (trust me bro)</span>`
    return `<span class="t-err">which: ${escapeHtml(args[0])}: not found</span>`
  },

  // destructive / system
  sudo: (args) => {
    const argStr = args.join(' ')
    if (argStr.includes('rm') && (argStr.includes('-rf') || argStr.includes('-fr')))
      return `<span class="t-err">sudo: nice try. This portfolio is indestructible.</span>`
    return (
      `<span class="t-err">sudo: ${escapeHtml(args[0] ?? 'command')} not found.</span>\n` +
      `<span class="t-dim">Also: I know your password. It's wrong.</span>`
    )
  },
  rm: (args) => {
    if (args.some(a => a.includes('r')))
      return (
        `<span class="t-err">rm: refusing to delete the portfolio.</span>\n` +
        `<span class="t-dim">(Nothing happened. You're welcome.)</span>`
      )
    return `<span class="t-err">rm: command not found.</span>\n<span class="t-dim">Probably for the best.</span>`
  },
  reboot: () =>
    `<span class="t-dim">Rebooting...\n\n...\n\nJust kidding. You can't reboot a portfolio site.</span>`,
  shutdown: () =>
    `<span class="t-dim">Shutting down...\n\n...\n\nNah.</span>`,
  exit: () => `<span class="t-dim">There is no escape.</span>`,
  quit: () => `<span class="t-dim">logout: not logged in</span>`,
  logout: () => `<span class="t-dim">logout: not logged in</span>`,
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
