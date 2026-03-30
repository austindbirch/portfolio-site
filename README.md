# portfolio-site

My personal portfolio site--built to look and feel like a desktop OS running in your browser!

## The idea

Most portfolio sites are the same: navbar, hero section, projects grid, contact form. I wanted to do something unique and memorable for mine. I stumbled across [Dustin Brett's](https://dustinbrett.com/) DaedalOS site, and loved the concept. I've always loved the MacOS look and layout, so I took heavy inspiration from it to build this site: it's a fake desktop environment with floating, draggable windows, a dock, and a working terminal emulator. The goal was to build something that feels like a toy a developer or technical recruiter would actually want to play with.

## Windows

- **Terminal** — a real-ish terminal with `ls`, `cd`, `cat`, `pwd`, and a bunch of easter eggs (if you're willing to poke around!)
- **Projects** — pulls live data from the GitHub API, with per-project write-ups rendered inline
- **About** — markdown rendered in a window
- **Contact** — markdown rendered in a window

## Reuse

If you want to use this as a base for your own portfolio:

1. **Replace the GitHub username** in `scripts/fetch-github.ts`
2. **Edit the content** in `content/` — `about.md`, `contact.md`, and per-project write-ups in `content/projects/`
3. **Run the data fetch** with `npm run fetch-github` (requires a GitHub PAT in `.env` as `GITHUB_TOKEN`)
4. **Deploy** — the site is fully static, so it works on Fly.io, Vercel, Netlify, or anywhere that serves static files

## Running locally

```bash
npm install
npm run fetch-github   # needs GITHUB_TOKEN in .env
npm run dev
```

## Tech

Next.js 16, TypeScript, CSS Modules. No UI library — all styles are hand-rolled.
