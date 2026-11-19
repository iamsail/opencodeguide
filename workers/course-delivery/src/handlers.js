/**
 * 事件处理：付款成功 → 落单 → 发开通信；退款 → 改状态 → 发通知。
 *
 * 依赖通过 deps 注入（store / mailer / env），因此可以脱离 D1 和
 * Resend 在 `node --test` 里跑完整逻辑（见 test/handlers.test.js）。
 *
 * 错误处理约定：
 *   - 基础设施错误（D1 写失败）向上抛 → 由 index.js 返回 500，让 Stripe 重试；
 *   - 业务不完整（没邮箱、识别不出课程、交付物没配）不抛错 → 记 needs_manual_delivery
 *     并发运营告警，因为重试一万次也不会自动变好；
 *   - 邮件发送失败不抛错 → 订单已落库，用 /admin/resend 补发。
 */

import {
  formatMoney,
  getSettings,
  planLabel,
  courseTitle,
  resolveDelivery,
  resolveLocale,
  resolvePurchase,
} from "./config.js";
import { buildGrantEmail, buildOpsAlert, buildRefundEmail } from "./templates.js";
import { grantEntitlements, normalizeEmail, revokeEntitlements } from "./entitlements.js";

const DELIVERABLE_EVENTS = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
]);

function idOf(value) {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && typeof value.id === "string") return value.id;
  return null;
}

async function notifyOps(mailer, settings, { title, lines }, logger) {
  if (!settings.supportEmail) {
    logger.warn(`[ops-alert] SUPPORT_EMAIL 未配置，告警仅打日志：${title}`);
    logger.warn(`[ops-alert] ${lines.join(" | ")}`);
    return;
  }
  const alert = buildOpsAlert({ subject: title, lines });
  try {
    await mailer.send({ to: settings.supportEmail, ...alert });
  } catch (error) {
    logger.error(`[ops-alert] 告警邮件发送失败：${error?.message ?? error}`);
  }
}

/**
 * @param {object} event Stripe 事件（已通过签名校验）
 * @param {object} deps  { store, mailer, env, logger?, now?, idFactory? }
 * @returns {Promise<{outcome: string, orderId?: string, reason?: string}>}
 */
export async function processEvent(event, deps) {
  const {
    store,
    mailer,
    env = {},
    logger = console,
    now = () => new Date(),
    idFactory = () => crypto.randomUUID(),
  } = deps;

  const settings = getSettings(env);
  const context = { store, mailer, env, logger, now, idFactory, settings };

  if (DELIVERABLE_EVENTS.has(event?.type)) return onCheckoutCompleted(event, context);
  if (event?.type === "checkout.session.async_payment_failed") {
    return { outcome: "ignored", reason: "async payment failed, no delivery" };
  }
  if (event?.type === "charge.refunded") return onRefund(event, context);
  if (event?.type === "charge.dispute.created") return onDispute(event, context);

  return { outcome: "ignored", reason: `unhandled event type: ${event?.type}` };
}

async function onCheckoutCompleted(event, context) {
  const { store, mailer, settings, logger, now, idFactory, env } = context;
  const session = event?.data?.object ?? {};

  if (session.mode && session.mode !== "payment") {
    return { outcome: "ignored", reason: `not a one-off payment (mode=${session.mode})` };
  }

  const paid =
    session.payment_status === "paid" || session.payment_status === "no_payment_required";
  if (!paid) {
    return { outcome: "ignored", reason: `payment not settled (payment_status=${session.payment_status})` };
  }

  // 服务端创建的 Checkout Session 会把「登录邮箱」写进 metadata，优先用它：
  // 这样权益归属与登录身份始终一致，不受买家在 Stripe 页面改动的影响。
  const email =
    normalizeEmail(session.metadata?.email) ||
    normalizeEmail(session.customer_details?.email || session.customer_email);
  const { courseSlug, planId } = resolvePurchase(session);
  const locale = resolveLocale(session);
  const timestamp = new Date(now()).toISOString();

  if (!session.id) {
    throw new Error("checkout.session.completed 缺少 session.id，无法幂等");
  }

  const orderId = idFactory();
  const delivery = courseSlug && planId ? resolveDelivery(context.env, courseSlug, planId) : null;

  let deliveryNote = null;
  if (!email) deliveryNote = "missing_customer_email";
  else if (!courseSlug || !planId) deliveryNote = "unresolved_course_reference";
  else if (!delivery?.complete) deliveryNote = "delivery_links_not_configured";

  const inserted = await store.insertOrder({
    id: orderId,
    stripeSessionId: session.id,
    stripePaymentIntent: idOf(session.payment_intent),
    email: email || "",
    locale,
    courseSlug: courseSlug || "",
    planId: planId || "",
    amountCents: Number(session.amount_total ?? 0),
    currency: session.currency || "usd",
    status: "paid",
    emailStatus: deliveryNote ? "needs_manual_delivery" : "pending",
    deliveryNote,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  if (!inserted) {
    // session 已处理过：可能是同一笔付款的重复事件，直接跳过，避免重复发信。
    // 但上一轮可能「订单落库成功、写权益失败」（D1 抖动时 Stripe 会重投），
    // 这里就是唯一的补偿点：补一次幂等授权再返回。
    const existing = await store.findBySession(session.id);
    if (existing && !existing.revoked_at) {
      await grantEntitlements({ store, order: existing, env, logger, now });
    }
    return { outcome: "duplicate", reason: `session ${session.id} already recorded` };
  }

  // 权益先写：邮件发不出去可以补发，但「已付款却没有阅读权」必须让 Stripe 重试
  //（这里的异常会冒泡到 index.js，返回 500 并撤销幂等标记）。
  const entitlement = await grantEntitlements({
    store,
    order: { id: orderId, email, course_slug: courseSlug, plan_id: planId },
    env,
    logger,
    now,
  });

  if (deliveryNote) {
    const lines = [
      `订单：${session.id}`,
      `邮箱：${email || "（Stripe 未返回邮箱）"}`,
      `课程：${courseSlug || "（无法识别）"} · ${planId || "（无法识别）"}`,
      `金额：${formatMoney(session.amount_total, session.currency)}`,
      `原因：${deliveryNote}`,
    ];
    if (delivery?.configError) lines.push(`配置错误：${delivery.configError}`);
    await notifyOps(
      mailer,
      settings,
      { title: "有订单需要人工交付", lines },
      logger,
    );
    return {
      outcome: "needs_manual_delivery",
      orderId,
      reason: deliveryNote,
      entitlements: entitlement.granted.length,
    };
  }

  const title = courseTitle(session, courseSlug, locale);
  const template = buildGrantEmail({
    locale,
    order: {
      id: orderId,
      formattedAmount: formatMoney(session.amount_total, session.currency),
    },
    courseTitle: title,
    planLabel: planLabel(planId, locale),
    delivery,
    settings,
  });

  try {
    await mailer.send({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      idempotencyKey: `grant/${session.id}`,
    });
    await store.updateOrder(orderId, { emailStatus: "sent", updatedAt: timestamp });
    return { outcome: "granted", orderId, entitlements: entitlement.granted.length };
  } catch (error) {
    const message = error?.message ?? String(error);
    await store.updateOrder(orderId, {
      emailStatus: "failed",
      delivery_note: `email_failed: ${message}`.slice(0, 500),
      updatedAt: timestamp,
    });
    await notifyOps(
      mailer,
      settings,
      {
        title: "开通邮件发送失败，需要补发",
        lines: [
          `订单：${orderId}`,
          `session：${session.id}`,
          `邮箱：${email}`,
          `错误：${message}`,
          "补发：POST /admin/resend { sessionId }",
        ],
      },
      logger,
    );
    return { outcome: "email_failed", orderId, reason: message, entitlements: entitlement.granted.length };
  }
}

async function onRefund(event, context) {
  const { store, mailer, settings, logger, now } = context;
  const charge = event?.data?.object ?? {};
  const paymentIntent = idOf(charge.payment_intent);

  if (!paymentIntent) {
    return { outcome: "ignored", reason: "charge.refunded without payment_intent" };
  }

  const order = await store.findByPaymentIntent(paymentIntent);
  if (!order) {
    await notifyOps(
      mailer,
      settings,
      {
        title: "退款找不到对应订单",
        lines: [
          `payment_intent：${paymentIntent}`,
          `退款金额：${formatMoney(charge.amount_refunded, charge.currency)}`,
          "可能是在 Stripe 后台手动退的款，或订单表缺记录",
        ],
      },
      logger,
    );
    return { outcome: "unmatched", reason: `no order for payment_intent ${paymentIntent}` };
  }

  const refunded = Number(charge.amount_refunded ?? 0);
  const total = Number(charge.amount ?? order.amount_cents ?? 0);
  const full = total > 0 && refunded >= total;
  const timestamp = new Date(now()).toISOString();

  await store.updateOrder(order.id, {
    status: full ? "refunded" : "partially_refunded",
    refunded_at: timestamp,
    ...(full ? { revoked_at: timestamp } : {}),
    updated_at: timestamp,
  });

  // 订单上的 revoked_at 只是给人看的标记；真正的门禁查 entitlements，所以必须同步回收。
  // 部分退款保留访问（与既有「部分退款不回收」策略一致）。
  let entitlementsRevoked = 0;
  if (full) {
    const revoked = await revokeEntitlements({ store, order, now });
    entitlementsRevoked = revoked.revoked;
  }

  if (order.email) {
    const template = buildRefundEmail({
      locale: order.locale || "en",
      order: {
        id: order.id,
        formattedAmount: formatMoney(refunded, charge.currency || order.currency),
      },
      courseTitle: courseTitle({}, order.course_slug, order.locale || "en"),
      planLabel: planLabel(order.plan_id, order.locale || "en"),
      settings,
      partial: !full,
    });
    try {
      await mailer.send({
        to: order.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
    } catch (error) {
      logger.error(`[refund] 退款通知发送失败（订单 ${order.id}）：${error?.message ?? error}`);
    }
  }

  return {
    outcome: full ? "refunded" : "partially_refunded",
    orderId: order.id,
    entitlementsRevoked,
  };
}

async function onDispute(event, context) {
  const { store, mailer, settings, logger, now } = context;
  const dispute = event?.data?.object ?? {};
  const paymentIntent = idOf(dispute.payment_intent);

  if (!paymentIntent) {
    return { outcome: "ignored", reason: "dispute without payment_intent" };
  }

  const order = await store.findByPaymentIntent(paymentIntent);
  if (!order) {
    await notifyOps(
      mailer,
      settings,
      {
        title: "拒付（dispute）找不到对应订单",
        lines: [`payment_intent：${paymentIntent}`, `金额：${formatMoney(dispute.amount, dispute.currency)}`],
      },
      logger,
    );
    return { outcome: "unmatched", reason: `no order for payment_intent ${paymentIntent}` };
  }

  const timestamp = new Date(now()).toISOString();
  await store.updateOrder(order.id, { status: "disputed", updated_at: timestamp });

  // 拒付意味着钱可能被撤回，但客户也可能申诉成功：默认只标记 + 告警，
  // 需要「立刻断访问」时把 REVOKE_ON_DISPUTE 设为 1。
  let entitlementsRevoked = 0;
  if (settings.revokeOnDispute) {
    const revoked = await revokeEntitlements({ store, order, now });
    entitlementsRevoked = revoked.revoked;
  }

  await notifyOps(
    mailer,
    settings,
    {
      title: "收到拒付，需要举证",
      lines: [
        `订单：${order.id}`,
        `邮箱：${order.email || "（无）"}`,
        `课程：${order.course_slug} · ${order.plan_id}`,
        "举证材料：本 Worker 的订单表记录 + 开通邮件发送记录（Resend 后台）",
        "Stripe 举证期限通常为 7–21 天，尽早处理",
      ],
    },
    logger,
  );

  return { outcome: "disputed", orderId: order.id, entitlementsRevoked };
}
