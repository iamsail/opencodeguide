/**
 * 购买页（/buy/<slug>/<plan>）+ 创建 Checkout Session（POST /checkout）。
 *
 * 为什么要有这一层（而不是继续用 Payment Link）：
 *   Payment Link 是匿名的，买家在 Stripe 页面自己填邮箱，我们只能事后猜身份。
 *   走服务端 Checkout Session 后：
 *     1. 下单前必须登录 → 付款人和权益归属是同一个人；
 *     2. 用 Customer 对象锁定邮箱，买家改不了；
 *     3. 权益直接写在会话的 metadata 上，webhook 不再依赖 Stripe 收集的邮箱。
 */

import { readSessionToken, verifySession } from "../auth.js";
import { formatPrice, getCatalogEntry } from "../catalog.js";
import { getSettings } from "../config.js";
import { createStripeClient } from "../stripe-api.js";
import {
  renderBuyPage,
  renderErrorPage,
  renderUnavailablePage,
  resolveLocale,
} from "../pages.js";

const HTML_HEADERS = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "no-store",
  "x-robots-tag": "noindex, nofollow",
};

function htmlPage(body, status = 200) {
  return new Response(body, { status, headers: HTML_HEADERS });
}

function redirect(location) {
  return new Response(null, { status: 303, headers: { location, "cache-control": "no-store" } });
}

function originFor(env, request) {
  return (env.LEARN_URL || new URL(request.url).origin).replace(/\/$/, "");
}

const BUY_PATH = /^\/buy\/([a-z0-9-]+)\/([a-z0-9-]+)\/?$/;

export async function handleBuyPage(request, env = {}) {
  const match = BUY_PATH.exec(new URL(request.url).pathname);
  if (!match) return null;

  const [, slug, plan] = match;
  const locale = resolveLocale(request);
  const session = await verifySession({
    token: readSessionToken(request),
    secret: env.SESSION_SECRET,
  });

  if (!session.valid) {
    return new Response(null, {
      status: 302,
      headers: {
        location: `/login?next=${encodeURIComponent(new URL(request.url).pathname)}`,
        "cache-control": "no-store",
      },
    });
  }

  const entry = getCatalogEntry(env, slug, plan);
  if (!entry) {
    console.warn(`[buy] 未配置的课程/计划：${slug}:${plan}`);
    return htmlPage(renderErrorPage({ locale, reason: "unknown-course" }), 404);
  }

  return htmlPage(
    renderBuyPage({
      locale,
      courseTitle: entry.title,
      planLabel: entry.planLabel,
      total: formatPrice(entry, locale),
      accent: entry.accent ?? null,
      form: { course: slug, plan },
    }),
  );
}

export async function handleCheckout(request, env = {}) {
  const locale = resolveLocale(request);

  const session = await verifySession({
    token: readSessionToken(request),
    secret: env.SESSION_SECRET,
  });
  if (!session.valid) {
    return new Response(null, {
      status: 302,
      headers: { location: `/login?next=${encodeURIComponent("/account")}`, "cache-control": "no-store" },
    });
  }

  const form = await request.formData().catch(() => null);
  const slug = String(form?.get("course") ?? "").trim();
  const plan = String(form?.get("plan") ?? "").trim();
  const entry = getCatalogEntry(env, slug, plan);
  if (!entry) {
    console.warn(`[checkout] 未配置的课程/计划：${slug}:${plan}`);
    return htmlPage(renderErrorPage({ locale, reason: "unknown-course" }), 400);
  }

  const settings = getSettings(env);
  if (!settings.stripeSecretKey) {
    console.error("[checkout] STRIPE_SECRET_KEY 未配置");
    return htmlPage(renderUnavailablePage({ locale }), 503);
  }
  if (!entry.priceId) {
    console.error(`[checkout] ${slug}:${plan} 缺少 priceId（COURSE_CATALOG 未同步？）`);
    return htmlPage(renderUnavailablePage({ locale }), 503);
  }

  const origin = originFor(env, request);
  const stripe = createStripeClient({ secretKey: settings.stripeSecretKey });

  try {
    const customer = await stripe.ensureCustomer({
      email: session.email,
      metadata: { source: "learn", course_slug: slug },
    });

    const checkout = await stripe.createCheckoutSession({
      customerId: customer.id,
      priceId: entry.priceId,
      // 带上 session_id：付完跳回来时账户页可以主动对账，不必等异步 webhook
      successUrl: `${origin}/account?paid=1&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/buy/${slug}/${plan}`,
      locale,
      metadata: {
        // 关键：权益归属用登录邮箱，而不是 Stripe 页面收集的邮箱
        email: session.email,
        course_slug: slug,
        plan_id: plan,
        course_title: entry.title,
        plan_label: entry.planLabel,
      },
    });

    if (!checkout?.url) throw new Error("Stripe 没有返回 checkout url");
    console.info(`[checkout] 创建会话 ${checkout.id} → ${session.email} ${slug}:${plan}`);
    return redirect(checkout.url);
  } catch (error) {
    console.error(`[checkout] 创建会话失败：${error?.message ?? error}`);
    return htmlPage(renderUnavailablePage({ locale }), 502);
  }
}
