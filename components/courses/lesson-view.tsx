import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode from "rehype-pretty-code";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock, Lock, PlayCircle } from "lucide-react";

import { useMDXComponents } from "@/mdx-components";
import {
  coursePath,
  getCourseContent,
  type Course,
  type Locale,
} from "@/lib/courses";
import type { CourseLesson, CurriculumModule } from "@/lib/course-lessons";
import { LessonJsonLd } from "@/components/courses/lesson-jsonld";
import { LockedLesson } from "@/components/courses/locked-lesson";

function lessonHref(locale: Locale, courseSlug: string, lessonSlug: string) {
  return `${coursePath(locale, courseSlug)}/${lessonSlug}`;
}

export function LessonView({
  course,
  locale,
  lesson,
  curriculum,
  previous,
  next,
  locked = false,
}: {
  course: Course;
  locale: Locale;
  lesson: CourseLesson;
  curriculum: CurriculumModule[];
  previous: CourseLesson | null;
  next: CourseLesson | null;
  /** true = 公开构建里的付费节：正文不渲染，改为锁定页 */
  locked?: boolean;
}) {
  const content = getCourseContent(course, locale);
  const components = useMDXComponents({});
  const moduleTitle =
    curriculum.find((module) => module.index === lesson.module)?.title ?? `模块 ${lesson.module}`;
  const totalReady = curriculum.reduce((sum, module) => sum + module.ready, 0);
  const totalLessons = curriculum.reduce((sum, module) => sum + module.total, 0);
  const position =
    curriculum
      .flatMap((module) => module.lessons)
      .filter((item) => item.slug)
      .findIndex((item) => item.slug === lesson.slug) + 1;

  const copy =
    locale === "zh"
      ? {
          back: "返回课程",
          curriculum: "课程目录",
          objectives: "本节目标",
          minutes: "分钟阅读",
          free: "免费试听",
          paid: "付费内容",
          previous: "上一节",
          next: "下一节",
          progress: "已完成正文",
          buying: "查看购买方式",
          notReady: "正文制作中",
        }
      : {
          back: "Back to course",
          curriculum: "Curriculum",
          objectives: "What you'll be able to do",
          minutes: "min read",
          free: "Free preview",
          paid: "Paid lesson",
          previous: "Previous",
          next: "Next",
          progress: "lessons written",
          buying: "See purchase options",
          notReady: "In production",
        };

  const siteUrl = "https://opencodeguide.com";
  const lessonPath = lessonHref(locale, course.slug, lesson.slug);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-8">
      <LessonJsonLd
        title={lesson.title}
        description={lesson.summary || content.seo.description}
        url={`${siteUrl}${lessonPath}`}
        locale={locale}
        courseTitle={content.title}
        courseUrl={`${siteUrl}${coursePath(locale, course.slug)}`}
        durationMinutes={lesson.duration}
      />
      {/* 面包屑 */}
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link
          href={coursePath(locale, course.slug)}
          className="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
          {copy.back}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="truncate">{content.title}</span>
        <span aria-hidden="true">/</span>
        <span className="truncate text-gray-900 dark:text-gray-100">{moduleTitle}</span>
      </div>

      <div className="grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* 侧边课表 */}
        <aside className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
              <BookOpen className="h-4 w-4" />
              {copy.curriculum}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {copy.progress} {totalReady}/{totalLessons}
            </p>
            <nav className="mt-4 space-y-4">
              {curriculum.map((module) => (
                <div key={module.index}>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    {module.title}
                  </p>
                  <ul className="mt-2 space-y-0.5">
                    {module.lessons.map((item, index) => {
                      const active = item.slug === lesson.slug;
                      return (
                        <li key={`${module.index}-${index}`}>
                          {item.slug ? (
                            <Link
                              href={lessonHref(locale, course.slug, item.slug)}
                              className={`flex items-start gap-1.5 rounded-md px-2 py-1.5 text-[13px] leading-snug transition-colors ${
                                active
                                  ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-900"
                              }`}
                            >
                              {item.free ? (
                                <PlayCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                              ) : (
                                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" />
                              )}
                              <span className="line-clamp-2">{item.title}</span>
                            </Link>
                          ) : (
                            <span className="flex items-start gap-1.5 px-2 py-1.5 text-[13px] leading-snug text-gray-400 dark:text-gray-600">
                              <span
                                aria-hidden="true"
                                className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full border border-gray-300 dark:border-gray-700"
                              />
                              <span className="line-clamp-2">
                                {item.title}
                                <span className="ml-1 text-[11px]">({copy.notReady})</span>
                              </span>
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* 正文 */}
        <main className="min-w-0">
          <header className="border-b border-gray-200 pb-6 dark:border-gray-800">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-600 dark:bg-gray-900 dark:text-gray-300">
                {moduleTitle}
              </span>
              {lesson.free && (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {copy.free}
                </span>
              )}
              {locked && (
                <span className="rounded-full bg-gray-900 px-2.5 py-1 font-medium text-white dark:bg-gray-100 dark:text-gray-900">
                  {copy.paid}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <Clock className="h-3.5 w-3.5" />
                {lesson.duration} {copy.minutes}
              </span>
              {position > 0 && (
                <span className="text-gray-400 dark:text-gray-500">
                  {position}/{totalReady}
                </span>
              )}
            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl dark:text-gray-50">
              {lesson.title}
            </h1>
            {lesson.summary && (
              <p className="mt-2 text-base leading-relaxed text-gray-600 dark:text-gray-400">
                {lesson.summary}
              </p>
            )}
          </header>

          {lesson.objectives.length > 0 && (
            <section className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900/60">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                <CheckCircle2 className="h-4 w-4" />
                {copy.objectives}
              </h2>
              <ul className="mt-3 space-y-1.5">
                {lesson.objectives.map((objective) => (
                  <li
                    key={objective}
                    className="flex gap-2 text-sm leading-relaxed text-gray-700 dark:text-gray-300"
                  >
                    <span aria-hidden="true" className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-gray-400" />
                    {objective}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {locked ? (
            <LockedLesson course={course} locale={locale} lesson={lesson} curriculum={curriculum} />
          ) : (
            <article className="prose prose-gray mt-8 max-w-none dark:prose-invert prose-headings:scroll-mt-24">
              <MDXRemote
                source={lesson.content}
                components={components}
                options={{
                  mdxOptions: {
                    remarkPlugins: [remarkGfm],
                    rehypePlugins: [rehypeSlug, [rehypePrettyCode, { theme: "github-dark-dimmed" }]],
                  },
                }}
              />
            </article>
          )}

          {/* 上一篇 / 下一篇 */}
          <nav className="mt-12 grid gap-3 border-t border-gray-200 pt-6 sm:grid-cols-2 dark:border-gray-800">
            {previous ? (
              <Link
                href={lessonHref(locale, course.slug, previous.slug)}
                className="group rounded-xl border border-gray-200 p-4 transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:hover:border-gray-700 dark:hover:bg-gray-900"
              >
                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {copy.previous}
                </span>
                <span className="mt-1 block text-sm font-medium text-gray-900 group-hover:underline dark:text-gray-100">
                  {previous.title}
                </span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={lessonHref(locale, course.slug, next.slug)}
                className="group rounded-xl border border-gray-200 p-4 text-right transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:hover:border-gray-700 dark:hover:bg-gray-900"
              >
                <span className="flex items-center justify-end gap-1 text-xs text-gray-500 dark:text-gray-400">
                  {copy.next}
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
                <span className="mt-1 block text-sm font-medium text-gray-900 group-hover:underline dark:text-gray-100">
                  {next.title}
                </span>
              </Link>
            ) : (
              <Link
                href={coursePath(locale, course.slug)}
                className="group rounded-xl border border-gray-200 p-4 text-right transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:hover:border-gray-700 dark:hover:bg-gray-900"
              >
                <span className="flex items-center justify-end gap-1 text-xs text-gray-500 dark:text-gray-400">
                  {copy.back}
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
                <span className="mt-1 block text-sm font-medium text-gray-900 dark:text-gray-100">
                  {copy.buying}
                </span>
              </Link>
            )}
          </nav>
        </main>
      </div>
    </div>
  );
}
