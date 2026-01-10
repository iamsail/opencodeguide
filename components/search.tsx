"use client"

import * as React from "react"
import { Command } from "cmdk"
import { Search as SearchIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import Fuse from "fuse.js"
import { cn } from "@/lib/utils"

interface SearchResult {
  title: string
  url: string
  content: string
  category: string
}

export function Search() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [data, setData] = React.useState<SearchResult[]>([])
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  React.useEffect(() => {
    if (open && data.length === 0) {
      fetch("/search.json")
        .then((res) => res.json())
        .then((json) => setData(json))
    }
  }, [open, data.length])

  const fuse = React.useMemo(() => {
    return new Fuse(data, {
      keys: ["title", "content"],
      threshold: 0.3,
    })
  }, [data])

  const results = React.useMemo(() => {
    if (!query) return []
    return fuse.search(query).map((result) => result.item)
  }, [query, fuse])

  const handleSelect = (url: string) => {
    setOpen(false)
    router.push(url)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-500 hover:border-gray-300 transition-colors dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
      >
        <SearchIcon className="h-4 w-4" />
        <span className="hidden sm:inline-block">Search...</span>
        <span className="hidden sm:inline-block text-xs text-gray-400">⌘K</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <Command 
             className="relative w-full max-w-lg overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-950"
             shouldFilter={false} // We rely on Fuse.js for filtering
          >
            <div className="flex items-center border-b border-gray-200 px-3 dark:border-gray-800">
              <SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Command.Input 
                value={query}
                onValueChange={setQuery}
                placeholder="Search documentation..."
                className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <Command.List className="max-h-[300px] overflow-y-auto p-2">
              {!query && (
                <div className="py-6 text-center text-sm text-gray-500">
                  Type to search...
                </div>
              )}
              {query && results.length === 0 && (
                <div className="py-6 text-center text-sm text-gray-500">
                  No results found.
                </div>
              )}
              {results.length > 0 && (
                 <div className="text-gray-900 dark:text-gray-100">
                    {results.map((result) => (
                      <Command.Item
                        key={result.url}
                        value={result.url}
                        onSelect={() => handleSelect(result.url)}
                        className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:aria-selected:bg-gray-800"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{result.title}</span>
                          <span className="text-xs text-gray-500 truncate max-w-[400px]">
                            {result.content}
                          </span>
                        </div>
                        <span className="ml-auto text-xs text-gray-400 capitalize">
                          {result.category}
                        </span>
                      </Command.Item>
                    ))}
                 </div>
              )}
            </Command.List>
          </Command>
        </div>
      )}
    </>
  )
}
