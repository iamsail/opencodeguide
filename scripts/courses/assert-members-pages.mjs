#!/usr/bin/env node
/**
 * 成员站产物自检（build:members 之后、deploy 之前）
 * ------------------------------------------------------------
 * 成员站最危险的失败不是报错，而是「静默降级」：只构建出 8 节正文的成员站，
 * 用户付了钱点进去看到的是锁定页。所以部署前必须逐节确认：
 *
 *   1. manifest 里每一节都必须有页面
 *   2. 每一页都必须含该节的正文（从私有正文里抽一段探针）
 *   3. 不允许出现 data-locked-lesson（成员站不该有锁定页）
 *   4. 页面里的课时链接都必须指向真实存在的页面（防 404 导航）
 *
 * 用法：node scripts/courses/assert-members-pages.mjs [--dir out-members]
 * 退出码：0 通过 / 1 有问题（调用方不应继续部署）
 */

import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import { lessonRoots, resolveLessonFile } from "./content-paths.mjs";
import { readLessonManifest } from "./manifest.mjs";

const args = process.argv.slice(2);
let dir = "out-members";
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === "--dir") dir = args[++i] ?? dir;
}

const outDir = path.resolve(process.cwd(), dir);
if (!fs.existsSync(outDir)) {
  console.error(`✖ 找不到 ${path.relative(process.cwd(), outDir)}，先跑 npm run build:members`);
  process.exit(1);
}

const manifest = readLessonManifest();
if (!manifest) {
  console.error("✖ 找不到 manifest，无法确认成员站完整性");
  process.exit(1);
}

const roots = lessonRoots("members");
const problems = [];
let checked = 0;

/**
 * 从正文里抽几条「渲染成 HTML 后大概率不变形」的句子。
 * 单条探针容易被行内代码/强调标记切断，所以抽多条，命中任意一条就算页面有正文。
 */
function buildProbes(body, max = 4) {
  const lines = [];
  let inFence = false;

  for (const raw of body.split("\n")) {
    const line = raw.trim();
    if (line.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence || line.length < 30) continue;
    if (/^[#|!<>\-*\d]/.test(line)) continue;
    if (/[`*[\]<>]/.test(line)) continue;
    if (!/[\u4e00-\u9fa5A-Za-z]/.test(line)) continue;
    lines.push(line.slice(0, 36));
    if (lines.length >= max * 4) break;
  }

  const step = Math.max(1, Math.floor(lines.length / max));
  const probes = [];
  for (let i = 0; i < lines.length && probes.length < max; i += step) probes.push(lines[i]);
  return probes;
}

for (const course of manifest.courses) {
  for (const [locale, lessons] of Object.entries(course.locales ?? {})) {
    for (const lesson of lessons) {
      checked += 1;
      const page = path.join(outDir, locale, "courses", course.slug, lesson.slug, "index.html");
      if (!fs.existsSync(page)) {
        problems.push(`缺页面：${locale}/courses/${course.slug}/${lesson.slug}/`);
        continue;
      }

      const html = fs.readFileSync(page, "utf8");
      if (html.includes("data-locked-lesson")) {
        problems.push(`渲染成锁定页：${locale}/courses/${course.slug}/${lesson.slug}/`);
        continue;
      }

      const file = resolveLessonFile({ locale, course: course.slug, slug: lesson.slug }, roots);
      if (!file) {
        problems.push(`找不到私有正文：${locale}/${course.slug}/${lesson.slug}.mdx`);
        continue;
      }

      const probes = buildProbes(matter(fs.readFileSync(file, "utf8")).content ?? "");
      if (probes.length > 0 && !probes.some((probe) => html.includes(probe))) {
        problems.push(`页面里没有正文：${locale}/courses/${course.slug}/${lesson.slug}/`);
      }
    }
  }
}

// 导航链接必须都能落地（只看课时页之间）
const linkPattern = /href="(\/(?:zh|en)\/courses\/([a-z0-9-]+)\/([a-z0-9-]+)\/)"/g;
const brokenLinks = new Set();
for (const course of manifest.courses) {
  for (const locale of Object.keys(course.locales ?? {})) {
    for (const lesson of course.locales[locale]) {
      const page = path.join(outDir, locale, "courses", course.slug, lesson.slug, "index.html");
      if (!fs.existsSync(page)) continue;
      const html = fs.readFileSync(page, "utf8");
      for (const match of html.matchAll(linkPattern)) {
        const [, href, linkedCourse, linkedLesson] = match;
        const target = path.join(outDir, href.replace(/^\//, ""), "index.html");
        if (!fs.existsSync(target)) {
          brokenLinks.add(`${href}（出现在 ${locale}/${course.slug}/${lesson.slug}）`);
        }
        if (!linkedCourse || !linkedLesson) continue;
      }
    }
  }
}
for (const broken of [...brokenLinks].slice(0, 10)) problems.push(`死链：${broken}`);

if (problems.length > 0) {
  console.error(`✖ 成员站自检失败（检查 ${checked} 节）：`);
  for (const problem of problems.slice(0, 25)) console.error(`  · ${problem}`);
  if (problems.length > 25) console.error(`  …其余 ${problems.length - 25} 个省略`);
  process.exit(1);
}

console.log(`✔ 成员站自检通过：${checked} 节全部有页面、有正文、无锁定页、无死链`);
