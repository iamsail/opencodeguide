/**
 * ③ 上游 MDX → 本地骨架
 * - 拆 YAML frontmatter（title）
 * - 组件透传（Callout/Card/CardGroup/CodeTabs 语法保持不变）
 * - 站内链接按 page-map.linkRewrites 重写
 * - PlanTabs 降级为两个 Callout
 * 输出 { frontmatterTitle, body }，body 仍是英文，等待 translate。
 */
import { loadPageMap } from "./lib.mjs"

/** 解析上游 YAML frontmatter（仅 title 字段，够用且避免引入 yaml 依赖） */
export function parseFrontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) return { data: {}, body: source }
  const data = {}
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^(\w+):\s*"?(.*?)"?\s*$/)
    if (m) data[m[1]] = m[2]
  }
  return { data, body: source.slice(match[0].length) }
}

/** 重写 Markdown 链接与 JSX href 中的站内路径 */
export function rewriteLinks(body, linkRewrites) {
  // Markdown 链接: [text](/path) 与 [text](/path#anchor)
  let out = body.replace(
    /\]\((\/[A-Za-z0-9/_-]*)/g,
    (full, pathPart) => {
      const target = linkRewrites[pathPart]
      if (target) return `](${target}`
      return full
    }
  )
  // JSX href="/path"
  out = out.replace(
    /href="(\/[A-Za-z0-9/_-]*)"/g,
    (full, pathPart) => {
      const target = linkRewrites[pathPart]
      if (target) return `href="${target}"`
      return full
    }
  )
  return out
}

/**
 * mdxjs-rs（Next MDX-RS）的 JSX 属性表达式解析器会在对象字面量内部的逗号处
 * 截断表达式（`{ label: "x", code: "y" }` → swc "Expected ',', got '<eof>'"）。
 * 因此 CodeTabs 的 tabs 改为 JSON 字符串属性，由组件端 JSON.parse。
 * 把上游 `tabs={[{ label: "...", code: "..." }, ...]}`（可多行）转换为
 * `tabs='[{"label":"...","code":"..."},...]'`（单行；JSX 字符串属性不支持
 * 反斜杠转义，JSON 中如出现单引号则该属性值不能安全嵌入——上游代码块不含单引号，
 * 若出现则保留原语法并告警）。
 */
export function convertCodeTabsToJsonAttr(body) {
  return body.replace(/<CodeTabs\b([\s\S]*?)\/>/g, (full, attrs) => {
    const tabsMatch = attrs.match(/tabs=\{\[([\s\S]*?)\]\}/)
    if (!tabsMatch) return full
    const objects = []
    const objRe =
      /\{\s*"?label"?\s*:\s*("(?:[^"\\]|\\.)*")\s*,\s*"?code"?\s*:\s*("(?:[^"\\]|\\.)*")\s*\}/g
    let m
    while ((m = objRe.exec(tabsMatch[1])) !== null) {
      objects.push({ label: JSON.parse(m[1]), code: JSON.parse(m[2]) })
    }
    if (!objects.length) return full
    const json = JSON.stringify(objects)
    if (json.includes("'")) {
      console.warn(`  ⚠ CodeTabs JSON 含单引号，无法安全嵌入 JSX 字符串属性，保留原语法（构建可能失败）: ${json.slice(0, 80)}`)
      return full
    }
    const otherAttrs = attrs
      .replace(/tabs=\{\[[\s\S]*?\]\}/, "")
      .replace(/\n\s*/g, " ")
      .trim()
    return `<CodeTabs ${otherAttrs} tabs='${json}' />`
  })
}

/**
 * PlanTabs 降级（上游仅 console/go 使用）：
 * - 带子元素形式 <PlanTabs ...><div slot="...">...</div></PlanTabs>：
 *   提取各 slot 内容转为加粗小节，保留数据（定价/请求表格），不丢内容。
 * - 自闭合形式 <PlanTabs ... />：降级为 note Callout。
 */
export function degradePlanTabs(body) {
  let out = body.replace(/<PlanTabs[^>]*>([\s\S]*?)<\/PlanTabs>/g, (full, children) => {
    const slots = []
    const slotRe = /<div slot="([^"]+)">([\s\S]*?)<\/div>/g
    let m
    while ((m = slotRe.exec(children)) !== null) {
      slots.push({ name: m[1], content: m[2].trim() })
    }
    if (!slots.length) {
      return `<Callout type="note">\n  上游此处为 Plan/Build 切换内容，请参考官方文档的交互式演示。\n</Callout>`
    }
    const labelFor = (name) => (name === "go" ? "Go" : name === "go-plus" ? "Go Plus" : name)
    return slots.map((s) => `**${labelFor(s.name)}：**\n\n${s.content}`).join("\n\n")
  })
  out = out.replace(
    /<PlanTabs[\s\S]*?\/>/g,
    `<Callout type="note">\n  上游此处为 Plan/Build 切换内容，请参考官方文档的交互式演示。\n</Callout>`
  )
  return out
}

export function transformSource(source, pageMap) {
  const { data, body } = parseFrontmatter(source)
  let out = degradePlanTabs(body)
  out = rewriteLinks(out, pageMap.linkRewrites)
  out = convertCodeTabsToJsonAttr(out)
  // 去掉开头多余空行
  out = out.replace(/^\s*\n/, "")
  return { frontmatterTitle: data.title || "", body: out }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { promises: fs } = await import("node:fs")
  const path = await import("node:path")
  const { UPSTREAM_DIR } = await import("./lib.mjs")
  const pageMap = await loadPageMap()
  const slug = process.argv[2]
  if (!slug) {
    console.error("用法: node transform.mjs <slug>")
    process.exit(1)
  }
  const source = await fs.readFile(path.join(UPSTREAM_DIR, "content", `${slug}.mdx`), "utf8")
  const result = transformSource(source, pageMap)
  console.log("--- frontmatter title:", result.frontmatterTitle)
  console.log(result.body.slice(0, 800))
}
