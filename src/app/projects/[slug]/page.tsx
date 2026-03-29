import { getRepos } from '@/lib/github'

export async function generateStaticParams() {
  return getRepos().map((r) => ({ slug: r.name }))
}

// Stub — renders desktop with projects window open
export { default } from '../../page'
