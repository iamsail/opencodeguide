import fs from "node:fs";
import path from "node:path";

/**
 * 课时清单（manifest）读取 —— 构建期脚本侧
 * ------------------------------------------------------------
 * 与 lib/course-manifest.ts 等价；脚本是 .mjs，无法直接复用 TS 模块，所以两份实现要同步。
 *
 * manifest 只有元数据（slug/title/summary/module/lesson/duration/trial），
 * 没有正文、也没有 hasBody —— 正文是否存在一律看磁盘。
 */

export const MANIFEST_FILE = path.join(process.cwd(), "content/courses/manifest.json");

export function readLessonManifest() {
  try {
    const parsed = JSON.parse(fs.readFileSync(MANIFEST_FILE, "utf8"));
    return Array.isArray(parsed?.courses) ? parsed : null;
  } catch {
    return null;
  }
}

export function getManifestLessons(manifest, courseSlug, locale) {
  if (!manifest) return [];
  const course = manifest.courses.find((entry) => entry.slug === courseSlug);
  const lessons = course?.locales?.[locale];
  return Array.isArray(lessons) ? lessons : [];
}

/** manifest 里的全部课时，展开成 [{ locale, course, ...lesson }]，顺序即课表顺序 */
export function flattenManifest(manifest) {
  if (!manifest) return [];
  const rows = [];
  for (const course of manifest.courses) {
    for (const [locale, lessons] of Object.entries(course.locales ?? {})) {
      for (const lesson of lessons) {
        rows.push({ locale, course: course.slug, ...lesson });
      }
    }
  }
  return rows;
}

export function countManifestLessons(manifest) {
  return flattenManifest(manifest).length;
}
