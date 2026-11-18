"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";

interface WaitlistFormProps {
  courseSlug: string;
  locale: "zh" | "en";
  /** 例如 Formspree / Buttondown / 自建收集端点；未配置时退回联系页 */
  endpoint?: string;
  contactHref?: string;
}

/**
 * 等待名单：预售课程或支付尚未配置时使用。
 * 端点通过 NEXT_PUBLIC_COURSE_WAITLIST_ENDPOINT 注入（静态站可直接对接
 * Formspree / Buttondown / Cloudflare Worker），无需自建后端。
 */
export function WaitlistForm({
  courseSlug,
  locale,
  endpoint,
  contactHref = "/contact",
}: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  const copy =
    locale === "zh"
      ? {
          placeholder: "you@example.com",
          submit: "加入等待名单",
          done: "已加入！开售时第一时间通知你。",
          error: "提交失败，请稍后重试，或直接联系我们。",
          privacy: "只用于课程通知，不做营销群发，可随时退订。",
        }
      : {
          placeholder: "you@example.com",
          submit: "Join the waitlist",
          done: "You're on the list. We'll email you at launch.",
          error: "Something went wrong. Try again, or contact us directly.",
          privacy: "Used only for launch updates. Unsubscribe anytime.",
        };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "loading") return;

    if (!endpoint) {
      window.location.href = contactHref;
      return;
    }

    setState("loading");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, course: courseSlug, locale, source: "courses-page" }),
      });
      if (!response.ok) throw new Error(String(response.status));
      setState("done");
      setEmail("");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
        <Check className="h-4 w-4 shrink-0" />
        {copy.done}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={copy.placeholder}
          aria-label={copy.submit}
          className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-gray-300"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gray-900 px-3.5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-60 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-200"
        >
          {state === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          {copy.submit}
        </button>
      </div>
      {state === "error" ? (
        <p className="text-xs text-rose-600 dark:text-rose-400">{copy.error}</p>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">{copy.privacy}</p>
      )}
    </form>
  );
}
