/**
 * ④ claude -p 逐文件翻译
 * - 缓存键：sha256(upstreamSha + glossary.version + promptVersion)
 * - 缓存目录 .translation-cache/（gitignore）
 * - 断点续跑：缓存命中直接返回
 *
 * 用法: node scripts/docs-sync/translate.mjs --slug <slug> [--force]
 */
import { promises as fs } from "node:fs"
import path from "node:path"
import { spawn } from "node:child_process"
import { CACHE_DIR, ensureDir, loadGlossary, sha256 } from "./lib.mjs"

const PROMPT_VERSION = "v2"

function buildSystemPrompt(glossary) {
  const termLines = Object.entries(glossary.terms)
    .map(([en, zh]) => `- ${en} → ${zh}`)
    .join("\n")
  const never = glossary.neverTranslate.join(", ")
  return `你是 OpenCode 官方文档的技术翻译。把给定的英文 MDX 正文翻译成简体中文，输出**只有翻译后的正文**（不要 markdown 代码围栏包裹整个输出，不要任何解释）。

硬性规则：
1. 代码块（\`\`\` 围栏内）内容一个字符都不能改。
2. 内联 code（反引号内）保留原文；但反引号内如出现完整英文句子且是解释性文字，可译（罕见，自行判断）。
3. MDX 组件语法保持原样：标签名、props 名、props 值中的代码/路径/URL 不译；仅翻译组件 children 中的自然语言。
   - <Callout type="..."> 内文字要译
   - <Card title="..."> 的 title 要译；href 不译
   - <CodeTabs ... tabs='[{"label":"...","code":"..."}]' /> 的 tabs 是 JSON 字符串属性：整段单行原样保留，label 与 code 都不译，不要改回数组语法，不要加/去空格破坏单行形式
4. Markdown 链接：\`[text](url)\` 中 url 不译，text 要译。
5. 标题（# ## ###）文字要译，层级与数量必须与源文一一对应，不得增删。
6. 列表、表格行数与源文一一对应，不得增删。
7. 表格单元格文字要译；单元格内如是命令/flag/路径保留原文。
8. HTML 实体、锚点 id 不译。
9. 术语表（必须遵守）：
${termLines}
10. 以下字面量永远保留英文：${never}
11. 语体：书面技术文档，简体中文，专业准确，不加语气词。术语首次出现可保留英文原词于括号内，如「智能体（agent）」——仅限术语表中的核心名词，不要每处都加。
12. 数字、单位、版本号不译。
13. 注意：输出的 markdown 必须保持可被 MDX 解析——不要在正文中引入未转义的 \`<\` \`>\` 构成新组件；如需提及泛型尖括号，用反引号包住。
14. 页面元信息：输出第一行必须是单独一行 \`TITLE: <中文标题>\`（简短、不含站点后缀），然后空一行，再是正文。中文标题结尾不要使用中文标点（。！？等），以避免编译器问题。`
}

function buildUserPrompt({ slug, titleZh, body, existingZh }) {
  let prompt = `页面 slug: ${slug}\n建议标题方向: ${titleZh}\n\n=== 英文源文开始 ===\n${body}\n=== 英文源文结束 ===\n`
  if (existingZh) {
    prompt += `\n=== 现有中文旧文（仅作风格参照，内容以英文源文为准）===\n${existingZh.slice(0, 3000)}\n=== 旧文结束 ===\n`
  }
  prompt += `\n请翻译。第一行输出 TITLE: ...`
  return prompt
}

function runClaude(systemPrompt, userPrompt) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "claude",
      ["-p", "--output-format", "text"],
      {
        stdio: ["pipe", "pipe", "pipe"],
        env: process.env,
      }
    )
    const timer = setTimeout(() => {
      child.kill("SIGKILL")
      reject(new Error("claude 翻译超时（10 分钟）"))
    }, 10 * 60 * 1000)
    // claude -p 的 prompt 经 stdin 传入，避免 shell 转义问题；system 规则并入 prompt 头部
    child.stdin.write(`${systemPrompt}\n\n${userPrompt}`)
    child.stdin.end()
    let stdout = ""
    let stderr = ""
    child.stdout.on("data", (d) => (stdout += d))
    child.stderr.on("data", (d) => (stderr += d))
    child.on("close", (code) => {
      clearTimeout(timer)
      if (code === 0) resolve(stdout)
      else reject(new Error(`claude 退出码 ${code}\n${stderr.slice(0, 800)}`))
    })
    child.on("error", (err) => {
      clearTimeout(timer)
      reject(new Error(`无法启动 claude: ${err.message}`))
    })
  })
}

function parseTranslation(raw) {
  const cleaned = raw.replace(/^```(?:md|mdx)?\n/, "").replace(/\n```\s*$/, "")
  const titleMatch = cleaned.match(/^TITLE:\s*(.+)\s*$/m)
  const title = titleMatch ? titleMatch[1].trim() : ""
  let body = cleaned
  // 去掉第一行 TITLE 行及紧随的空行
  body = body.replace(/^TITLE:.*$\r?\n?/m, "").replace(/^\r?\n/, "")
  return { title, body: body.trimEnd() + "\n" }
}

export async function translatePage({ slug, upstreamSha, titleZh, body, existingZh, force = false }) {
  const glossary = await loadGlossary()
  const cacheKey = await sha256(
    `${upstreamSha}|g${glossary.version}|${PROMPT_VERSION}|${slug}`
  )
  const cachePath = path.join(CACHE_DIR, `${slug.replace(/\//g, "__")}.json`)
  await ensureDir(CACHE_DIR)

  if (!force) {
    try {
      const cached = JSON.parse(await fs.readFile(cachePath, "utf8"))
      if (cached.cacheKey === cacheKey) {
        return { ...cached.result, cached: true }
      }
    } catch {
      /* miss */
    }
  }

  const systemPrompt = buildSystemPrompt(glossary)
  const userPrompt = buildUserPrompt({ slug, titleZh, body, existingZh })
  const raw = await runClaude(systemPrompt, userPrompt)
  const result = parseTranslation(raw)
  if (!result.body || result.body.length < 20) {
    throw new Error(`翻译输出过短（${result.body.length} 字符），疑似失败`)
  }
  await fs.writeFile(
    cachePath,
    JSON.stringify({ cacheKey, upstreamSha, translatedAt: new Date().toISOString(), result }, null, 2),
    "utf8"
  )
  return { ...result, cached: false }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const slugIndex = process.argv.indexOf("--slug")
  const slug = slugIndex >= 0 ? process.argv[slugIndex + 1] : null
  if (!slug) {
    console.error("用法: node translate.mjs --slug <slug>")
    process.exit(1)
  }
  console.error("translate.mjs 应通过 run.mjs 编排调用；单独入口仅用于调试，需手工提供 body。")
  process.exit(1)
}
