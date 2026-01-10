import fs from 'fs'
import path from 'path'
import { globby } from 'globby'

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

  // Ensure public folder exists
  if (!fs.existsSync('public')) {
    fs.mkdirSync('public')
  }

  fs.writeFileSync('public/search.json', JSON.stringify(searchIndex))
  console.log(`Updated search index with ${searchIndex.length} pages`)
}

buildSearchIndex()
