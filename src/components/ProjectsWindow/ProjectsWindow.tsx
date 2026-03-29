// src/components/ProjectsWindow/ProjectsWindow.tsx
'use client'

import type { GitHubRepo, StoryFrontmatter } from '@/types'
import styles from './ProjectsWindow.module.css'

const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  TypeScript:  { bg: 'rgba(77,170,252,0.12)',   color: 'var(--c12)' },
  JavaScript:  { bg: 'rgba(240,198,116,0.12)',  color: 'var(--c11)' },
  Rust:        { bg: 'rgba(248,81,73,0.12)',     color: 'var(--c9)' },
  Go:          { bg: 'rgba(86,212,221,0.12)',    color: 'var(--c14)' },
  Python:      { bg: 'rgba(240,198,116,0.12)',   color: 'var(--c11)' },
  React:       { bg: 'rgba(17,168,205,0.12)',    color: 'var(--c6)' },
}

function getTagStyle(name: string) {
  return TAG_COLORS[name] ?? { bg: 'rgba(110,118,129,0.15)', color: 'var(--c8)' }
}

interface ProjectCardData {
  repo: GitHubRepo
  frontmatter?: StoryFrontmatter
}

export function ProjectsWindow({ projects }: { projects: ProjectCardData[] }) {
  return (
    <div className={styles.body}>
      {projects.map(({ repo, frontmatter }) => {
        const tags = [
          ...Object.keys(repo.languages),
          ...(frontmatter?.frameworks ?? []),
        ].filter((v, i, a) => a.indexOf(v) === i)  // dedupe

        return (
          <div key={repo.name} className={styles.card}>
            <div className={styles.name}>{frontmatter?.title ?? repo.name}</div>
            <div className={styles.desc}>{repo.description ?? 'No description.'}</div>
            <div className={styles.tags}>
              {tags.map((tag) => {
                const { bg, color } = getTagStyle(tag)
                return (
                  <span key={tag} className={styles.tag} style={{ background: bg, color }}>
                    {tag}
                  </span>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
