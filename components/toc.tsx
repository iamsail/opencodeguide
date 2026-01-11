"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"

interface TocItem {
  title: string
  url: string
  items?: TocItem[]
}

interface TableOfContentsProps {
  className?: string
}

export function TableOfContents({ className }: TableOfContentsProps) {
  const [items, setItems] = React.useState<TocItem[]>([])
  const [activeId, setActiveId] = React.useState<string>()
  const pathname = usePathname()

  React.useEffect(() => {
    const content = document.querySelector("article")
    if (!content) return

    const headings = Array.from(content.querySelectorAll("h2, h3"))
    const items: TocItem[] = []

    const slugify = (value: string) => {
      return value
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[\u0000-\u001f\u007f]+/g, '')
        .replace(/["'`~!@#$%^&*()+=\[\]{}|\\:;,.?<>/]+/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
    }

    const usedIds = new Set<string>()
    const ensureUniqueId = (base: string) => {
      const fallbackBase = base || 'section'
      let candidate = fallbackBase
      let counter = 2
      while (usedIds.has(candidate) || document.getElementById(candidate)) {
        candidate = `${fallbackBase}-${counter}`
        counter += 1
      }
      usedIds.add(candidate)
      return candidate
    }
    
    // Simple flat list approach first for robustness
    headings.forEach((heading) => {
      const title = heading.textContent || ""
      if (!title) return

      if (!heading.id) {
        // Prefer existing anchor id if present (e.g., rehype-autolink-headings)
        const maybeAnchor = heading.querySelector('a[href^="#"]') as HTMLAnchorElement | null
        const hrefId = maybeAnchor?.getAttribute('href')?.slice(1)
        if (hrefId) {
          heading.id = hrefId
        } else {
          heading.id = ensureUniqueId(slugify(title))
        }
      }

      const id = heading.id
      if (id) {
        items.push({
          title,
          url: `#${id}`,
        })
      }
    })

    setItems(items)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: "0% 0% -80% 0%" }
    )

    headings.forEach((heading) => observer.observe(heading))

    return () => {
      headings.forEach((heading) => observer.unobserve(heading))
    }
  }, [pathname])

  if (!items?.length) {
    return null
  }

  return (
    <div className={cn("space-y-2", className)}>
      <p className="font-medium text-sm text-gray-900">On This Page</p>
      <ul className="m-0 list-none">
        {items.map((item) => (
          <li key={item.url} className="mt-0 pt-2">
            <a
              href={item.url}
              className={cn(
                "inline-block no-underline transition-colors hover:text-gray-900",
                item.url === `#${activeId}`
                  ? "font-medium text-gray-900"
                  : "text-gray-600"
              )}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
