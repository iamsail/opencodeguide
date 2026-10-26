import * as React from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function Card({
  title,
  href,
  children,
}: {
  title: string
  href?: string
  children: React.ReactNode
}) {
  const body = (
    <>
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        {href && (
          <ArrowRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5" />
        )}
      </div>
      <div className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">
        {children}
      </div>
    </>
  )

  const className =
    "group block h-full rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-gray-300 dark:border-gray-800 dark:bg-gray-950 dark:hover:border-gray-700"

  if (href) {
    const isInternal = href.startsWith("/") || href.startsWith("#")
    if (isInternal) {
      return (
        <Link href={href} className={className}>
          {body}
        </Link>
      )
    }
    return (
      <a
        href={href}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
      >
        {body}
      </a>
    )
  }

  return <div className={className}>{body}</div>
}

export function CardGroup({
  cols = 2,
  children,
}: {
  cols?: number
  children: React.ReactNode
}) {
  const columnClass =
    cols >= 3
      ? "sm:grid-cols-2 lg:grid-cols-3"
      : cols === 2
        ? "sm:grid-cols-2"
        : "grid-cols-1"

  return (
    <div className={`my-6 grid gap-4 ${columnClass}`}>{children}</div>
  )
}
