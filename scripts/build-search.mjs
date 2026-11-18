import fs from 'fs'
import path from 'path'
import { globby } from 'globby'

/** 把课程 JSON 转成搜索索引条目（课程页是 TSX，不在 MDX 扫描范围内） */
function buildCourseEntries() {
  const dir = path.join(process.cwd(), 'content/courses')
  if (!fs.existsSync(dir)) return []

  const entries = []
  const files = fs.readdirSync(dir).filter((file) => file.endsWith('.json') && !file.startsWith('stripe-'))

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

  // 课程页（含中英双语），去重同 URL
  const seen = new Set(searchIndex.map((entry) => entry.url))
  for (const entry of buildCourseEntries()) {
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
