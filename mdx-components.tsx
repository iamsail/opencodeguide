import type { MDXComponents } from 'mdx/types'
import Link from 'next/link'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="mt-8 mb-4 scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl text-gray-900">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="mt-10 mb-4 scroll-m-20 border-b border-gray-200 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-gray-900">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-8 mb-4 scroll-m-20 text-2xl font-semibold tracking-tight text-gray-900">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="leading-7 [&:not(:first-child)]:mt-6 text-gray-700">
        {children}
      </p>
    ),
    a: ({ href, children }) => {
      const isInternal = href?.startsWith('/') || href?.startsWith('#');
      if (isInternal) {
        return <Link href={href || '#'} className="font-medium text-gray-900 underline underline-offset-4 hover:text-gray-600">{children}</Link>
      }
      return <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-gray-900 underline underline-offset-4 hover:text-gray-600">{children}</a>
    },
    code: ({ children }) => (
      <code className="relative rounded bg-gray-100 px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-gray-900">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="mb-4 mt-6 overflow-x-auto rounded-lg border border-gray-800 bg-gray-950 py-4 text-gray-50">
        {children}
      </pre>
    ),
    ul: ({ children }) => (
      <ul className="my-6 ml-6 list-disc [&>li]:mt-2 text-gray-700">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="my-6 ml-6 list-decimal [&>li]:mt-2 text-gray-700">
        {children}
      </ol>
    ),
    ...components,
  }
}
