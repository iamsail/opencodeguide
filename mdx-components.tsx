import type { MDXComponents } from 'mdx/types'
import Link from 'next/link'
import { CopyButton } from '@/components/copy-button'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="mt-8 mb-4 scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl text-gray-900 dark:text-gray-50">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="mt-10 mb-4 scroll-m-20 border-b border-gray-200 dark:border-gray-800 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-gray-900 dark:text-gray-100">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-8 mb-4 scroll-m-20 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="leading-7 [&:not(:first-child)]:mt-6 text-gray-700 dark:text-gray-400">
        {children}
      </p>
    ),
    a: ({ href, children }) => {
      const isInternal = href?.startsWith('/') || href?.startsWith('#');
      if (isInternal) {
        return <Link href={href || '#'} className="font-medium text-gray-900 dark:text-gray-100 underline underline-offset-4 hover:text-gray-600 dark:hover:text-gray-300">{children}</Link>
      }
      return <a href={href} className="font-medium text-gray-900 dark:text-gray-100 underline underline-offset-4 hover:text-gray-600 dark:hover:text-gray-300" target="_blank" rel="noopener noreferrer">{children}</a>
    },
    code: ({ children, className, ...props }) => {
      // Check if the code has a language class, implying it's a block
      const isBlock = className?.includes('language-');
      
      if (isBlock) {
        return (
          <code className={className} {...props}>
            {children}
          </code>
        );
      }

      return (
        <code className={`relative rounded bg-gray-100 dark:bg-gray-800 px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-gray-900 dark:text-gray-100 ${className || ''}`} {...props}>
          {children}
        </code>
      )
    },
    pre: ({ children, ...props }) => {
      return (
        <div className="group relative mt-6 mb-4">
           <CopyButton />
           <pre
            {...props}
            className="mb-4 overflow-x-auto rounded-lg border border-gray-800 bg-gray-950 py-4"
          >
            {children}
          </pre>
        </div>
      )
    },
    ul: ({ children }) => (
      <ul className="my-6 ml-6 list-disc [&>li]:mt-2 text-gray-700 dark:text-gray-400">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="my-6 ml-6 list-decimal [&>li]:mt-2 text-gray-700 dark:text-gray-400">
        {children}
      </ol>
    ),
    table: ({ children }) => (
      <div className="my-6 w-full overflow-y-auto">
        <table className="w-full">
          {children}
        </table>
      </div>
    ),
    tr: ({ children }) => (
      <tr className="m-0 border-t p-0 even:bg-muted border-gray-200 dark:border-gray-800">
        {children}
      </tr>
    ),
    th: ({ children }) => (
      <th className="border px-4 py-2 text-left font-bold border-gray-200 dark:border-gray-800 [&[align=center]]:text-center [&[align=right]]:text-right">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border px-4 py-2 text-left border-gray-200 dark:border-gray-800 [&[align=center]]:text-center [&[align=right]]:text-right">
        {children}
      </td>
    ),
    ...components,
  }
}
