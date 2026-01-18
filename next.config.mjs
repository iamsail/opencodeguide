import createMDX from '@next/mdx'

/** @type {import('rehype-pretty-code').Options} */
const options = {
  theme: 'github-dark-dimmed',
}


const withMDX = createMDX({
  options: {
    remarkPlugins: ['remark-gfm'], // 使用字符串而非对象
    rehypePlugins: [
      ['rehype-pretty-code', options]
    ],
  },
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  reactStrictMode: true,
  experimental: {
    mdxRs: false, // 必须设置为 false，否则 remarkPlugins 不生效
  },
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

export default withMDX(nextConfig)
