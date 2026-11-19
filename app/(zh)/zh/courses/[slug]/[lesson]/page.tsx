import { type Metadata } from "next";
import { notFound } from "next/navigation";

import { getCourse, getCourseContent, getCourseSlugs } from "@/lib/courses";
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

  const content = getCourseContent(course, "zh");
  const path = `/zh/courses/${slug}/${lessonSlug}`;

  return {
    title: `${lesson.title} · ${content.title}`,
    // 锁定页只留一句摘要（frontmatter 的 summary），不把付费正文写进 meta
    description: lesson.summary || content.seo.description,
    // 锁定页保持可索引（它是转化入口，正文不含付费内容）；成员站另行 noindex
    robots: { index: true, follow: true },
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
  const locked = isLessonLocked(lesson);

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
