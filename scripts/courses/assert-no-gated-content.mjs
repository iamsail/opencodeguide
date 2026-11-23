#!/usr/bin/env node
/**
 * 付费墙闸门（公开构建后运行）
 * ------------------------------------------------------------
 * 站点是纯静态导出，`out/` 里的 HTML 等于公开文件：前端隐藏、CSS 遮挡、
 * JS 拦截都不算数。唯一可信的检查是「公开产物里根本找不到付费正文」。
 *
 * 本脚本做四件事：
 *   1. 仓库检查（防放进公开仓）：`git ls-files` 里不允许出现付费正文文件。
 *      这是拆分后最重要的一条——正文已经不在公开仓，但仍要被守住。
 *   2. 反向检查（防泄露）：本 checkout 若存在付费正文，从里面抽 2 段特征串（探针），
 *      在整个 out/ 目录（html / json / js / xml）里搜索，命中即失败。
 *   3. 正向检查（防漏锁）：每个付费课时页必须渲染 `data-locked-lesson` 标记，
 *      否则说明分流没生效，或者页面根本没生成（URL 会 404）。
 *   4. 对照检查（防误锁）：免费试听页必须仍然包含自己的正文探针。
 *
 * 与拆分前的重要区别：付费清单改由 `content/courses/manifest.json` 提供。
 * 以前从 `.mdx` 反推，正文一搬走付费清单就变成 0 条，脚本会打印 ✔ 但什么都没验。
 * 现在即使本 checkout 里没有任何付费正文，第 1 条与第 3 条仍然在生效。
 *
 * 用法：
 *   node scripts/courses/assert-no-gated-content.mjs
 *   node scripts/courses/assert-no-gated-content.mjs --dir out --thorough
 *   node scripts/courses/assert-no-gated-content.mjs --report     # 打印探针
 *
 * 退出码：0 通过 / 1 有泄露、缺锁或仓库里混入付费正文
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import matter from "gray-matter";

import { getAccessMode, isMembersBuild, readAccessConfig } from "./access.mjs";
import { lessonRoots, resolveLessonFile } from "./content-paths.mjs";
import { readLessonManifest } from "./manifest.mjs";

const ROOT = process.cwd();

const SCAN_EXTENSIONS = new Set([".html", ".htm", ".json", ".js", ".mjs", ".xml", ".txt"]);
const MIN_FILE_BYTES = 64;

function parseArgs(argv) {
  const args = { dir: "out", thorough: false, report: false, skipProbeCheck: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dir") args.dir = argv[++i] ?? args.dir;
    else if (arg === "--thorough") args.thorough = true;
    else if (arg === "--report") args.report = true;
    else if (arg === "--skip-probe-check") args.skipProbeCheck = true;
    else if (arg === "--help" || arg === "-h") {
      console.log(
        "用法：node scripts/courses/assert-no-gated-content.mjs [--dir out] [--thorough] [--report] [--skip-probe-check]",
      );
      process.exit(0);
    }
  }
  return args;
}

/**
 * 从 manifest 组装课时清单。
 * body 只从当前构建模式可见的根里读（public 构建 = 只有公开根，所以正常情况下付费节 body 为空）。
 */
function collectLessons(manifest) {
  const roots = lessonRoots();
  const { freeLessonLimit } = readAccessConfig();
  const rows = [];

  for (const course of manifest.courses) {
    for (const [locale, lessons] of Object.entries(course.locales ?? {})) {
      lessons.forEach((lesson, index) => {
        const file = resolveLessonFile({ locale, course: course.slug, slug: lesson.slug }, roots);
        let body = "";
        if (file) {
          try {
            body = matter(fs.readFileSync(file, "utf8")).content ?? "";
          } catch {
            body = "";
          }
        }
        rows.push({
          locale,
          courseSlug: course.slug,
          slug: lesson.slug,
          title: lesson.title ?? lesson.slug,
          free: lesson.trial === true || index < freeLessonLimit,
          body,
          hasBody: Boolean(file) && body.trim().length > 0,
        });
      });
    }
  }

  return rows;
}

/** 当前 checkout 里被 git 跟踪的课程文件（用于「付费正文不许进公开仓」检查） */
function trackedCourseFiles() {
  try {
    const output = execFileSync("git", ["ls-files", "-z", "--", "content/courses"], {
      cwd: ROOT,
      encoding: "utf8",
    });
    return new Set(output.split("\0").filter(Boolean));
  } catch {
    return null;
  }
}

/**
 * 从正文抽探针：优先取「HTML 渲染后文本不变形」的行——
 * 去掉标题符号、列表符号、表格行、代码块围栏，跳过含 * ` [ ] & < > " ' 的行
 * （这些在 HTML 里会变成标签或实体，导致匹配不上，产生假阴性）。
 */
function buildProbes(body, max = 2) {
  const candidates = [];
  let inFence = false;

  for (const raw of body.split("\n")) {
    const line = raw.trim();
    if (line.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence || !line) continue;
    if (line.startsWith("|") || line.startsWith("![")) continue;

    const withoutMarker = line
      .replace(/^#{1,6}\s*/, "")
      .replace(/^[-*+]\s+/, "")
      .replace(/^\d+\.\s+/, "")
      .replace(/^>\s*/, "");

    for (const piece of withoutMarker.split(/`[^`]*`|\*\*[^*]*\*\*/)) {
      const normalized = piece
        .replace(/[*`[\]]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (normalized.length < 40) continue;
      if (/[&<>"']/.test(normalized)) continue;
      candidates.push(normalized);
    }
  }

  if (candidates.length === 0) return [];

  const probes = [];
  const step = Math.max(1, Math.floor(candidates.length / max));
  for (let i = 0; i < candidates.length && probes.length < max; i += step) {
    probes.push(candidates[i].slice(0, 56));
  }
  return [...new Set(probes)];
}

function walkFiles(dir, collected = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, collected);
    } else if (entry.isFile() && SCAN_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      collected.push(full);
    }
  }
  return collected;
}

function pageFileCandidates(outDir, lesson) {
  const base = path.join(outDir, lesson.locale, "courses", lesson.courseSlug, lesson.slug);
  return [path.join(base, "index.html"), `${base}.html`];
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (isMembersBuild()) {
    console.log(`跳过付费墙闸门：COURSE_ACCESS=${getAccessMode()}（成员构建不发布到公开站）`);
    return 0;
  }

  const outDir = path.resolve(ROOT, args.dir);
  if (!fs.existsSync(outDir)) {
    console.error(`✖ 找不到构建产物目录：${outDir}`);
    console.error("  先跑 npm run build（或指定 --dir），否则这道闸门等于没开。");
    return 1;
  }

  const manifest = readLessonManifest();
  if (!manifest) {
    console.error("✖ 找不到 content/courses/manifest.json，无法确定付费课时清单");
    console.error("  先跑 npm run courses:manifest（在带正文的环境里生成并提交）");
    return 1;
  }

  const lessons = collectLessons(manifest);
  if (lessons.length === 0) {
    console.error("✖ manifest 里没有任何课时，无法校验");
    return 1;
  }

  const gated = lessons.filter((lesson) => !lesson.free);
  const free = lessons.filter((lesson) => lesson.free);
  const gatedWithBody = gated.filter((lesson) => lesson.hasBody);

  // ---- 检查 1：公开仓里不允许出现付费正文文件 ----
  const tracked = trackedCourseFiles();
  const leakedInRepo = [];
  if (tracked) {
    for (const lesson of gated) {
      const rel = `content/courses/${lesson.locale}/${lesson.courseSlug}/${lesson.slug}.mdx`;
      if (tracked.has(rel)) leakedInRepo.push(rel);
    }
  }

  const files = walkFiles(outDir).filter((file) => fs.statSync(file).size >= MIN_FILE_BYTES);

  // ---- 检查 2：付费正文探针不得出现在公开产物里 ----
  const needles = [];
  let noProbe = 0;
  for (const lesson of gatedWithBody) {
    const probes = buildProbes(lesson.body, args.thorough ? 3 : 2);
    if (probes.length === 0) {
      noProbe += 1;
      continue;
    }
    for (const probe of probes) {
      needles.push({ probe, needle: Buffer.from(probe, "utf8"), lesson });
    }
  }

  if (args.report) {
    console.log(`样本探针（付费节，共 ${needles.length} 条）：`);
    for (const item of needles.slice(0, 6)) {
      console.log(`  · ${item.lesson.locale}/${item.lesson.courseSlug}/${item.lesson.slug}: ${item.probe}`);
    }
  }

  const leaks = [];
  for (const file of files) {
    const buffer = fs.readFileSync(file);
    for (const item of needles) {
      if (buffer.indexOf(item.needle) !== -1) {
        const relative = path.relative(ROOT, file);
        leaks.push({
          file: relative.startsWith("..") ? file : relative,
          lesson: `${item.lesson.locale}/courses/${item.lesson.courseSlug}/${item.lesson.slug}`,
          probe: item.probe.slice(0, 24),
        });
        break;
      }
    }
  }

  // ---- 检查 3：每个付费课时页都必须存在且渲染锁定标记 ----
  const missingLockedPages = [];
  for (const lesson of gated) {
    const candidates = pageFileCandidates(outDir, lesson);
    const existing = candidates.find((file) => fs.existsSync(file));
    if (!existing) {
      // 英文课时路由尚未上线，缺页不算失败；中文必须逐节有页面
      if (lesson.locale === "zh") {
        missingLockedPages.push(`${lesson.courseSlug}/${lesson.slug}（页面未生成，URL 会 404）`);
      }
      continue;
    }
    const html = fs.readFileSync(existing, "utf8");
    if (!html.includes("data-locked-lesson")) {
      missingLockedPages.push(`${lesson.courseSlug}/${lesson.slug}（缺少锁定标记）`);
    }
  }

  // ---- 检查 4：免费试听页必须仍带自己的正文 ----
  const missingFreeContent = [];
  for (const lesson of free) {
    if (!lesson.hasBody) {
      missingFreeContent.push(`${lesson.courseSlug}/${lesson.slug}（公开仓里没有免费正文）`);
      continue;
    }
    const candidates = pageFileCandidates(outDir, lesson);
    const existing = candidates.find((file) => fs.existsSync(file));
    if (!existing) continue; // 英文课时无路由

    const probes = buildProbes(lesson.body, 2);
    if (probes.length === 0) continue;
    const html = fs.readFileSync(existing, "utf8");
    if (!probes.some((probe) => html.includes(probe))) {
      missingFreeContent.push(`${lesson.courseSlug}/${lesson.slug}（页面里找不到正文）`);
    }
  }

  const problems = leakedInRepo.length + leaks.length + missingLockedPages.length + missingFreeContent.length;

  console.log(
    `付费墙闸门 · 扫描 ${files.length} 个文件 · 公开 ${free.length} 节 / 锁定 ${gated.length} 节 · ` +
      `仓库内付费正文 ${leakedInRepo.length} 个 · 探针 ${needles.length} 条`,
  );
  if (tracked === null) {
    console.log("  ⚠ 当前目录不是 git checkout，跳过「付费正文不得入库」检查");
  }
  if (gatedWithBody.length === 0) {
    console.log(
      `  说明：本 checkout 内没有付费正文（${gated.length} 节都在私有仓），探针检查无可检对象，` +
        "泄露面由「仓库检查 + 锁定页检查」覆盖",
    );
  }

  if (leakedInRepo.length > 0) {
    console.error(`\n✖ 公开仓里混进了 ${leakedInRepo.length} 个付费正文文件：`);
    for (const item of leakedInRepo.slice(0, 10)) console.error(`  · ${item}`);
    if (leakedInRepo.length > 10) console.error(`  …其余 ${leakedInRepo.length - 10} 个省略`);
  }

  if (leaks.length > 0) {
    console.error(`\n✖ 发现 ${leaks.length} 处付费正文泄露：`);
    for (const leak of leaks.slice(0, 10)) {
      console.error(`  · ${leak.file}  ←  ${leak.lesson}  「${leak.probe}…」`);
    }
    if (leaks.length > 10) console.error(`  …其余 ${leaks.length - 10} 处省略`);
  }

  if (missingLockedPages.length > 0) {
    console.error(`\n✖ ${missingLockedPages.length} 个付费课时页没有渲染锁定页：`);
    for (const item of missingLockedPages.slice(0, 10)) console.error(`  · ${item}`);
  }

  if (missingFreeContent.length > 0) {
    console.error(`\n✖ ${missingFreeContent.length} 个免费节的正文没出现在页面里（误锁或缺正文）：`);
    for (const item of missingFreeContent.slice(0, 10)) console.error(`  · ${item}`);
  }

  if (noProbe > 0 && !args.skipProbeCheck) {
    console.error(`\n✖ ${noProbe} 个付费节无法生成探针，等价于没有检查（正文格式异常？）`);
    console.error("  确认后用 --skip-probe-check 放行，或调整正文的段落长度。");
    return 1;
  }

  if (problems > 0) {
    console.error(
      "\n修复方向：付费正文只应存在于私有仓，公开构建只渲染锁定页。见 docs/courses/09-content-repo-boundary.md。",
    );
    return 1;
  }

  console.log("✔ 公开产物里没有付费正文，锁定页与免费试听页均正常");
  return 0;
}

process.exit(main());
