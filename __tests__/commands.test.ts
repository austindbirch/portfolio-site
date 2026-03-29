// __tests__/commands.test.ts
import { executeCommand } from '@/components/Terminal/commands'
import { buildVFS } from '@/components/Terminal/filesystem'
import type { GitHubRepo } from '@/types'

const repos: GitHubRepo[] = [{
  name: 'test-repo', description: 'Test', html_url: '',
  language: 'Go', languages: { Go: 500 }, topics: [],
  stargazers_count: 0, forks_count: 0, updated_at: '', readme: '# test-repo',
}]
const vfs = buildVFS(repos, '# About', '# Contact')

describe('executeCommand', () => {
  it('ls returns directory listing at home', () => {
    const result = executeCommand('ls', [], '~', vfs)
    expect(result.output).toContain('projects')
    expect(result.output).toContain('about.md')
    expect(result.cwd).toBe('~')
  })

  it('ls on a specific path', () => {
    const result = executeCommand('ls', ['~/projects'], '~', vfs)
    expect(result.output).toContain('test-repo')
  })

  it('cd changes cwd', () => {
    const result = executeCommand('cd', ['projects'], '~', vfs)
    expect(result.cwd).toBe('~/projects')
  })

  it('cd to nonexistent path returns error', () => {
    const result = executeCommand('cd', ['nonexistent'], '~', vfs)
    expect(result.output).toContain('no such file')
    expect(result.cwd).toBe('~')
  })

  it('pwd prints expanded path', () => {
    const result = executeCommand('pwd', [], '~/projects', vfs)
    expect(result.output).toContain('/home/austin/projects')
  })

  it('cat renders file content', () => {
    const result = executeCommand('cat', ['about.md'], '~', vfs)
    expect(result.output).toContain('About')
  })

  it('cat on directory returns error', () => {
    const result = executeCommand('cat', ['projects'], '~', vfs)
    expect(result.output).toContain('Is a directory')
  })

  it('cat nonexistent file returns error', () => {
    const result = executeCommand('cat', ['missing.md'], '~', vfs)
    expect(result.output).toContain('No such file')
  })

  it('whoami returns username', () => {
    const result = executeCommand('whoami', [], '~', vfs)
    expect(result.output).toContain('austin')
  })

  it('unknown command returns error', () => {
    const result = executeCommand('rm', ['-rf', '/'], '~', vfs)
    expect(result.output).toContain('command not found')
  })

  it('clear returns clear signal', () => {
    const result = executeCommand('clear', [], '~', vfs)
    expect(result.clear).toBe(true)
  })
})
