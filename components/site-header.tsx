import Link from 'next/link';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-14 items-center px-4 md:px-8 max-w-screen-xl mx-auto">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold inline-block text-gray-900">OpenCode Guide</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link href="/en/installation" className="transition-colors hover:text-gray-900 text-gray-600">English Docs</Link>
            <Link href="/zh/install" className="transition-colors hover:text-gray-900 text-gray-600">中文文档</Link>
          </nav>
        </div>
        <div className="flex-1 flex justify-end">
           {/* Placeholder for GitHub link or similar */}
        </div>
      </div>
    </header>
  );
}
