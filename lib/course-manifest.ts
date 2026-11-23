import fs from "fs";
import path from "path";

import type { Locale } from "./courses";

/**
 * 课时清单（manifest）读取
 * ------------------------------------------------------------
 * manifest 是「课表」的真相源：slug / 标题 / 摘要 / 模块序号 / 时长 / 是否显式试听。
 * 它由 scripts/courses/build-manifest.mjs 在**有正文的环境**里生成，然后提交到公开仓。
 *
 * 刻意不含两样东西：
 *   - 正文（公开仓里不能出现付费正文）
 *   - hasBody（正文是否存在只能看磁盘，否则公开仓会谎报「123 节都有正文」）
 *
 * 脚本侧有一份等价实现 scripts/courses/manifest.mjs（.mjs 无法直接复用 TS），改动请同步。
 */

export interface ManifestLesson {
  slug: string;
  title: string;
  summary: string;
  module: number;
  lesson: number;
  duration: number;
  /** frontmatter 里显式写了 free: true 的节（额外试听），与「每门前 N 节免费」是两件事 */
  trial: boolean;
}

export interface ManifestCourse {
  slug: string;
  locales: Record<string, ManifestLesson[]>;
}

export interface LessonManifest {
  version: number;
  courses: ManifestCourse[];
}

const MANIFEST_FILE = path.join(process.cwd(), "content/courses/manifest.json");

let cached: LessonManifest | null | undefined;

/** 读 manifest；文件缺失或损坏时返回 null（调用方回退到按目录扫描） */
export function readLessonManifest(): LessonManifest | null {
  if (cached !== undefined) return cached;
  try {
    const parsed = JSON.parse(fs.readFileSync(MANIFEST_FILE, "utf8")) as LessonManifest;
    cached = Array.isArray(parsed?.courses) ? parsed : null;
  } catch {
    cached = null;
  }
  return cached;
}

/** 某门课某语言的课时清单（已按 manifest 里的顺序排好） */
export function getManifestLessons(
  courseSlug: string,
  locale: Locale,
  manifest: LessonManifest | null = readLessonManifest(),
): ManifestLesson[] {
  if (!manifest) return [];
  const course = manifest.courses.find((entry) => entry.slug === courseSlug);
  const lessons = course?.locales?.[locale];
  return Array.isArray(lessons) ? lessons : [];
}

/** manifest 里所有课时数（用于构建期核对「课表 123 节」这类数字） */
export function countManifestLessons(manifest: LessonManifest | null = readLessonManifest()): number {
  if (!manifest) return 0;
  return manifest.courses.reduce(
    (total, course) =>
      total + Object.values(course.locales).reduce((sum, lessons) => sum + lessons.length, 0),
    0,
  );
}
