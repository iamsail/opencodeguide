#!/usr/bin/env node
/**
 * 生成课时清单（manifest）
 * ------------------------------------------------------------
 * manifest 是「课表」的真相源：slug、标题、摘要、模块/节序号、时长、是否试听。
 * 它**不含正文**，因此可以安全地提交到公开仓；正文是否存在于磁盘由读取侧判断。
 *
 * 为什么要它：公开仓只保留 8 节免费正文，如果课表继续由 MDX 文件驱动
 * （`lib/course-lessons.ts` 的 readdirSync），付费节会从课表里消失、课时 URL 直接 404。
 * 把元数据抽出来之后，「课表 123 节」和「正文只有 8 节」可以同时成立。
 *
 * 这个脚本必须在**有私有正文的机器/仓库**上运行（本地开发机或私有仓 CI），
 * 生成结果再提交到公开仓。
 *
 * 用法：
 *   node scripts/courses/build-manifest.mjs            # 写入 content/courses/manifest.json
 *   node scripts/courses/build-manifest.mjs --check    # 只比较，不一致则退出码 1
 *   node scripts/courses/build-manifest.mjs --stdout   # 打印到标准输出，不落盘
 *
 * 输出结构（不含时间戳，保证重复运行结果稳定）：
 *   {
 *     "version": 1,
 *     "note": "...",
 *     "courses": [
 *       { "slug": "ai-coding-workflow",
 *         "locales": { "zh": [ { slug, title, summary, module, lesson, duration, trial } ] } }
 *     ]
 *   }
 */

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

import { privateRoot } from "./content-paths.mjs";

const ROOT = process.cwd();
const COURSE_DIR = path.join(ROOT, "content/courses");
const OUTPUT = path.join(COURSE_DIR, "manifest.json");
const LOCALES = ["zh", "en"];

const args = new Set(process.argv.slice(2));
const checkOnly = args.has("--check");
const toStdout = args.has("--stdout");

const errors = [];
const warnings = [];
const fail = (where, message) => errors.push(`${where}: ${message}`);
const warn = (where, message) => warnings.push(`${where}: ${message}`);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function positiveInt(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

/** 课程大纲里出现过的 模块:节 槽位，用来校验正文是否对得上大纲 */
function outlineSlots(course, locale) {
  const modules = course?.locales?.[locale]?.modules ?? [];
  const slots = new Set();
  modules.forEach((module, moduleIndex) => {
    (module.lessons ?? []).forEach((_, lessonIndex) => {
      slots.add(`${moduleIndex + 1}:${lessonIndex + 1}`);
    });
  });
  return slots;
}

/**
 * manifest 必须在**能看到全部正文**的地方生成：私有根优先，公开根补齐。
 * 只扫公开根的话（8 节免费正文），会生成一份只有 8 节、把付费课时从课表里砍掉的 manifest。
 */
function scanRoots() {
  const roots = [];
  const priv = privateRoot();
  if (fs.existsSync(priv)) roots.push(priv);
  roots.push(COURSE_DIR);
  return roots;
}

function collectLessons(courseSlug, locale, course) {
  const slots = outlineSlots(course, locale);
  const bySlug = new Map();

  for (const root of scanRoots()) {
    const dir = path.join(root, locale, courseSlug);
    if (!fs.existsSync(dir)) continue;

    for (const file of fs.readdirSync(dir).sort()) {
      if (!file.endsWith(".mdx") || file.startsWith("_")) continue;

      const slug = path.basename(file, ".mdx");
      if (bySlug.has(slug)) continue; // 私有根优先，公开根的副本只在私有根缺失时兜底

      const rel = `content/courses/${locale}/${courseSlug}/${file}`;

      let parsed;
      try {
        parsed = matter(fs.readFileSync(path.join(dir, file), "utf8"));
      } catch (error) {
        fail(rel, `frontmatter 解析失败：${error.message}`);
        continue;
      }

      const data = parsed.data ?? {};
      const module = positiveInt(data.module);
      const lesson = positiveInt(data.lesson);
      if (!module) fail(rel, "缺少有效的 module（≥1 的整数）");
      if (!lesson) fail(rel, "缺少有效的 lesson（≥1 的整数）");

      const title = String(data.title ?? "").trim();
      const summary = String(data.summary ?? "").trim();
      if (!title) fail(rel, "缺少 title");
      if (!summary) warn(rel, "缺少 summary（课程卡与搜索摘要会退化成标题）");

      if (module && lesson && slots.size > 0 && !slots.has(`${module}:${lesson}`)) {
        fail(rel, `大纲里没有 模块 ${module} 第 ${lesson} 节，这一节不会出现在课表里`);
      }

      const duration = positiveInt(data.duration);
      if (!duration) warn(rel, "缺少有效的 duration（分钟），默认按 8 分钟展示");
      else if (duration < 4 || duration > 25) warn(rel, `duration=${duration} 超出建议区间 4–25`);

      if (summary.length > 120) warn(rel, `summary 长度 ${summary.length}，超过 120 会撑破卡片`);

      bySlug.set(slug, {
        slug,
        title,
        summary,
        module: module ?? 0,
        lesson: lesson ?? 0,
        duration: duration ?? 8,
        // 只记录 frontmatter 的显式试听标记；"每门前 N 节免费"由 access.json 的额度在运行期决定，
        // 避免 manifest 与 access.json 两份真相源。
        trial: data.free === true,
      });
    }
  }

  return [...bySlug.values()].sort(
    (a, b) => a.module - b.module || a.lesson - b.lesson || a.slug.localeCompare(b.slug),
  );
}

function build() {
  if (!fs.existsSync(COURSE_DIR)) {
    fail("content/courses", "目录不存在");
    return null;
  }

  const courseFiles = fs
    .readdirSync(COURSE_DIR)
    .filter(
      (file) =>
        file.endsWith(".json") &&
        !file.startsWith("stripe-") &&
        file !== "access.json" &&
        file !== "manifest.json",
    )
    .sort();

  const courses = [];

  for (const file of courseFiles) {
    const course = readJson(path.join(COURSE_DIR, file));
    const slug = String(course?.slug ?? "").trim();
    if (!slug) {
      fail(`content/courses/${file}`, "缺少 slug");
      continue;
    }

    const locales = {};
    let total = 0;
    for (const locale of LOCALES) {
      const lessons = collectLessons(slug, locale, course);
      if (lessons.length === 0) continue;
      locales[locale] = lessons;
      total += lessons.length;
    }

    if (total === 0) {
      // 只有元数据没有正文的课程（例如还没开写的英文课）不算错误
      continue;
    }

    courses.push({ slug, locales });
  }

  courses.sort((a, b) => a.slug.localeCompare(b.slug));

  return {
    version: 1,
    note: "课表真相源：只有元数据，不含正文。由 scripts/courses/build-manifest.mjs 生成，手改无效。正文是否存在由构建期读取磁盘决定。",
    courses,
  };
}

function summarize(manifest) {
  const rows = [];
  for (const course of manifest.courses) {
    for (const [locale, lessons] of Object.entries(course.locales)) {
      rows.push({
        course: course.slug,
        locale,
        lessons: lessons.length,
        trial: lessons.filter((lesson) => lesson.trial).length,
        minutes: lessons.reduce((sum, lesson) => sum + lesson.duration, 0),
      });
    }
  }
  return rows;
}

const manifest = build();

if (errors.length > 0) {
  console.error("✖ 无法生成 manifest：");
  for (const message of errors) console.error(`  - ${message}`);
  process.exit(1);
}

const serialized = `${JSON.stringify(manifest, null, 2)}\n`;

if (toStdout) {
  process.stdout.write(serialized);
} else if (checkOnly) {
  const existing = fs.existsSync(OUTPUT) ? fs.readFileSync(OUTPUT, "utf8") : "";
  if (existing !== serialized) {
    console.error("✖ content/courses/manifest.json 与正文不一致，请运行 npm run courses:manifest 重新生成");
    process.exit(1);
  }
  console.log("✔ manifest 与正文一致");
} else {
  // 护栏：在只有免费正文的机器上（公开仓）跑这个脚本，会生成一份只有 8 节的 manifest。
  // 那会把付费课时从课表里砍掉，属于静默事故，所以默认拒绝覆盖，除非显式 --force。
  const force = args.has("--force");
  const rows = summarize(manifest);
  const nextCount = rows.reduce((sum, row) => sum + row.lessons, 0);
  const existing = fs.existsSync(OUTPUT) ? JSON.parse(fs.readFileSync(OUTPUT, "utf8")) : null;
  const existingCount = Array.isArray(existing?.courses)
    ? existing.courses.reduce(
        (total, course) =>
          total +
          Object.values(course.locales ?? {}).reduce((sum, lessons) => sum + lessons.length, 0),
        0,
      )
    : 0;

  if (nextCount < existingCount && !force) {
    console.error(
      `✖ 扫描到 ${nextCount} 节正文，但现有 manifest 有 ${existingCount} 节，拒绝覆盖。`,
    );
    console.error(
      "  这通常说明你在只有免费正文的环境里运行（公开仓）。真要从头重建，加 --force。",
    );
    process.exit(1);
  }

  fs.writeFileSync(OUTPUT, serialized);
  const totalLessons = rows.reduce((sum, row) => sum + row.lessons, 0);
  console.log(`✔ 已写入 content/courses/manifest.json：${rows.length} 份课表 / ${totalLessons} 节`);
  for (const row of rows) {
    console.log(
      `  ${row.course} [${row.locale}] ${row.lessons} 节 · 显式试听 ${row.trial} · 约 ${Math.round(row.minutes / 60)} 小时`,
    );
  }
}

for (const message of warnings) console.warn(`⚠ ${message}`);
