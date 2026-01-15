import Link from 'next/link';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Search } from '@/components/search';
import { ThemeToggle } from '@/components/theme-toggle';

interface SiteHeaderProps {
  lang?: "en" | "zh";
}

export function SiteHeader({ lang = "en" }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-gray-800 dark:bg-gray-950/95 dark:supports-[backdrop-filter]:bg-gray-950/60">
      <div className="container flex h-14 items-center px-4 md:px-8 max-w-screen-xl mx-auto">
        <div className="mr-4 flex items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold inline-block text-gray-900 dark:text-gray-100">OpenCode Guide</span>
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-end space-x-4">
          <nav className="flex items-center space-x-6 text-sm font-medium mr-4">
            {lang === "zh" ? (
               <>
                 <Link href="/zh/opencode" className="transition-colors hover:text-gray-800/80 text-gray-600 dark:text-gray-300 dark:hover:text-gray-100">
                   指南
                 </Link>
                 <Link href="/zh/docs" className="transition-colors hover:text-gray-800/80 text-gray-600 dark:text-gray-300 dark:hover:text-gray-100">
                   文档中心
                 </Link>
               </>
            ) : (
                <>
                  <Link href="/en/what-is-opencode" className="transition-colors hover:text-gray-800/80 text-gray-600 dark:text-gray-300 dark:hover:text-gray-100">
                    Docs
                  </Link>
                </>
            )}
          </nav>
          <Search />
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
