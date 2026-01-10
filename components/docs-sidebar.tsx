'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DocsConfig } from '@/lib/docs-config'
import { cn } from '@/lib/utils'

interface DocsSidebarProps {
  config: DocsConfig
}

export function DocsSidebar({ config }: DocsSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="fixed top-14 z-30 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
      <div className="h-full overflow-y-auto py-6 pr-6 lg:py-8">
        {config.map((section, index) => (
          <div key={index} className="pb-4">
            <h4 className="mb-1 rounded-md px-2 py-1 text-sm font-semibold text-gray-900">
              {section.title}
            </h4>
            <div className="grid grid-flow-row auto-rows-max text-sm">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.disabled ? '#' : item.href}
                  className={cn(
                    "group flex w-full items-center rounded-md border border-transparent px-2 py-1.5 hover:underline",
                    item.disabled && "cursor-not-allowed opacity-60",
                    pathname === item.href
                      ? "font-medium text-gray-900 underline" // Active state
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}

interface DocsMobileNavProps {
  config: DocsConfig
}

export function DocsMobileNav({ config }: DocsMobileNavProps) {
  const pathname = usePathname()
  
  // Find current section/page title for the summary
  let currentTitle = "Menu"
  for (const section of config) {
    for (const item of section.items) {
      if (item.href === pathname) {
        currentTitle = item.title
        break
      }
    }
  }

  return (
    <div className="block md:hidden mb-8">
      <details className="group rounded-lg border border-gray-200 bg-gray-50">
        <summary className="flex cursor-pointer items-center justify-between px-4 py-3 font-medium text-gray-900 hover:bg-gray-100">
          <span className="flex items-center gap-2">
            <span className="text-gray-500">Navigate:</span> {currentTitle}
          </span>
          <span className="transition-transform group-open:rotate-180">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </span>
        </summary>
        <div className="border-t border-gray-200 px-4 py-4">
          {config.map((section, index) => (
            <div key={index} className="pb-4 last:pb-0">
              <h4 className="mb-2 font-semibold text-gray-900">{section.title}</h4>
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "block rounded-md px-3 py-2 text-sm transition-colors",
                         pathname === item.href
                          ? "bg-gray-200 font-medium text-gray-900"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      )}
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </details>
    </div>
  )
}
