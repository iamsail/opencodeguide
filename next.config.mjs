import createMDX from '@next/mdx'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  reactStrictMode: true,
}

const withMDX = createMDX({
  options: {
    remarkPlugins: [],
    rehypePlugins: [], 
    // Temporarily disabled due to serialization issue in Next.js 15+
    // rehypePlugins: [
    //   [rehypeSlug],
    //   [rehypeAutolinkHeadings, { behavior: 'wrap' }],
    // ],
  },
})

export default withMDX(nextConfig)
