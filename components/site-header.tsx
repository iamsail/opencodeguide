import Link from 'next/link';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Search } from '@/components/search';
import { ThemeToggle } from '@/components/theme-toggle';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-gray-800 dark:bg-gray-950/95 dark:supports-[backdrop-filter]:bg-gray-950/60">
      <div className="container flex h-14 items-center px-4 md:px-8 max-w-screen-xl mx-auto">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold inline-block text-gray-900 dark:text-gray-100">OpenCode Guide</span>
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-end space-x-4">
          <Search />
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
