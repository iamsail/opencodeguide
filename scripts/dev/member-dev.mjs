#!/usr/bin/env node
/**
 * 本地成员站开发服务器（带出站代理）。
 *
 * 为什么需要这个脚本：
 *   `wrangler dev` 的本地模式用 workerd 跑代码，workerd 的出站 fetch **不读系统代理**，
 *   也没有任何 proxy 选项（`workerd serve --help` 里没有相关 flag）。于是 Worker 里
 *   `fetch('https://oauth2.googleapis.com/token')` 在国内网络下会一直挂到 75 秒超时，
 *   表现为 Google 登录回调 400 + `[auth] internal error`。
 *
 * 解决办法：
 *   Miniflare 提供 `outboundService` 钩子，它跑在 **Node 宿主进程**里。Node 24 支持
 *   `NODE_USE_ENV_PROXY=1`，让 `fetch` 认 `HTTPS_PROXY`。两者接起来，workerd 里的
 *   出站请求就被 Node 侧代理接管了。
 *
 * 用法（代理端口按自己的改）：
 *   NODE_USE_ENV_PROXY=1 HTTPS_PROXY=http://127.0.0.1:7890 \
 *   NO_PROXY=localhost,127.0.0.1 node scripts/dev/member-dev.mjs
 *
 * 或直接 `npm run dev:proxy`（见 workers/course-delivery/package.json）。
 *
 * 说明：
 *   - 读 `workers/course-delivery/.dev.vars`（已 gitignore），密钥不落别处。
 *   - D1 复用 `wrangler dev` 的本地库（同一个 database_id + persist 目录），
 *     所以先跑一次 `npm run migrate:local` 就有表了。
 *   - 不绑定 ASSETS：`/login`、`/auth/*`、`/account` 由 Worker 自己渲染，
 *     验证登录回路不需要 `out-members/`。要验付费正文请用 `wrangler dev`。
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Miniflare } from "miniflare";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");
const workerDir = path.join(repoRoot, "workers/course-delivery");

const PORT = Number(process.env.PORT || 3022);
const COMPATIBILITY_DATE = "2025-11-01";
/** 与 wrangler.toml 的 database_id 保持一致，才能复用同一份本地 D1 文件 */
const D1_ID = "c31ee524-4a47-4482-86c0-c93d8be925c6";

function loadDevVars() {
  const file = path.join(workerDir, ".dev.vars");
  let raw;
  try {
    raw = readFileSync(file, "utf8");
  } catch {
    console.error(`找不到 ${path.relative(repoRoot, file)}，先按 docs/courses/08-launch-runbook.md 配好再启动`);
    process.exit(1);
  }
  const vars = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    // 允许写成 KEY="value" / KEY='value'
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value) vars[key] = value;
  }
  return vars;
}

const vars = loadDevVars();
const proxy = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY;

if (!proxy) {
  console.warn("⚠️  没有检测到 HTTPS_PROXY / HTTP_PROXY，出站请求会直连（Google 可能超时）。");
} else if (process.env.NODE_USE_ENV_PROXY !== "1") {
  console.warn(
    `⚠️  检测到代理 ${proxy}，但缺少 NODE_USE_ENV_PROXY=1，Node 的 fetch 不会使用它。\n` +
      "    请用：NODE_USE_ENV_PROXY=1 HTTPS_PROXY=... npm run dev:proxy",
  );
}

const mf = new Miniflare({
  host: "127.0.0.1",
  port: PORT,
  modules: true,
  // 不显式声明时 Miniflare 会按 CommonJS 解析 .js，import/export 直接报 ERR_MODULE_PARSE
  modulesRules: [{ type: "ESModule", include: ["**/*.js"], fallthrough: true }],
  scriptPath: path.join(workerDir, "src/index.js"),
  compatibilityDate: COMPATIBILITY_DATE,
  bindings: vars,
  d1Databases: { DB: D1_ID },
  d1Persist: path.join(workerDir, ".wrangler/state/v3/d1"),
  /**
   * 所有出站请求都经过这里。它在 Node 进程里执行，因此能吃到 NODE_USE_ENV_PROXY 的代理。
   *
   * 注意：不能直接 `fetch(request)` —— workerd 的 Request 不是 undici 的 Request，
   * 传进去会抛 `ERR_INVALID_URL`。必须拆成 url + init 重新构造。
   */
  outboundService: async (request) => {
    const url = request.url;
    const method = request.method.toUpperCase();
    try {
      const headers = Object.fromEntries(request.headers.entries());
      const init = { method, headers, redirect: "manual" };
      if (method !== "GET" && method !== "HEAD") {
        init.body = Buffer.from(await request.arrayBuffer());
      }
      const response = await fetch(url, init);
      const body = Buffer.from(await response.arrayBuffer());
      return new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });
    } catch (error) {
      console.error(`[outbound] ${method} ${url} 失败：`, error?.cause?.code || error?.message);
      return new Response(`outbound fetch failed: ${error?.message}`, { status: 502 });
    }
  },
});

const url = await mf.ready;
console.log(`成员站本地开发服务器已启动：${url.origin}`);
console.log(`  Google 回调地址：${vars.GOOGLE_REDIRECT_URI || "(未配置)"}`);
console.log(`  代理：${proxy || "无"}`);
console.log(`  登录入口：${url.origin}/login`);

const shutdown = async (signal) => {
  console.log(`\n收到 ${signal}，正在关闭…`);
  await mf.dispose();
  process.exit(0);
};
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
