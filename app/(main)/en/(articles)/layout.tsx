export default function ArticleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container mx-auto max-w-3xl py-6 lg:py-10 px-4">
      <div className="prose prose-gray dark:prose-invert max-w-none">
        {children}
      </div>
    </div>
  )
}
