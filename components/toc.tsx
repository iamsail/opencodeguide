"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

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

  React.useEffect(() => {
    const content = document.querySelector("article")
    if (!content) return

    const headings = Array.from(content.querySelectorAll("h2, h3"))
    const items: TocItem[] = []
    
    // Simple flat list approach first for robustness
    headings.forEach((heading) => {
      const id = heading.id
      const title = heading.textContent || ""
      if (id && title) {
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
  }, [])

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
