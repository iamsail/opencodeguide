import fs from "fs";
import path from "path";
import matter from "gray-matter";

import { getCourse, type Course, type Locale } from "./courses";
import { getAccessMode, getFreeLessonLimit, isPublicBuild } from "./course-access";
import { getManifestLessons, readLessonManifest } from "./course-manifest";
import { lessonRoots, resolveLessonFile } from "./course-paths";

/**
 * 课程正文（文章版）
 * ------------------------------------------------------------
 * 两个数据源，职责分开：
 *
 *   1. 课表（有哪 123 节、标题、摘要、模块序号、时长、试听）
 *      → content/courses/manifest.json（由私有仓的正文生成后提交到公开仓）
 *   2. 正文（这一节写了什么）
 *      → content/courses/<locale>/<course>/<lesson>.mdx
 *        公开仓只有 8 节免费正文；其余 115 节只在私有仓（members 构建时可见）
 *
 * 为什么这样拆：公开仓不能放付费正文，但课表必须完整——否则删掉正文就等于商品页自残。
 * 拆开之后，「课表 123 节」和「正文只有 8 节」可以同时成立。
 *
 * 正文是否存在只看磁盘（hasBody），manifest 里没有、也不该有这个概念。
 *
 * 注意：本模块用 fs，只能在 Server Component / generateStaticParams 中引用。
 */

export interface CourseLesson {
  slug: string;
  title: string;
  summary: string;
  /** 对应大纲的模块序号（1 起） */
  module: number;
  /** 模块内的节序号（1 起） */
  lesson: number;
  /** 预计阅读分钟数 */
  duration: number;
  /** 是否可公开阅读（每门前 N 节 + frontmatter 显式 free） */
  free: boolean;
  objectives: string[];
  content: string;
  /** 磁盘上是否存在正文；false 时 public 构建渲染锁定页，members 构建属于异常（CI 会拦） */
  hasBody: boolean;
}

/** 课表里的一节：有 slug 才能点进去 */
export interface CurriculumLesson {
  title: string;
  slug: string | null;
  duration: number | null;
  free: boolean;
  hasBody?: boolean;
}

export interface CurriculumModule {
  index: number;
  title: string;
  summary?: string;
  lessons: CurriculumLesson[];
  /** 已写好正文的节数 */
  ready: number;
  total: number;
}

const CONTENT_ROOT = path.join(process.cwd(), "content/courses");

const lessonCache = new Map<string, CourseLesson[]>();

function toPositiveInt(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

interface BodyPayload {
  content: string;
  objectives: string[];
  title: string;
  summary: string;
  duration: number | null;
}

const EMPTY_BODY: BodyPayload = {
  content: "",
  objectives: [],
  title: "",
  summary: "",
  duration: null,
};

/** 读一节正文；文件不存在或解析失败时返回空正文（hasBody=false），不抛错 */
function readBodyFile(file: string | null): BodyPayload {
  if (!file) return EMPTY_BODY;
  try {
    const parsed = matter(fs.readFileSync(file, "utf8"));
    const data = parsed.data ?? {};
    return {
      content: parsed.content.trim(),
      objectives: toStringArray(data.objectives),
      title: String(data.title ?? "").trim(),
      summary: String(data.summary ?? "").trim(),
      duration: Number.isFinite(Number(data.duration)) ? Number(data.duration) : null,
    };
  } catch {
    return EMPTY_BODY;
  }
}

/** 按 manifest 组装课表（推荐路径）；manifest 里没有这门课时返回 null，交给目录扫描兜底 */
function lessonsFromManifest(courseSlug: string, locale: Locale): CourseLesson[] | null {
  const manifest = readLessonManifest();
  if (!manifest) return null;

  const entries = getManifestLessons(courseSlug, locale, manifest);
  if (entries.length === 0) return null;

  const roots = lessonRoots();
  const freeLimit = getFreeLessonLimit();

  return entries.map((entry, index) => {
    const file = resolveLessonFile({ locale, course: courseSlug, slug: entry.slug }, roots);
    const body = readBodyFile(file);
    return {
      slug: entry.slug,
      // manifest 是元数据真相源，正文 frontmatter 只在 manifest 缺字段时兜底
      title: entry.title || body.title || entry.slug,
      summary: entry.summary || body.summary,
      module: toPositiveInt(entry.module, 1),
      lesson: toPositiveInt(entry.lesson, 1),
      duration: toPositiveInt(entry.duration ?? body.duration, 8),
      free: entry.trial === true || index < freeLimit,
      objectives: body.objectives,
      content: body.content,
      hasBody: body.content.length > 0,
    };
  });
}

function parseLessonFile(file: string, courseSlug: string, locale: Locale): CourseLesson | null {
  const filePath = path.join(CONTENT_ROOT, locale, courseSlug, file);
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
    hasBody: true,
  };
}

/** 兜底路径：manifest 缺失时按目录扫描（行为与拆分前一致） */
function lessonsFromFiles(courseSlug: string, locale: Locale): CourseLesson[] {
  const dir = path.join(CONTENT_ROOT, locale, courseSlug);
  if (!fs.existsSync(dir)) return [];

  const sorted = fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".mdx") && !file.startsWith("_"))
    .map((file) => parseLessonFile(file, courseSlug, locale))
    .filter((lesson): lesson is CourseLesson => Boolean(lesson))
    .sort((a, b) => a.module - b.module || a.lesson - b.lesson || a.slug.localeCompare(b.slug));

  const freeLimit = getFreeLessonLimit();
  return sorted.map((lesson, index) => ({
    ...lesson,
    free: lesson.free || index < freeLimit,
  }));
}

/** 某门课某语言的全部课时（含没有正文的付费节），按 模块 → 节 排序 */
export function getCourseLessons(courseSlug: string, locale: Locale): CourseLesson[] {
  const cacheKey = `${locale}:${courseSlug}`;
  const cached = lessonCache.get(cacheKey);
  if (cached) return cached;

  const lessons = lessonsFromManifest(courseSlug, locale) ?? lessonsFromFiles(courseSlug, locale);
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
 * 真正的渲染判断还要叠加 hasBody：没有正文就只能是锁定页（见课时页）。
 */
export function isLessonLocked(lesson: CourseLesson): boolean {
  return isPublicBuild() && !lesson.free;
}

/** 当前构建模式下真正带正文的课时（public：免费且有正文；members：有正文的全部） */
export function getReadableLessons(courseSlug: string, locale: Locale): CourseLesson[] {
  const lessons = getCourseLessons(courseSlug, locale).filter((lesson) => lesson.hasBody);
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
 * 详情页课表：以课程大纲为准排模块，把课时挂上去。
 *
 * manifest 让「没写正文的节」也有 slug，所以付费节现在会渲染成锁定页而不是「制作中」；
 * 大纲里还没排进 manifest 的节仍然显示为不可点击（保留原行为）。
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
      const key = `${moduleNumber}:${lessonIndex + 1}`;
      const written = bySlot.get(key);
      bySlot.delete(key);
      return {
        title: written?.title ?? title,
        slug: written?.slug ?? null,
        duration: written?.duration ?? null,
        free: written?.free ?? false,
        hasBody: written?.hasBody ?? false,
      };
    });

    return {
      index: moduleNumber,
      title: module.title,
      summary: module.summary,
      lessons: moduleLessons,
      ready: moduleLessons.filter((lesson) => lesson.hasBody).length,
      total: moduleLessons.length,
    };
  });

  // 大纲之外的正文（例如大纲改了但 JSON 没同步）挂到最后一节之后，避免内容「消失」
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
        hasBody: lesson.hasBody,
      })),
      ready: orphans.filter((lesson) => lesson.hasBody).length,
      total: orphans.length,
    });
  }

  return modules;
}

/** 有正文的节数（不含只存在于 manifest/大纲里的节） */
export function countReadyLessons(courseSlug: string, locale: Locale): number {
  return getCourseLessons(courseSlug, locale).filter((lesson) => lesson.hasBody).length;
}

/** 课表总节数（manifest 驱动时是完整节数，不是有正文的节数） */
export function countCurriculumLessons(courseSlug: string, locale: Locale): number {
  return getCourseLessons(courseSlug, locale).length;
}
