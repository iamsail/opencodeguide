import fs from "node:fs";
import path from "node:path";

/**
 * 课程访问控制的共享规则（构建期脚本用）
 * ------------------------------------------------------------
 * 与 lib/course-access.ts 保持一致：课时页、sitemap、搜索索引、校验脚本
 * 与 CI 断言必须对「哪一节是免费的」给出同一个答案，否则会出现
 * 「页面锁了但搜索索引里还有正文」这类漏洞。
 *
 * 单一事实来源：content/courses/access.json 的 freeLessonLimit。
 * 访问模式由环境变量 COURSE_ACCESS 决定（public | members）。
 */

export const DEFAULT_FREE_LESSON_LIMIT = 2;

const CONFIG_FILE = path.join(process.cwd(), "content/courses/access.json");

let cachedConfig = null;

/** 读取访问控制配置；文件缺失或损坏时回退到默认值（不抛错，避免构建中断） */
export function readAccessConfig() {
  if (cachedConfig) return cachedConfig;

  let raw = null;
  try {
    raw = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
  } catch {
    raw = null;
  }

  const limit = raw?.freeLessonLimit;
  cachedConfig = {
    exists: Boolean(raw),
    freeLessonLimit:
      Number.isInteger(limit) && limit >= 0 ? limit : DEFAULT_FREE_LESSON_LIMIT,
    raw: raw ?? {},
  };
  return cachedConfig;
}

/** 访问模式：members 生成全部正文（成员站），public 只公开免费节 */
export function getAccessMode() {
  return process.env.COURSE_ACCESS === "members" ? "members" : "public";
}

export function isMembersBuild() {
  return getAccessMode() === "members";
}

export function isPublicBuild() {
  return getAccessMode() === "public";
}

/**
 * 免费节判定。
 * @param {{ index?: number, frontmatterFree?: boolean }} lesson
 *   index: 该节在课程内按 模块 → 节 排序后的位置（0 起）
 *   frontmatterFree: MDX frontmatter 的 free: true（可用于额外开放某节试听）
 */
export function isFreeLesson({ index, frontmatterFree } = {}) {
  if (frontmatterFree === true) return true;
  const { freeLessonLimit } = readAccessConfig();
  return Number.isInteger(index) && index >= 0 && index < freeLessonLimit;
}

/**
 * 课表排序：与 lib/course-lessons.ts 的 sort 保持一致。
 * 入参形如 { slug, data: frontmatter }，data 直接读 frontmatter 的 module / lesson。
 */
export function compareLessons(a, b) {
  const aData = a?.data ?? {};
  const bData = b?.data ?? {};
  const aModule = Number(aData.module ?? 0) || 0;
  const bModule = Number(bData.module ?? 0) || 0;
  const aLesson = Number(aData.lesson ?? 0) || 0;
  const bLesson = Number(bData.lesson ?? 0) || 0;
  return aModule - bModule || aLesson - bLesson || String(a?.slug ?? "").localeCompare(String(b?.slug ?? ""));
}
