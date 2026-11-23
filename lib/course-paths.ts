import fs from "fs";
import path from "path";

import { getAccessMode, type CourseAccessMode } from "./course-access";

/**
 * 课时正文的根目录解析
 * ------------------------------------------------------------
 * 公开仓只带 8 节免费正文，其余 115 节在私有仓。构建期把「正文从哪来」收敛到这里，
 * 让课表、课时页、sitemap、搜索索引、校验脚本与断言用同一套规则。
 *
 * 两条硬规则：
 *
 *   1. COURSE_ACCESS=public（默认）→ **只读公开根**。
 *      公开构建永远看不到付费正文，这条不变量必须能在没有私有仓的机器上成立，
 *      所以不能因为本机恰好有私有仓就让公开构建读到它。
 *
 *   2. COURSE_ACCESS=members → [公开根, 私有根]，私有优先。
 *      members 构建缺私有根直接报错，绝不静默降级成「只有 8 节的成员站」。
 *
 * 注意：本模块读 fs，只能在 Server Component / generateStaticParams / 构建期脚本中引用。
 * 脚本侧有一份等价实现 scripts/courses/content-paths.mjs，改动请同步。
 */

export type LessonLocale = "zh" | "en";

export interface LessonLocator {
  locale: string;
  course: string;
  slug: string;
}

const PUBLIC_ROOT = path.join(process.cwd(), "content/courses");

/** 默认私有根：两个仓库同级 checkout 时的约定位置 */
export const DEFAULT_PRIVATE_RELATIVE = path.join("..", "opencodeCourse", "content", "courses");

function resolveFromCwd(value: string): string {
  return path.isAbsolute(value) ? value : path.resolve(process.cwd(), value);
}

export function publicRoot(): string {
  return PUBLIC_ROOT;
}

/** 私有正文根（只做解析，不检查存在性） */
export function privateRoot(): string {
  const configured = process.env.COURSE_PRIVATE_DIR?.trim();
  if (configured) return resolveFromCwd(configured);
  return resolveFromCwd(DEFAULT_PRIVATE_RELATIVE);
}

/** 按构建模式给出正文查找顺序 */
export function lessonRoots(mode: CourseAccessMode = getAccessMode()): string[] {
  // 私有根优先：members 构建以私有仓为准，公开根只兜底（例如免费节还没导出到私有仓）
  return mode === "members" ? [privateRoot(), PUBLIC_ROOT] : [PUBLIC_ROOT];
}

export function lessonFileIn(root: string, locator: LessonLocator): string {
  return path.join(root, locator.locale, locator.course, `${locator.slug}.mdx`);
}

/** 在给定根里找到第一个存在的正文文件 */
export function resolveLessonFile(
  locator: LessonLocator,
  roots: string[] = lessonRoots(),
): string | null {
  for (const root of roots) {
    const file = lessonFileIn(root, locator);
    if (fs.existsSync(file)) return file;
  }
  return null;
}

/**
 * members 构建必须有私有根；缺失时抛出可操作的错误。
 * 返回私有根路径（public 模式下返回 null）。
 */
export function requirePrivateRootForMembers(
  mode: CourseAccessMode = getAccessMode(),
): string | null {
  if (mode !== "members") return null;

  const root = privateRoot();
  if (!fs.existsSync(root)) {
    throw new Error(
      [
        "COURSE_ACCESS=members 需要私有正文，但找不到私有根：",
        `  ${root}`,
        "",
        "把它指向私有仓的 content/courses 目录即可：",
        "  COURSE_PRIVATE_DIR=/path/to/opencodeCourse/content/courses npm run build:members",
      ].join("\n"),
    );
  }
  return root;
}
