/**
 * 付款会话对账：让「付完立刻可见」不依赖 webhook 的到达时间。
 *
 * 这里只测 reconcileCheckoutSession 的决策，Stripe 用 fetch 替身模拟。
 */

import assert from "node:assert/strict";
import test from "node:test";

import { reconcileCheckoutSession } from "../src/reconcile.js";
import { createStore } from "../src/store.js";
import { createFakeD1, createFakeMailer, createTestEnv } from "./fakes.js";

const silentLogger = { info() {}, warn() {}, error() {} };

function paidSession(overrides = {}) {
  return {
    id: "cs_test_reconcile",
    object: "checkout.session",
    mode: "payment",
    payment_status: "paid",
    amount_total: 7900,
    currency: "usd",
    locale: "zh",
    payment_intent: "pi_reconcile",
    customer_details: { email: "buyer@example.com" },
    metadata: {
      email: "buyer@example.com",
      course_slug: "ai-coding-workflow",
      plan_id: "single",
    },
    ...overrides,
  };
}

function setup({ session = paidSession(), status = 200 } = {}) {
  const db = createFakeD1();
  const store = createStore(db);
  const mailer = createFakeMailer();
  const env = createTestEnv({ db, overrides: { STRIPE_SECRET_KEY: "sk_test_fake" } });
  const calls = [];
  const original = globalThis.fetch;

  globalThis.fetch = async (url) => {
    calls.push(String(url));
    if (status >= 400) {
      return new Response(JSON.stringify({ error: { message: "boom" } }), { status });
    }
    return new Response(JSON.stringify(session), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  return {
    db,
    store,
    mailer,
    env,
    calls,
    run: (params = {}) =>
      reconcileCheckoutSession({
        sessionId: "cs_test_reconcile",
        email: "buyer@example.com",
        env,
        store,
        mailer,
        logger: silentLogger,
        ...params,
      }),
    restore: () => {
      globalThis.fetch = original;
    },
  };
}

async function seedOrder(store, { revokedAt = null } = {}) {
  const at = new Date().toISOString();
  await store.insertOrder({
    id: "ord_seed",
    stripeSessionId: "cs_test_reconcile",
    stripePaymentIntent: "pi_reconcile",
    email: "buyer@example.com",
    locale: "zh",
    courseSlug: "ai-coding-workflow",
    planId: "single",
    amountCents: 7900,
    currency: "usd",
    status: "paid",
    emailStatus: "sent",
    deliveryNote: null,
    createdAt: at,
    updatedAt: at,
  });
  if (revokedAt) await store.updateOrder("ord_seed", { revoked_at: revokedAt });
}

test("已付清且邮箱匹配：补写订单与权益", async () => {
  const ctx = setup();
  try {
    const result = await ctx.run();

    assert.equal(result.status, "granted");
    assert.equal(ctx.db._orders.size, 1);
    assert.equal(ctx.db._entitlements.size, 1);
    assert.equal(
      ctx.db._entitlements.get("buyer@example.com\u0000ai-coding-workflow").plan_id,
      "single",
    );
    assert.ok(ctx.calls[0].endsWith("/v1/checkout/sessions/cs_test_reconcile"));
  } finally {
    ctx.restore();
  }
});

test("重复刷新：只落一单、只发一封信，第二次返回 already", async () => {
  const ctx = setup();
  try {
    const first = await ctx.run();
    const second = await ctx.run();

    assert.equal(first.status, "granted");
    assert.equal(second.status, "already");
    assert.equal(ctx.db._orders.size, 1);
    assert.equal(ctx.mailer.sent.length, 1);
  } finally {
    ctx.restore();
  }
});

test("未结清（如银行转账）：不写权益", async () => {
  const ctx = setup({ session: paidSession({ payment_status: "unpaid" }) });
  try {
    const result = await ctx.run();

    assert.equal(result.status, "unpaid");
    assert.equal(ctx.db._orders.size, 0);
    assert.equal(ctx.db._entitlements.size, 0);
  } finally {
    ctx.restore();
  }
});

test("别人的会话：不认领、不写权益", async () => {
  const ctx = setup({
    session: paidSession({
      metadata: {
        email: "other@example.com",
        course_slug: "ai-coding-workflow",
        plan_id: "single",
      },
    }),
  });
  try {
    const result = await ctx.run();

    assert.equal(result.status, "foreign");
    assert.equal(ctx.db._orders.size, 0);
    assert.equal(ctx.db._entitlements.size, 0);
  } finally {
    ctx.restore();
  }
});

test("session_id 形状不对：直接拒绝，不打 Stripe 接口", async () => {
  const ctx = setup();
  try {
    const result = await ctx.run({ sessionId: "../../v1/customers" });

    assert.equal(result.status, "invalid");
    assert.equal(ctx.calls.length, 0);
  } finally {
    ctx.restore();
  }
});

test("Stripe 接口失败：降级成 error，不抛异常、不写库", async () => {
  const ctx = setup({ status: 500 });
  try {
    const result = await ctx.run();

    assert.equal(result.status, "error");
    assert.equal(result.reason, "stripe_unavailable");
    assert.equal(ctx.db._orders.size, 0);
  } finally {
    ctx.restore();
  }
});

test("已退款订单：返回 refunded，不复活权益", async () => {
  const ctx = setup();
  try {
    await seedOrder(ctx.store, { revokedAt: new Date().toISOString() });
    const result = await ctx.run();

    assert.equal(result.status, "refunded");
    assert.equal(ctx.db._entitlements.size, 0);
  } finally {
    ctx.restore();
  }
});

test("订单在但权益缺失（上一轮 D1 抖动）：对账时补权益，不重发邮件", async () => {
  const ctx = setup();
  try {
    await seedOrder(ctx.store);
    const result = await ctx.run();

    assert.equal(result.status, "already");
    assert.equal(ctx.db._entitlements.size, 1, "重复分支应补写遗漏的权益");
    assert.equal(ctx.mailer.sent.length, 0, "订单已存在，不该再发开通邮件");
  } finally {
    ctx.restore();
  }
});

test("没配 STRIPE_SECRET_KEY：返回 error 而不是崩", async () => {
  const ctx = setup();
  try {
    const result = await ctx.run({ env: { ...ctx.env, STRIPE_SECRET_KEY: "" } });

    assert.equal(result.status, "error");
    assert.equal(result.reason, "stripe_key_missing");
    assert.equal(ctx.calls.length, 0);
  } finally {
    ctx.restore();
  }
});
