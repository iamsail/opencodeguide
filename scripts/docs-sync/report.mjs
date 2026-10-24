/**
 * ⑦ 生成 SYNC_REPORT.md
 */
import { promises as fs } from "node:fs"
import path from "node:path"
import { ROOT } from "./lib.mjs"

export async function writeReport({ manifest, results, failures }) {
  const lines = [
    `# Docs Sync Report`,
    ``,
    `- 上游: \`${manifest.repo}@${manifest.ref}\` commit \`${manifest.commitSha.slice(0, 7)}\``,
    `- 时间: ${new Date().toISOString()}`,
    `- 成功: ${results.length} 页 / 失败: ${failures.length} 页`,
    ``,
  ]

  if (results.length) {
    lines.push(`## 已处理`, ``, `| slug | action | 本地 URL | 模式 | 缓存 |`, `| --- | --- | --- | --- | --- |`)
    for (const r of results) {
      lines.push(`| \`${r.slug}\` | ${r.action} | ${r.localUrl} | ${r.mode} | ${r.cached ? "命中" : "重译"} |`)
    }
    lines.push(``)
  }

  if (failures.length) {
    lines.push(`## 失败`, ``, `| slug | 错误 |`, `| --- | --- |`)
    for (const f of failures) {
      lines.push(`| \`${f.slug}\` | ${f.error.replace(/\|/g, "\\|").slice(0, 200)} |`)
    }
    lines.push(``)
  }

  // 新增页的 ROUTE_MAP 建议行
  const created = results.filter((r) => r.mode === "create")
  if (created.length) {
    lines.push(`## ROUTE_MAP.md 建议追加行（人工审阅后合入）`, ``)
    lines.push(`| 路由 | 说明 |`, `| :--- | :--- |`)
    for (const r of created) {
      lines.push(`| \`${r.localUrl}\` | ${r.titleZh}（v2 同步新增） |`)
    }
    lines.push(``)
  }

  const reportPath = path.join(ROOT, "SYNC_REPORT.md")
  await fs.writeFile(reportPath, lines.join("\n"), "utf8")
  return reportPath
}
