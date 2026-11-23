import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { globby } from 'globby'
import { isPublicBuild, readAccessConfig } from './courses/access.mjs'
import { lessonRoots, resolveLessonFile } from './courses/content-paths.mjs'
import { readLessonManifest } from './courses/manifest.mjs'

/** 把课程 JSON 转成搜索索引条目（课程页是 TSX，不在 MDX 扫描范围内） */
function buildCourseEntries() {
  const dir = path.join(process.cwd(), 'content/courses')
  if (!fs.existsSync(dir)) return []

  const entries = []
  const files = fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.json') && !file.startsWith('stripe-') && file !== 'manifest.json')

  for (const file of files) {
    let course
    try {
      course = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))
    } catch {
      continue
    }
    if (!course?.slug) continue

    for (const locale of ['zh', 'en']) {
      const content = course.locales?.[locale]
      if (!content) continue
      const prefix = locale === 'zh' ? '/zh/courses' : '/en/courses'
      entries.push({
        title: content.title,
        url: `${prefix}/${course.slug}`,
        content: [content.subtitle, content.seo?.description].filter(Boolean).join(' ').slice(0, 500),
        category: locale === 'zh' ? 'Chinese' : 'English',
      })
    }

    const zh = course.locales?.zh
    if (zh) {
      entries.push({
        title: `${zh.title}（课程总览）`,
        url: '/zh/courses',
        content: (zh.tagline || zh.subtitle || '').slice(0, 300),
        category: 'Chinese',
      })
    }
  }

  return entries
}

/**
 * 课程正文（文章版）的搜索条目。
 * 课时页是动态路由，不在 app/**\/*.mdx 的扫描范围里，所以单独读 content。
 */
function buildLessonEntries() {
  const manifest = readLessonManifest()
  if (!manifest) return []

  const roots = lessonRoots()
  const { freeLessonLimit } = readAccessConfig()
  const entries = []

  for (const course of manifest.courses) {
    for (const [locale, lessons] of Object.entries(course.locales ?? {})) {
      const prefix = locale === 'zh' ? '/zh/courses' : '/en/courses'

      lessons.forEach((lesson, index) => {
        // 免费额度按 manifest 顺序算 —— 与课时页、sitemap 用的是同一个「第几节」，
        // 不能按「磁盘上恰好有哪几个文件」排序，否则少文件会把付费节错标成免费。
        const free = lesson.trial === true || index < freeLessonLimit
        const file = resolveLessonFile({ locale, course: course.slug, slug: lesson.slug }, roots)

        // 公开构建里付费节的正文不能进索引：search.json 是全站公开文件
        const includeBody = !isPublicBuild() || free

        let body = ''
        if (includeBody && file) {
          try {
            body = matter(fs.readFileSync(file, 'utf8'))
              .content.replace(/```[\s\S]*?```/g, '')
              .replace(/[#*\[\]()_`>|-]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
              .slice(0, 400)
          } catch {
            body = ''
          }
        }

        entries.push({
          title: lesson.title || lesson.slug,
          url: `${prefix}/${course.slug}/${lesson.slug}`,
          content: [lesson.summary, body].filter(Boolean).join(' ').slice(0, 500),
          category: locale === 'zh' ? 'Chinese' : 'English',
        })
      })
    }
  }

  return entries
}

async function buildSearchIndex() {
  const pages = await globby(['app/**/*.mdx'])
  
  const searchIndex = pages.map((pagePath) => {
    const content = fs.readFileSync(pagePath, 'utf8')
    // Simple heuristic to get title: find first # Heading
    const titleMatch = content.match(/^#\s+(.+)$/m)
    const title = titleMatch ? titleMatch[1] : path.basename(pagePath, '.mdx')
    
    // Normalize path: app/(main)/en/page.mdx -> /en/page
    let url = pagePath
      .replace(/^app\//, '')
      .replace(/\/\(.*\)/g, '') // remove route groups like (main)
      .replace(/\/page\.mdx$/, '')
    
    // Ensure leading slash
    if (!url.startsWith('/')) url = '/' + url

    // Remove code blocks and frontmatter for search content
    const cleanContent = content
      .replace(/---[\s\S]*?---/, '') // remove frontmatter
      .replace(/```[\s\S]*?```/g, '') // remove code blocks
      .replace(/[#*\[\]()_`]/g, '') // remove markdown syntax
      .replace(/\s+/g, ' ') // collapse whitespace
      .trim()
      .slice(0, 500) // limit content length to keep index small

    return {
      title,
      url,
      content: cleanContent,
      category: url.startsWith('/zh') ? 'Chinese' : 'English'
    }
  })

  // 课程页与课时正文，去重同 URL
  const seen = new Set(searchIndex.map((entry) => entry.url))
  for (const entry of [...buildCourseEntries(), ...buildLessonEntries()]) {
    if (seen.has(entry.url)) continue
    seen.add(entry.url)
    searchIndex.push(entry)
  }

  // Ensure public folder exists
  if (!fs.existsSync('public')) {
    fs.mkdirSync('public')
  }

  fs.writeFileSync('public/search.json', JSON.stringify(searchIndex))
  console.log(`Updated search index with ${searchIndex.length} pages`)
}

buildSearchIndex()
