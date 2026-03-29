// src/lib/content.ts
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import type { StoryFrontmatter } from '@/types'

const contentDir = path.join(process.cwd(), 'content')

export function readMarkdownFile(relPath: string): { frontmatter: Record<string, unknown>; content: string } | null {
  const fullPath = path.join(contentDir, relPath)
  if (!fs.existsSync(fullPath)) return null
  const raw = fs.readFileSync(fullPath, 'utf-8')
  const { data, content } = matter(raw)
  return { frontmatter: data, content }
}

export function getStoryDoc(slug: string): { frontmatter: StoryFrontmatter; content: string } | null {
  const result = readMarkdownFile(`projects/${slug}.md`)
  if (!result) return null
  return { frontmatter: result.frontmatter as StoryFrontmatter, content: result.content }
}

export function getAboutContent(): string {
  return readMarkdownFile('about.md')?.content ?? ''
}

export function getContactContent(): string {
  return readMarkdownFile('contact.md')?.content ?? ''
}
