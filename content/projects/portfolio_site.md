---
title: "Portfolio Site"
frameworks: [Next.js, TypeScript, React, CSS Modules]
demo_url: "https://austindbirch.fly.dev"
show_readme: false
---

This site! A browser-based desktop OS built with Next.js.

## Backstory

I knew I wanted my portfolio to stand out, but I spent a long time not knowing exactly what that meant. Most developer portfolios look more or less the same — a clean landing page with a hero, an about section, a projects grid, and a contact form. They're fine, but they all kinda look the same.

I stumbled across [Dustin Brett's DaedalOS](https://dustinbrett.com/) and it stuck with me--a fake OS running in the browser, complete with draggable windows, a desktop, a dock. I loved the concept, and I've always had a soft spot for the MacOS look and feel, so I used that as my inspiration and built this.

## Design

The core interaction model is that there's a desktop with a wallpaper and a dock at the bottom. You can click any dock icon (or double-click a desktop icon) to open a window. Each window is independently draggable, resizable, and closeable. Clicking a window brings it to the front. It's just a desktop — familiar enough that it needs no explanation.

I wanted the aesthetic to feel like sort of terminal-UI-y: dark background, monospace type, muted colors with just enough accent to guide the eye. I originally started with a multi-panel TUI (think lazygit), but figured there would be some usage friction for less-technical users.

Each window has a soft colored glow that matches its desktop icon color — blue-green for the terminal, blue for projects, purple for about, green for contact. It's subtle, but it gives each window a distinct identity. Maybe I'm reading into it too much though, I'm definitely not a great designer.

## Implementation

### Window management

Each window has a position, size, z-index, focus state, and open/closed state. All of that lives in a `useReducer`-based context (`WindowManagerContext`) that the entire app reads from. The reducer handles five actions: `OPEN`, `CLOSE`, `FOCUS`, `MAXIMIZE`, and `UPDATE_RECT`.

Every time a window is opened or focused, a global `zCounter` increments and gets assigned to that window's `zIndex`. That's the entire focus/stacking system — no manual z-index juggling.

Dragging and resizing are handled by custom hooks (`useDrag`, `useResize`) that track pointer events and fire `UPDATE_RECT` to update the window's position and dimensions in the context.

On mobile, only one window can be open at a time. The `OPEN` reducer action checks the viewport width and closes all other windows before opening the new one.

### The terminal

The terminal was the part I was most excited to build (and the most likely to go wrong).

The first thing I needed was a virtual filesystem to make `ls`, `cd`, and `cat` actually work. I built a flat path-keyed object (`VFS`) that gets populated at build time from the Github data and markdown content files. The structure mirrors a real home directory:

```
~
├── projects/
│   ├── harbor_hook/
│   │   └── README.md
│   └── ...
├── about.md
└── contact.md
```

Commands run through an `executeCommand` function that dispatches on the command name, resolves paths against the current working directory, and returns an output string and optionally a new `cwd`. The terminal hook (`useTerminal`) maintains the history of output lines and the current directory.

The easter eggs are a `Record<string, (args) => string>` map that the default case checks before falling back to "command not found." `vim`, `docker`, `git push --force`, `ssh`, `htop`, `sl`, `fortune`, 30ish in total. The hint file in `docs/eggs.md` teases a few of them.

### Github integration

The projects window pulls live data from the Github API. There's a `fetch-github` script that runs at build time (or locally with `npm run fetch-github`), hits the GitHub API, and writes the results to `data/github.json`. That file is committed as a fallback so the build works even without a token. In CI, it always gets overwritten with fresh data before `next build` runs.

Each project card shows the repo name, description, and language/framework tags. Clicking a card opens a detail view that renders the corresponding `content/projects/<name>.md` file as markdown, plus optionally the repo's README.

### Content

`about.md` and `contact.md` in `content/` control those windows. Per-project write-ups live in `content/projects/`. The markdown gets loaded at build time via `gray-matter` (for frontmatter) and rendered in-window with `react-markdown` and `remark-gfm`.

### URL sync

One thing I wanted was for the URL to reflect which window is open, so links like `austindbirch.fly.dev/projects` work. This turned out to be trickier than expected. The naive solution — using `router.push()` whenever the focused window changed — caused the entire app to remount and re-render, which made it look like the terminal was always opening. The fix was to use `window.history.replaceState()` instead, which updates the URL bar without triggering any React navigation.

## Deployment

The site is fully static (`output: 'export'`), so deployment is just an nginx:alpine container serving the `out/` directory. It deploys to Fly.io automatically on every push to `main` via Github Actions: install → test → fetch Github data → `next build` → docker build/push → `flyctl deploy`.
