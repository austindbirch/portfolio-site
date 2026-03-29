// src/types/index.ts

export type WindowId = 'terminal' | 'projects' | 'about' | 'contact'

export interface WindowRect {
  x: number
  y: number
  width: number
  height: number
}

export interface WindowState {
  id: WindowId
  isOpen: boolean
  isMaximized: boolean
  isFocused: boolean
  rect: WindowRect
  preMaxRect: WindowRect | null
  zIndex: number
}

export type WindowsState = Record<WindowId, WindowState>

export interface GitHubRepo {
  name: string
  description: string | null
  html_url: string
  language: string | null
  languages: Record<string, number>  // language → byte count
  topics: string[]
  stargazers_count: number
  forks_count: number
  updated_at: string
  readme: string | null              // raw markdown content
}

export interface StoryFrontmatter {
  title?: string
  frameworks?: string[]
  demo_url?: string
  show_readme?: boolean
}

export interface ProjectData {
  repo: GitHubRepo
  story: { frontmatter: StoryFrontmatter; content: string } | null
}

// Virtual filesystem node
export type VFSNode =
  | { type: 'dir'; children: string[] }
  | { type: 'file'; content: string }

export type VFS = Record<string, VFSNode>

export interface TerminalOutputLine {
  id: string
  html: string
  isPromptLine?: boolean
}
