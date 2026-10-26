/**
 * ⑤ 写入 app/(zh)/zh/docs 下的 page.mdx
 * - update：保留现有 metadata 导出，仅替换正文（SEO 保护：title/canonical 尽量不改）
 * - create：生成 metadata 骨架（canonical 自指、title 带站点后缀、description 用译文首段压缩）
 */
import { promises as fs } from "node:fs"
import path from "node:path"
import { localUrlToMdxPath, ZH_DOCS_APP_DIR } from "./lib.mjs"
import { convertCodeTabsToJsonAttr } from "./transform.mjs"

/** 从现有 page.mdx 提取 export const metadata = {...} 原文（精确保留字段） */
export function extractMetadataBlock(source) {
  const match = source.match(/export const metadata = \{[\s\S]*?\n\}/)
  return match ? match[0] : null
}

/** 从现有文件提取正文（metadata 之后的部分） */
export function extractBody(source) {
  const meta = extractMetadataBlock(source)
  if (!meta) return source
  const idx = source.indexOf(meta)
  return source.slice(idx + meta.length).replace(/^\s*\n/, "")
}

function firstParagraph(text) {
  const lines = text.split(/\r?\n/)
  const buf = []
  let inCode = false
  for (const line of lines) {
    if (line.trim().startsWith("```")) inCode = !inCode
    if (inCode) continue
    if (line.trim().startsWith("#") || line.trim().startsWith("<")) continue
    if (!line.trim()) {
      if (buf.length) break
      continue
    }
    buf.push(line.trim())
  }
  const para = buf.join("")
  if (para.length <= 120) return para
  // 在标点边界截断，避免句子被拦腰切断
  const cut = para.slice(0, 120)
  const lastPunct = Math.max(
    cut.lastIndexOf("。"),
    cut.lastIndexOf("."),
    cut.lastIndexOf("；"),
    cut.lastIndexOf(";"),
    cut.lastIndexOf("，"),
    cut.lastIndexOf(",")
  )
  if (lastPunct > 60) return cut.slice(0, lastPunct + 1)
  return `${cut}…`
}

function sanitizeDescription(desc) {
  // SWC 中文标点保护：description 结尾不留中文标点
  return desc.replace(/[。！？，；：""''）】\s]+$/, "")
}

export async function generatePage({ slug, action, localUrl, titleZh, translatedTitle, translatedBody }) {
  // 防御：翻译模型可能把 tabs JSON 属性改回对象数组语法，统一再转换回来
  translatedBody = convertCodeTabsToJsonAttr(translatedBody)
  const mdxPath = localUrlToMdxPath(localUrl)
  await fs.mkdir(path.dirname(mdxPath), { recursive: true })

  if (action === "update") {
    let existing = null
    try {
      existing = await fs.readFile(mdxPath, "utf8")
    } catch {
      /* 更新目标不存在 → 按 create 处理 */
    }
    if (existing) {
      const metaBlock = extractMetadataBlock(existing)
      if (!metaBlock) {
        throw new Error(`${localUrl} 现有页面缺少 export const metadata，拒绝覆盖（SEO 保护）`)
      }
      const newSource = `${metaBlock}\n\n${translatedBody}`
      await fs.writeFile(mdxPath, newSource, "utf8")
      return { mdxPath, mode: "update-in-place" }
    }
    // fallthrough to create
  }

  // create（或 update 目标缺失时的兜底）
  const title = `${translatedTitle || titleZh} | OpenCode 中文文档`
  const description = sanitizeDescription(firstParagraph(translatedBody)) || `OpenCode ${titleZh} 中文文档`
  const canonical = localUrl
  const skeleton = `export const metadata = {
  title: "${title.replace(/"/g, '\\"')}",
  description: "${description.replace(/"/g, '\\"')}",
  alternates: {
    canonical: "${canonical}",
  },
}

${translatedBody}`
  await fs.writeFile(mdxPath, skeleton, "utf8")
  return { mdxPath, mode: "create" }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.error("generate.mjs 应通过 run.mjs 编排调用。")
  process.exit(1)
}
