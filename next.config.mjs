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
}

const withMDX = createMDX({
  options: {
    remarkPlugins: [],
    rehypePlugins: [
      () => (tree) => {
        visit(tree, (node) => {
          if (node?.type === 'element' && node?.tagName === 'pre') {
            const [codeEl] = node.children
            if (codeEl.tagName !== 'code') return
            
            node.properties['data-raw-code'] = codeEl.children?.[0].value
          }
        })
      },
      [rehypePrettyCode, options],
    ], 
  },
})

export default withMDX(nextConfig)
