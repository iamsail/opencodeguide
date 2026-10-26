/**
 * ① 拉取上游 v2 MDX → .upstream/content/
 * 以 GitHub git tree + blob sha 为基线，写入 .upstream/manifest.json。
 *
 * 用法: node scripts/docs-sync/fetch.mjs [--ref <branch|sha>]
 */
import { promises as fs } from "node:fs"
import path from "node:path"
import {
  UPSTREAM_DIR,
  ensureDir,
  loadPageMap,
  githubApi,
} from "./lib.mjs"

async function getTreeSha(repo, ref, token) {
  const res = await githubApi(
    `https://api.github.com/repos/${repo}/git/ref/heads/${ref}`,
    token
  )
  const data = await res.json()
  return data.object.sha
}

async function getRecursiveTree(repo, treeSha, token) {
  const res = await githubApi(
    `https://api.github.com/repos/${repo}/git/trees/${treeSha}?recursive=1`,
    token
  )
  return res.json()
}

async function getBlobContent(repo, commitSha, filePath) {
  // raw.githubusercontent.com 按 commit 取文件，不受 GitHub API 匿名限流约束；瞬时网络错误自动重试
  const url = `https://raw.githubusercontent.com/${repo}/${commitSha}/${filePath}`
  let lastErr
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "opencodeguide-docs-sync" },
        signal: AbortSignal.timeout(30_000),
      })
      if (!res.ok) throw new Error(`raw fetch ${res.status} for ${filePath}`)
      return await res.text()
    } catch (err) {
      lastErr = err
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, attempt * 1500))
      }
    }
  }
  throw lastErr
}

/** 简单并发池 */
async function mapLimit(items, limit, fn) {
  const results = new Array(items.length)
  let cursor = 0
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await fn(items[index], index)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

const TREE_CACHE_PATH = path.join(UPSTREAM_DIR, "tree.json")

export async function fetchUpstream({ ref, token } = {}) {
  const pageMap = await loadPageMap()
  const { repo, branch, contentPath } = pageMap.upstream
  const useRef = ref || branch

  let commitSha
  let tree
  let treeFromCache = false
  try {
    commitSha = await getTreeSha(repo, useRef, token)
    tree = await getRecursiveTree(repo, commitSha, token)
  } catch (err) {
    // API 限流等故障：回退到缓存树（内容仍从 raw 拉取，新鲜度以分支 HEAD 为准的近似）
    try {
      tree = JSON.parse(await fs.readFile(TREE_CACHE_PATH, "utf8"))
      commitSha = useRef
      treeFromCache = true
      console.warn(`  ⚠ GitHub API 不可用（${err.message.split("\n")[0]}），使用缓存树枚举文件`)
    } catch {
      throw err
    }
  }
  if (tree.truncated) {
    throw new Error("上游 git tree 被截断，无法可靠枚举文件；请改用更精确的 ref 或 shallow 拉取。")
  }
  if (!treeFromCache) {
    await ensureDir(UPSTREAM_DIR)
    await fs.writeFile(TREE_CACHE_PATH, JSON.stringify(tree), "utf8")
  }

  const prefix = `${contentPath}/`
  const mdxBlobs = tree.tree.filter(
    (entry) => entry.type === "blob" && entry.path.startsWith(prefix) && entry.path.endsWith(".mdx")
  )

  // 只保留 page-map 中声明的 slug（index 对应 content/index.mdx）
  const knownSlugs = new Set(Object.keys(pageMap.pages))
  const selected = []
  const unknown = []
  for (const blob of mdxBlobs) {
    const rel = blob.path.slice(prefix.length) // e.g. cli/tui.mdx
    let slug = rel.replace(/\.mdx$/, "")
    if (slug.endsWith("/index")) slug = slug.slice(0, -"/index".length) || "index"
    // content/index.mdx → slug "index"；content/cli/index.mdx → slug "cli"
    if (rel === "index.mdx") slug = "index"
    if (knownSlugs.has(slug)) {
      selected.push({ slug, path: blob.path, sha: blob.sha })
    } else {
      unknown.push({ slug, path: blob.path })
    }
  }

  // 反向：page-map 中 action!=defer 的 slug 必须在上游找到
  const foundSlugs = new Set(selected.map((s) => s.slug))
  const missing = []
  for (const [slug, entry] of Object.entries(pageMap.pages)) {
    if (entry.action === "defer") continue
    if (!foundSlugs.has(slug)) missing.push(slug)
  }

  const prevManifestPath = path.join(UPSTREAM_DIR, "manifest.json")
  let prevManifest = null
  try {
    prevManifest = JSON.parse(await fs.readFile(prevManifestPath, "utf8"))
  } catch {
    /* 首次运行 */
  }

  await ensureDir(path.join(UPSTREAM_DIR, "content"))
  const files = {}
  let done = 0
  const toDownload = []
  for (const item of selected) {
    const prev = prevManifest?.files?.[item.slug]
    const unchanged = prev && prev.sha === item.sha
    const filePath = path.join(UPSTREAM_DIR, "content", `${item.slug}.mdx`)
    if (unchanged) {
      try {
        const text = await fs.readFile(filePath, "utf8")
        files[item.slug] = { sha: item.sha, path: item.path, bytes: Buffer.byteLength(text) }
        done++
        continue
      } catch {
        /* 本地快照缺失，落入下载队列 */
      }
    }
    toDownload.push(item)
  }

  await mapLimit(toDownload, 6, async (item) => {
    const text = await getBlobContent(repo, commitSha, item.path)
    const filePath = path.join(UPSTREAM_DIR, "content", `${item.slug}.mdx`)
    await ensureDir(path.dirname(filePath))
    await fs.writeFile(filePath, text, "utf8")
    files[item.slug] = { sha: item.sha, path: item.path, bytes: Buffer.byteLength(text) }
    done++
    process.stdout.write(`\r  下载 ${done}/${selected.length}（并发 6）`)
  })
  if (toDownload.length) process.stdout.write("\n")

  const manifest = {
    repo,
    ref: useRef,
    commitSha,
    fetchedAt: new Date().toISOString(),
    files,
  }
  await fs.writeFile(prevManifestPath, JSON.stringify(manifest, null, 2), "utf8")

  return { manifest, unknown, missing, selected }
}

// CLI 入口
if (import.meta.url === `file://${process.argv[1]}`) {
  const refIndex = process.argv.indexOf("--ref")
  const ref = refIndex >= 0 ? process.argv[refIndex + 1] : undefined
  const token = process.env.GITHUB_TOKEN
  fetchUpstream({ ref, token })
    .then(({ manifest, unknown, missing, selected }) => {
      console.log(`✔ 拉取完成 commit=${manifest.commitSha.slice(0, 7)} 文件=${selected.length}`)
      if (unknown.length) {
        console.error(`✖ 上游存在 page-map 未声明的 slug（请更新 page-map.json）：`)
        for (const u of unknown) console.error(`  - ${u.slug}  (${u.path})`)
        process.exit(1)
      }
      if (missing.length) {
        console.error(`✖ page-map 声明的 slug 在上游缺失：`)
        for (const m of missing) console.error(`  - ${m}`)
        process.exit(1)
      }
    })
    .catch((err) => {
      console.error("✖ fetch 失败:", err.message)
      process.exit(1)
    })
}
