#!/usr/bin/env node
/**
 * 课程数据自检（构建前置）
 * ------------------------------------------------------------
 * 课程内容由 `content/courses/*.json` 驱动，改错一个字段不会报错，
 * 而是静默降级（图标变 Layers、渐变回退默认色、支付按钮消失）。
 * 本脚本把这类「静默失败」变成构建期可见的错误/警告。
 *
 * 校验范围：
 *   1. 课程 JSON 的结构、枚举、价格、双语完整度
 *   2. 与代码的联动：icon 是否在 CourseIcon 映射中、accent 是否在 accentClass 白名单中
 *   3. stripe-links.json 的 key 是否指向真实存在的 课程:计划
 *
 * 用法：
 *   node scripts/courses/validate-courses.mjs
 *   node scripts/courses/validate-courses.mjs --strict   # 警告也视为失败
 *   node scripts/courses/validate-courses.mjs --json     # 机器可读输出
 *
 * 退出码：0 通过（可能带警告） / 1 有错误
 */

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

import { getAccessMode, isFreeLesson, readAccessConfig } from "./access.mjs";
import {
  lessonRoots,
  privateRoot,
  publicRoot,
  requirePrivateRootForMembers,
  resolveLessonFile,
} from "./content-paths.mjs";
import { readLessonManifest } from "./manifest.mjs";

const ROOT = process.cwd();
const COURSE_DIR = path.join(ROOT, "content/courses");
const LINKS_FILE = path.join(COURSE_DIR, "stripe-links.json");
const VISUALS_FILE = path.join(ROOT, "components/courses/course-visuals.tsx");
const ACCESS_FILE = path.join(COURSE_DIR, "access.json");
const accessConfig = readAccessConfig();

/** 与 lib/courses.ts 的 TRACKS 保持一致；bundle 单独处理 */
const TRACKS = ["ai-coding", "indie", "ecommerce", "global-seo"];
const KINDS = ["course", "bundle"];
const STATUSES = ["live", "preorder", "coming-soon"];
const LEVELS = ["beginner", "intermediate", "advanced", "mixed"];
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

const diagnostics = [];

function add(level, file, field, message) {
  diagnostics.push({ level, file, field, message });
}
const error = (file, field, message) => add("error", file, field, message);
const warn = (file, field, message) => add("warn", file, field, message);

function parseArgs(argv) {
  const args = { strict: false, json: false };
  for (const raw of argv) {
    const key = raw.replace(/^--/, "");
    if (key === "strict") args.strict = true;
    else if (key === "json") args.json = true;
  }
  return args;
}

function readJson(file) {
  const text = fs.readFileSync(file, "utf8");
  return JSON.parse(text);
}

const isString = (value) => typeof value === "string" && value.trim().length > 0;
const isStringArray = (value) =>
  Array.isArray(value) && value.length > 0 && value.every(isString);
const isPositiveInt = (value) => Number.isInteger(value) && value > 0;

/**
 * 从 course-visuals.tsx 抽出 icon 映射与 accent 白名单，
 * 避免把这两份清单在本脚本里再抄一遍（抄了就会不同步）。
 */
function readVisuals() {
  try {
    const source = fs.readFileSync(VISUALS_FILE, "utf8");
    const iconsBlock = source.match(/const ICONS[^{]*\{([\s\S]*?)\};/);
    const icons = iconsBlock
      ? [...iconsBlock[1].matchAll(/^\s*([A-Za-z0-9_]+)\s*,/gm)].map((m) => m[1])
      : null;
    const allowedBlock = source.match(/const allowed = \[([\s\S]*?)\];/);
    const accents = allowedBlock
      ? [...allowedBlock[1].matchAll(/"([^"]+)"/g)].map((m) => m[1])
      : null;
    return { icons, accents };
  } catch {
    return { icons: null, accents: null };
  }
}

/* ------------------------------------------------------------------ */
/* 课程 JSON                                                            */
/* ------------------------------------------------------------------ */

function validatePlans(file, slug, course) {
  const plans = course.plans;
  if (!Array.isArray(plans) || plans.length === 0) {
    error(file, "plans", "必须是非空数组");
    return;
  }

  const seen = new Set();
  for (const [index, plan] of plans.entries()) {
    const at = `plans[${index}]`;
    if (!plan || typeof plan !== "object") {
      error(file, at, "必须是对象");
      continue;
    }
    if (!isString(plan.id)) error(file, `${at}.id`, "缺少计划 id");
    else {
      if (!KEBAB.test(plan.id)) error(file, `${at}.id`, `计划 id 必须是 kebab-case：${plan.id}`);
      if (seen.has(plan.id)) error(file, `${at}.id`, `计划 id 重复：${plan.id}`);
      seen.add(plan.id);
    }

    if (!isPositiveInt(plan.priceUSD)) {
      error(file, `${at}.priceUSD`, "必须是大于 0 的整数（美元，不带小数）");
    } else if (plan.priceUSD > 10000) {
      warn(file, `${at}.priceUSD`, `价格偏高（$${plan.priceUSD}），请确认不是分位录入错误`);
    }

    if (plan.compareAtUSD !== undefined) {
      if (!isPositiveInt(plan.compareAtUSD)) {
        error(file, `${at}.compareAtUSD`, "必须是大于 0 的整数");
      } else if (isPositiveInt(plan.priceUSD) && plan.compareAtUSD <= plan.priceUSD) {
        warn(file, `${at}.compareAtUSD`, "划线价不高于售价，用户会看出「假折扣」");
      }
    }

    if (plan.priceCNYRef !== undefined) {
      if (!isPositiveInt(plan.priceCNYRef)) {
        error(file, `${at}.priceCNYRef`, "必须是大于 0 的整数");
      } else if (isPositiveInt(plan.priceUSD)) {
        const ratio = plan.priceCNYRef / plan.priceUSD;
        if (ratio < 5.5 || ratio > 8.5) {
          warn(
            file,
            `${at}.priceCNYRef`,
            `人民币参考价偏离汇率区间（1 USD ≈ ${ratio.toFixed(1)} CNY），当前 ${plan.priceUSD} → ${plan.priceCNYRef}`,
          );
        }
      }
    }

    if (plan.badge !== undefined) {
      if (!plan.badge || !isString(plan.badge.zh) || !isString(plan.badge.en)) {
        error(file, `${at}.badge`, "需要同时提供 zh 与 en 文案");
      }
    }

    const features = plan.features;
    if (!features || !isStringArray(features.zh) || !isStringArray(features.en)) {
      error(file, `${at}.features`, "zh 与 en 都必须是非空字符串数组");
    } else if (features.zh.length !== features.en.length) {
      error(
        file,
        `${at}.features`,
        `中英条目数不一致（zh ${features.zh.length} / en ${features.en.length}）：文案会错位`,
      );
    }
  }

  if (course.kind === "bundle" && !seen.has("all-access")) {
    warn(file, "plans", "全站通的计划 id 建议为 all-access（目录页与文案层按此约定）");
  }
}

function validateLocaleContent(file, slug, locale, content) {
  const at = `locales.${locale}`;
  if (!content || typeof content !== "object") {
    error(file, at, "缺少该语言版本");
    return;
  }

  for (const field of ["title", "subtitle", "tagline"]) {
    if (!isString(content[field])) error(file, `${at}.${field}`, "必须是非空字符串");
  }

  for (const field of ["audience", "outcomes", "deliverables"]) {
    if (!isStringArray(content[field])) {
      error(file, `${at}.${field}`, "必须是非空字符串数组（详情页会逐条渲染）");
    }
  }

  if (!Array.isArray(content.modules) || content.modules.length === 0) {
    error(file, `${at}.modules`, "必须是非空数组");
  } else {
    const titles = new Set();
    for (const [index, module] of content.modules.entries()) {
      const mAt = `${at}.modules[${index}]`;
      if (!module || typeof module !== "object") {
        error(file, mAt, "必须是对象");
        continue;
      }
      if (!isString(module.title)) error(file, `${mAt}.title`, "缺少章节标题");
      else if (titles.has(module.title)) warn(file, `${mAt}.title`, `章节标题重复：${module.title}`);
      else titles.add(module.title);

      if (!isStringArray(module.lessons)) {
        error(file, `${mAt}.lessons`, "必须是非空字符串数组");
      }
      if (module.free !== undefined && typeof module.free !== "boolean") {
        error(file, `${mAt}.free`, "必须是布尔值");
      }
    }
  }

  if (!Array.isArray(content.faq) || content.faq.length === 0) {
    error(file, `${at}.faq`, "必须是非空数组");
  } else {
    const questions = new Set();
    for (const [index, item] of content.faq.entries()) {
      const fAt = `${at}.faq[${index}]`;
      if (!item || !isString(item.q) || !isString(item.a)) {
        error(file, fAt, "需要非空的 q 与 a");
        continue;
      }
      if (questions.has(item.q)) warn(file, fAt, `FAQ 问题重复：${item.q}`);
      questions.add(item.q);
    }
  }

  const seo = content.seo;
  if (!seo || !isString(seo.title) || !isString(seo.description)) {
    error(file, `${at}.seo`, "需要非空的 title 与 description");
  } else {
    if (seo.title.length > 60) {
      warn(file, `${at}.seo.title`, `长度 ${seo.title.length}，超过 Google 标题展示上限（~60）`);
    }
    if (seo.description.length > 160) {
      warn(
        file,
        `${at}.seo.description`,
        `长度 ${seo.description.length}，超过建议上限（160），移动端会被截断`,
      );
    } else if (seo.description.length < 60) {
      warn(file, `${at}.seo.description`, `长度 ${seo.description.length}，偏短（建议 60-160）`);
    }
  }

  if (content.instructor !== undefined) {
    if (
      !content.instructor ||
      !isString(content.instructor.name) ||
      !isString(content.instructor.role) ||
      !isString(content.instructor.bio)
    ) {
      error(file, `${at}.instructor`, "需要 name / role / bio 三个非空字段");
    }
  }

  if (content.guarantee !== undefined && !isString(content.guarantee)) {
    error(file, `${at}.guarantee`, "必须是非空字符串");
  }
}

function validateCourse(file, course, visuals, ctx) {
  if (!course || typeof course !== "object") {
    error(file, "-", "顶层必须是 JSON 对象");
    return;
  }

  const slug = course.slug;
  if (!isString(slug)) {
    error(file, "slug", "缺少 slug");
  } else {
    if (!KEBAB.test(slug)) error(file, "slug", `必须是 kebab-case：${slug}`);
    if (path.basename(file, ".json") !== slug) {
      error(file, "slug", `与文件名不一致（${path.basename(file, ".json")}）：路由与静态生成会错位`);
    }
    if (ctx.slugs.has(slug)) error(file, "slug", `与其他文件重复：${slug}`);
    ctx.slugs.add(slug);
  }

  if (!KINDS.includes(course.kind)) {
    error(file, "kind", `必须是 ${KINDS.join(" / ")} 之一`);
  }
  if (!STATUSES.includes(course.status)) {
    error(file, "status", `必须是 ${STATUSES.join(" / ")} 之一`);
  }
  if (!LEVELS.includes(course.level)) {
    error(file, "level", `必须是 ${LEVELS.join(" / ")} 之一`);
  }

  const expectedTrack = course.kind === "bundle" ? "bundle" : TRACKS;
  if (!expectedTrack.includes(course.track)) {
    error(
      file,
      "track",
      course.kind === "bundle"
        ? 'kind 为 bundle 时 track 必须是 "bundle"'
        : `必须是 ${TRACKS.join(" / ")} 之一（目录页按此分组）`,
    );
  }

  if (!isString(course.icon)) {
    error(file, "icon", "缺少图标名");
  } else if (visuals.icons && !visuals.icons.includes(course.icon)) {
    warn(
      file,
      "icon",
      `不在 CourseIcon 映射中（${visuals.icons.join(", ")}），将回退为 Layers 图标`,
    );
  }

  if (!isString(course.accent)) {
    error(file, "accent", "缺少渐变类名");
  } else if (visuals.accents && !visuals.accents.includes(course.accent)) {
    warn(
      file,
      "accent",
      "不在 accentClass 白名单中，将回退为默认渐变（新增配色需同时改 course-visuals.tsx）",
    );
  }

  if (!isPositiveInt(course.durationHours)) error(file, "durationHours", "必须是大于 0 的整数");
  if (!isPositiveInt(course.lessonCount)) error(file, "lessonCount", "必须是大于 0 的整数");
  if (!isString(course.lastUpdated) || !MONTH.test(course.lastUpdated ?? "")) {
    error(file, "lastUpdated", "格式必须是 YYYY-MM");
  }

  if (course.releaseDate !== undefined) {
    if (!isString(course.releaseDate) || !MONTH.test(course.releaseDate)) {
      error(file, "releaseDate", "格式必须是 YYYY-MM");
    }
    if (course.status === "live") {
      warn(file, "releaseDate", "已上线课程仍带 releaseDate，详情页会显示预售时间");
    }
  } else if (course.status !== "live") {
    warn(file, "releaseDate", "预售/制作中的课程建议填写 releaseDate（详情页会展示）");
  }

  validatePlans(file, slug, course);

  const locales = course.locales;
  if (!locales || typeof locales !== "object") {
    error(file, "locales", "必须包含 zh 与 en");
    return;
  }
  for (const locale of ["zh", "en"]) {
    if (!locales[locale]) error(file, `locales.${locale}`, "缺少该语言版本（详情页会回退到中文）");
    else validateLocaleContent(file, slug, locale, locales[locale]);
  }

  if (locales.zh && locales.en) {
    for (const field of ["audience", "outcomes", "deliverables", "modules", "faq"]) {
      const zhLen = Array.isArray(locales.zh[field]) ? locales.zh[field].length : 0;
      const enLen = Array.isArray(locales.en[field]) ? locales.en[field].length : 0;
      if (zhLen > 0 && enLen > 0 && zhLen !== enLen) {
        warn(file, `locales.${field}`, `中英条目数不一致（zh ${zhLen} / en ${enLen}），像是漏翻了`);
      }
    }
  }

  if (course.kind === "bundle" && course.status === "live" && isPositiveInt(course.lessonCount)) {
    ctx.bundleLessonCount = course.lessonCount;
  }
}

/* ------------------------------------------------------------------ */
/* 支付链接                                                             */
/* ------------------------------------------------------------------ */

function validateLinks(coursesBySlug, args) {
  if (!fs.existsSync(LINKS_FILE)) {
    warn("content/courses/stripe-links.json", "-", "文件不存在，所有购买按钮都会降级为等待名单");
    return;
  }

  let links;
  try {
    links = readJson(LINKS_FILE);
  } catch (err) {
    error("content/courses/stripe-links.json", "-", `JSON 解析失败：${err.message}`);
    return;
  }

  if (!links || typeof links !== "object") {
    error("content/courses/stripe-links.json", "-", "顶层必须是对象");
    return;
  }

  if (links.mode === "test") {
    warn(
      "content/courses/stripe-links.json",
      "mode",
      "当前是 test 模式链接，正式上线前必须用 sk_live_ 重新生成，否则真实用户无法付款",
    );
  }

  const plans = links.plans;
  if (plans === undefined) return;
  if (!plans || typeof plans !== "object") {
    error("content/courses/stripe-links.json", "plans", "必须是对象");
    return;
  }

  for (const [key, url] of Object.entries(plans)) {
    const at = `plans["${key}"]`;
    const [slug, planId, ...rest] = key.split(":");
    if (!slug || !planId || rest.length > 0) {
      error(
        "content/courses/stripe-links.json",
        at,
        '格式必须是 "课程 slug:计划 id"，例如 "ai-coding-workflow:pro"',
      );
      continue;
    }

    const course = coursesBySlug.get(slug);
    if (!course) {
      error(
        "content/courses/stripe-links.json",
        at,
        `课程不存在：${slug}（课程改名/删除后要同步清理链接，否则该条配置静默失效）`,
      );
    } else if (!course.plans.some((plan) => plan.id === planId)) {
      error(
        "content/courses/stripe-links.json",
        at,
        `课程 ${slug} 没有计划 ${planId}（现有：${course.plans.map((p) => p.id).join(", ")}）`,
      );
    } else if (course.status !== "live") {
      warn(
        "content/courses/stripe-links.json",
        at,
        `课程 ${slug} 状态为 ${course.status}，详情页仍会显示等待名单，链接不会生效`,
      );
    }

    if (!isString(url)) {
      error("content/courses/stripe-links.json", at, "链接必须是非空字符串");
      continue;
    }
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      error("content/courses/stripe-links.json", at, `不是合法 URL：${url}`);
      continue;
    }
    if (parsed.protocol !== "https:") {
      error("content/courses/stripe-links.json", at, "必须是 https 链接");
    } else if (!/(^|\.)stripe\.com$/.test(parsed.hostname)) {
      warn("content/courses/stripe-links.json", at, `非 Stripe 域名：${parsed.hostname}`);
    }
  }

  // 有正式链接但页面仍是等待名单，是上线前最常见的漏配
  for (const course of coursesBySlug.values()) {
    if (course.status !== "live") continue;
    const hasAny = course.plans.some((plan) => Boolean(plans[`${course.slug}:${plan.id}`]));
    if (!hasAny) {
      warn(
        "content/courses/stripe-links.json",
        course.slug,
        `已上线但没有任何支付链接，详情页会显示等待名单（若是有意预售可忽略）`,
      );
    }
  }
}

/* ------------------------------------------------------------------ */
/* 课时正文（文章版 MDX）                                                */
/* ------------------------------------------------------------------ */

const lessonStats = { total: 0, ready: 0, missing: 0, free: 0, gated: 0 };

function normalizeTitle(value) {
  return String(value ?? "")
    .replace(/[\s·:：,，。.、—\-()（）「」【】]/g, "")
    .toLowerCase();
}

/** 判断这一节在当前构建模式下缺正文是否算错误 */
function missingBodyIsError() {
  return getAccessMode() === "members";
}

function validateLessons(coursesBySlug) {
  const manifest = readLessonManifest();

  if (!manifest) {
    if (getAccessMode() === "members") {
      error(
        "content/courses/manifest.json",
        "-",
        "members 构建必须有 manifest（否则成员站课表会退化成有正文的那几节），先跑 npm run courses:manifest",
      );
      return;
    }
    warn(
      "content/courses/manifest.json",
      "-",
      "缺少课时清单，回退为按目录扫描课表（先跑 npm run courses:manifest 生成）",
    );
    validateLessonsFromFiles(coursesBySlug);
    return;
  }

  validateLessonsFromManifest(manifest, coursesBySlug);
}

/**
 * manifest 驱动的课时校验
 * ------------------------------------------------------------
 * 课表以 manifest 为准，正文以磁盘为准（公开仓只有免费节）。
 * 缺正文：public 是正常状态（付费正文在私有仓），members 是错误。
 */
function validateLessonsFromManifest(manifest, coursesBySlug) {
  // members 构建前先确认私有根可用，避免刷出上百条「缺正文」掩盖真正原因
  if (missingBodyIsError()) {
    try {
      requirePrivateRootForMembers();
    } catch (rootError) {
      error("COURSE_PRIVATE_DIR", "-", String(rootError.message).split("\n")[0]);
      return;
    }
  }

  const roots = lessonRoots();
  const members = missingBodyIsError();
  const { freeLessonLimit } = accessConfig;
  const known = new Set();

  for (const course of manifest.courses) {
    const courseJson = coursesBySlug.get(course.slug);
    if (!courseJson) {
      error(
        `content/courses/${course.slug}.json`,
        "-",
        "manifest 里有这门课，但找不到对应的课程 JSON",
      );
    }

    for (const [locale, lessons] of Object.entries(course.locales ?? {})) {
      const outline = courseJson?.locales?.[locale]?.modules ?? [];
      const slots = new Map();
      outline.forEach((module, moduleIndex) => {
        (module.lessons ?? []).forEach((title, lessonIndex) => {
          slots.set(`${moduleIndex + 1}:${lessonIndex + 1}`, title);
        });
      });

      const usedSlots = new Map();

      lessons.forEach((lesson, index) => {
        const rel = `content/courses/${locale}/${course.slug}/${lesson.slug}.mdx`;
        lessonStats.total += 1;
        known.add(`${locale}:${course.slug}:${lesson.slug}`);

        if (!isString(lesson.title)) error(rel, "title", "manifest 里缺少标题");
        if (!isString(lesson.summary)) warn(rel, "summary", "manifest 里缺少摘要");
        else if (lesson.summary.length > 60) {
          warn(rel, "summary", `长度 ${lesson.summary.length}，建议 ≤60 字（课程卡/搜索摘要会截断）`);
        }

        const slotKey = `${lesson.module}:${lesson.lesson}`;
        if (slots.size > 0 && !slots.has(slotKey)) {
          error(
            rel,
            "module/lesson",
            `大纲里没有 模块 ${lesson.module} 第 ${lesson.lesson} 节（该语言现有模块数 ${outline.length}），这一节不会出现在课表里`,
          );
        } else if (usedSlots.has(slotKey)) {
          error(rel, "module/lesson", `与 ${usedSlots.get(slotKey)} 指向同一节（${slotKey}）`);
        } else {
          usedSlots.set(slotKey, lesson.slug);
          const outlineTitle = slots.get(slotKey);
          if (
            isString(lesson.title) &&
            isString(outlineTitle) &&
            normalizeTitle(lesson.title) !== normalizeTitle(outlineTitle)
          ) {
            warn(
              rel,
              "title",
              `与大纲标题不一致：manifest「${lesson.title}」/ 大纲「${outlineTitle}」`,
            );
          }
        }

        if (!Number.isInteger(lesson.duration) || lesson.duration < 4 || lesson.duration > 25) {
          warn(rel, "duration", "建议 4–25 的整数（分钟），用于阅读时长展示");
        }

        const file = resolveLessonFile({ locale, course: course.slug, slug: lesson.slug }, roots);
        if (!file) {
          lessonStats.missing += 1;
          if (members) {
            error(rel, "-", "members 构建缺正文：这一节会渲染成锁定页而不是正文，先补齐私有仓");
          }
          return;
        }

        lessonStats.ready += 1;

        // 免费节同时存在于公开仓与私有仓：两边内容不同就是漂移，必须重新导出
        if (members) {
          const locator = { locale, course: course.slug, slug: lesson.slug };
          const publicFile = resolveLessonFile(locator, [publicRoot()]);
          const privateFile = resolveLessonFile(locator, [privateRoot()]);
          if (
            publicFile &&
            privateFile &&
            !fs.readFileSync(publicFile).equals(fs.readFileSync(privateFile))
          ) {
            error(
              rel,
              "-",
              "公开根与私有根的同一节课内容不一致（免费节漂移），以私有仓为准重新导出免费节",
            );
          }
        }

        let parsed;
        try {
          parsed = matter(fs.readFileSync(file, "utf8"));
        } catch (err) {
          error(rel, "frontmatter", `解析失败：${err.message}`);
          return;
        }

        const data = parsed.data ?? {};
        const body = parsed.content.trim();

        if (Number(data.module) !== lesson.module || Number(data.lesson) !== lesson.lesson) {
          warn(
            rel,
            "module/lesson",
            `正文 frontmatter（${data.module}:${data.lesson}）与 manifest（${lesson.module}:${lesson.lesson}）不一致，重新生成 manifest`,
          );
        }
        if ((data.free === true) !== (lesson.trial === true)) {
          warn(rel, "free", "frontmatter 的 free 与 manifest 的 trial 不一致，重新生成 manifest");
        }
        if (isString(data.title) && normalizeTitle(data.title) !== normalizeTitle(lesson.title)) {
          warn(rel, "title", `正文标题「${data.title}」与 manifest「${lesson.title}」不一致`);
        }

        if (!Array.isArray(data.objectives) || data.objectives.length === 0) {
          error(rel, "objectives", "至少要有 1 条可检验的学习目标");
        } else if (data.objectives.length < 2) {
          warn(rel, "objectives", "建议 2–3 条");
        }

        if (body.length < 400) {
          error(rel, "body", `正文只有 ${body.length} 字符，太薄（目标 700–1100 汉字）`);
        } else if (body.length < 700) {
          warn(rel, "body", `正文 ${body.length} 字符，偏短（目标 700–1100 汉字）`);
        }

        const hasCode = body.includes("```");
        const hasTable = /^\|.*\|$/m.test(body);
        if (!hasCode && !hasTable) {
          warn(rel, "body", "既没有代码块也没有表格：读者拿不到可复制的产物");
        }

        const headings = (body.match(/^## /gm) ?? []).length;
        if (headings < 2) {
          warn(rel, "body", `只有 ${headings} 个二级标题，建议 3–5 个`);
        }
      });

      // 免费边界：按 manifest 顺序算，与课时页/sitemap/搜索索引用同一个「第几节」
      const freeCount = lessons.filter(
        (lesson, index) => lesson.trial === true || index < freeLessonLimit,
      ).length;
      lessonStats.free += freeCount;
      lessonStats.gated += lessons.length - freeCount;

      lessons.forEach((lesson, index) => {
        if (lesson.trial === true && index >= freeLessonLimit) {
          warn(
            `content/courses/${locale}/${course.slug}/${lesson.slug}.mdx`,
            "free",
            `标了免费试听，但它是课表第 ${index + 1} 节，超出免费额度 ${freeLessonLimit} 节：公开站仍按付费节锁定`,
          );
        }
      });
    }
  }

  // 有正文但不在 manifest：永远不会被渲染，属于必须修的问题
  for (const locale of ["zh", "en"]) {
    for (const root of roots) {
      const localeDir = path.join(root, locale);
      if (!fs.existsSync(localeDir)) continue;
      for (const courseEntry of fs.readdirSync(localeDir)) {
        const courseDir = path.join(localeDir, courseEntry);
        if (!fs.statSync(courseDir).isDirectory()) continue;
        for (const file of fs.readdirSync(courseDir)) {
          if (!file.endsWith(".mdx") || file.startsWith("_")) continue;
          const slug = file.replace(/\.mdx$/, "");
          if (!known.has(`${locale}:${courseEntry}:${slug}`)) {
            error(
              `content/courses/${locale}/${courseEntry}/${file}`,
              "-",
              "正文存在但不在 manifest 里，永远不会被渲染（重新跑 npm run courses:manifest）",
            );
          }
        }
      }
    }
  }
}

/** 兜底：manifest 缺失时按目录扫描（行为与拆分前一致） */
function validateLessonsFromFiles(coursesBySlug) {
  for (const locale of ["zh", "en"]) {
    const localeDir = path.join(COURSE_DIR, locale);
    if (!fs.existsSync(localeDir)) continue;

    for (const entry of fs.readdirSync(localeDir)) {
      const dir = path.join(localeDir, entry);
      if (!fs.statSync(dir).isDirectory()) continue;
      const rel = `content/courses/${locale}/${entry}`;
      const course = coursesBySlug.get(entry);
      if (!course) {
        error(rel, "-", `没有对应的课程 JSON（content/courses/${entry}.json），这些正文永远不会被渲染`);
        continue;
      }

      const outline = course.locales?.[locale]?.modules ?? [];
      const slots = new Map();
      outline.forEach((module, moduleIndex) => {
        module.lessons.forEach((title, lessonIndex) => {
          slots.set(`${moduleIndex + 1}:${lessonIndex + 1}`, title);
        });
      });

      const files = fs
        .readdirSync(dir)
        .filter((file) => file.endsWith(".mdx") && !file.startsWith("_"))
        .sort();

      const usedSlots = new Map();
      const fileData = new Map();

      for (const file of files) {
        const fileRel = `${rel}/${file}`;
        const slug = file.replace(/\.mdx$/, "");
        lessonStats.total += 1;

        let parsed;
        try {
          parsed = matter(fs.readFileSync(path.join(dir, file), "utf8"));
        } catch (err) {
          error(fileRel, "frontmatter", `解析失败：${err.message}`);
          continue;
        }

        const data = parsed.data ?? {};
        fileData.set(file, data);
        const body = parsed.content.trim();
        lessonStats.ready += 1;

        for (const field of ["title", "summary"]) {
          if (!isString(data[field])) error(fileRel, field, "缺少非空字符串");
        }
        if (isString(data.summary) && data.summary.length > 60) {
          warn(fileRel, "summary", `长度 ${data.summary.length}，建议 ≤60 字（课程卡片/搜索摘要会截断）`);
        }

        const module = Number(data.module);
        const lesson = Number(data.lesson);
        if (!Number.isInteger(module) || module < 1) error(fileRel, "module", "必须是 ≥1 的整数");
        if (!Number.isInteger(lesson) || lesson < 1) error(fileRel, "lesson", "必须是 ≥1 的整数");

        const slotKey = `${module}:${lesson}`;
        if (Number.isInteger(module) && Number.isInteger(lesson)) {
          if (!slots.has(slotKey)) {
            error(
              fileRel,
              "module/lesson",
              `大纲里没有 模块 ${module} 第 ${lesson} 节（该语言现有模块数 ${outline.length}），正文不会出现在课表里`,
            );
          } else {
            const outlineTitle = slots.get(slotKey);
            if (usedSlots.has(slotKey)) {
              error(fileRel, "module/lesson", `与 ${usedSlots.get(slotKey)} 指向同一节（${slotKey}）`);
            } else {
              usedSlots.set(slotKey, file);
              if (isString(data.title) && normalizeTitle(data.title) !== normalizeTitle(outlineTitle)) {
                warn(
                  fileRel,
                  "title",
                  `与大纲标题不一致：正文「${data.title}」/ 大纲「${outlineTitle}」（详情页和阅读页会显示不同标题）`,
                );
              }
            }
          }
        }

        const duration = Number(data.duration);
        if (!Number.isInteger(duration) || duration < 4 || duration > 25) {
          warn(fileRel, "duration", "建议 4–25 的整数（分钟），用于阅读时长展示");
        }
        if (typeof data.free !== "boolean") {
          warn(fileRel, "free", "建议显式写 true/false（决定是否显示「免费试听」）");
        }

        if (!Array.isArray(data.objectives) || data.objectives.length === 0) {
          error(fileRel, "objectives", "至少要有 1 条可检验的学习目标");
        } else if (data.objectives.length < 2) {
          warn(fileRel, "objectives", "建议 2–3 条");
        }

        if (body.length < 400) {
          error(fileRel, "body", `正文只有 ${body.length} 字符，太薄（目标 700–1100 汉字）`);
        } else if (body.length < 700) {
          warn(fileRel, "body", `正文 ${body.length} 字符，偏短（目标 700–1100 汉字）`);
        }

        // 技术课时要命令/配置，商业课时可以是表格或清单；两者都没有才算"没有可复制的产物"
        const hasCode = body.includes("```");
        const hasTable = /^\|.*\|$/m.test(body);
        if (!hasCode && !hasTable) {
          warn(fileRel, "body", "既没有代码块也没有表格：读者拿不到可复制的产物");
        }

        const headings = (body.match(/^## /gm) ?? []).length;
        if (headings < 2) {
          warn(fileRel, "body", `只有 ${headings} 个二级标题，建议 3–5 个`);
        }
      }

      // 免费边界（与 lib/course-lessons.ts 同口径）：按 模块 → 节 排序后前 N 节公开，
      // frontmatter 的 free: true 可额外开放一节。这里统计公开/锁定节数并提示越界。
      const orderedFiles = files
        .filter((file) => fileData.has(file))
        .sort((a, b) => {
          const aData = fileData.get(a);
          const bData = fileData.get(b);
          const aModule = Number(aData.module) || 0;
          const bModule = Number(bData.module) || 0;
          const aLesson = Number(aData.lesson) || 0;
          const bLesson = Number(bData.lesson) || 0;
          return aModule - bModule || aLesson - bLesson || a.localeCompare(b);
        });

      const { freeLessonLimit } = accessConfig;
      const courseFree = orderedFiles.filter((file, index) =>
        isFreeLesson({ index, frontmatterFree: fileData.get(file).free === true }),
      ).length;

      orderedFiles.forEach((file, index) => {
        if (fileData.get(file).free === true && index >= freeLessonLimit) {
          warn(
            `${rel}/${file}`,
            "free",
            `frontmatter 标了免费试听，但它是课表第 ${index + 1} 节，超出免费额度 ${freeLessonLimit} 节：公开站仍按付费节锁定`,
          );
        }
      });

      lessonStats.free += courseFree;
      lessonStats.gated += orderedFiles.length - courseFree;

      const missing = [...slots.keys()].filter((slot) => !usedSlots.has(slot));
      lessonStats.missing += missing.length;
      if (missing.length > 0) {
        warn(
          rel,
          "-",
          `还有 ${missing.length}/${slots.size} 节没有正文（课表里显示为「制作中」，无法点击）`,
        );
      }
    }
  }
}

/* ------------------------------------------------------------------ */
/* 主流程                                                               */
/* ------------------------------------------------------------------ */

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(COURSE_DIR)) {
    error("content/courses", "-", "目录不存在");
    return report(args, 0);
  }

  const visuals = readVisuals();
  const files = fs
    .readdirSync(COURSE_DIR)
    .filter(
      (file) =>
        file.endsWith(".json") &&
        !file.startsWith("stripe-") &&
        file !== path.basename(ACCESS_FILE) &&
        // manifest 是课表元数据，不是课程数据，别当课程 JSON 校验
        file !== "manifest.json",
    )
    .sort();

  if (files.length === 0) {
    error("content/courses", "-", "没有任何课程 JSON");
    return report(args, 0);
  }

  // 访问控制配置：免费节数直接决定公开站能看到多少正文，配错等于白送内容
  const rawLimit = accessConfig.raw?.freeLessonLimit;
  if (!accessConfig.exists) {
    warn(
      "content/courses/access.json",
      "-",
      `缺少访问控制配置，按默认 ${accessConfig.freeLessonLimit} 节免费处理`,
    );
  } else if (!Number.isInteger(rawLimit) || rawLimit < 0 || rawLimit > 5) {
    error("content/courses/access.json", "freeLessonLimit", "必须是 0–5 的整数（每门课免费开放的节数）");
  }

  const ctx = { slugs: new Set(), bundleLessonCount: null };
  const coursesBySlug = new Map();

  for (const name of files) {
    const file = `content/courses/${name}`;
    let course;
    try {
      course = readJson(path.join(COURSE_DIR, name));
    } catch (err) {
      error(file, "-", `JSON 解析失败：${err.message}`);
      continue;
    }
    validateCourse(file, course, visuals, ctx);
    if (isString(course?.slug)) coursesBySlug.set(course.slug, course);
  }

  const bundles = [...coursesBySlug.values()].filter((course) => course.kind === "bundle");
  if (bundles.length === 0) {
    warn("content/courses", "-", "没有 bundle（全站通）课程，目录页的「全站通」区块会缺失");
  } else if (bundles.length > 1) {
    error("content/courses", "-", `存在 ${bundles.length} 个 bundle，只能有一个全站通`);
  }

  const singlePrices = [...coursesBySlug.values()]
    .filter((course) => course.kind !== "bundle")
    .flatMap((course) => course.plans.filter((plan) => plan.id === "single"))
    .map((plan) => plan.priceUSD)
    .filter((price) => isPositiveInt(price));
  const bundle = bundles[0];
  if (bundle && singlePrices.length > 0) {
    const bundleSingle = bundle.plans?.find((plan) => plan.id === "all-access") ?? bundle.plans?.[0];
    const total = singlePrices.reduce((sum, price) => sum + price, 0);
    if (bundleSingle && isPositiveInt(bundleSingle.priceUSD) && bundleSingle.priceUSD >= total) {
      warn(
        "content/courses/all-access.json",
        "plans.all-access.priceUSD",
        `全站通 $${bundleSingle.priceUSD} 不低于单课合计 $${total}，打包没有折扣说服力`,
      );
    }
  }

  validateLinks(coursesBySlug, args);
  validateLessons(coursesBySlug);
  return report(args, files.length);
}

function report(args, fileCount) {
  let errors = diagnostics.filter((item) => item.level === "error");
  const warnings = diagnostics.filter((item) => item.level === "warn");
  if (args.strict) {
    errors = [...errors, ...warnings];
  }

  if (args.json) {
    console.log(
      JSON.stringify(
        {
          files: fileCount,
          errors: errors.length,
          warnings: warnings.length,
          diagnostics,
        },
        null,
        2,
      ),
    );
  } else {
    console.log(
      `课程数据校验 · ${fileCount} 个课程 · 课时正文 ${lessonStats.ready}/${
        lessonStats.ready + lessonStats.missing
      } 节 · 公开 ${lessonStats.free} 节 / 锁定 ${lessonStats.gated} 节（COURSE_ACCESS=${getAccessMode()}）` +
        (lessonStats.missing > 0 && getAccessMode() === "public"
          ? ` · 另有 ${lessonStats.missing} 节在私有仓（公开仓正常）`
          : ""),
    );
    const byFile = new Map();
    for (const item of diagnostics) {
      if (!byFile.has(item.file)) byFile.set(item.file, []);
      byFile.get(item.file).push(item);
    }
    for (const [file, items] of byFile) {
      console.log(`\n  ${file}`);
      for (const item of items) {
        const mark = item.level === "error" ? "✖" : "⚠";
        console.log(`    ${mark} [${item.field}] ${item.message}`);
      }
    }
    console.log(
      `\n${errors.length === 0 ? "✔" : "✖"} ${errors.length} 个错误 · ${warnings.length} 个警告${
        args.strict && warnings.length > 0 ? "（--strict 下警告视为失败）" : ""
      }`,
    );
  }

  if (errors.length > 0) {
    if (!args.json) {
      console.log(
        "\n修复后重试：node scripts/courses/validate-courses.mjs\n" +
          "说明见 docs/courses/02-feature-design.md 第 5 节（数据模型）。",
      );
    }
    process.exit(1);
  }
}

main();
