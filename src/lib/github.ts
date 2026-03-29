// src/lib/github.ts
import type { GitHubRepo } from '@/types'

export function getRepos(): GitHubRepo[] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('../../data/github.json') as GitHubRepo[]
}

export function getRepo(slug: string): GitHubRepo | undefined {
  return getRepos().find((r) => r.name === slug)
}
