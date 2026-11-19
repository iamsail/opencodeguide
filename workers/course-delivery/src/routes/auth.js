/**
 * 登录相关路由（P2.2）：/login、/auth/magic、/auth/verify、/auth/logout。
 *
 * 设计约束：
 *   1. 无论邮箱是否购买过，POST /auth/magic 的响应都一样（防枚举）；
 *   2. 回跳地址只接受站内路径（防开放重定向）；
 *   3. 基础设施故障（D1/邮件）返回 5xx，不伪装成「已发送」——否则用户会一直等一封不存在的邮件。
 */

import { createMailer } from "../email.js";
import { getSettings } from "../config.js";
import { createStore } from "../store.js";
import {
  MAGIC_TTL_MINUTES,
  buildClearedSessionCookie,
  buildSessionCookie,
  consumeMagicToken,
  issueMagicLink,
  safeNextPath,
  signSession,
} from "../auth.js";
import { normalizeEmail } from "../entitlements.js";
import { buildLoginEmail } from "../templates.js";
import {
  renderInvalidLinkPage,
  renderLoginPage,
  renderRateLimitedPage,
  renderSentPage,
  renderUnavailablePage,
  resolveLocale,
} from "../pages.js";

const HTML_HEADERS = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "no-store",
  "x-robots-tag": "noindex, nofollow",
  // 令牌在 URL 里，禁止通过 Referer 外泄给第三方
  "referrer-policy": "no-referrer",
};

function htmlPage(body, status = 200, extraHeaders = {}) {
  return new Response(body, { status, headers: { ...HTML_HEADERS, ...extraHeaders } });
}

function redirect(location, extraHeaders = {}) {
  return new Response(null, {
    status: 302,
    headers: { location, "referrer-policy": "no-referrer", "cache-control": "no-store", ...extraHeaders },
  });
}

/** 成员站可以让 cookie 覆写父域，留一个显式开关而不是硬编码 */
function cookieDomain(env = {}) {
  return env.SESSION_COOKIE_DOMAIN || undefined;
}

function openStore(env) {
  try {
    return { store: createStore(env.DB) };
  } catch (error) {
    return { error };
  }
}

async function readSubmittedEmail(request) {
  const contentType = request.headers.get("content-type") || "";
  let email = null;
  let next = "/account";

  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    email = body?.email;
    next = body?.next ?? next;
  } else {
    const form = await request.formData().catch(() => null);
    email = form?.get("email");
    next = form?.get("next") ?? next;
  }

  return { email: normalizeEmail(email), next: safeNextPath(next) };
}

export async function handleAuthRoutes(request, env = {}) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method.toUpperCase();

  if (pathname === "/login" && method === "GET") {
    const locale = resolveLocale(request);
    return htmlPage(renderLoginPage({ locale, next: safeNextPath(url.searchParams.get("next")) }));
  }

  if (pathname === "/auth/magic" && method === "POST") {
    return handleMagicRequest(request, env);
  }

  if (pathname === "/auth/verify" && method === "GET") {
    return handleVerify(request, env);
  }

  if (pathname === "/auth/logout" && (method === "POST" || method === "GET")) {
    return redirect("/login", { "set-cookie": buildClearedSessionCookie({ domain: cookieDomain(env) }) });
  }

  return null;
}

async function handleMagicRequest(request, env) {
  const locale = resolveLocale(request);
  const { email, next } = await readSubmittedEmail(request);

  // 邮箱格式不对也不报错，直接给「已发送」——否则等于提供了一个邮箱是否买过的探测器
  if (!email) return htmlPage(renderSentPage({ locale }));

  const { store, error } = openStore(env);
  if (!store) {
    console.error(`[auth] 存储未就绪：${error?.message ?? error}`);
    return htmlPage(renderUnavailablePage({ locale }), 503);
  }

  const issued = await issueMagicLink({
    store,
    email,
    ip: request.headers.get("cf-connecting-ip") || null,
  });
  if (!issued.ok) {
    console.warn(`[auth] 登录邮件限流：${issued.reason}`);
    return htmlPage(renderRateLimitedPage({ locale }), 429);
  }

  const origin = (env.LEARN_URL || new URL(request.url).origin).replace(/\/$/, "");
  const loginUrl = `${origin}/auth/verify?t=${encodeURIComponent(issued.token)}&next=${encodeURIComponent(next)}`;
  const template = buildLoginEmail({
    locale,
    email,
    loginUrl,
    expiresMinutes: MAGIC_TTL_MINUTES,
    settings: getSettings(env),
  });

  try {
    await createMailer(env).send({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  } catch (sendError) {
    console.error(`[auth] 登录邮件发送失败：${sendError?.message ?? sendError}`);
    return htmlPage(renderUnavailablePage({ locale }), 503);
  }

  return htmlPage(renderSentPage({ locale, email }));
}

async function handleVerify(request, env) {
  const locale = resolveLocale(request);
  const url = new URL(request.url);
  const token = url.searchParams.get("t");
  const next = safeNextPath(url.searchParams.get("next"));

  if (!env.SESSION_SECRET) {
    console.error("[auth] SESSION_SECRET 未配置，拒绝签发会话");
    return htmlPage(renderUnavailablePage({ locale }), 503);
  }

  const { store, error } = openStore(env);
  if (!store) {
    console.error(`[auth] 存储未就绪：${error?.message ?? error}`);
    return htmlPage(renderUnavailablePage({ locale }), 503);
  }

  const result = await consumeMagicToken({ store, token });
  if (!result.ok) {
    console.warn(`[auth] 登录链接不可用：${result.reason}`);
    return htmlPage(renderInvalidLinkPage({ locale }), 400);
  }

  const session = await signSession({ email: result.email, secret: env.SESSION_SECRET });
  return redirect(next, {
    "set-cookie": buildSessionCookie({ token: session, domain: cookieDomain(env) }),
  });
}
