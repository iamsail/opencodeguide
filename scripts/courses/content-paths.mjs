import fs from "node:fs";
import path from "node:path";

/**
 * 课时正文的根目录解析（构建期脚本侧）
 * ------------------------------------------------------------
 * 与 lib/course-paths.ts 等价；脚本是 .mjs，无法直接复用 TS 模块，所以两份实现要同步。
 * 规则见 lib/course-paths.ts：
 *   public  → 只读公开根
 *   members → [公开根, 私有根]，私有优先，缺私有根直接报错
 */

export const PUBLIC_ROOT = path.join(process.cwd(), "content/courses");
export const DEFAULT_PRIVATE_RELATIVE = path.join("..", "opencodeCourse", "content", "courses");

function resolveFromCwd(value) {
  return path.isAbsolute(value) ? value : path.resolve(process.cwd(), value);
}

export function publicRoot() {
  return PUBLIC_ROOT;
}

export function privateRoot() {
  const configured = process.env.COURSE_PRIVATE_DIR?.trim();
  if (configured) return resolveFromCwd(configured);
  return resolveFromCwd(DEFAULT_PRIVATE_RELATIVE);
}

export function lessonRoots(mode = process.env.COURSE_ACCESS === "members" ? "members" : "public") {
  // 私有根优先（与 lib/course-paths.ts 一致）：members 构建以私有仓为准
  return mode === "members" ? [privateRoot(), PUBLIC_ROOT] : [PUBLIC_ROOT];
}

export function lessonFileIn(root, { locale, course, slug }) {
  return path.join(root, locale, course, `${slug}.mdx`);
}

export function resolveLessonFile(locator, roots = lessonRoots()) {
  for (const root of roots) {
    const file = lessonFileIn(root, locator);
    if (fs.existsSync(file)) return file;
  }
  return null;
}

/** members 构建必须有私有根 */
export function requirePrivateRootForMembers(mode = process.env.COURSE_ACCESS === "members" ? "members" : "public") {
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
