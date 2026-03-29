// scripts/fetch-github.ts
import fs from 'fs'
import path from 'path'
import type { GitHubRepo } from '../src/types'

const USERNAME = process.env.GITHUB_USERNAME || 'austin'
const TOKEN = process.env.GITHUB_TOKEN

const headers: Record<string, string> = {
  'Accept': 'application/vnd.github.v3+json',
  'User-Agent': 'portfolio-fetch-script',
}
if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`

async function fetchJSON(url: string) {
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${url}`)
  return res.json()
}

async function fetchReadme(repoName: string): Promise<string | null> {
  try {
    const data = await fetchJSON(
      `https://api.github.com/repos/${USERNAME}/${repoName}/readme`
    )
    return Buffer.from(data.content, 'base64').toString('utf-8')
  } catch {
    return null
  }
}

async function main() {
  console.log(`Fetching repos for ${USERNAME}...`)
  const repos: any[] = []
  let page = 1

  while (true) {
    const batch = await fetchJSON(
      `https://api.github.com/users/${USERNAME}/repos?per_page=100&page=${page}&type=public`
    )
    if (batch.length === 0) break
    repos.push(...batch)
    page++
  }

  const results: GitHubRepo[] = []

  for (const repo of repos) {
    if (repo.fork) continue  // skip forks

    const languages = await fetchJSON(
      `https://api.github.com/repos/${USERNAME}/${repo.name}/languages`
    )
    const readme = await fetchReadme(repo.name)

    results.push({
      name: repo.name,
      description: repo.description,
      html_url: repo.html_url,
      language: repo.language,
      languages,
      topics: repo.topics || [],
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      updated_at: repo.updated_at,
      readme,
    })

    console.log(`  ✓ ${repo.name}`)
  }

  const outPath = path.join(process.cwd(), 'data', 'github.json')
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2))
  console.log(`\nWrote ${results.length} repos to data/github.json`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
