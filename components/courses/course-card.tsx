import Link from "next/link";
import { ArrowRight, Clock, PlayCircle } from "lucide-react";
import {
  STATUS_LABELS,
  TRACKS,
  formatCNYRef,
  formatUSD,
  getCourseContent,
  type Course,
  type Locale,
} from "@/lib/courses";
import { getCourseCopy } from "@/lib/course-copy";
import { CourseIcon, StatusPill, accentClass } from "@/components/courses/course-visuals";

/**
 * 课程卡片。价格展示的是最低档（single），以美元为主、人民币为参考。
 */
export function CourseCard({ course, locale }: { course: Course; locale: Locale }) {
  const copy = getCourseCopy(locale);
  const content = getCourseContent(course, locale);
  const track = TRACKS[course.track];
  const status = STATUS_LABELS[course.status];
  const cheapest = [...course.plans].sort((a, b) => a.priceUSD - b.priceUSD)[0];
  const isBundle = course.kind === "bundle";

  return (
    <Link
      href={`${locale === "zh" ? "/zh/courses" : "/en/courses"}/${course.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-950 dark:hover:border-gray-700"
    >
      <div
        className={`relative flex h-28 items-start justify-between bg-gradient-to-br p-5 ${accentClass(
          course.accent,
        )}`}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
            <CourseIcon name={course.icon} className="h-5 w-5 text-white" />
          </span>
          <span className="text-xs font-medium uppercase tracking-widest text-white/80">
            {track ? track[locale] : course.track}
          </span>
        </div>
        <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold text-gray-900">
          {locale === "zh" ? "2026 版" : "2026"}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center gap-2">
          <StatusPill label={status[locale]} tone={status.tone} />
          {isBundle && (
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
              {copy.card.bundleIncludes}
            </span>
          )}
        </div>

        <h3 className="text-lg font-bold leading-snug tracking-tight text-gray-900 group-hover:underline dark:text-gray-50">
          {content.title}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          {content.subtitle}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
          <span className="inline-flex items-center gap-1.5">
            <PlayCircle className="h-3.5 w-3.5" />
            {course.lessonCount} {copy.card.lessons}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {course.durationHours} {copy.card.hours}
          </span>
        </div>

        <div className="mt-auto flex items-end justify-between pt-5">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-gray-900 dark:text-gray-50">
                {formatUSD(cheapest.priceUSD)}
              </span>
              {cheapest.priceCNYRef && (
                <span className="text-xs text-gray-400">
                  {formatCNYRef(cheapest.priceCNYRef)}
                </span>
              )}
            </div>
            {cheapest.compareAtUSD && (
              <span className="text-xs text-gray-400 line-through">
                {formatUSD(cheapest.compareAtUSD)}
              </span>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900 dark:text-gray-50">
            {copy.card.viewCourse}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
