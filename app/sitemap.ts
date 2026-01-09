import { MetadataRoute } from 'next'
import { promises as fs } from 'fs'
import path from 'path'

async function getPageFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  let files: string[] = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (!entry.name.startsWith('_') && !entry.name.startsWith('.')) {
        files = files.concat(await getPageFiles(fullPath))
      }
    } else if (entry.isFile()) {
      if (entry.name === 'page.tsx' || entry.name === 'page.mdx') {
        files.push(fullPath)
      }
    }
  }
  return files
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://opencodeguide.com'
  const appDir = path.join(process.cwd(), 'app')
  const files = await getPageFiles(appDir)

  const sitemapEntries = await Promise.all(
    files.map(async (file) => {
      const relativePath = path.relative(appDir, file)
      const dir = path.dirname(relativePath)

      // Normalize path and remove route groups (folders like (main), (zh))
      const segments = dir
        .split(path.sep)
        .join('/')
        .split('/')
        .filter((segment) => !(segment.startsWith('(') && segment.endsWith(')')))

      const routePath = segments.join('/')
      const route = routePath === '' ? '' : `/${routePath}`

      // Get file modification time
      const stats = await fs.stat(file)

      return {
        url: `${baseUrl}${route}`,
        lastModified: stats.mtime,
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1 : 0.8,
      }
    })
  )

  // Sort by URL to ensure stable output
  return sitemapEntries.sort((a, b) => a.url.localeCompare(b.url))
}
