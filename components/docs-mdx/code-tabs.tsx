"use client"

import * as React from "react"
import { CopyButton } from "@/components/copy-button"

export type CodeTab = {
  label: string
  code: string
}

/**
 * tabs 说明：mdxjs-rs（Next MDX-RS）无法解析 JSX 属性表达式中含多属性的对象字面量
 * （`{ label: "x", code: "y" }` 会在逗号处截断表达式），因此本组件约定
 * tabs 传 JSON 字符串：tabs='[{"label":"curl","code":"..."}]'
 * 组件内部 JSON.parse；为兼容手写用法也接受已解析的数组。
 */
function parseTabs(tabs: string | CodeTab[]): CodeTab[] {
  if (Array.isArray(tabs)) return tabs
  try {
    const parsed = JSON.parse(tabs)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    console.error("CodeTabs: tabs JSON 解析失败")
    return []
  }
}

export function CodeTabs({
  id,
  label,
  tabs,
}: {
  id?: string
  label?: string
  tabs: string | CodeTab[]
}) {
  const [active, setActive] = React.useState(0)
  const items = React.useMemo(() => parseTabs(tabs), [tabs])
  const current = items[active]

  if (!current) return null

  return (
    <div className="my-6" role="group" aria-label={label}>
      <div
        className="flex flex-wrap gap-1 rounded-t-lg border border-b-0 border-gray-800 bg-gray-900 px-2 pt-2"
        role="tablist"
        aria-label={label}
      >
        {items.map((tab, index) => (
          <button
            key={`${id ?? "code-tabs"}-${tab.label}`}
            role="tab"
            type="button"
            aria-selected={index === active}
            onClick={() => setActive(index)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              index === active
                ? "bg-gray-800 text-gray-100"
                : "text-gray-400 hover:bg-gray-800/60 hover:text-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="group relative">
        <CopyButton text={current.code} />
        <pre className="overflow-x-auto rounded-none rounded-b-lg border border-t-0 border-gray-800 bg-gray-950 py-4">
          <code className="text-sm text-gray-100">{current.code}</code>
        </pre>
      </div>
    </div>
  )
}
