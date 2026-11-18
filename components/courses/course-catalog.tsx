import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  CreditCard,
  Layers,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  TRACKS,
  formatUSD,
  getBundle,
  getTrackCourses,
  type Course,
  type Locale,
} from "@/lib/courses";
import { getCourseCopy } from "@/lib/course-copy";
import { CourseCard } from "@/components/courses/course-card";
import { CourseIcon } from "@/components/courses/course-visuals";

/** 展示顺序：学习路径由浅入深，与 catalog.pathSteps 保持一致 */
const COURSE_ORDER = [
  "ai-coding-workflow",
  "indie-saas-launch",
  "global-site-seo",
  "cross-border-store",
];

function CourseFaq({ locale }: { locale: Locale }) {
  const copy = getCourseCopy(locale);
  return (
    <div className="divide-y divide-gray-200 rounded-2xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
      {copy.faq.map((item) => (
        <details key={item.q} className="group px-5 py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
            {item.q}
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-90" />
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{item.a}</p>
        </details>
      ))}
    </div>
  );
}

export function CourseCatalog({ locale }: { locale: Locale }) {
  const copy = getCourseCopy(locale);
  const localeBase = locale === "zh" ? "/zh/courses" : "/en/courses";
  const bundle = getBundle();
  const allTrackCourses = getTrackCourses();
  const stats = [
    { value: String(allTrackCourses.length), label: copy.catalog.stats[0].label },
    {
      value: String(allTrackCourses.reduce((total, course) => total + course.lessonCount, 0)),
      label: copy.catalog.stats[1].label,
    },
    {
      value: String(allTrackCourses.reduce((total, course) => total + course.durationHours, 0)),
      label: copy.catalog.stats[2].label,
    },
    { value: copy.catalog.stats[3].value, label: copy.catalog.stats[3].label },
  ];

  const courses = [...allTrackCourses].sort(
    (a, b) => COURSE_ORDER.indexOf(a.slug) - COURSE_ORDER.indexOf(b.slug),
  );

  const trackOrder = ["ai-coding", "indie", "global-seo", "ecommerce"];

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-50">
      {/* Hero */}
      <section className="border-b border-gray-200 bg-gradient-to-b from-gray-50 to-white dark:border-gray-800 dark:from-gray-900 dark:to-gray-950">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 md:px-8 md:py-24">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
            {copy.catalog.eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            {copy.catalog.title}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-gray-600 dark:text-gray-300">
            {copy.catalog.lead}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            {copy.catalog.subLead}
          </p>

          <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 sm:grid-cols-4 dark:border-gray-800 dark:bg-gray-800">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white p-5 dark:bg-gray-950">
                <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5" /> Stripe
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> {locale === "zh" ? "7 天无理由退款" : "7-day refund"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" /> {locale === "zh" ? "永久观看" : "Lifetime access"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> {locale === "zh" ? "持续更新" : "Continuously updated"}
            </span>
          </div>
        </div>
      </section>

      {/* Tracks */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-bold tracking-tight">{copy.catalog.tracksTitle}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{copy.catalog.tracksLead}</p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trackOrder.map((trackKey) => {
            const track = TRACKS[trackKey];
            const firstCourse = courses.find((course) => course.track === trackKey);
            if (!track || !firstCourse) return null;
            return (
              <Link
                key={trackKey}
                href={`${localeBase}/${firstCourse.slug}`}
                className="group rounded-2xl border border-gray-200 p-5 transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:hover:border-gray-700 dark:hover:bg-gray-900"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900">
                  <CourseIcon name={track.icon} className="h-4 w-4" />
                </div>
                <h3 className="mt-4 text-sm font-semibold">{track[locale]}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  {track.description[locale]}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-gray-900 dark:text-gray-100">
                  {locale === "zh" ? "查看课程" : "View course"}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Courses */}
      <section className="border-t border-gray-200 bg-gray-50/60 py-16 dark:border-gray-800 dark:bg-gray-900/30">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-8">
          <h2 className="text-2xl font-bold tracking-tight">{copy.catalog.coursesTitle}</h2>

          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course: Course) => (
              <CourseCard key={course.slug} course={course} locale={locale} />
            ))}
          </div>

          {bundle && (
            <Link
              href={`${localeBase}/${bundle.slug}`}
              className="group mt-5 flex flex-col gap-5 overflow-hidden rounded-2xl bg-slate-900 p-6 text-white transition-shadow hover:shadow-xl md:flex-row md:items-center md:justify-between md:p-8"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
                  <Layers className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight">
                    {bundle.locales[locale].title}
                  </h3>
                  <p className="mt-1 max-w-xl text-sm leading-relaxed text-white/70">
                    {bundle.locales[locale].tagline}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-5">
                <div className="text-right">
                  <div className="text-2xl font-bold">{formatUSD(bundle.plans[0].priceUSD)}</div>
                  {bundle.plans[0].compareAtUSD && (
                    <div className="text-xs text-white/50 line-through">
                      {formatUSD(bundle.plans[0].compareAtUSD)}
                    </div>
                  )}
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-900">
                  {locale === "zh" ? "查看全站通" : "See All-Access"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* Learning path */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 md:px-8">
        <h2 className="text-2xl font-bold tracking-tight">{copy.catalog.pathTitle}</h2>
        <p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          {copy.catalog.pathLead}
        </p>

        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {copy.catalog.pathSteps.map((step) => (
            <li key={step.step}>
              <Link
                href={step.href}
                className="group flex h-full flex-col rounded-2xl border border-gray-200 p-5 transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:hover:border-gray-700 dark:hover:bg-gray-900"
              >
                <span className="font-mono text-xs text-gray-400">{step.step}</span>
                <span className="mt-2 text-sm font-semibold">{step.title}</span>
                <span className="mt-1.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  {step.detail}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ + CTA */}
      <section className="border-t border-gray-200 bg-gray-50/60 py-16 dark:border-gray-800 dark:bg-gray-900/30">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] md:px-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {locale === "zh" ? "购买前常见问题" : "Before you buy"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              {locale === "zh"
                ? "还有其他问题？直接联系我们，通常 1 个工作日内回复。"
                : "Anything else? Contact us and we usually reply within one business day."}
            </p>
            <Link
              href="/contact"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900 hover:underline dark:text-gray-100"
            >
              {copy.cta.contact}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <CourseFaq locale={locale} />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 md:px-8">
        <div className="rounded-2xl border border-gray-200 p-6 md:flex md:items-center md:justify-between md:p-8 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-bold tracking-tight">{copy.cta.title}</h2>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              {copy.cta.lead}
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 md:mt-0">
            <Link
              href={locale === "zh" ? "/zh/docs" : "/en/what-is-opencode"}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
            >
              {copy.cta.docs}
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-200"
            >
              {copy.cta.contact}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
