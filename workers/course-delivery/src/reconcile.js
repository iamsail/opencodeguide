/**
 * 付款会话对账（让「付完立刻可见」成立）
 * ------------------------------------------------------------
 * 权益由异步 webhook 写入，而 Stripe 付完就把人送回 /account。两者之间有
 * 几百毫秒到几十秒的空窗，用户在这个窗口里看到的会是「还没有课程」——
 * 最容易让人以为支付失败的时刻。
 *
 * 所以 success_url 里带上 {CHECKOUT_SESSION_ID}，账户页渲染前主动向 Stripe
 * 取一次会话：已付清、且会话里登记的邮箱就是当前登录邮箱时，走与 webhook
 * 完全相同的 processEvent 路径补齐订单与权益（insertOrder 幂等，两个标签页
 * 同时刷新也只会落一单、发一封信）。
 *
 * 这里不做任何信任推断：只认 metadata.email 与登录邮箱相等的会话。
 */

import { getSettings } from "./config.js";
import { createMailer } from "./email.js";
import { normalizeEmail } from "./entitlements.js";
import { processEvent } from "./handlers.js";
import { createStripeClient } from "./stripe-api.js";

/** cs_test_a1B2… 这种形状；限制长度和字符集，避免把用户输入拼进请求路径 */
const SESSION_ID_PATTERN = /^cs_[A-Za-z0-9_]{1,255}$/;

/**
 * @param {{ sessionId?: string, email?: string, env?: object, store: object, mailer?: object, logger?: object }} params
 * @returns {Promise<{ status: string, orderId?: string, outcome?: string, reason?: string }>}
 *   status: invalid | error | unpaid | foreign | refunded | already | granted
 */
export async function reconcileCheckoutSession({
  sessionId,
  email,
  env = {},
  store,
  mailer,
  logger = console,
} = {}) {
  const id = typeof sessionId === "string" ? sessionId.trim() : "";
  const owner = normalizeEmail(email);
  if (!SESSION_ID_PATTERN.test(id) || !owner || !store) return { status: "invalid" };

  const settings = getSettings(env);
  if (!settings.stripeSecretKey) return { status: "error", reason: "stripe_key_missing" };

  let session;
  try {
    const stripe = createStripeClient({ secretKey: settings.stripeSecretKey });
    session = await stripe.retrieveCheckoutSession(id);
  } catch (error) {
    logger.error?.(`[reconcile] 取会话失败 ${id}：${error?.message ?? error}`);
    return { status: "error", reason: "stripe_unavailable" };
  }

  const paid =
    session?.payment_status === "paid" || session?.payment_status === "no_payment_required";
  if (!paid) return { status: "unpaid" };

  // 只允许「会话里登记的登录邮箱」认领：拿别人的 session_id 过来，
  // 既不该给他权益，也不该让我们替他触发一次授权
  if (normalizeEmail(session?.metadata?.email) !== owner) {
    logger.warn?.(`[reconcile] 会话 ${id} 的邮箱与当前登录账号不一致，忽略`);
    return { status: "foreign" };
  }

  const existing = await store.findBySession(id);
  if (existing?.revoked_at) return { status: "refunded", orderId: existing.id };

  try {
    const result = await processEvent(
      {
        // 事件 id 只用于日志语义：真正的幂等由 orders 的 unique(session_id) 保证
        id: `reconcile:${id}`,
        type: "checkout.session.completed",
        data: { object: session },
      },
      { store, mailer: mailer ?? createMailer(env, { logger }), env, logger },
    );
    return {
      status: result?.outcome === "duplicate" ? "already" : "granted",
      outcome: result?.outcome,
      orderId: result?.orderId,
    };
  } catch (error) {
    logger.error?.(`[reconcile] 补写订单/权益失败 ${id}：${error?.message ?? error}`);
    return { status: "error", reason: "store_unavailable" };
  }
}
