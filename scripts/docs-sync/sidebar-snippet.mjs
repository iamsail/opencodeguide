/**
 * 侧边栏辅助：根据 page-map.json 中的 sidebar 声明，
 * 生成 docsConfigZh 各分组的追加条目 TS 片段，供 Phase 3 人工合入 lib/docs-config.ts。
 *
 * 用法: node scripts/docs-sync/sidebar-snippet.mjs [--action create]
 */
import { loadPageMap } from "./lib.mjs"

const GROUP_LABELS = {
  intro: "Intro (入门)",
  usage: "Usage (使用指南)",
  configure: "Configure (详细配置)",
  develop: "Develop (开发)",
  console: "Console (控制台)",
}

async function main() {
  const actionIndex = process.argv.indexOf("--action")
  const onlyAction = actionIndex >= 0 ? process.argv[actionIndex + 1] : null
  const pageMap = await loadPageMap()

  const groups = new Map()
  for (const [slug, entry] of Object.entries(pageMap.pages)) {
    if (!entry.sidebar) continue
    if (onlyAction && entry.action !== onlyAction) continue
    const group = entry.sidebar.group
    if (!groups.has(group)) groups.set(group, [])
    groups.get(group).push({ title: entry.sidebar.title, href: entry.localUrl, slug })
  }

  for (const [group, items] of groups) {
    console.log(`// —— ${GROUP_LABELS[group] ?? group} 追加条目 ——`)
    for (const item of items) {
      console.log(`      { title: "${item.title}", href: "${item.href}" },   // ${item.slug}`)
    }
    console.log("")
  }
}

main()
