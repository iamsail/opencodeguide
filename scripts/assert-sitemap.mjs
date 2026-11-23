#!/usr/bin/env node
/**
 * sitemap 自检（公开构建后运行）
 * ------------------------------------------------------------
 * 站点是 `trailingSlash: true`，所以 sitemap 里每一条 URL 都必须以 `/` 结尾，
 * 否则爬虫每次抓取都要先吃一次 301，白白浪费抓取预算（148 条 URL 就是 148 次）。
 *
 * 同时检查：
 *   - 没有重复 <loc>
 *   - hreflang alternate 的 href 也带尾斜杠
 *   - 每条 URL 在产物目录里真的有对应页面（防止 sitemap 指向 404）
 *
 * 用法：node scripts/assert-sitemap.mjs [--dir out]
 * 退出码：0 通过 / 1 有问题
 */

import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
let dir = "out";
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === "--dir") dir = args[++i] ?? dir;
}

const outDir = path.resolve(process.cwd(), dir);
const file = path.join(outDir, "sitemap.xml");

if (!fs.existsSync(file)) {
  console.error(`✖ 找不到 ${path.relative(process.cwd(), file)}，先跑构建`);
  process.exit(1);
}

const xml = fs.readFileSync(file, "utf8");
const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const alternates = [...xml.matchAll(/<xhtml:link[^>]*href="([^"]+)"/g)].map((match) => match[1]);

const problems = [];

if (locs.length === 0) problems.push("sitemap 里没有任何 <loc>");

const missingSlash = locs.filter((loc) => !loc.endsWith("/"));
if (missingSlash.length > 0) {
  problems.push(`${missingSlash.length}/${locs.length} 条 <loc> 缺尾斜杠（会多一跳 301）`);
  for (const loc of missingSlash.slice(0, 5)) problems.push(`  · ${loc}`);
}

const duplicate = locs.filter((loc, index) => locs.indexOf(loc) !== index);
if (duplicate.length > 0) {
  problems.push(`${duplicate.length} 条重复 URL`);
  for (const loc of [...new Set(duplicate)].slice(0, 5)) problems.push(`  · ${loc}`);
}

const badAlternates = alternates.filter((href) => !href.endsWith("/"));
if (badAlternates.length > 0) {
  problems.push(`${badAlternates.length}/${alternates.length} 条 hreflang href 缺尾斜杠`);
  for (const href of badAlternates.slice(0, 5)) problems.push(`  · ${href}`);
}

// 每条 URL 必须真的有对应页面
const missingPages = [];
for (const loc of locs) {
  const { pathname } = new URL(loc);
  const relative = pathname.replace(/^\//, "");
  const candidates = [
    path.join(outDir, relative, "index.html"),
    path.join(outDir, `${relative.replace(/\/$/, "")}.html`),
  ];
  if (!candidates.some((candidate) => fs.existsSync(candidate))) {
    missingPages.push(loc);
  }
}
if (missingPages.length > 0) {
  problems.push(`${missingPages.length} 条 URL 在产物里没有对应页面`);
  for (const loc of missingPages.slice(0, 5)) problems.push(`  · ${loc}`);
}

if (problems.length > 0) {
  console.error("✖ sitemap 自检失败：");
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.log(
  `✔ sitemap 自检通过：${locs.length} 条 URL（全部带尾斜杠、无重复、页面都存在），hreflang ${alternates.length} 条`,
);
