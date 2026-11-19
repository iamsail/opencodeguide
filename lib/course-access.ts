import fs from "fs";
import path from "path";

/**
 * 课程访问控制（构建期）
 * ------------------------------------------------------------
 * 站点是 `output: 'export'`，HTML 一旦产出就是公开文件，前端隐藏/加密都不算数。
 * 所以安全边界放在这里：**付费正文在公开构建里根本不渲染**，页面只输出锁定页。
 *
 * 模式：
 *   COURSE_ACCESS=public （默认）→ 每门课只渲染前 N 节正文，其余为锁定页
 *   COURSE_ACCESS=members        → 渲染全部正文（仅部署到成员站，noindex）
 *
 * 免费额度由 content/courses/access.json 的 freeLessonLimit 决定，
 * 与 scripts/courses/access.mjs 共享同一份配置。
 *
 * 注意：本模块读 fs，只能在 Server Component / generateStaticParams / 构建期脚本中引用。
 */

export type CourseAccessMode = "public" | "members";

export const DEFAULT_FREE_LESSON_LIMIT = 2;

const CONFIG_FILE = path.join(process.cwd(), "content/courses/access.json");

let cachedLimit: number | null = null;

/** 每门课免费开放的节数 */
export function getFreeLessonLimit(): number {
  if (cachedLimit !== null) return cachedLimit;

  let limit = DEFAULT_FREE_LESSON_LIMIT;
  try {
    const raw = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8")) as {
      freeLessonLimit?: unknown;
    };
    const value = raw?.freeLessonLimit;
    if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
      limit = value;
    }
  } catch {
    // 配置缺失时按默认值走，不阻断构建
  }

  cachedLimit = limit;
  return limit;
}

export function getAccessMode(): CourseAccessMode {
  return process.env.COURSE_ACCESS === "members" ? "members" : "public";
}

export function isMembersBuild(): boolean {
  return getAccessMode() === "members";
}

export function isPublicBuild(): boolean {
  return getAccessMode() === "public";
}
