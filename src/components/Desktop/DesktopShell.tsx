// src/components/Desktop/DesktopShell.tsx
'use client'

import { WindowManagerProvider } from '@/components/WindowManager/WindowManagerContext'
import { Desktop } from './Desktop'
import { DesktopIcon } from '@/components/DesktopIcon/DesktopIcon'
import { Dock } from '@/components/Dock/Dock'
import { Window } from '@/components/Window/Window'
import { Terminal } from '@/components/Terminal/Terminal'
import { ProjectsWindow } from '@/components/ProjectsWindow/ProjectsWindow'
import { ContentWindow } from '@/components/ContentWindow/ContentWindow'
import { TerminalIcon, ProjectsIcon, AboutIcon, ContactIcon } from '@/components/icons'
import { useEffect } from 'react'
import { useUrlSync } from '@/components/WindowManager/useUrlSync'
import { useWindowManager } from '@/components/WindowManager/useWindowManager'
import type { VFS, GitHubRepo, StoryFrontmatter } from '@/types'
import desktopStyles from './Desktop.module.css'

interface Props {
  vfs: VFS
  projects: { repo: GitHubRepo; frontmatter?: StoryFrontmatter }[]
  aboutContent: string
  contactContent: string
}

const ICON_STYLES = {
  terminal: { background: 'linear-gradient(135deg, #1a2a2a, #0f2020)', border: '0.5px solid rgba(17,168,205,0.3)' },
  projects: { background: 'linear-gradient(135deg, #0d1f33, #0a1828)', border: '0.5px solid rgba(0,120,212,0.35)' },
  about:    { background: 'linear-gradient(135deg, #1e1430, #140e22)', border: '0.5px solid rgba(188,140,255,0.3)' },
  contact:  { background: 'linear-gradient(135deg, #0d1f14, #091510)', border: '0.5px solid rgba(46,160,67,0.3)' },
}

const DOCK_ITEMS = [
  { id: 'terminal' as const, label: 'Terminal', icon: <TerminalIcon />, iconStyle: ICON_STYLES.terminal },
  { id: 'projects' as const, label: 'Projects', icon: <ProjectsIcon />, iconStyle: ICON_STYLES.projects },
  { id: 'about'    as const, label: 'About',    icon: <AboutIcon />,    iconStyle: ICON_STYLES.about    },
  { id: 'contact'  as const, label: 'Contact',  icon: <ContactIcon />,  iconStyle: ICON_STYLES.contact  },
]

function UrlSyncEffect() {
  useUrlSync()
  return null
}

function TabletWindowCentering() {
  const { updateRect } = useWindowManager()

  useEffect(() => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    if (vw >= 640 && vw < 1024) {
      const w = Math.min(vw * 0.9, 640)
      const h = Math.min(vh * 0.85, 520)
      const x = (vw - w) / 2
      const y = (vh - h) / 2;
      (['terminal', 'projects', 'about', 'contact'] as const).forEach((id) => {
        updateRect(id, { x, y, width: w, height: h })
      })
    }
  }, [updateRect])

  return null
}

export function DesktopShell({ vfs, projects, aboutContent, contactContent }: Props) {
  return (
    <WindowManagerProvider>
      <UrlSyncEffect />
      <TabletWindowCentering />
      <Desktop>
        {/* Desktop icons */}
        <div className={desktopStyles.icons}>
          <DesktopIcon id="terminal" label="Terminal" icon={<TerminalIcon />} iconStyle={ICON_STYLES.terminal} />
          <DesktopIcon id="projects" label="Projects" icon={<ProjectsIcon />} iconStyle={ICON_STYLES.projects} />
          <DesktopIcon id="about"    label="About"    icon={<AboutIcon />}    iconStyle={ICON_STYLES.about}    />
          <DesktopIcon id="contact"  label="Contact"  icon={<ContactIcon />}  iconStyle={ICON_STYLES.contact}  />
        </div>

        {/* Windows */}
        <Window id="terminal" title="terminal — zsh">
          <Terminal vfs={vfs} />
        </Window>
        <Window id="projects" title="~/projects">
          <ProjectsWindow projects={projects} />
        </Window>
        <Window id="about" title="about.md">
          <ContentWindow content={aboutContent} />
        </Window>
        <Window id="contact" title="contact.md">
          <ContentWindow content={contactContent} />
        </Window>

        {/* Dock */}
        <Dock items={DOCK_ITEMS} />
      </Desktop>
    </WindowManagerProvider>
  )
}
