import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  GraduationCap,
  Layers,
  Lock,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import {
  LEVELS,
  PLAN_LABELS,
  STATUS_LABELS,
  TRACKS,
  formatCNYRef,
  formatUSD,
  getBundle,
  getCheckoutUrl,
  getCourseContent,
  type Course,
  type CoursePlan,
  type Locale,
} from "@/lib/courses";
import { getCourseCopy, fillTemplate } from "@/lib/course-copy";
import { CourseIcon, StatusPill, accentClass } from "@/components/courses/course-visuals";
import { BuyButton } from "@/components/courses/buy-button";
import { WaitlistForm } from "@/components/courses/waitlist-form";
import { CourseJsonLd } from "@/components/courses/course-jsonld";


function planLabel(plan: CoursePlan, locale: Locale) {
  return PLAN_LABELS[plan.id]?.[locale] ?? plan.id;
}

export function CourseDetail({ course, locale }: { course: Course; locale: Locale }) {
  const copy = getCourseCopy(locale);
  const content = getCourseContent(course, locale);
  const track = TRACKS[course.track];
  const status = STATUS_LABELS[course.status];
  const bundle = getBundle();
  const isBundle = course.kind === "bundle";
  const localeBase = locale === "zh" ? "/zh/courses" : "/en/courses";

  const plans = course.plans.map((plan) => ({
    plan,
    checkout: getCheckoutUrl(course, plan, locale),
  }));
  const hasCheckout = plans.some((item) => Boolean(item.checkout.url));
  const showWaitlist = !hasCheckout || course.status !== "live";
  const fallback =
    course.status === "preorder"
      ? { href: "#waitlist", label: copy.detail.notifyMe }
      : { href: "/contact", label: copy.detail.contactUs };
  const guarantee = content.guarantee ?? copy.detail.guaranteeFallback;

  return (
    <>
      <CourseJsonLd course={course} locale={locale} url={`${localeBase}/${course.slug}`} />

      <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-50">
        {/* Breadcrumb */}
        <div className="mx-auto w-full max-w-6xl px-4 pt-8 md:px-8">
          <nav className="flex min-w-0 items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Link href={localeBase} className="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100">
              <ArrowLeft className="h-4 w-4" />
              {copy.detail.back}
            </Link>
            <span>/</span>
            <span className="min-w-0 truncate text-gray-900 dark:text-gray-100">{content.title}</span>
          </nav>
        </div>

        {/* Hero */}
        <header className="mx-auto w-full max-w-6xl px-4 pb-12 pt-8 md:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-[11px] font-medium text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
              {track && <CourseIcon name={track.icon} className="h-3.5 w-3.5" />}
              {track ? track[locale] : course.track}
            </span>
            <StatusPill label={status[locale]} tone={status.tone} />
            {course.status === "preorder" && course.releaseDate && (
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                {copy.detail.releaseDate}: {course.releaseDate}
              </span>
            )}
          </div>

          <h1 className="mt-5 max-w-4xl text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {content.title}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-gray-600 dark:text-gray-300">
            {content.subtitle}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              {fillTemplate(copy.detail.lessonsCount, { count: course.lessonCount })}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {fillTemplate(copy.detail.hoursCount, { hours: course.durationHours })}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4" />
              {LEVELS[course.level][locale]}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <RefreshCcw className="h-4 w-4" />
              {copy.detail.updatedLabel} {course.lastUpdated}
            </span>
          </div>

          <div className="mt-8 max-w-3xl border-l-2 border-gray-900 pl-4 text-base leading-relaxed text-gray-700 dark:border-gray-100 dark:text-gray-300">
            {content.tagline}
          </div>
        </header>

        {/* Body */}
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 pb-20 md:px-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-14">
            {/* Audience */}
            <section>
              <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
                <Users className="h-5 w-5" />
                {copy.detail.audienceTitle}
              </h2>
              <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {content.audience.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2.5 rounded-xl border border-gray-100 bg-gray-50/70 p-4 text-sm leading-relaxed text-gray-700 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-300"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* Outcomes */}
            <section>
              <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
                <CheckCircle2 className="h-5 w-5" />
                {copy.detail.outcomesTitle}
              </h2>
              <ol className="mt-5 space-y-3">
                {content.outcomes.map((item, index) => (
                  <li key={item} className="flex gap-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[11px] font-semibold text-white dark:bg-gray-100 dark:text-gray-900">
                      {index + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ol>
            </section>

            {/* Curriculum */}
            <section>
              <div className="flex flex-wrap items-end justify-between gap-2">
                <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
                  <Layers className="h-5 w-5" />
                  {copy.detail.curriculumTitle}
                </h2>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {fillTemplate(copy.detail.curriculumLead, { lessonCount: course.lessonCount })}
                </span>
              </div>

              <div className="mt-5 divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
                {content.modules.map((module, index) => (
                  <details
                    key={module.title}
                    className="group bg-white dark:bg-gray-950"
                    open={index === 0}
                  >
                    <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900">
                      <span className="w-7 shrink-0 text-xs font-mono text-gray-400">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {module.title}
                        </span>
                        {module.summary && (
                          <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                            {module.summary}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-xs text-gray-400">
                        {module.lessons.length} {locale === "zh" ? "节" : "lessons"}
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-90" />
                    </summary>
                    <ul className="space-y-2 border-t border-gray-100 bg-gray-50/60 px-5 py-4 dark:border-gray-800 dark:bg-gray-900/40">
                      {module.lessons.map((lesson) => (
                        <li
                          key={lesson}
                          className="flex items-start gap-2.5 text-sm leading-relaxed text-gray-700 dark:text-gray-300"
                        >
                          <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300 dark:bg-gray-600" />
                          {lesson}
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            </section>

            {/* Deliverables */}
            <section>
              <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
                <Sparkles className="h-5 w-5" />
                {copy.detail.deliverablesTitle}
              </h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {content.deliverables.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2.5 rounded-xl border border-gray-200 p-4 text-sm leading-relaxed text-gray-700 dark:border-gray-800 dark:text-gray-300"
                  >
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-gray-900 dark:text-gray-100" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* Instructor */}
            {content.instructor && (
              <section>
                <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
                  <GraduationCap className="h-5 w-5" />
                  {copy.detail.instructorTitle}
                </h2>
                <div className="mt-5 flex gap-4 rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white ${accentClass(
                      course.accent,
                    )}`}
                  >
                    <CourseIcon name={course.icon} className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {content.instructor.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {content.instructor.role}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                      {content.instructor.bio}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Waitlist */}
            {showWaitlist && (
              <section id="waitlist" className="scroll-mt-24">
                <div className="rounded-2xl border border-gray-900/10 bg-gray-50 p-6 dark:border-gray-100/10 dark:bg-gray-900">
                  <h2 className="text-lg font-bold tracking-tight">{course.status === "live" ? copy.detail.waitlistTitleLive : copy.detail.waitlistTitle}</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                    {course.status === "live" ? copy.detail.waitlistLeadLive : copy.detail.waitlistLead}
                  </p>
                  <div className="mt-4 max-w-md">
                    <WaitlistForm
                      courseSlug={course.slug}
                      locale={locale}
                      endpoint={process.env.NEXT_PUBLIC_COURSE_WAITLIST_ENDPOINT}
                    />
                  </div>
                </div>
              </section>
            )}

            {/* FAQ */}
            <section>
              <h2 className="text-xl font-bold tracking-tight">{copy.detail.faqTitle}</h2>
              <div className="mt-5 divide-y divide-gray-200 rounded-2xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
                {content.faq.map((item) => (
                  <details key={item.q} className="group px-5 py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {item.q}
                      <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-90" />
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          </div>

          {/* Aside: purchase */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
              <div className={`bg-gradient-to-br px-5 py-4 text-white ${accentClass(course.accent)}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-widest text-white/80">
                    {copy.detail.pricingTitle}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-white/80">
                    <Lock className="h-3 w-3" />
                    Stripe
                  </span>
                </div>
                <div className="mt-1 text-sm text-white/90">
                  {formatUSD(Math.min(...course.plans.map((plan) => plan.priceUSD)))}
                  {locale === "zh" ? " 起" : "+"}
                </div>
              </div>

              <div className="space-y-4 p-5">
                <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  {copy.detail.pricingLead}
                </p>

                {plans.map(({ plan, checkout }) => (
                  <div
                    key={plan.id}
                    className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {planLabel(plan, locale)}
                      </span>
                      {plan.badge && (
                        <span className="rounded-full bg-gray-900 px-2 py-0.5 text-[10px] font-semibold text-white dark:bg-gray-100 dark:text-gray-900">
                          {plan.badge[locale]}
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 flex items-baseline gap-2">
                      <span className="text-2xl font-bold tracking-tight">
                        {formatUSD(plan.priceUSD)}
                      </span>
                      {plan.compareAtUSD && (
                        <span className="text-sm text-gray-400 line-through">
                          {formatUSD(plan.compareAtUSD)}
                        </span>
                      )}
                      {plan.priceCNYRef && (
                        <span className="text-xs text-gray-400">{formatCNYRef(plan.priceCNYRef)}</span>
                      )}
                    </div>

                    <ul className="mt-3 space-y-1.5">
                      {plan.features[locale].map((feature) => (
                        <li
                          key={feature}
                          className="flex gap-2 text-xs leading-relaxed text-gray-600 dark:text-gray-300"
                        >
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-4">
                      <BuyButton
                        href={checkout.url}
                        label={
                          course.status === "preorder"
                            ? copy.detail.preorderNow
                            : copy.detail.buyNow
                        }
                        courseSlug={course.slug}
                        planId={plan.id}
                        priceUSD={plan.priceUSD}
                        locale={locale}
                        fallbackHref={fallback.href}
                        fallbackLabel={fallback.label}
                        emphasis={plan.id === "pro" || course.plans.length === 1}
                      />
                    </div>
                  </div>
                ))}

                <div className="space-y-2 rounded-xl bg-gray-50 p-3.5 text-xs leading-relaxed text-gray-600 dark:bg-gray-900 dark:text-gray-400">
                  <p className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {guarantee}
                  </p>
                  <p className="flex items-start gap-2">
                    <CreditCard className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {copy.detail.paymentNote}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    {copy.detail.paymentTitle}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
                    {copy.detail.paymentMethods}
                  </p>
                </div>
              </div>
            </div>

            {!isBundle && bundle && (
              <Link
                href={`${localeBase}/${bundle.slug}`}
                className="mt-4 block rounded-2xl border border-gray-200 bg-gray-50 p-5 transition-colors hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
              >
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {copy.detail.bundleTitle}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  {copy.detail.bundleLead}
                </p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-gray-900 dark:text-gray-100">
                  {copy.detail.bundleCta}
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            )}
          </aside>
        </div>

        {/* Footer CTA */}
        <section className="border-t border-gray-200 bg-gray-50 py-14 dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 px-4 md:flex-row md:items-center md:px-8">
            <div>
              <h2 className="text-lg font-bold tracking-tight">{copy.detail.moreCourses}</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{copy.detail.sampleNote}</p>
            </div>
            <Link
              href={localeBase}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-200"
            >
              {copy.detail.back}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
