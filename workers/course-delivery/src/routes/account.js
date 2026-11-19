/**
 * 账户页（P2.2）：/account
 *
 * 只做四件事：显示当前邮箱、列出有效权益、退出登录、给未登录用户回跳。
 * 学习进度、换绑邮箱、自助退款属于 P2.4 / P3，这里不做。
 */

import { displayCourseName, planLabel } from "../config.js";
import { createStore } from "../store.js";
import { readSessionToken, verifySession } from "../auth.js";
import { renderAccountPage, renderUnavailablePage, resolveLocale } from "../pages.js";

const HTML_HEADERS = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "no-store",
  "x-robots-tag": "noindex, nofollow",
};

function htmlPage(body, status = 200) {
  return new Response(body, { status, headers: HTML_HEADERS });
}

export async function handleAccountPage(request, env = {}) {
  const locale = resolveLocale(request);

  if (!env.SESSION_SECRET) {
    console.error("[account] SESSION_SECRET 未配置");
    return htmlPage(renderUnavailablePage({ locale }), 503);
  }

  let store;
  try {
    store = createStore(env.DB);
  } catch (error) {
    console.error(`[account] 存储未就绪：${error?.message ?? error}`);
    return htmlPage(renderUnavailablePage({ locale }), 503);
  }

  const session = await verifySession({
    token: readSessionToken(request),
    secret: env.SESSION_SECRET,
  });

  if (!session.valid) {
    return new Response(null, {
      status: 302,
      headers: { location: `/login?next=${encodeURIComponent("/account")}` },
    });
  }

  const rows = await store.listEntitlementsByEmail(session.email);

  // 同一门课可能既有直接权益又有全站通权益：按 slug 去重，bundle 排最后
  const seen = new Set();
  const courses = [];
  for (const row of rows) {
    if (row.revoked_at) continue;
    if (seen.has(row.course_slug)) continue;
    seen.add(row.course_slug);
    courses.push({
      courseSlug: row.course_slug,
      title: displayCourseName(row.course_slug, locale),
      planLabel: planLabel(row.plan_id, locale),
    });
  }
  courses.sort(
    (a, b) =>
      Number(a.courseSlug === "all-access") - Number(b.courseSlug === "all-access") ||
      a.courseSlug.localeCompare(b.courseSlug),
  );

  return htmlPage(renderAccountPage({ locale, email: session.email, courses }));
}
