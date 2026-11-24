/**
 * 账户页（P2.2 / TASK111）：/account
 *
 * 这里是「交付主入口」：权益写在 D1，登录后就能看到课程与模板仓/社群链接，
 * 不依赖开通邮件（邮件只是通知）。付完钱跳回来时还会带 ?paid=1&session_id=…，
 * 先向 Stripe 对一次账，把 webhook 还没到的权益就地补上，避免「刚付完还看不到课」。
 *
 * 学习进度、换绑邮箱、自助退款属于 P3，这里不做。
 */

import { displayCourseName, planLabel, resolveEmailDelivery } from "../config.js";
import { getCatalogEntry } from "../catalog.js";
import { createStore } from "../store.js";
import { readSessionToken, verifySession } from "../auth.js";
import { reconcileCheckoutSession } from "../reconcile.js";
import { renderAccountPage, renderUnavailablePage, resolveLocale } from "../pages.js";

const HTML_HEADERS = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "no-store",
  "x-robots-tag": "noindex, nofollow",
};

function htmlPage(body, status = 200) {
  return new Response(body, { status, headers: HTML_HEADERS });
}

/**
 * 付款后状态条。
 *
 * 只有带 session_id 的跳转才算「这次刚付完」——否则一个收藏的 /account?paid=1
 * 会永远显示「支付成功」。没有课程又没有 session 时退回普通空态，不误导。
 */
function resolveStatus({ paid, hasCourses, hasSessionId, reconciled }) {
  if (!paid) return null;
  if (hasCourses) return hasSessionId ? "paid" : null;
  if (!hasSessionId) return null;

  switch (reconciled?.status) {
    case "unpaid":
      return "unpaid";
    // 已处理过 / 已退款 / 不是本人的会话：不该再提示「正在开通」
    case "foreign":
    case "refunded":
    case "already":
    case "invalid":
      return null;
    default:
      return "pending";
  }
}

export async function handleAccountPage(request, env = {}) {
  const url = new URL(request.url);
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

  const paid = url.searchParams.get("paid") === "1";
  const sessionId = (url.searchParams.get("session_id") || "").trim();
  const retryParam = Number.parseInt(url.searchParams.get("retry") || "0", 10);
  const retry = Number.isFinite(retryParam) && retryParam > 0 ? Math.min(retryParam, 9) : 0;

  // 付完跳回来的那一跳：主动对账，把「webhook 还没到」的空窗补上。
  // 任何异常都只降级成 pending 提示，绝不让账户页 500。
  let reconciled = null;
  if (paid && sessionId) {
    try {
      reconciled = await reconcileCheckoutSession({
        sessionId,
        email: session.email,
        env,
        store,
        logger: console,
      });
    } catch (error) {
      console.error(`[account] 对账异常：${error?.message ?? error}`);
      reconciled = { status: "error" };
    }
  }

  const rows = await store.listEntitlementsByEmail(session.email);

  // 同一门课可能既有直接权益又有全站通权益：按 slug 去重，bundle 排最后
  const seen = new Set();
  const courses = [];
  for (const row of rows) {
    if (row.revoked_at) continue;
    if (seen.has(row.course_slug)) continue;
    seen.add(row.course_slug);
    const entry = getCatalogEntry(env, row.course_slug, row.plan_id);
    // 模板仓库 / 社群邀请在账户页直接给出，不再只靠开通邮件
    const delivery = resolveEmailDelivery(env, row.course_slug, row.plan_id);
    courses.push({
      courseSlug: row.course_slug,
      title: displayCourseName(row.course_slug, locale),
      planLabel: planLabel(row.plan_id, locale),
      accent: entry?.accent ?? null,
      repo: delivery.repo,
      community: delivery.community,
    });
  }
  courses.sort(
    (a, b) =>
      Number(a.courseSlug === "all-access") - Number(b.courseSlug === "all-access") ||
      a.courseSlug.localeCompare(b.courseSlug),
  );

  const status = resolveStatus({
    paid,
    hasCourses: courses.length > 0,
    hasSessionId: Boolean(sessionId),
    reconciled,
  });

  const refreshHref =
    status === "pending" && retry < 3 && sessionId
      ? `/account?paid=1&retry=${retry + 1}&session_id=${encodeURIComponent(sessionId)}`
      : null;

  return htmlPage(
    renderAccountPage({
      locale,
      email: session.email,
      courses,
      status,
      retry,
      refreshHref,
    }),
  );
}
