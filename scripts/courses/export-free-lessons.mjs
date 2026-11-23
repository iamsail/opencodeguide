#!/usr/bin/env node
/**
 * 导出免费试听正文
 * ------------------------------------------------------------
 * 公开仓里的 8 节免费正文是**派生产物**，不允许手拷：
 *   - 真相源：私有仓 content/courses/zh/**（全部 123 节）
 *   - 导出规则：manifest 顺序的每门前 N 节（access.json 的 freeLessonLimit）+ frontmatter 显式 free: true
 *   - 产物：公开仓 content/courses/zh/** 只留这些节；付费节一律删除
 *
 * 顺带维护 .gitignore 里的「免费试听」区块：整片忽略课时正文，只放行免费那几节。
 * 这样即使有人 hand-copy 一个付费 .mdx 进来，`git add -A` 也不会把它带上。
 *
 * 用法：
 *   node scripts/courses/export-free-lessons.mjs           # 写入（复制/删除/gitignore 区块）
 *   node scripts/courses/export-free-lessons.mjs --check   # 只检查是否一致，不一致 exit 1
 *
 * 必须在**有私有正文的环境**运行，私有根默认 ../opencodeCourse/content/courses。
 * 这个脚本在公开仓（没有私有正文）里跑必然会失败——这是设计如此。
 */

import fs from "node:fs";
import path from "node:path";

import { readAccessConfig } from "./access.mjs";
import { privateRoot, publicRoot } from "./content-paths.mjs";
import { readLessonManifest } from "./manifest.mjs";

const ROOT = process.cwd();
const GITIGNORE = path.join(ROOT, ".gitignore");
const BLOCK_START = "# >>> 免费试听课时正文（由 npm run courses:export-free 生成，别手改） >>>";
const BLOCK_END = "# <<< 免费试听课时正文 <<<";

const checkOnly = new Set(process.argv.slice(2)).has("--check");

const problems = [];
const fail = (message) => problems.push(message);

const manifest = readLessonManifest();
if (!manifest) {
  console.error("✖ 找不到 content/courses/manifest.json");
  console.error("  先在有正文的环境跑 npm run courses:manifest");
  process.exit(1);
}

const { freeLessonLimit } = readAccessConfig();
const srcRoot = privateRoot();
const destRoot = publicRoot();

if (!fs.existsSync(srcRoot)) {
  console.error(`✖ 找不到私有正文根：${srcRoot}`);
  console.error("  设置 COURSE_PRIVATE_DIR，或把私有仓 clone 到 ../opencodeCourse");
  process.exit(1);
}

/** 全部课时（含付费），按 manifest 顺序标出哪些该出现在公开仓 */
const plan = [];
for (const course of manifest.courses) {
  for (const [locale, lessons] of Object.entries(course.locales ?? {})) {
    lessons.forEach((lesson, index) => {
      const rel = path.join(locale, course.slug, `${lesson.slug}.mdx`);
      plan.push({
        rel,
        slug: lesson.slug,
        course: course.slug,
        locale,
        free: lesson.trial === true || index < freeLessonLimit,
        src: path.join(srcRoot, rel),
        dest: path.join(destRoot, rel),
      });
    });
  }
}

const freeFiles = plan.filter((item) => item.free);
const paidFiles = plan.filter((item) => !item.free);

const added = [];
const updated = [];
const removed = [];
const unchanged = [];

for (const item of freeFiles) {
  if (!fs.existsSync(item.src)) {
    fail(`私有仓缺正文：${path.join(srcRoot, item.rel)}`);
    continue;
  }
  if (!fs.existsSync(item.dest)) {
    added.push(item);
    continue;
  }
  if (fs.readFileSync(item.src).equals(fs.readFileSync(item.dest))) {
    unchanged.push(item);
  } else {
    updated.push(item);
  }
}

for (const item of paidFiles) {
  if (fs.existsSync(item.dest)) removed.push(item);
}

// 公开根里不在计划内的课时（例如手抄进来的草稿）
const strays = [];
for (const locale of ["zh", "en"]) {
  const localeDir = path.join(destRoot, locale);
  if (!fs.existsSync(localeDir)) continue;
  for (const courseEntry of fs.readdirSync(localeDir)) {
    const courseDir = path.join(localeDir, courseEntry);
    if (!fs.statSync(courseDir).isDirectory()) continue;
    for (const file of fs.readdirSync(courseDir)) {
      if (!file.endsWith(".mdx") || file.startsWith("_")) continue;
      const rel = path.join(locale, courseEntry, file);
      if (!plan.some((item) => item.rel === rel)) strays.push(rel);
    }
  }
}
for (const rel of strays) {
  fail(`公开根里有不在 manifest 的正文：content/courses/${rel}（删掉或补进 manifest）`);
}

/** 生成/更新 .gitignore 的免费试听区块 */
function gitignoreBlock() {
  const lines = [BLOCK_START, "# 课时正文默认全部忽略，只放行免费试听；付费节不可能被 git add -A 带上"];
  lines.push("content/courses/zh/**/*.mdx");
  for (const item of freeFiles) {
    lines.push(`!content/courses/${item.rel.split(path.sep).join("/")}`);
  }
  lines.push(BLOCK_END);
  return lines.join("\n") + "\n";
}

function currentBlock() {
  if (!fs.existsSync(GITIGNORE)) return null;
  const text = fs.readFileSync(GITIGNORE, "utf8");
  const start = text.indexOf(BLOCK_START);
  if (start === -1) return null;
  const end = text.indexOf(BLOCK_END, start);
  if (end === -1) return null;
  return text.slice(start, end + BLOCK_END.length + 1);
}

const blockOutdated = currentBlock() !== gitignoreBlock();

if (checkOnly) {
  const drift = added.length + updated.length + removed.length;
  if (drift > 0 || problems.length > 0 || blockOutdated) {
    console.error("✖ 公开仓的免费试听正文与私有仓不一致：");
    for (const item of added) console.error(`  · 缺文件 ${item.rel}`);
    for (const item of updated) console.error(`  · 内容不同 ${item.rel}`);
    for (const item of removed) console.error(`  · 付费节不该出现 ${item.rel}`);
    for (const message of problems) console.error(`  · ${message}`);
    if (blockOutdated) console.error("  · .gitignore 的免费试听区块过期");
    console.error("\n跑 npm run courses:export-free 重新导出。");
    process.exit(1);
  }
  console.log(
    `✔ 免费试听正文一致：${freeFiles.length} 节（其余 ${paidFiles.length} 节在私有仓，公开根没有残留）`,
  );
  process.exit(0);
}

for (const item of added) {
  fs.mkdirSync(path.dirname(item.dest), { recursive: true });
  fs.copyFileSync(item.src, item.dest);
}
for (const item of updated) {
  fs.copyFileSync(item.src, item.dest);
}
for (const item of removed) {
  fs.rmSync(item.dest, { force: true });
}

// .gitignore 区块
if (fs.existsSync(GITIGNORE)) {
  const text = fs.readFileSync(GITIGNORE, "utf8");
  const block = currentBlock();
  const next = block === null
    ? `${text.replace(/\s*$/, "")}\n\n${gitignoreBlock()}`
    : text.replace(block, gitignoreBlock());
  if (next !== text) fs.writeFileSync(GITIGNORE, next);
}

console.log(
  `导出完成：新增 ${added.length} / 更新 ${updated.length} / 删除 ${removed.length} / 未变 ${unchanged.length}` +
    `（公开 ${freeFiles.length} 节，私有 ${paidFiles.length} 节）`,
);
if (blockOutdated) console.log("已刷新 .gitignore 的免费试听区块");

if (problems.length > 0) {
  for (const message of problems) console.error(`⚠ ${message}`);
  process.exit(1);
}
