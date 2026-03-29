// src/components/Terminal/filesystem.ts
import type { GitHubRepo, VFS, VFSNode } from '@/types'

export function buildVFS(repos: GitHubRepo[], aboutContent: string, contactContent: string): VFS {
  const vfs: VFS = {}

  const projectNames = repos.map((r) => r.name)

  vfs['~'] = { type: 'dir', children: ['projects', 'about.md', 'contact.md'] }
  vfs['~/projects'] = { type: 'dir', children: projectNames }
  vfs['~/about.md'] = { type: 'file', content: aboutContent }
  vfs['~/contact.md'] = { type: 'file', content: contactContent }

  for (const repo of repos) {
    const base = `~/projects/${repo.name}`
    vfs[base] = { type: 'dir', children: ['README.md'] }
    vfs[`${base}/README.md`] = {
      type: 'file',
      content: repo.readme ?? `# ${repo.name}\n\n${repo.description ?? 'No description.'}`,
    }
  }

  return vfs
}

export function getNode(vfs: VFS, path: string): VFSNode | undefined {
  return vfs[path]
}

export function resolvePath(cwd: string, input: string): string {
  if (!input || input === '~') return '~'
  if (input.startsWith('~/') || input === '~') return input
  if (input === '..') {
    const parts = cwd.split('/')
    if (parts.length <= 1) return '~'
    parts.pop()
    return parts.join('/') || '~'
  }
  if (cwd === '~') return `~/${input}`
  return `${cwd}/${input}`
}
