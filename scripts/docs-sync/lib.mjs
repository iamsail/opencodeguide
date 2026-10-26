/**
 * 公共工具：路径、page-map 加载、GitHub API 请求。
 */
import { promises as fs } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
export const SYNC_DIR = path.join(ROOT, "scripts", "docs-sync")
export const UPSTREAM_DIR = path.join(ROOT, ".upstream")
export const CACHE_DIR = path.join(ROOT, ".translation-cache")
export const ZH_DOCS_APP_DIR = path.join(ROOT, "app", "(zh)", "zh", "docs")

export async function loadPageMap() {
  const raw = await fs.readFile(path.join(SYNC_DIR, "page-map.json"), "utf8")
  return JSON.parse(raw)
}

export async function loadGlossary() {
  const raw = await fs.readFile(path.join(SYNC_DIR, "glossary.zh.json"), "utf8")
  return JSON.parse(raw)
}

/** 把本地 URL（/zh/docs/cli/config）转成 page.mdx 路径 */
export function localUrlToMdxPath(localUrl) {
  const rel = localUrl.replace(/^\/zh\/docs\/?/, "")
  const dir = rel === "" ? "." : rel
  return path.join(ZH_DOCS_APP_DIR, dir, "page.mdx")
}

export async function githubApi(url, token) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "opencodeguide-docs-sync",
  }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`GitHub API ${res.status} for ${url}\n${body.slice(0, 500)}`)
  }
  return res
}

export function ensureDir(dir) {
  return fs.mkdir(dir, { recursive: true })
}

export function sha256(text) {
  return import("node:crypto").then((crypto) =>
    crypto.createHash("sha256").update(text).digest("hex")
  )
}
