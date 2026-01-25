import { DocsSidebar, DocsMobileNav } from '@/components/docs-sidebar'
import { TableOfContents } from '@/components/toc'
import { docsConfigZh } from '@/lib/docs-config'

export default function ArticleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)_200px] lg:gap-10 px-4 mx-auto max-w-7xl">
      <DocsSidebar config={docsConfigZh} />
      <main className="relative py-6 lg:py-8 w-full min-w-0">
        <DocsMobileNav config={docsConfigZh} />
        <article className="prose prose-gray max-w-none dark:prose-invert">
          {children}
        </article>
      </main>
      <div className="hidden text-sm lg:block">
        <div className="sticky top-16 -mt-10 h-[calc(100vh-3.5rem)] overflow-hidden pt-6">
          <TableOfContents />
        </div>
      </div>
    </div>
  )
}
