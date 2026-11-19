import fs from "fs";
import path from "path";
import matter from "gray-matter";

import { getCourse, type Course, type Locale } from "./courses";
import { getFreeLessonLimit, isPublicBuild } from "./course-access";

/**
 * 课程正文（文章版）
 * ------------------------------------------------------------
 * 数据源：content/courses/<locale>/<courseSlug>/<lesson-slug>.mdx
 * 一门课一个目录，一节正文一个文件；frontmatter 里用 module / lesson
 * 指回 content/courses/<courseSlug>.json 里的大纲位置。
 *
 * 为什么这样拆：课程大纲（模块标题、卖点、价格）属于商品信息，归 JSON；
 * 正文属于内容，归 MDX。运营改价格不用碰 110 个文件，写课也不用动 JSON。
 *
 * 注意：本模块用 fs，只能在 Server Component / generateStaticParams 中引用。
 */

export interface CourseLesson {
  slug: string;
  title: string;
  summary: string;
  /** 对应 JSON 大纲的模块序号（1 起） */
  module: number;
  /** 模块内的节序号（1 起） */
  lesson: number;
  /** 预计阅读分钟数 */
  duration: number;
  free: boolean;
  objectives: string[];
  content: string;
}

/** 课表里的一节：有 slug 才能点进去，没有说明正文还没写 */
export interface CurriculumLesson {
  title: string;
  slug: string | null;
  duration: number | null;
  free: boolean;
}

export interface CurriculumModule {
  index: number;
  title: string;
  summary?: string;
  lessons: CurriculumLesson[];
  /** 已写完正文的节数 / 总节数，用于展示"内容制作中"的进度 */
  ready: number;
  total: number;
}

const CONTENT_ROOT = path.join(process.cwd(), "content/courses");

const lessonCache = new Map<string, CourseLesson[]>();

function lessonDir(locale: Locale, courseSlug: string): string {
  return path.join(CONTENT_ROOT, locale, courseSlug);
}

function toPositiveInt(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

function parseLesson(file: string, courseSlug: string, locale: Locale): CourseLesson | null {
  const filePath = path.join(lessonDir(locale, courseSlug), file);
  let parsed: matter.GrayMatterFile<string>;
  try {
    parsed = matter(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }

  const data = parsed.data ?? {};
  const slug = path.basename(file, ".mdx");
  const content = parsed.content.trim();
  if (!content) return null;

  return {
    slug,
    title: String(data.title ?? slug),
    summary: String(data.summary ?? ""),
    module: toPositiveInt(data.module, 1),
    lesson: toPositiveInt(data.lesson, 1),
    duration: toPositiveInt(data.duration, 8),
    free: data.free === true,
    objectives: toStringArray(data.objectives),
    content,
  };
}

/** 某门课某语言的全部正文，按 模块 → 节 排序 */
export function getCourseLessons(courseSlug: string, locale: Locale): CourseLesson[] {
  const cacheKey = `${locale}:${courseSlug}`;
  const cached = lessonCache.get(cacheKey);
  if (cached) return cached;

  const dir = lessonDir(locale, courseSlug);
  if (!fs.existsSync(dir)) {
    lessonCache.set(cacheKey, []);
    return [];
  }

  const sorted = fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".mdx") && !file.startsWith("_"))
    .map((file) => parseLesson(file, courseSlug, locale))
    .filter((lesson): lesson is CourseLesson => Boolean(lesson))
    .sort((a, b) => a.module - b.module || a.lesson - b.lesson || a.slug.localeCompare(b.slug));

  // 免费额度按课表顺序判定：每门前 N 节免费；frontmatter 的 free: true 可额外开放某一节。
  // 这是「哪个页面能看全文」的唯一口径，与 scripts/courses/access.mjs 保持一致。
  const freeLimit = getFreeLessonLimit();
  const lessons = sorted.map((lesson, index) => ({
    ...lesson,
    free: lesson.free || index < freeLimit,
  }));

  lessonCache.set(cacheKey, lessons);
  return lessons;
}

export function getCourseLesson(
  courseSlug: string,
  lessonSlug: string,
  locale: Locale,
): CourseLesson | null {
  return getCourseLessons(courseSlug, locale).find((lesson) => lesson.slug === lessonSlug) ?? null;
}

/**
 * 该节在当前构建模式下是否需要付费才能读。
 * public 构建里非免费节只输出锁定页；members 构建里全部可读。
 */
export function isLessonLocked(lesson: CourseLesson): boolean {
  return isPublicBuild() && !lesson.free;
}

/** 当前构建模式下真正带正文的课时（public 构建只有免费的这几节） */
export function getReadableLessons(courseSlug: string, locale: Locale): CourseLesson[] {
  const lessons = getCourseLessons(courseSlug, locale);
  return isPublicBuild() ? lessons.filter((lesson) => lesson.free) : lessons;
}

/** 相邻节，用于「上一篇 / 下一篇」 */
export function getLessonNeighbours(
  courseSlug: string,
  lessonSlug: string,
  locale: Locale,
): { previous: CourseLesson | null; next: CourseLesson | null } {
  const lessons = getCourseLessons(courseSlug, locale);
  const index = lessons.findIndex((lesson) => lesson.slug === lessonSlug);
  if (index === -1) return { previous: null, next: null };
  return {
    previous: index > 0 ? lessons[index - 1] : null,
    next: index < lessons.length - 1 ? lessons[index + 1] : null,
  };
}

/**
 * 详情页课表：以 JSON 大纲为准，把已写好的正文挂上去。
 * 这样即使部分课程还没写正文，详情页依旧能展示完整大纲（不带链接）。
 */
export function getCourseCurriculum(courseSlug: string, locale: Locale): CurriculumModule[] {
  const course = getCourse(courseSlug);
  if (!course) return [];

  const outline = course.locales[locale]?.modules ?? course.locales.zh.modules ?? [];
  const lessons = getCourseLessons(courseSlug, locale);
  const bySlot = new Map<string, CourseLesson>();
  for (const lesson of lessons) {
    bySlot.set(`${lesson.module}:${lesson.lesson}`, lesson);
  }

  const modules: CurriculumModule[] = outline.map((module, moduleIndex) => {
    const moduleNumber = moduleIndex + 1;
    const moduleLessons = module.lessons.map((title, lessonIndex) => {
      const written = bySlot.get(`${moduleNumber}:${lessonIndex + 1}`);
      bySlot.delete(`${moduleNumber}:${lessonIndex + 1}`);
      return {
        title,
        slug: written?.slug ?? null,
        duration: written?.duration ?? null,
        free: written?.free ?? false,
      };
    });

    return {
      index: moduleNumber,
      title: module.title,
      summary: module.summary,
      lessons: moduleLessons,
      ready: moduleLessons.filter((lesson) => lesson.slug).length,
      total: moduleLessons.length,
    };
  });

  // 大纲之外的正文（例如大纲改了但 JSON 没同步）挂到最后一节之后，避免内容"消失"
  const orphans = [...bySlot.values()];
  if (orphans.length > 0) {
    modules.push({
      index: modules.length + 1,
      title: "补充内容",
      lessons: orphans.map((lesson) => ({
        title: lesson.title,
        slug: lesson.slug,
        duration: lesson.duration,
        free: lesson.free,
      })),
      ready: orphans.length,
      total: orphans.length,
    });
  }

  return modules;
}

export function countReadyLessons(courseSlug: string, locale: Locale): number {
  return getCourseLessons(courseSlug, locale).length;
}
