"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, Languages } from "lucide-react"
import { cn } from "@/lib/utils"

export function LanguageSwitcher() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Default to English unless path starts with /zh
  const isZh = pathname?.startsWith("/zh")
  const currentLabel = isZh ? "中文" : "English"

  // Close on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Languages className="h-4 w-4" />
        <span>{currentLabel}</span>
        <ChevronDown className={cn("h-3 w-3 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-32 rounded-md border border-gray-200 bg-white p-1 shadow-md animate-in fade-in zoom-in-95 duration-100">
          <Link
            href="/en/installation"
            className={cn(
              "flex w-full items-center rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-gray-100",
              !isZh && "bg-gray-50 font-medium text-gray-900"
            )}
            onClick={() => setIsOpen(false)}
          >
            English
          </Link>
          <Link
            href="/zh/install"
            className={cn(
              "flex w-full items-center rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-gray-100",
              isZh && "bg-gray-50 font-medium text-gray-900"
            )}
            onClick={() => setIsOpen(false)}
          >
            中文
          </Link>
        </div>
      )}
    </div>
  )
}
