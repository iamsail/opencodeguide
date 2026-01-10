"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"

export function CopyButton({ text }: { text?: string }) {
  const [isCopied, setIsCopied] = React.useState(false)

  const copy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    let textToCopy = text

    if (!textToCopy) {
      // Find the sibling <pre> element
      const button = e.currentTarget
      const container = button.parentElement
      const pre = container?.querySelector("pre")
      
      if (pre) {
        textToCopy = pre.innerText
      }
    }

    if (!textToCopy) return

    await navigator.clipboard.writeText(textToCopy)
    setIsCopied(true)

    setTimeout(() => {
      setIsCopied(false)
    }, 2000)
  }

  return (
    <button
      disabled={isCopied}
      onClick={copy}
      className="absolute right-4 top-4 z-20 inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-700 bg-gray-800 text-gray-400 opacity-0 transition-all hover:bg-gray-700 hover:text-gray-100 group-hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-900"
    >
      {isCopied ? (
        <Check className="h-4 w-4" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
      <span className="sr-only">Copy code</span>
    </button>
  )
}
