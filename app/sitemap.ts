import { MetadataRoute } from 'next'
import { promises as fs } from 'fs'
import path from 'path'
import { getCourseSlugs } from '@/lib/courses'
import { getCourseLessons } from '@/lib/course-lessons'

export const dynamic = 'force-static'

const BASE_URL = 'https://opencodeguide.com'

async function getPageFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  let files: string[] = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      // 跳过动态路由（[slug] 由 generateStaticParams 展开，单独补充）
      if (!entry.name.startsWith('_') && !entry.name.startsWith('.') && !entry.name.includes('[')) {
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

      let priority = 0.8
      if (route === '') priority = 1.0
      else if (route.startsWith('/zh/courses') || route.startsWith('/en/courses')) priority = 0.95
      else if (route === '/en/mcp') priority = 0.95
      else if (route === '/en/mcp-client') priority = 0.7
      else if (route === '/en/mcp-configuration') priority = 0.7

      return {
        url: `${BASE_URL}${route}`,
        lastModified: stats.mtime,
        changeFrequency: 'weekly' as const,
        priority,
      }
    })
  )

  // 课程详情页（动态路由）单独补充，并声明中英文 alternate
  const courseEntries: MetadataRoute.Sitemap = getCourseSlugs().flatMap((slug) => [
    {
      url: `${BASE_URL}/zh/courses/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
      alternates: {
        languages: {
          en: `${BASE_URL}/en/courses/${slug}`,
          'zh-CN': `${BASE_URL}/zh/courses/${slug}`,
        },
      },
    },
    {
      url: `${BASE_URL}/en/courses/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
      alternates: {
        languages: {
          en: `${BASE_URL}/en/courses/${slug}`,
          'zh-CN': `${BASE_URL}/zh/courses/${slug}`,
        },
      },
    },
  ])

  // 课时正文（文章版）：每节一篇，中英各自声明
  const lessonEntries: MetadataRoute.Sitemap = getCourseSlugs().flatMap((slug) => {
    const zhLessons = getCourseLessons(slug, 'zh')
    const enLessons = getCourseLessons(slug, 'en')
    const lessonSlugs = new Set([...zhLessons.map((l) => l.slug), ...enLessons.map((l) => l.slug)])

    return [...lessonSlugs].flatMap((lesson) => {
      const zhPath = `/zh/courses/${slug}/${lesson}`
      const enPath = `/en/courses/${slug}/${lesson}`
      const entries: MetadataRoute.Sitemap = []

      if (zhLessons.some((l) => l.slug === lesson)) {
        entries.push({
          url: `${BASE_URL}${zhPath}`,
          lastModified: new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.7,
          alternates: { languages: { 'zh-CN': `${BASE_URL}${zhPath}`, en: `${BASE_URL}${enPath}` } },
        })
      }
      if (enLessons.some((l) => l.slug === lesson)) {
        entries.push({
          url: `${BASE_URL}${enPath}`,
          lastModified: new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.7,
          alternates: { languages: { 'zh-CN': `${BASE_URL}${zhPath}`, en: `${BASE_URL}${enPath}` } },
        })
      }

      return entries
    })
  })

  // 感谢页是 noindex 的，从 sitemap 中剔除
  const filtered = sitemapEntries.filter((entry) => !entry.url.includes('/courses/thank-you'))

  // Sort by URL to ensure stable output
  return [...filtered, ...courseEntries, ...lessonEntries].sort((a, b) => a.url.localeCompare(b.url))
}
