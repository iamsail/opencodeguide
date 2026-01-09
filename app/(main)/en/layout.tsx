export default function EnDocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container max-w-4xl py-6 lg:py-10 px-4 mx-auto">
      <article className="prose prose-gray max-w-none dark:prose-invert">
        {children}
      </article>
    </div>
  )
}
