/**
 * ② 对比 .upstream/manifest.json 与上次处理记录，产出待处理清单。
 * 处理记录写在 .upstream/processed.json：{ [slug]: { upstreamSha, action, localUrl, processedAt } }
 *
 * 用法: node scripts/docs-sync/diff.mjs [--force] [--only slug1,slug2]
 */
import { promises as fs } from "node:fs"
import path from "node:path"
import { UPSTREAM_DIR, loadPageMap } from "./lib.mjs"

const PROCESSED_PATH = path.join(UPSTREAM_DIR, "processed.json")

export async function loadProcessed() {
  try {
    return JSON.parse(await fs.readFile(PROCESSED_PATH, "utf8"))
  } catch {
    return {}
  }
}

export async function saveProcessed(processed) {
  await fs.writeFile(PROCESSED_PATH, JSON.stringify(processed, null, 2), "utf8")
}

export async function diffUpstream({ force = false, only = null } = {}) {
  const pageMap = await loadPageMap()
  const manifest = JSON.parse(
    await fs.readFile(path.join(UPSTREAM_DIR, "manifest.json"), "utf8")
  )
  const processed = await loadProcessed()

  const onlySet = only ? new Set(only.split(",").map((s) => s.trim())) : null
  const plan = []

  for (const [slug, entry] of Object.entries(manifest.files)) {
    if (onlySet && !onlySet.has(slug)) continue
    const mapping = pageMap.pages[slug]
    if (!mapping) continue // fetch 阶段已对 unknown 报错，这里是防御
    if (mapping.action === "defer") continue

    const prev = processed[slug]
    const upstreamChanged = !prev || prev.upstreamSha !== entry.sha
    // force 时即使上游没变也重新处理；否则仅上游变化时处理
    if (!force && !upstreamChanged) continue

    plan.push({
      slug,
      action: mapping.action,
      localUrl: mapping.localUrl,
      titleZh: mapping.titleZh,
      section: mapping.section,
      upstreamSha: entry.sha,
      prevUpstreamSha: prev?.upstreamSha ?? null,
      alreadyProcessed: Boolean(prev),
    })
  }

  return { plan, manifest, pageMap }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const force = process.argv.includes("--force")
  const onlyIndex = process.argv.indexOf("--only")
  const only = onlyIndex >= 0 ? process.argv[onlyIndex + 1] : null
  diffUpstream({ force, only })
    .then(({ plan, manifest }) => {
      console.log(`上游 commit=${manifest.commitSha.slice(0, 7)}，待处理 ${plan.length} 页：`)
      for (const p of plan) {
        console.log(`  [${p.action}] ${p.slug} → ${p.localUrl}${p.alreadyProcessed ? " (更新)" : ""}`)
      }
    })
    .catch((err) => {
      console.error("✖ diff 失败:", err.message)
      process.exit(1)
    })
}
