import Link from "next/link";
import { ArrowRight, Lock, PlayCircle } from "lucide-react";

import { coursePath, getCourseContent, type Course, type Locale } from "@/lib/courses";
import { getFreeLessonLimit } from "@/lib/course-access";
import type { CourseLesson, CurriculumModule } from "@/lib/course-lessons";

/**
 * 锁定页
 * ------------------------------------------------------------
 * 公开构建里，付费课时只输出这一块卡片，正文 MDX 根本不参与渲染
 * （构建期分流，不是前端隐藏）。因此这里的文案要能独立完成「解释 + 转化」：
 * 说明本课有多少节、免费几节、购买后拿到什么，并给出试听与购买入口。
 *
 * `data-locked-lesson` 是 CI 断言用的标记：scripts/courses/assert-no-gated-content.mjs
 * 会检查每个付费课时页确实渲染了这个标记，否则说明分流没生效。
 */
export function LockedLesson({
  course,
  locale,
  lesson,
  curriculum,
}: {
  course: Course;
  locale: Locale;
  /** 当前被锁定的这一节（只用标题等元信息，正文不会传进来） */
  lesson: CourseLesson;
  curriculum: CurriculumModule[];
}) {
  const content = getCourseContent(course, locale);
  const freeLimit = getFreeLessonLimit();
  const readyLessons = curriculum.reduce((sum, module) => sum + module.ready, 0);
  const totalLessons = curriculum.reduce((sum, module) => sum + module.total, 0);

  const previews = curriculum
    .flatMap((module) => module.lessons)
    .filter((item) => item.slug && item.free)
    .slice(0, Math.max(freeLimit, 1));

  const copy =
    locale === "zh"
      ? {
          eyebrow: "付费内容",
          title: "这一节的正文仅对付费学员开放",
          lead: `《${content.title}》共 ${totalLessons} 节，已上线 ${readyLessons} 节，其中前 ${freeLimit} 节可以免费试听。你正在读的「${lesson.title}」属于付费部分。`,
          previewTitle: "先免费试听",
          cta: "查看课程与价格",
          note: "购买后通过邮件收到完整正文的阅读入口，7 天内可申请退款。已经购买过？邮件里有你的专属链接。",
          back: "返回课程目录",
        }
      : {
          eyebrow: "Paid lesson",
          title: "This lesson is part of the paid course",
          lead: `“${content.title}” has ${totalLessons} lessons (${readyLessons} published). The first ${freeLimit} are free to preview — “${lesson.title}” is not one of them.`,
          previewTitle: "Try a free lesson first",
          cta: "See pricing",
          note: "After purchase you get the full lessons by email, with a 7-day refund window. Already bought? Your delivery email has the link.",
          back: "Back to course",
        };

  return (
    <section
      data-locked-lesson="true"
      className="mt-8 rounded-2xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white p-6 dark:border-gray-800 dark:from-gray-900/70 dark:to-gray-950"
    >
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-2.5 py-1 text-[11px] font-semibold text-white dark:bg-gray-100 dark:text-gray-900">
        <Lock className="h-3 w-3" />
        {copy.eyebrow}
      </span>

      <h2 className="mt-4 text-lg font-bold tracking-tight text-gray-900 dark:text-gray-50">
        {copy.title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{copy.lead}</p>

      {previews.length > 0 && (
        <div className="mt-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            {copy.previewTitle}
          </p>
          <ul className="mt-2 space-y-1.5">
            {previews.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`${coursePath(locale, course.slug)}/${item.slug}`}
                  className="inline-flex items-start gap-2 text-sm font-medium text-gray-700 underline-offset-2 hover:text-gray-900 hover:underline dark:text-gray-300 dark:hover:text-gray-100"
                >
                  <PlayCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link
          href={`${coursePath(locale, course.slug)}#pricing`}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-200"
        >
          {copy.cta}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href={coursePath(locale, course.slug)}
          className="text-sm font-medium text-gray-500 underline-offset-2 hover:text-gray-900 hover:underline dark:text-gray-400 dark:hover:text-gray-100"
        >
          {copy.back}
        </Link>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{copy.note}</p>
    </section>
  );
}
