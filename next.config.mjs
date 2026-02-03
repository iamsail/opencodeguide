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
