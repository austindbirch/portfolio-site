// __tests__/filesystem.test.ts
import { resolvePath, getNode, buildVFS } from '@/components/Terminal/filesystem'
import type { GitHubRepo } from '@/types'

const mockRepos: GitHubRepo[] = [
  {
    name: 'my-project',
    description: 'A test project',
    html_url: '',
    language: 'TypeScript',
    languages: { TypeScript: 1000 },
    topics: [],
    stargazers_count: 0,
    forks_count: 0,
    updated_at: '',
    readme: '# my-project\n\nHello.',
  },
]

describe('resolvePath', () => {
  it('returns ~ for empty string', () => {
    expect(resolvePath('~', '')).toBe('~')
  })
  it('returns home for ~', () => {
    expect(resolvePath('~/projects', '~')).toBe('~')
  })
  it('resolves .. from nested path', () => {
    expect(resolvePath('~/projects/my-project', '..')).toBe('~/projects')
  })
  it('resolves .. from projects to home', () => {
    expect(resolvePath('~/projects', '..')).toBe('~')
  })
  it('resolves relative path from home', () => {
    expect(resolvePath('~', 'projects')).toBe('~/projects')
  })
  it('resolves relative path from subdir', () => {
    expect(resolvePath('~/projects', 'my-project')).toBe('~/projects/my-project')
  })
  it('passes through absolute ~ paths unchanged', () => {
    expect(resolvePath('~', '~/projects')).toBe('~/projects')
  })
})

describe('buildVFS', () => {
  const vfs = buildVFS(mockRepos, '# About', '# Contact')

  it('creates home directory', () => {
    expect(getNode(vfs, '~')).toEqual(
      expect.objectContaining({ type: 'dir' })
    )
  })
  it('creates projects directory', () => {
    expect(getNode(vfs, '~/projects')).toEqual(
      expect.objectContaining({ type: 'dir' })
    )
  })
  it('creates project subdirectory', () => {
    expect(getNode(vfs, '~/projects/my-project')).toEqual(
      expect.objectContaining({ type: 'dir' })
    )
  })
  it('creates README.md for project', () => {
    const node = getNode(vfs, '~/projects/my-project/README.md')
    expect(node).toEqual(expect.objectContaining({ type: 'file' }))
  })
  it('README.md contains repo readme content', () => {
    const node = getNode(vfs, '~/projects/my-project/README.md')
    expect(node?.type === 'file' && node.content).toContain('my-project')
  })
  it('creates about.md', () => {
    const node = getNode(vfs, '~/about.md')
    expect(node?.type === 'file' && node.content).toContain('About')
  })
  it('creates contact.md', () => {
    const node = getNode(vfs, '~/contact.md')
    expect(node?.type === 'file' && node.content).toContain('Contact')
  })
})
