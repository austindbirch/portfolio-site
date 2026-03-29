// src/app/page.tsx
import { getRepos } from '@/lib/github'
import { getAboutContent, getContactContent, getStoryDoc } from '@/lib/content'
import { buildVFS } from '@/components/Terminal/filesystem'
import { DesktopShell } from '@/components/Desktop/DesktopShell'

export default function Home() {
  const repos = getRepos()
  const aboutContent = getAboutContent()
  const contactContent = getContactContent()
  const vfs = buildVFS(repos, aboutContent, contactContent)
  const projects = repos.map((repo) => ({
    repo,
    story: getStoryDoc(repo.name) ?? null,
  }))

  return (
    <DesktopShell
      vfs={vfs}
      projects={projects}
      aboutContent={aboutContent}
      contactContent={contactContent}
    />
  )
}
