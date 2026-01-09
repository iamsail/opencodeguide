import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://opencodeguide.com'
  
  // Base routes
  const routes = [
    '',
    '/en/installation',
    '/en/what-is-opencode',
    '/en/opencode-vs-claude-code',
    '/en/opencode-with-ollama',
    '/en/mcp-explained',
    '/en/neovim-integration',
    '/en/cli-commands',
    '/en/use-cases',
    '/zh/what-is-opencode',
    '/zh/install',
    '/zh/ollama-local-deploy',
    '/zh/vs-claude-code',
    '/zh/what-is-mcp',
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.8,
  }))
}
