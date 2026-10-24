/**
 * ⑥ 校验
 * - 内链存在性：扫描 app/(zh)/zh/docs 下 page.mdx 的 /zh/docs/... 链接，确认目标路由存在
 * - 裸多行 HTML 表格 lint：table 标签跨行即告警（MDX-RS 风险）
 * - 可选 --build 跑 npm run build
 *
 * 用法: node scripts/docs-sync/validate.mjs [--build]
 */
import { promises as fs } from "node:fs"
import path from "node:path"
import { spawn } from "node:child_process"
import { ROOT, ZH_DOCS_APP_DIR, loadPageMap } from "./lib.mjs"

async function walkMdx(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await walkMdx(full)))
    else if (entry.name === "page.mdx") files.push(full)
  }
  return files
}

/** mdx 路径 → 路由 */
function mdxToRoute(file) {
  const rel = path.relative(path.join(ROOT, "app"), file)
  const segments = rel
    .split(path.sep)
    .join("/")
    .split("/")
    .filter((s) => !(s.startsWith("(") && s.endsWith(")")))
    .filter((s) => s !== "page.mdx")
  return `/${segments.join("/")}`
}

export async function validateDocs({ skipBuild = false } = {}) {
  const files = await walkMdx(ZH_DOCS_APP_DIR)
  const routes = new Set(files.map(mdxToRoute))

  // page-map 中 create/update 声明的路由视为“计划中”——试点阶段链接到尚未创建的页不算断链
  const pageMap = await loadPageMap()
  const plannedRoutes = new Set()
  for (const entry of Object.values(pageMap.pages)) {
    if (entry.action === "create" || entry.action === "update") {
      if (entry.localUrl.startsWith("/")) plannedRoutes.add(entry.localUrl.replace(/\/$/, ""))
    }
  }
  for (const item of Object.values(pageMap.legacy ?? {})) {
    if (item?.target?.startsWith?.("/")) plannedRoutes.add(item.target.replace(/\/$/, ""))
  }

  const routeExists = (route) => {
    const bare = route.replace(/\/$/, "")
    return routes.has(bare) || routes.has(`${bare}/`)
  }
  const isPlanned = (route) => plannedRoutes.has(route.replace(/\/$/, ""))

  const brokenLinks = []
  const plannedLinks = []
  const tableWarnings = []

  for (const file of files) {
    const source = await fs.readFile(file, "utf8")
    const route = mdxToRoute(file)
    const relFile = path.relative(ROOT, file)

    // 内链检查（仅 /zh/docs 前缀）
    const checkLink = (link) => {
      const target = link.split("#")[0].replace(/\/$/, "")
      if (!target) return
      if (routeExists(target)) return
      if (isPlanned(target)) {
        plannedLinks.push({ file: relFile, link })
      } else {
        brokenLinks.push({ file: relFile, route, link })
      }
    }
    for (const m of source.matchAll(/\]\((\/zh\/docs[^)\s]*)/g)) checkLink(m[1])
    for (const m of source.matchAll(/href="(\/zh\/docs[^"\s]*)"/g)) checkLink(m[1])

    // 裸多行 HTML table
    if (/<table[\s\S]*?\n[\s\S]*?<\/table>/.test(source)) {
      // 允许单行 table；含换行的多行 table 告警
      const multiLineTable = source.match(/<table(?![^>]*>.*<\/table>)[^>]*>[\s\S]*?<\/table>/)
      if (multiLineTable && multiLineTable[0].includes("\n")) {
        tableWarnings.push({ file: relFile })
      }
    }
  }

  let buildOk = true
  let buildOutput = ""
  if (!skipBuild) {
    buildOutput = await new Promise((resolve) => {
      const child = spawn("npm", ["run", "build"], { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] })
      let out = ""
      child.stdout.on("data", (d) => (out += d))
      child.stderr.on("data", (d) => (out += d))
      child.on("close", (code) => resolve({ code, out }))
    })
    buildOk = buildOutput.code === 0
  }

  return {
    pageCount: files.length,
    brokenLinks,
    plannedLinks,
    tableWarnings,
    buildOk,
    buildLog: buildOutput ? buildOutput.out?.slice(-4000) : "",
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const skipBuild = !process.argv.includes("--build")
  validateDocs({ skipBuild })
    .then((result) => {
      console.log(`检查 ${result.pageCount} 个中文文档页`)
      if (result.brokenLinks.length) {
        console.error(`✖ 断链 ${result.brokenLinks.length} 处：`)
        for (const b of result.brokenLinks) console.error(`  ${b.file}: ${b.link}`)
      } else {
        console.log("✔ 无真实断链")
      }
      if (result.plannedLinks?.length) {
        console.warn(`ℹ 指向计划中页面的链接 ${result.plannedLinks.length} 处（Phase 3 建页后消解，不算失败）`)
      }
      if (result.tableWarnings.length) {
        console.warn(`⚠ 多行 HTML table ${result.tableWarnings.length} 处（MDX-RS 风险）：`)
        for (const t of result.tableWarnings) console.warn(`  ${t.file}`)
      } else {
        console.log("✔ 无裸多行 HTML table")
      }
      if (!skipBuild) {
        console.log(result.buildOk ? "✔ build 通过" : "✖ build 失败：")
        if (!result.buildOk) console.error(result.buildLog)
      }
      process.exit(result.brokenLinks.length || !result.buildOk ? 1 : 0)
    })
    .catch((err) => {
      console.error("✖ validate 失败:", err.message)
      process.exit(1)
    })
}
