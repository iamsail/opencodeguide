"use client";

import { useSearchParams } from "next/navigation";

export interface ThankYouEntry {
  title: string;
  plans: Record<string, string>;
}

/**
 * 付款回执：Stripe Payment Link 的 after_completion 会带上
 * ?course=<slug>&plan=<planId>，这里在客户端读取并展示订单摘要。
 * 静态导出下必须包在 <Suspense> 内（在 course-thank-you.tsx 中处理）。
 */
export function ThankYouOrder({
  entries,
  labels,
}: {
  entries: Record<string, ThankYouEntry>;
  labels: { purchaseTitle: string; purchaseCourse: string; purchasePlan: string; missingOrder: string };
}) {
  const params = useSearchParams();
  const slug = params.get("course") ?? "";
  const planId = params.get("plan") ?? "";
  const entry = entries[slug];

  return (
    <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {labels.purchaseTitle}
      </h2>
      {entry ? (
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500 dark:text-gray-400">{labels.purchaseCourse}</dt>
            <dd className="text-right font-medium text-gray-900 dark:text-gray-100">{entry.title}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500 dark:text-gray-400">{labels.purchasePlan}</dt>
            <dd className="text-right font-medium text-gray-900 dark:text-gray-100">
              {entry.plans[planId] ?? planId}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          {labels.missingOrder}
        </p>
      )}
    </div>
  );
}
