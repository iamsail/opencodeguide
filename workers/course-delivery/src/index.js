/**
 * Cloudflare Worker 入口。
 *
 * 路由：
 *   POST /stripe/webhook   接收 Stripe 事件（校验签名 → 幂等 → 处理）
 *   POST /admin/resend     { sessionId } 补发开通邮件（需 ADMIN_TOKEN）
 *   GET  /health           健康检查与配置自检（不含密钥内容）
 *
 * 为什么不放在 Next 里：站点是 `output: 'export'` 的纯静态导出，
 * 没有服务端运行时；把 Webhook 独立成 Worker，静态站继续零计算成本。
 */

import {
  courseTitle,
  displayCourseName,
  formatMoney,
  getSettings,
  planLabel,
  resolveEmailDelivery,
} from "./config.js";
import { createMailer } from "./email.js";
import { processEvent } from "./handlers.js";
import { createStore } from "./store.js";
import { normalizeEmail } from "./entitlements.js";
import { buildGrantEmail } from "./templates.js";
import { verifyStripeSignature } from "./stripe.js";
import { handleAccountPage } from "./routes/account.js";
import { handleAuthRoutes } from "./routes/auth.js";
import { handleBuyPage, handleCheckout } from "./routes/buy.js";
import { authorizeRequest, isHtmlRequest, loginRedirectFor } from "./gate.js";
import { renderDeniedPage, renderUnavailablePage, resolveLocale } from "./pages.js";

const WEBHOOK_PATH = "/stripe/webhook";
const RESEND_PATH = "/admin/resend";
const HEALTH_PATH = "/health";
const TOLERANCE_SECONDS = 300;
const ADMIN_ORDERS_PATH = "/admin/orders";
const ADMIN_GRANT_PATH = "/admin/grant";
const COURSE_PATH = /^\/courses(?:\/|$)/;
const COURSE_SLUG = /^[a-z0-9-]{1,64}$/;

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

/** 管理接口统一鉴权：ADMIN_TOKEN 未配置时整个后台禁用（宁可不可用，也不要裸奔） */
function requireAdmin(request, env) {
  const settings = getSettings(env);
  if (!settings.adminToken) {
    return json({ error: "ADMIN_TOKEN 未配置，管理接口已禁用" }, 503);
  }
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!timingSafeEqual(token, settings.adminToken)) {
    return json({ error: "unauthorized" }, 401);
  }
  return null;
}

/** 根级 /courses/… → /zh|courses/…（保留查询串，?lang=en 走英文） */
function redirectToLocalizedCourse(url) {
  const lang = url.searchParams.get("lang") === "en" ? "en" : "zh";
  const location = `/${lang}${url.pathname}${url.search}`;
  return new Response(null, { status: 302, headers: { location, "cache-control": "no-store" } });
}

/** 定长比较，避免 token 比对的时间差泄露 */
function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return diff === 0;
}

export default {
  async fetch(request, env = {}) {
    const url = new URL(request.url);

    // 根路径没有独立首页：直接送进账户页（未登录会再 302 到 /login）
    if (url.pathname === "/" && request.method === "GET") {
      return new Response(null, { status: 302, headers: { location: "/account", "cache-control": "no-store" } });
    }

    // 邮件里可能配成根级 /courses/…（没有语言前缀），而静态产物只有 /zh|en/courses/…
    // 门禁认这两种形状，但文件只存在于带前缀的目录：这里补一次重定向兜住。
    if (COURSE_PATH.test(url.pathname) && request.method === "GET") {
      return redirectToLocalizedCourse(url);
    }

    if (url.pathname === HEALTH_PATH && request.method === "GET") return handleHealth(env);
    if (url.pathname === WEBHOOK_PATH && request.method === "POST") return handleWebhook(request, env);
    if (url.pathname === RESEND_PATH && request.method === "POST") return handleResend(request, env);
    if (url.pathname === ADMIN_ORDERS_PATH && request.method === "GET") return handleAdminOrders(request, env);
    if (url.pathname === ADMIN_GRANT_PATH && request.method === "POST") return handleAdminGrant(request, env);

    // P2.2 登录、购买、账户：这些都是 Worker 自己渲染的页面，不需要静态资源。
    // 成员站正文（out-members/）在下面走门禁，见 handleMemberAsset。
    const authRoute = await handleAuthRoutes(request, env);
    if (authRoute) return authRoute;

    // 购买回路：/buy 要求登录，/checkout 由服务端创建 Stripe 会话
    if (url.pathname.startsWith("/buy/") && request.method === "GET") {
      const buyPage = await handleBuyPage(request, env);
      if (buyPage) return buyPage;
    }
    if (url.pathname === "/checkout" && request.method === "POST") {
      return handleCheckout(request, env);
    }

    if (url.pathname === "/account" && request.method === "GET") return handleAccountPage(request, env);

    // P2.3 成员站静态资源：默认拒绝，放行后才回源 out-members/。
    // wrangler.toml 必须 run_worker_first = true —— 默认 false 时 Cloudflare 会先
    // 返回静态文件、Worker 根本不执行，整套门禁等于不存在。
    if (env.ASSETS) return handleMemberAsset(request, env);

    return json({ error: "not found" }, 404);
  },
};

/**
 * Stripe 密钥模式（只用于自检，不碰密钥内容）。
 *
 * 标准密钥是 `sk_live_` / `sk_test_`，受限密钥是 `rk_live_` / `rk_test_` —— 两者都能
 * 正常调用 API，只是受限密钥的权限更窄。只认 `sk_` 会让「给 Worker 单独发一把受限
 * 密钥」的部署在 /health 里报 `unset`，看起来像没配密钥，实际是误报。
 */
function stripeModeForKey(key) {
  const value = String(key || "");
  if (/^[sr]k_live_/.test(value)) return "live";
  if (/^[sr]k_test_/.test(value)) return "test";
  return "unset";
}

function handleHealth(env) {
  return json({
    ok: true,
    service: "course-delivery",
    bindings: {
      db: Boolean(env.DB),
      webhookSecret: Boolean(env.STRIPE_WEBHOOK_SECRET),
      resend: Boolean(env.RESEND_API_KEY),
      adminToken: Boolean(env.ADMIN_TOKEN),
      supportEmail: Boolean(env.SUPPORT_EMAIL),
      deliveryMap: Boolean(env.COURSE_DELIVERY),
      sessionSecret: Boolean(env.SESSION_SECRET),
      learnUrl: Boolean(env.LEARN_URL),
      googleOauth: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
      stripeKey: Boolean(env.STRIPE_SECRET_KEY),
      // 只报模式，不报密钥：换 live 之后靠这一项自检，不用翻 wrangler 配置
      stripeMode: stripeModeForKey(env.STRIPE_SECRET_KEY),
      catalog: Boolean(env.COURSE_CATALOG),
      assets: Boolean(env.ASSETS),
      dryRun: env.EMAIL_DRY_RUN === "1",
    },
  });
}

async function handleWebhook(request, env) {
  const settings = getSettings(env);
  if (!settings.webhookSecret) {
    return json({ error: "STRIPE_WEBHOOK_SECRET 未配置，拒绝处理任何事件" }, 500);
  }

  const signature = request.headers.get("stripe-signature");
  // 必须用原始字符串验签，JSON.parse 再 stringify 会改变字节
  const rawBody = await request.text();

  const verdict = await verifyStripeSignature({
    payload: rawBody,
    header: signature,
    secret: settings.webhookSecret,
    toleranceSeconds: TOLERANCE_SECONDS,
  });
  if (!verdict.valid) {
    console.warn(`[webhook] 签名校验失败：${verdict.reason}`);
    return json({ error: "invalid signature", reason: verdict.reason }, 400);
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json({ error: "body is not valid JSON" }, 400);
  }
  if (!event?.id || !event?.type) {
    return json({ error: "missing event id or type" }, 400);
  }

  let store;
  try {
    store = createStore(env.DB);
  } catch (error) {
    console.error(`[webhook] 存储未就绪：${error.message}`);
    return json({ error: "storage unavailable" }, 500);
  }

  const receivedAt = new Date().toISOString();
  const firstDelivery = await store.markEventProcessed(event.id, event.type, receivedAt);
  if (!firstDelivery) {
    console.info(`[webhook] 重复事件，跳过：${event.id} (${event.type})`);
    return json({ received: true, duplicate: true });
  }

  const mailer = createMailer(env);

  try {
    const result = await processEvent(event, { store, mailer, env });
    console.info(
      `[webhook] ${event.type} ${event.id} → ${result.outcome}${
        result.reason ? ` (${result.reason})` : ""
      }`,
    );
    return json({ received: true, ...result });
  } catch (error) {
    const message = error?.message ?? String(error);
    console.error(`[webhook] 处理失败 ${event.id}：${message}`);
    // 撤销幂等标记，让 Stripe 的重试能重新进入处理逻辑
    await store.unmarkEvent(event.id).catch(() => {});
    return json({ error: "processing failed", message }, 500);
  }
}

async function handleResend(request, env) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;

  const settings = getSettings(env);

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "body must be JSON" }, 400);
  }

  const sessionId = typeof payload?.sessionId === "string" ? payload.sessionId.trim() : "";
  if (!sessionId) return json({ error: "missing sessionId" }, 400);

  let store;
  try {
    store = createStore(env.DB);
  } catch (error) {
    return json({ error: error.message }, 500);
  }

  const order = await store.findBySession(sessionId);
  if (!order) return json({ error: "order not found", sessionId }, 404);
  if (!order.email) return json({ error: "order has no email, deliver manually", orderId: order.id }, 409);

  // 没配交付链接也能补发：入口回退到成员站账户页（登录后即可阅读）
  const delivery = resolveEmailDelivery(env, order.course_slug, order.plan_id);

  const locale = order.locale || "en";
  const template = buildGrantEmail({
    locale,
    order: { id: order.id, formattedAmount: formatMoney(order.amount_cents, order.currency) },
    courseTitle: courseTitle({}, order.course_slug, locale),
    planLabel: planLabel(order.plan_id, locale),
    delivery,
    settings,
  });

  const mailer = createMailer(env);
  try {
    await mailer.send({
      to: order.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      // 区别于首次发送的幂等键，避免被 Resend 去重掉
      idempotencyKey: `resend/${sessionId}/${Math.floor(Date.now() / 60000)}`,
    });
  } catch (error) {
    return json({ error: "send failed", message: error?.message ?? String(error) }, 502);
  }

  await store.updateOrder(order.id, {
    email_status: "resent",
    updated_at: new Date().toISOString(),
  });

  return json({ ok: true, orderId: order.id, to: order.email });
}

/** 运营排查：按邮箱查订单与权益（付款到了但页面没课、或怀疑漏发时用） */
async function handleAdminOrders(request, env) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;

  const email = normalizeEmail(new URL(request.url).searchParams.get("email") || "");
  if (!email) return json({ error: "missing or invalid email" }, 400);

  let store;
  try {
    store = createStore(env.DB);
  } catch (error) {
    return json({ error: error.message }, 500);
  }

  const orders = await store.listOrdersByEmail(email);
  const entitlements = await store.listEntitlementsByEmail(email);
  return json({ email, orders, entitlements });
}

/**
 * 手工补权益：webhook 彻底没到、或买家换了 Google 账号时的人工出口。
 * order_id 用 manual:<uuid> 留痕，退款按订单号撤销时不会误伤人工授权。
 */
async function handleAdminGrant(request, env) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "body must be JSON" }, 400);
  }

  const email = normalizeEmail(payload?.email || "");
  const courseSlug = typeof payload?.courseSlug === "string" ? payload.courseSlug.trim() : "";
  const planId =
    typeof payload?.planId === "string" && payload.planId.trim() ? payload.planId.trim() : "manual";
  if (!email) return json({ error: "missing or invalid email" }, 400);
  if (!COURSE_SLUG.test(courseSlug)) return json({ error: "missing or invalid courseSlug" }, 400);

  let store;
  try {
    store = createStore(env.DB);
  } catch (error) {
    return json({ error: error.message }, 500);
  }

  const orderId = `manual:${crypto.randomUUID()}`;
  const grantedAt = new Date().toISOString();
  await store.grantEntitlement({
    id: crypto.randomUUID(),
    email,
    courseSlug,
    planId,
    orderId,
    grantedAt,
  });
  console.info(`[admin] 手动授权 ${email} → ${courseSlug}（${planId}，${orderId}）`);
  return json({ ok: true, email, courseSlug, planId, orderId, grantedAt });
}

/**
 * 成员站静态资源（P2.3）
 * ------------------------------------------------------------
 * 门禁在这里落地：默认拒绝 —— 未登录 → /login，已登录但无权益 → 403，
 * 只有 authorizeRequest 放行之后才向 env.ASSETS 回源。
 *
 * 顺序很重要：**先判权限、再回源**。反过来写（先取 assets 再决定要不要给）
 * 等于把正文读进了内存，后面任何一处提前 return 都会泄露。
 */
async function handleMemberAsset(request, env) {
  let store;
  try {
    store = createStore(env.DB);
  } catch (error) {
    // 查不了权益就无法证明有权限：失败必须朝「拒绝」方向倒
    console.error(`[assets] 存储未就绪，拒绝回源：${error.message}`);
    return unavailableResponse(request);
  }

  const decision = await authorizeRequest({ request, env, store });
  if (!decision.allowed) return denyAssetRequest(request, env, decision);

  return withMemberHeaders(await env.ASSETS.fetch(request));
}

function unavailableResponse(request) {
  const locale = resolveLocale(request);
  if (isHtmlRequest(request)) return htmlResponse(renderUnavailablePage({ locale }), 503);
  return json({ error: "storage unavailable" }, 503);
}

/** 未登录 / 无权益的分流响应 */
function denyAssetRequest(request, env, decision) {
  const locale = resolveLocale(request);
  const pathname = new URL(request.url).pathname;

  if (decision.needsLogin) {
    if (isHtmlRequest(request)) {
      return new Response(null, {
        status: 302,
        headers: { location: loginRedirectFor(pathname), "cache-control": "no-store" },
      });
    }
    // RSC / JSON / .txt 这类请求不跳登录页，直接告诉调用方未登录
    return json({ error: "login required", login: `/login?next=${encodeURIComponent(pathname)}` }, 401);
  }

  const courseTitle = decision.courseSlug
    ? displayCourseName(decision.courseSlug, locale, env)
    : "";

  if (isHtmlRequest(request)) {
    return htmlResponse(renderDeniedPage({ locale, courseTitle }), 403);
  }
  return json({ error: "forbidden", reason: decision.reason ?? "no_entitlement" }, 403);
}

function htmlResponse(html, status = 200) {
  return new Response(html, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}

/**
 * 成员站的所有响应都不许被索引、不许被缓存：
 * 同一个 URL 对不同用户返回不同正文，被 CDN 或浏览器缓存就会串号。
 */
function withMemberHeaders(response) {
  if (response.status === 204 || response.status === 304) return response;

  const headers = new Headers(response.headers);
  headers.set("x-robots-tag", "noindex, nofollow");
  headers.set("cache-control", "no-store");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
