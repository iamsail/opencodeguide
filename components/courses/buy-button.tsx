"use client";

import { useCallback } from "react";
import { ArrowRight, CreditCard, Mail } from "lucide-react";

interface BuyButtonProps {
  /** Stripe Payment Link（带跟踪参数）；未配置时为 null */
  href: string | null;
  label: string;
  courseSlug: string;
  planId: string;
  priceUSD: number;
  locale: "zh" | "en";
  /** 未开通支付时的替代动作（等待名单 / 联系页） */
  fallbackHref: string;
  fallbackLabel: string;
  emphasis?: boolean;
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/**
 * 购买按钮：Stripe Payment Link 是纯跳转，无需后端，因此与 output: 'export' 兼容。
 * 点击时上报 GA4 begin_checkout（含课程与计划），便于和 Stripe 收款记录对账。
 */
export function BuyButton({
  href,
  label,
  courseSlug,
  planId,
  priceUSD,
  locale,
  fallbackHref,
  fallbackLabel,
  emphasis = false,
}: BuyButtonProps) {
  const track = useCallback(() => {
    try {
      window.gtag?.("event", "begin_checkout", {
        currency: "USD",
        value: priceUSD,
        items: [
          {
            item_id: courseSlug,
            item_name: courseSlug,
            item_variant: planId,
          },
        ],
        course: courseSlug,
        plan: planId,
        locale,
      });
    } catch {
      /* analytics must never block checkout */
    }
  }, [courseSlug, planId, priceUSD, locale]);

  if (!href) {
    return (
      <a
        href={fallbackHref}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
      >
        <Mail className="h-4 w-4" />
        {fallbackLabel}
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={track}
      className={
        emphasis
          ? "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-200"
          : "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-900 px-4 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100 dark:border-gray-100 dark:text-gray-100 dark:hover:bg-gray-800"
      }
    >
      <CreditCard className="h-4 w-4" />
      {label}
      <ArrowRight className="h-4 w-4" />
    </a>
  );
}
