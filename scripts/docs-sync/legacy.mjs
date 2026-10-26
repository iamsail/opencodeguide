/**
 * Phase 2.2：为 v1 独有页注入迁移提示（页首 Callout，正文与 metadata 不动）。
 * 数据来源：page-map.json 的 legacy 节。幂等：已含标记注释则跳过。
 *
 * 用法: node scripts/docs-sync/legacy.mjs [--dry-run]
 */
import { promises as fs } from "node:fs"
import { loadPageMap, localUrlToMdxPath } from "./lib.mjs"

const MARKER = "{/* v2-legacy-banner */}"

function buildBanner(note, target) {
  const linkText = target.startsWith("http") ? "官方 v2 文档" : "相关页面"
  return `${MARKER}
<Callout type="note">
  本页基于 OpenCode v1 文档编写，部分内容可能已过时。${note}请参阅 [${linkText}](${target}) 获取最新信息。
</Callout>
`
}

/** 在 metadata 导出块之后（或文件开头）插入 banner */
function injectBanner(source, banner) {
  const metaMatch = source.match(/export const metadata = \{[\s\S]*?\n\}/)
  if (metaMatch) {
    const idx = source.indexOf(metaMatch[0]) + metaMatch[0].length
    return `${source.slice(0, idx)}\n\n${banner}\n${source.slice(idx).replace(/^\s*\n/, "")}`
  }
  return `${banner}\n${source}`
}

async function main() {
  const dryRun = process.argv.includes("--dry-run")
  const pageMap = await loadPageMap()
  const results = []

  for (const [localUrl, entry] of Object.entries(pageMap.legacy ?? {})) {
    if (localUrl.startsWith("$")) continue // $comment 键
    const mdxPath = localUrlToMdxPath(localUrl)
    let source
    try {
      source = await fs.readFile(mdxPath, "utf8")
    } catch {
      results.push({ localUrl, status: "missing" })
      continue
    }
    if (source.includes(MARKER)) {
      results.push({ localUrl, status: "skipped" })
      continue
    }
    const banner = buildBanner(entry.note, entry.target)
    const next = injectBanner(source, banner)
    if (!dryRun) {
      await fs.writeFile(mdxPath, next, "utf8")
    }
    results.push({ localUrl, status: dryRun ? "would-inject" : "injected" })
  }

  for (const r of results) {
    console.log(`  [${r.status}] ${r.localUrl}`)
  }
  const counts = results.reduce((acc, r) => ((acc[r.status] = (acc[r.status] ?? 0) + 1), acc), {})
  console.log(`✔ legacy 处理完成: ${JSON.stringify(counts)}`)
}

main().catch((err) => {
  console.error("✖ legacy 注入失败:", err)
  process.exit(1)
})
