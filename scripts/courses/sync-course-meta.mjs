#!/usr/bin/env node
/**
 * 把课程 JSON 里的营销数字对齐到真实内容。
 *
 *   lessonCount   = 大纲总节数（以 locales.zh.modules 为准）
 *   durationHours = 已写正文的阅读时长之和（分钟/60，向上取整），没有正文时保留原值
 *   bundle        = 四门课之和
 *
 * 为什么不手改：123 节的数字散落在 5 个 JSON 和 2 处文案里，
 * 手改必然漏一处，最后页面上的数字和课表对不上。
 *
 * 用法：
 *   node scripts/courses/sync-course-meta.mjs --dry-run
 *   node scripts/courses/sync-course-meta.mjs
 */

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const ROOT = process.cwd();
const COURSE_DIR = path.join(ROOT, "content/courses");
const dryRun = process.argv.includes("--dry-run");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

/** 已写正文的总阅读分钟数；没有正文返回 null */
function writtenMinutes(courseSlug) {
  const dir = path.join(COURSE_DIR, "zh", courseSlug);
  if (!fs.existsSync(dir)) return null;

  const files = fs.readdirSync(dir).filter((file) => file.endsWith(".mdx") && !file.startsWith("_"));
  if (files.length === 0) return null;

  let minutes = 0;
  for (const file of files) {
    const data = matter(fs.readFileSync(path.join(dir, file), "utf8")).data ?? {};
    const duration = Number(data.duration);
    minutes += Number.isFinite(duration) && duration > 0 ? duration : 8;
  }
  return minutes;
}

const files = fs
  .readdirSync(COURSE_DIR)
  .filter((file) => file.endsWith(".json") && !file.startsWith("stripe-"));

const rows = [];
let bundleLessonCount = 0;
let bundleHours = 0;

for (const file of files) {
  const filePath = path.join(COURSE_DIR, file);
  const course = readJson(filePath);
  if (!course?.slug) continue;

  const outline = course.locales?.zh?.modules ?? [];
  const outlineLessons = outline.reduce((sum, module) => sum + module.lessons.length, 0);
  const minutes = writtenMinutes(course.slug);

  if (course.kind === "bundle") {
    rows.push({ file, slug: course.slug, bundle: true, minutes });
    continue;
  }

  bundleLessonCount += outlineLessons;

  const next = {
    ...course,
    lessonCount: outlineLessons || course.lessonCount,
    durationHours: minutes ? Math.max(1, Math.ceil(minutes / 60)) : course.durationHours,
  };

  bundleHours += next.durationHours;

  rows.push({
    file,
    slug: course.slug,
    before: { lessons: course.lessonCount, hours: course.durationHours },
    after: { lessons: next.lessonCount, hours: next.durationHours },
    written: minutes ? Math.round(minutes / 8.5) : 0,
    outline: outlineLessons,
    path: filePath,
    value: next,
  });
}

// bundle 最后处理：等所有单课算完
for (const row of rows.filter((item) => item.bundle)) {
  const course = readJson(row.path ?? path.join(COURSE_DIR, row.file));
  const next = {
    ...course,
    lessonCount: bundleLessonCount,
    durationHours: bundleHours || course.durationHours,
  };
  row.before = { lessons: course.lessonCount, hours: course.durationHours };
  row.after = { lessons: next.lessonCount, hours: next.durationHours };
  row.value = next;
}

for (const row of rows) {
  const label = `${row.slug.padEnd(22)}`;
  if (!row.before) {
    console.log(`${label} (bundle) → ${row.after.lessons} 节 / ${row.after.hours}h`);
    if (!dryRun) writeJson(path.join(COURSE_DIR, row.file), row.value);
    continue;
  }
  const changed =
    row.before.lessons !== row.after.lessons || row.before.hours !== row.after.hours;
  console.log(
    `${label} ${String(row.before.lessons).padStart(3)} 节/${String(row.before.hours).padStart(2)}h → ` +
      `${String(row.after.lessons).padStart(3)} 节/${String(row.after.hours).padStart(2)}h` +
      `${row.written ? `  (已写约 ${row.written}/${row.outline} 节)` : "  (尚无正文)"}` +
      `${changed ? "" : "  [无变化]"}`,
  );
  if (!dryRun && changed) writeJson(path.join(COURSE_DIR, row.file), row.value);
}

console.log(
  dryRun ? "\n--dry-run：未写入文件" : "\n已更新课程 JSON（lessonCount / durationHours）",
);
