#!/usr/bin/env node
/**
 * 付费墙闸门（公开构建后运行）
 * ------------------------------------------------------------
 * 站点是纯静态导出，`out/` 里的 HTML 等于公开文件：前端隐藏、CSS 遮挡、
 * JS 拦截都不算数。唯一可信的检查是「公开产物里根本找不到付费正文」。
 *
 * 本脚本做三件事：
 *   1. 反向检查（防泄露）：为每个付费课时从正文里抽 2 段特征串（探针），
 *      在整个 out/ 目录（html / json / js / xml）里搜索，命中即失败。
 *   2. 正向检查（防漏锁）：每个付费课时页必须渲染 `data-locked-lesson` 标记，
 *      否则说明分流没生效（正文可能被渲染出去了）。
 *   3. 对照检查（防误锁）：免费试听页必须仍然包含自己的正文探针，
 *      避免「一刀切锁完」把该公开的内容也锁掉。
 *
 * 用法：
 *   node scripts/courses/assert-no-gated-content.mjs
 *   node scripts/courses/assert-no-gated-content.mjs --dir out --thorough
 *   node scripts/courses/assert-no-gated-content.mjs --report     # 打印探针
 *
 * 退出码：0 通过 / 1 有泄露或缺锁
 */

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

import {
  compareLessons,
  getAccessMode,
  isFreeLesson,
  isMembersBuild,
} from "./access.mjs";

const ROOT = process.cwd();
const COURSE_DIR = path.join(ROOT, "content/courses");

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

/** 按 模块 → 节 排序收集某门课的正文 */
function readLessons(locale, courseSlug) {
  const dir = path.join(COURSE_DIR, locale, courseSlug);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".mdx") && !file.startsWith("_"))
    .map((file) => {
      try {
        const doc = matter(fs.readFileSync(path.join(dir, file), "utf8"));
        return {
          slug: path.basename(file, ".mdx"),
          data: doc.data ?? {},
          body: doc.content ?? "",
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort(compareLessons);
}

function collectLessons() {
  const lessons = [];
  for (const locale of ["zh", "en"]) {
    const localeDir = path.join(COURSE_DIR, locale);
    if (!fs.existsSync(localeDir)) continue;

    for (const entry of fs.readdirSync(localeDir)) {
      if (!fs.statSync(path.join(localeDir, entry)).isDirectory()) continue;
      readLessons(locale, entry).forEach(({ slug, data, body }, index) => {
        lessons.push({
          locale,
          courseSlug: entry,
          slug,
          title: String(data.title ?? slug),
          body,
          free: isFreeLesson({ index, frontmatterFree: data.free === true }),
        });
      });
    }
  }
  return lessons;
}

/**
 * 从正文抽探针：优先取「HTML 渲染后文本不变形」的行——
 * 去掉标题符号、列表符号、表格行、代码块围栏，跳过含 * ` [ ] & < > " ' 的行
 * （这些在 HTML 里会变成标签或实体，导致匹配不上，产生假阴性）。
 */
function buildProbes(body, max = 2) {
  // 探针取「渲染成 HTML 后仍然连续」的纯文本片段：
  //   - 跳过代码块 / 表格行 / 图片；
  //   - 行内代码与加粗会把段落切成多段，所以按它们切开，取其中足够长的一段；
  //   - 含 & < > " ' 的片段在 HTML 里会变成实体，直接排除（否则必然匹配不上）。
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

  const lessons = collectLessons();
  if (lessons.length === 0) {
    console.error("✖ content/courses 下没有任何课时正文，无法校验");
    return 1;
  }

  const gated = lessons.filter((lesson) => !lesson.free);
  const free = lessons.filter((lesson) => lesson.free);

  const files = walkFiles(outDir).filter((file) => fs.statSync(file).size >= MIN_FILE_BYTES);
  const needles = [];
  let noProbe = 0;

  for (const lesson of gated) {
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

  // 1. 反向检查：付费正文是否出现在公开产物里
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

  // 2. 正向检查：付费课时页必须渲染锁定标记
  const missingLockedPages = [];
  for (const lesson of gated) {
    const candidates = pageFileCandidates(outDir, lesson);
    const existing = candidates.find((file) => fs.existsSync(file));
    if (!existing) {
      // 只有中文课时有路由；英文正文尚未上线，缺失不算失败
      if (lesson.locale === "zh") missingLockedPages.push(`${lesson.courseSlug}/${lesson.slug}（页面未生成）`);
      continue;
    }
    const html = fs.readFileSync(existing, "utf8");
    if (!html.includes("data-locked-lesson")) {
      missingLockedPages.push(`${lesson.courseSlug}/${lesson.slug}（缺少锁定标记）`);
    }
  }

  // 3. 对照检查：免费试听页必须仍带自己的正文
  const missingFreeContent = [];
  for (const lesson of free) {
    const candidates = pageFileCandidates(outDir, lesson);
    const existing = candidates.find((file) => fs.existsSync(file));
    if (!existing) continue; // 英文课时无路由

    const probes = buildProbes(lesson.body, 2);
    if (probes.length === 0) continue;
    const html = fs.readFileSync(existing, "utf8");
    if (!probes.some((probe) => html.includes(probe))) {
      missingFreeContent.push(`${lesson.courseSlug}/${lesson.slug}`);
    }
  }

  const problems = leaks.length + missingLockedPages.length + missingFreeContent.length;
  console.log(
    `付费墙闸门 · 扫描 ${files.length} 个文件 · 公开 ${free.length} 节 / 锁定 ${gated.length} 节 · 探针 ${needles.length} 条`,
  );

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
    console.error(`\n✖ ${missingFreeContent.length} 个免费节的正文没出现在页面里（误锁）：`);
    for (const item of missingFreeContent.slice(0, 10)) console.error(`  · ${item}`);
  }

  if (noProbe > 0 && !args.skipProbeCheck) {
    console.error(`\n✖ ${noProbe} 个付费节无法生成探针，等价于没有检查（正文格式异常？）`);
    console.error("  确认后用 --skip-probe-check 放行，或调整正文的段落长度。");
    return 1;
  }

  if (problems > 0) {
    console.error("\n修复方向：付费正文必须只在 members 构建里渲染，见 docs/courses/07-access-control.md 第 3 节。");
    return 1;
  }

  console.log("✔ 公开产物中没有任何付费正文，锁定页与免费试听页均正常");
  return 0;
}

process.exit(main());
