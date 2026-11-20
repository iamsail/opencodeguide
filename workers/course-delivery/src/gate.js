/**
 * 静态资源门禁（P2.2 实现，P2.3 接线到 Cloudflare 静态资源）。
 *
 * 原则：**默认拒绝**。公开路径是一份显式白名单，其余一切（正文、RSC payload、
 * 搜索索引、账户页）都要求登录，正文还要按课程查权益。
 *
 * 为什么必须按「路径前缀 + 所有文件后缀」拦：
 * Next 的静态导出除了 index.html，还会产出 index.txt / __next._full.txt
 * 这类 RSC payload。只拦 *.html 等于把正文从 .txt 里漏出去。
 */

import { readSessionToken, verifySession } from "./auth.js";
import { ALL_ACCESS_SLUG } from "./entitlements.js";

/** 成员站上无需登录即可访问的路径 */
const PUBLIC_PATTERNS = [
  /^\/login\/?$/,
  /^\/auth\//,
  /^\/health$/,
  /^\/robots\.txt$/,
  /^\/favicon\.ico$/,
  /^\/_next\//, // 构建产物的 CSS/JS/字体，不含正文
  /^\/assets\//,
];

export function isPublicPath(pathname) {
  return PUBLIC_PATTERNS.some((pattern) => pattern.test(pathname ?? ""));
}

export function isProtectedPath(pathname) {
  return !isPublicPath(pathname);
}

/**
 * /courses/<slug>/... → slug；带语言前缀的 /zh/courses/<slug>/... 同样识别。
 * /courses、/zh/courses 或其它路径 → null。
 *
 * 语言前缀必须支持：Next 静态导出把课时页产在 /zh/ 与 /en/ 下，
 * 漏掉前缀会让带前缀的 URL 被当成「非课程页」直接放行（已由测试兜住）。
 */
export function courseSlugFromPath(pathname) {
  const match = /^(?:\/(?:zh|en))?\/courses\/([a-z0-9-]+)(?:\/|$)/.exec(pathname ?? "");
  return match ? match[1] : null;
}

export function isHtmlRequest(request) {
  const accept = request.headers.get("accept") || "";
  return accept.includes("text/html");
}

/** 未登录时的回跳地址 */
export function loginRedirectFor(pathname) {
  return `/login?next=${encodeURIComponent(pathname || "/account")}`;
}

/**
 * 授权决策。
 * @returns {Promise<{
 *   allowed: boolean,
 *   public?: boolean,
 *   status?: number,
 *   reason?: string,
 *   needsLogin?: boolean,
 *   email?: string,
 *   courseSlug?: string | null,
 * }>}
 */
export async function authorizeRequest({ request, env = {}, store, now = () => new Date() }) {
  const pathname = new URL(request.url).pathname;

  if (!isProtectedPath(pathname)) return { allowed: true, public: true };

  const session = await verifySession({
    token: readSessionToken(request),
    secret: env.SESSION_SECRET,
    now,
  });
  if (!session.valid) {
    return { allowed: false, status: 401, needsLogin: true, reason: session.reason };
  }

  const courseSlug = courseSlugFromPath(pathname);
  // 账户页、搜索索引、成员站首页：登录即可
  if (!courseSlug) return { allowed: true, email: session.email, courseSlug: null };

  const hasDirect = await store.hasEntitlement(session.email, courseSlug);
  const hasBundle =
    courseSlug === ALL_ACCESS_SLUG ? false : await store.hasEntitlement(session.email, ALL_ACCESS_SLUG);

  if (hasDirect || hasBundle) {
    return { allowed: true, email: session.email, courseSlug };
  }

  return {
    allowed: false,
    status: 403,
    reason: "no_entitlement",
    email: session.email,
    courseSlug,
  };
}
