import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, LifeBuoy, Mail } from "lucide-react";
import { PLAN_LABELS, getCourseContent, getCourses, type Locale } from "@/lib/courses";
import { getCourseCopy } from "@/lib/course-copy";
import { ThankYouOrder, type ThankYouEntry } from "@/components/courses/thank-you-order";

export function CourseThankYou({ locale }: { locale: Locale }) {
  const copy = getCourseCopy(locale);
  const localeBase = locale === "zh" ? "/zh/courses" : "/en/courses";

  const entries: Record<string, ThankYouEntry> = {};
  for (const course of getCourses()) {
    const content = getCourseContent(course, locale);
    entries[course.slug] = {
      title: content.title,
      plans: Object.fromEntries(
        course.plans.map((plan) => [plan.id, PLAN_LABELS[plan.id]?.[locale] ?? plan.id]),
      ),
    };
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-50">
      <div className="mx-auto w-full max-w-4xl px-4 py-16 md:px-8 md:py-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4" />
          Stripe · 200 OK
        </div>

        <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
          {copy.thankYou.title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-600 dark:text-gray-300">
          {copy.thankYou.lead}
        </p>

        <div className="mt-10 grid gap-8 md:grid-cols-[minmax(0,1fr)_320px]">
          <ol className="space-y-4">
            {copy.thankYou.steps.map((step, index) => (
              <li
                key={step.title}
                className="flex gap-4 rounded-2xl border border-gray-200 p-5 dark:border-gray-800"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white dark:bg-gray-100 dark:text-gray-900">
                  {index + 1}
                </span>
                <div>
                  <h2 className="text-sm font-semibold">{step.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                    {step.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="space-y-4">
            <Suspense
              fallback={
                <div className="h-32 animate-pulse rounded-2xl border border-gray-200 dark:border-gray-800" />
              }
            >
              <ThankYouOrder
                entries={entries}
                labels={{
                  purchaseTitle: copy.thankYou.purchaseTitle,
                  purchaseCourse: copy.thankYou.purchaseCourse,
                  purchasePlan: copy.thankYou.purchasePlan,
                  missingOrder: copy.thankYou.missingOrder,
                }}
              />
            </Suspense>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <LifeBuoy className="h-4 w-4" />
                {copy.thankYou.helpTitle}
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                {copy.thankYou.helpLead}
              </p>
              <Link
                href="/contact"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-gray-700 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-200"
              >
                <Mail className="h-3.5 w-3.5" />
                {copy.thankYou.contactCta}
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-gray-200 pt-6 text-sm dark:border-gray-800">
          <Link
            href={localeBase}
            className="inline-flex items-center gap-1.5 font-semibold text-gray-900 hover:underline dark:text-gray-100"
          >
            {copy.thankYou.browseCta}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={locale === "zh" ? "/zh/refund-policy" : "/refund-policy"}
            className="text-xs text-gray-500 underline hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            {copy.thankYou.refundNote}
          </Link>
        </div>
      </div>
    </div>
  );
}
