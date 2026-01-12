import createMDX from '@next/mdx'
import rehypePrettyCode from 'rehype-pretty-code'
import { visit } from 'unist-util-visit'

/** @type {import('rehype-pretty-code').Options} */
const options = {
  theme: 'github-dark-dimmed',
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/zh/opencode-install',
        destination: '/zh/install',
        permanent: true,
      },
      {
        source: '/en/mcp-explained',
        destination: '/en/mcp',
        permanent: true,
      },
    ]
  },
}

const withMDX = createMDX({
  options: {
    remarkPlugins: [],
    rehypePlugins: [], 
    // rehypePlugins: [
    //   [rehypePrettyCode, options],
    // ], 
  },
})

export default withMDX(nextConfig)
