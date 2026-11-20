import createMDX from '@next/mdx'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import remarkGfm from 'remark-gfm'
import { visit } from 'unist-util-visit'

/** @type {import('rehype-pretty-code').Options} */
const options = {
  theme: 'github-dark-dimmed',
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // 成员站构建（npm run build:members）产出到独立目录，避免覆盖公开站的 out/
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  reactStrictMode: true,
  experimental: {
    mdxRs: true,
  },
}

const withMDX = createMDX({
  // options: {
  //   remarkPlugins: [remarkGfm],
  //   rehypePlugins: [
  //     rehypeSlug,
  //     [rehypePrettyCode, options],
  //     [rehypeAutolinkHeadings, { behavior: 'wrap' }],
  //   ],
  // },
})

export default withMDX(nextConfig)
