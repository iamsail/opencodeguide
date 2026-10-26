/**
 * 编排器：fetch → diff → transform → translate → generate → validate → report
 *
 * 用法:
 *   npm run docs:sync                      # 全量（上游有变更的页）
 *   npm run docs:sync -- --only index,config
 *   npm run docs:sync -- --force           # 忽略上游 diff，全部重译
 *   npm run docs:sync -- --dry-run         # 只 fetch+diff，不翻译不写文件
 *   npm run docs:sync -- --no-build        # validate 跳过 npm run build
 *   npm run docs:sync -- --ref <branch|sha>
 */
import { promises as fs } from "node:fs"
import path from "node:path"
import { fetchUpstream } from "./fetch.mjs"
import { diffUpstream, loadProcessed, saveProcessed } from "./diff.mjs"
import { transformSource } from "./transform.mjs"
import { translatePage } from "./translate.mjs"
import { generatePage, extractBody } from "./generate.mjs"
import { validateDocs } from "./validate.mjs"
import { writeReport } from "./report.mjs"
import { UPSTREAM_DIR, loadPageMap } from "./lib.mjs"

function argValue(flag) {
  const i = process.argv.indexOf(flag)
  return i >= 0 ? process.argv[i + 1] : undefined
}

async function main() {
  const only = argValue("--only")
  const force = process.argv.includes("--force")
  const dryRun = process.argv.includes("--dry-run")
  const noBuild = process.argv.includes("--no-build")
  const ref = argValue("--ref")

  console.log("① fetch 上游…")
  let manifest
  if (process.argv.includes("--skip-fetch")) {
    manifest = JSON.parse(
      await fs.readFile(
        new URL("../../.upstream/manifest.json", import.meta.url),
        "utf8"
      )
    )
    console.log(`  ⚠ --skip-fetch：使用本地快照 commit=${String(manifest.commitSha).slice(0, 7)}`)
  } else {
    const fetched = await fetchUpstream({ ref, token: process.env.GITHUB_TOKEN })
    manifest = fetched.manifest
    if (fetched.unknown.length) {
      console.error(`✖ 上游有 page-map 未声明的 slug：${fetched.unknown.map((u) => u.slug).join(", ")}`)
      process.exit(1)
    }
    if (fetched.missing.length) {
      console.error(`✖ page-map 声明但上游缺失：${fetched.missing.join(", ")}`)
      process.exit(1)
    }
    console.log(`  commit=${manifest.commitSha.slice(0, 7)} files=${Object.keys(manifest.files).length}`)
  }

  console.log("② diff…")
  const { plan } = await diffUpstream({ force, only })
  if (!plan.length) {
    console.log("✔ 无待处理页面（上游未变更）。")
    return
  }
  for (const p of plan) console.log(`  [${p.action}] ${p.slug} → ${p.localUrl}`)

  if (dryRun) {
    console.log("✔ dry-run 结束（未翻译、未写文件）。")
    return
  }

  const pageMap = await loadPageMap()
  const processed = await loadProcessed()
  const results = []
  const failures = []

  for (const item of plan) {
    process.stdout.write(`③④⑤ 处理 ${item.slug} … `)
    try {
      const source = await fs.readFile(
        path.join(UPSTREAM_DIR, "content", `${item.slug}.mdx`),
        "utf8"
      )
      const { body } = transformSource(source, pageMap)

      // update 模式：读现有中文旧文作风格参照
      let existingZh = null
      const { localUrlToMdxPath } = await import("./lib.mjs")
      try {
        existingZh = extractBody(
          await fs.readFile(localUrlToMdxPath(item.localUrl), "utf8")
        )
      } catch {
        /* create */
      }

      const translated = await translatePage({
        slug: item.slug,
        upstreamSha: item.upstreamSha,
        titleZh: item.titleZh,
        body,
        existingZh,
        force,
      })

      const { mode, mdxPath } = await generatePage({
        slug: item.slug,
        action: item.action,
        localUrl: item.localUrl,
        titleZh: item.titleZh,
        translatedTitle: translated.title,
        translatedBody: translated.body,
      })

      processed[item.slug] = {
        upstreamSha: item.upstreamSha,
        action: item.action,
        localUrl: item.localUrl,
        processedAt: new Date().toISOString(),
      }
      results.push({ slug: item.slug, action: item.action, localUrl: item.localUrl, mode, cached: translated.cached, titleZh: item.titleZh })
      console.log(`${mode}${translated.cached ? " (缓存)" : ""}`)
    } catch (err) {
      failures.push({ slug: item.slug, error: err.message })
      console.log(`✖ ${err.message.split("\n")[0]}`)
    }
  }

  await saveProcessed(processed)

  console.log("⑥ validate…")
  const validation = await validateDocs({ skipBuild: noBuild })
  console.log(`  断链 ${validation.brokenLinks.length}，计划中链接 ${validation.plannedLinks?.length ?? 0}，多行 HTML table ${validation.tableWarnings.length}，build ${validation.buildOk ? "通过" : "失败"}`)

  const reportPath = await writeReport({ manifest, results, failures })
  console.log(`⑦ 报告: ${path.relative(process.cwd(), reportPath)}`)

  if (failures.length || validation.brokenLinks.length || !validation.buildOk) {
    process.exit(1)
  }
  console.log("✔ 同步完成。")
}

main().catch((err) => {
  console.error("✖ 同步失败:", err)
  process.exit(1)
})
