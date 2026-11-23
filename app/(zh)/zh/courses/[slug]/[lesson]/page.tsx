import { type Metadata } from "next";
import { notFound } from "next/navigation";

import { getCourse, getCourseContent, getCourseSlugs } from "@/lib/courses";
import { shouldIndexLockedPages } from "@/lib/course-access";
import {
  getCourseCurriculum,
  getCourseLesson,
  getCourseLessons,
  getLessonNeighbours,
  isLessonLocked,
} from "@/lib/course-lessons";
import { LessonView } from "@/components/courses/lesson-view";

interface PageProps {
  params: Promise<{ slug: string; lesson: string }>;
}

export const dynamicParams = false;

/**
 * 课时 URL 全量生成（含锁定页）。
 * 不按免费节过滤：外链、搜索结果、旧邮件里的链接都要能落地，
 * 落地后是锁定页而不是 404；正文是否输出由 isLessonLocked 决定。
 */
export function generateStaticParams() {
  return getCourseSlugs().flatMap((slug) =>
    getCourseLessons(slug, "zh").map((lesson) => ({ slug, lesson: lesson.slug })),
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, lesson: lessonSlug } = await params;
  const course = getCourse(slug);
  const lesson = getCourseLesson(slug, lessonSlug, "zh");
  if (!course || !lesson) return { title: "课时未找到" };

  // 与页面渲染用同一个判定：没有正文的节一律按锁定页处理
  const locked = isLessonLocked(lesson) || !lesson.hasBody;

  const content = getCourseContent(course, "zh");
  const path = `/zh/courses/${slug}/${lessonSlug}`;

  return {
    title: `${lesson.title} · ${content.title}`,
    // 锁定页只留一句摘要（frontmatter 的 summary），不把付费正文写进 meta
    description: lesson.summary || content.seo.description,
    // 锁定页默认 noindex/follow：薄页面不参与索引，但链接权重照常传递。
    // 想改回可索引（长尾词入口策略）：LOCKED_PAGE_INDEX=true。
    robots:
      locked && !shouldIndexLockedPages()
        ? { index: false, follow: true }
        : { index: true, follow: true },
    alternates: {
      canonical: path,
      languages: {
        "zh-CN": path,
        en: `/en/courses/${slug}/${lessonSlug}`,
      },
    },
    openGraph: {
      title: lesson.title,
      description: lesson.summary || content.seo.description,
      url: path,
      type: "article",
      locale: "zh_CN",
    },
  };
}

export default async function CourseLessonPage({ params }: PageProps) {
  const { slug, lesson: lessonSlug } = await params;
  const course = getCourse(slug);
  const lesson = getCourseLesson(slug, lessonSlug, "zh");
  if (!course || !lesson) notFound();

  const curriculum = getCourseCurriculum(slug, "zh");
  const { previous, next } = getLessonNeighbours(slug, lessonSlug, "zh");
  // 没有正文时一律渲染锁定页：members 构建缺正文属于异常（assert-members-complete 会拦），
  // 但这里也不能渲染一篇空文章。
  const locked = isLessonLocked(lesson) || !lesson.hasBody;

  return (
    <LessonView
      course={course}
      locale="zh"
      // 锁定页不把正文传给视图：即便将来视图改成客户端组件，props 也不会把付费内容序列化进产物
      lesson={locked ? { ...lesson, content: "" } : lesson}
      locked={locked}
      curriculum={curriculum}
      previous={previous}
      next={next}
    />
  );
}
