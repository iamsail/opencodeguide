import { type Metadata } from "next";
import { notFound } from "next/navigation";

import { getCourse, getCourseContent, getCourseSlugs } from "@/lib/courses";
import {
  getCourseCurriculum,
  getCourseLesson,
  getCourseLessons,
  getLessonNeighbours,
} from "@/lib/course-lessons";
import { LessonView } from "@/components/courses/lesson-view";

interface PageProps {
  params: Promise<{ slug: string; lesson: string }>;
}

export const dynamicParams = false;

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
    description: lesson.summary || content.seo.description,
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

  return (
    <LessonView
      course={course}
      locale="zh"
      lesson={lesson}
      curriculum={curriculum}
      previous={previous}
      next={next}
    />
  );
}
