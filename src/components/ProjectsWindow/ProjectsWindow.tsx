// src/components/ProjectsWindow/ProjectsWindow.tsx
'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ProjectData } from '@/types'
import styles from './ProjectsWindow.module.css'

const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  TypeScript:  { bg: 'rgba(77,170,252,0.12)',   color: 'var(--c12)' },
  JavaScript:  { bg: 'rgba(240,198,116,0.12)',  color: 'var(--c11)' },
  Rust:        { bg: 'rgba(248,81,73,0.12)',     color: 'var(--c9)'  },
  Go:          { bg: 'rgba(86,212,221,0.12)',    color: 'var(--c14)' },
  Python:      { bg: 'rgba(240,198,116,0.12)',   color: 'var(--c11)' },
  React:       { bg: 'rgba(17,168,205,0.12)',    color: 'var(--c6)'  },
}

function getTagStyle(name: string) {
  return TAG_COLORS[name] ?? { bg: 'rgba(110,118,129,0.15)', color: 'var(--c8)' }
}

function TagList({ tags }: { tags: string[] }) {
  return (
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
  )
}

export function ProjectsWindow({ projects }: { projects: ProjectData[] }) {
  const [selected, setSelected] = useState<ProjectData | null>(null)

  if (selected) {
    return <ProjectDetail project={selected} onBack={() => setSelected(null)} />
  }

  return (
    <div className={styles.body}>
      {projects.map((p) => {
        const { repo, story } = p
        const tags = [
          ...Object.keys(repo.languages),
          ...(story?.frontmatter.frameworks ?? []),
        ].filter((v, i, a) => a.indexOf(v) === i)

        return (
          <div key={repo.name} className={styles.card} onClick={() => setSelected(p)}>
            <div className={styles.name}>{story?.frontmatter.title ?? repo.name}</div>
            <div className={styles.desc}>{repo.description ?? 'No description.'}</div>
            <TagList tags={tags} />
          </div>
        )
      })}
    </div>
  )
}

function ProjectDetail({ project, onBack }: { project: ProjectData; onBack: () => void }) {
  const { repo, story } = project
  const title = story?.frontmatter.title ?? repo.name
  const tags = [
    ...Object.keys(repo.languages),
    ...(story?.frontmatter.frameworks ?? []),
  ].filter((v, i, a) => a.indexOf(v) === i)

  return (
    <div className={styles.detail}>
      <div className={styles.detailHeader}>
        <button className={styles.backBtn} onClick={onBack}>← back</button>
        <div className={styles.detailLinks}>
          <a href={repo.html_url} target="_blank" rel="noreferrer" className={styles.link}>
            GitHub ↗
          </a>
          {story?.frontmatter.demo_url && (
            <a href={story.frontmatter.demo_url} target="_blank" rel="noreferrer" className={styles.link}>
              Demo ↗
            </a>
          )}
        </div>
      </div>

      <h1 className={styles.detailTitle}>{title}</h1>
      {tags.length > 0 && (
        <div className={styles.detailTags}><TagList tags={tags} /></div>
      )}

      <div className={styles.detailContent}>
        {story?.content ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{story.content}</ReactMarkdown>
        ) : (
          <p className={styles.noStory}>{repo.description ?? 'No description.'}</p>
        )}

        {story?.frontmatter.show_readme && repo.readme && (
          <>
            <hr className={styles.divider} />
            <p className={styles.readmeLabel}>README</p>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{repo.readme}</ReactMarkdown>
          </>
        )}
      </div>
    </div>
  )
}
