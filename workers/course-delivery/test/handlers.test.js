import assert from "node:assert/strict";
import test from "node:test";

import { processEvent } from "../src/handlers.js";
import { createStore } from "../src/store.js";
import { checkoutEvent, createFakeD1, createFakeMailer, createTestEnv, refundEvent } from "./fakes.js";

function setup({ envOverrides = {}, mailerOptions } = {}) {
  const db = createFakeD1();
  const store = createStore(db);
  const mailer = createFakeMailer(mailerOptions);
  const env = createTestEnv({ db, overrides: envOverrides });
  return { db, store, mailer, env, deps: { store, mailer, env } };
}

test("付款成功：落单并发送含观看链接的开通邮件", async () => {
  const { db, mailer, deps } = setup();

  const result = await processEvent(checkoutEvent(), deps);

  assert.equal(result.outcome, "granted");
  assert.equal(mailer.sent.length, 1);

  const mail = mailer.sent[0];
  assert.equal(mail.to, "buyer@example.com");
  assert.match(mail.subject, /AI Coding Workflow|已开通/);
  assert.match(mail.html, /https:\/\/stream\.example\.com\/ai-coding/);
  assert.match(mail.html, /github\.com\/example\/course\/invitations/);

  const order = [...db._orders.values()][0];
  assert.equal(order.status, "paid");
  assert.equal(order.email_status, "sent");
  assert.equal(order.amount_cents, 7900);
  assert.equal(order.course_slug, "ai-coding-workflow");
  assert.equal(order.plan_id, "single");
});

test("同一 session 的第二次事件不会重复发货", async () => {
  const { mailer, deps } = setup();

  const first = await processEvent(checkoutEvent(), deps);
  const second = await processEvent(
    checkoutEvent({ sessionId: "cs_test_123" }, "evt_checkout_2"),
    deps,
  );

  assert.equal(first.outcome, "granted");
  assert.equal(second.outcome, "duplicate");
  assert.equal(mailer.sent.length, 1);
});

test("client_reference_id 缺失时回退到 Payment Link metadata", async () => {
  const { mailer, deps } = setup();

  const event = checkoutEvent({
    reference: null,
    metadata: { course_slug: "ai-coding-workflow", plan_id: "pro" },
  });
  const result = await processEvent(event, deps);

  assert.equal(result.outcome, "granted");
  assert.match(mailer.sent[0].html, /Pro/);
});

test("没有邮箱：不发信，记录 needs_manual_delivery 并告警运营", async () => {
  const { db, mailer, deps } = setup();

  const event = checkoutEvent({ email: null });
  const result = await processEvent(event, deps);

  assert.equal(result.outcome, "needs_manual_delivery");
  assert.equal(result.reason, "missing_customer_email");
  // 唯一一封邮件是给运营的告警，不是给买家的
  assert.equal(mailer.sent.length, 1);
  assert.equal(mailer.sent[0].to, "ops@example.com");

  const order = [...db._orders.values()][0];
  assert.equal(order.email_status, "needs_manual_delivery");
  assert.equal(order.delivery_note, "missing_customer_email");
});

test("交付链接没配置：不发给买家，改为告警运营", async () => {
  const { mailer, deps } = setup({ envOverrides: { COURSE_DELIVERY: "{}" } });

  const result = await processEvent(checkoutEvent(), deps);

  assert.equal(result.outcome, "needs_manual_delivery");
  assert.equal(result.reason, "delivery_links_not_configured");
  assert.equal(mailer.sent[0].to, "ops@example.com");
  assert.match(mailer.sent[0].text, /delivery_links_not_configured/);
});

test("COURSE_DELIVERY 不是合法 JSON 时给出配置错误提示", async () => {
  const { mailer, deps } = setup({ envOverrides: { COURSE_DELIVERY: "{not json" } });

  const result = await processEvent(checkoutEvent(), deps);

  assert.equal(result.outcome, "needs_manual_delivery");
  assert.match(mailer.sent[0].text, /不是合法 JSON/);
});

test("邮件服务挂掉：订单仍落库，标记失败并告警，不抛错", async () => {
  const { db, mailer, deps } = setup({
    mailerOptions: {
      onSend: (message) => {
        if (message.to === "buyer@example.com") throw new Error("resend 502");
      },
    },
  });

  const result = await processEvent(checkoutEvent(), deps);

  assert.equal(result.outcome, "email_failed");
  const order = [...db._orders.values()][0];
  assert.equal(order.status, "paid");
  assert.equal(order.email_status, "failed");
  assert.match(order.delivery_note, /email_failed/);
  assert.equal(mailer.sent[0].to, "ops@example.com");
});

test("未付清（async 待支付）不发货", async () => {
  const { mailer, deps } = setup();

  const result = await processEvent(checkoutEvent({ paymentStatus: "unpaid" }), deps);

  assert.equal(result.outcome, "ignored");
  assert.equal(mailer.sent.length, 0);
});

test("订阅模式事件被忽略（P3 之前不处理）", async () => {
  const { deps } = setup();
  const result = await processEvent(checkoutEvent({ mode: "subscription" }), deps);
  assert.equal(result.outcome, "ignored");
});

test("全额退款：状态变 refunded、权益回收、发退款通知", async () => {
  const { db, mailer, deps } = setup();
  await processEvent(checkoutEvent(), deps);
  mailer.sent.length = 0;

  const result = await processEvent(refundEvent(), deps);

  assert.equal(result.outcome, "refunded");
  const order = [...db._orders.values()][0];
  assert.equal(order.status, "refunded");
  assert.ok(order.revoked_at, "应记录权益回收时间");
  assert.equal(mailer.sent.length, 1);
  assert.equal(mailer.sent[0].to, "buyer@example.com");
  assert.match(mailer.sent[0].text, /退款/);
});

test("部分退款：状态 partial，不回收权益", async () => {
  const { db, deps } = setup();
  await processEvent(checkoutEvent({ amount: 14900 }), deps);

  const result = await processEvent(
    refundEvent({ amount: 14900, amountRefunded: 5000 }),
    deps,
  );

  assert.equal(result.outcome, "partially_refunded");
  const order = [...db._orders.values()][0];
  assert.equal(order.status, "partially_refunded");
  assert.equal(order.revoked_at, null);
});

test("找不到订单的退款：告警运营而不是静默丢弃", async () => {
  const { mailer, deps } = setup();

  const result = await processEvent(refundEvent({ paymentIntent: "pi_unknown" }), deps);

  assert.equal(result.outcome, "unmatched");
  assert.equal(mailer.sent[0].to, "ops@example.com");
  assert.match(mailer.sent[0].subject, /退款找不到对应订单/);
});

test("拒付：状态变 disputed 并提示举证", async () => {
  const { db, mailer, deps } = setup();
  await processEvent(checkoutEvent(), deps);
  mailer.sent.length = 0;

  const result = await processEvent(
    {
      id: "evt_dispute_1",
      type: "charge.dispute.created",
      data: {
        object: { id: "dp_1", payment_intent: "pi_test_123", amount: 7900, currency: "usd" },
      },
    },
    deps,
  );

  assert.equal(result.outcome, "disputed");
  assert.equal([...db._orders.values()][0].status, "disputed");
  assert.match(mailer.sent[0].text, /举证/);
});

test("未知事件类型安全忽略", async () => {
  const { deps } = setup();
  const result = await processEvent({ id: "evt_x", type: "customer.created" }, deps);
  assert.equal(result.outcome, "ignored");
});

/* ------------------------------------------------------------------ */
/* P2.1 权益：付款写入、退款回收、拒付策略                              */
/* ------------------------------------------------------------------ */

test("付款成功即写入权益（单课一条，含规范化邮箱）", async () => {
  const { db, deps } = setup();

  const result = await processEvent(checkoutEvent({ email: "Buyer@Example.COM " }), deps);

  assert.equal(result.outcome, "granted");
  assert.equal(result.entitlements, 1);
  assert.equal(db._entitlements.size, 1);

  const row = [...db._entitlements.values()][0];
  assert.equal(row.email, "buyer@example.com");
  assert.equal(row.course_slug, "ai-coding-workflow");
  assert.equal(row.plan_id, "single");
  assert.equal(row.revoked_at, null);
});

test("全站通展开成 4 门课 + bundle 自身", async () => {
  const { db, deps } = setup({
    envOverrides: {
      COURSE_DELIVERY: JSON.stringify({ "all-access:*": { watch: "https://learn.example.com" } }),
    },
  });

  const result = await processEvent(
    checkoutEvent({
      reference: "all-access:all-access",
      metadata: { course_slug: "all-access", plan_id: "all-access" },
      amount: 19900,
    }),
    deps,
  );

  assert.equal(result.outcome, "granted");
  assert.equal(result.entitlements, 5);

  const slugs = [...db._entitlements.values()].map((row) => row.course_slug).sort();
  assert.deepEqual(slugs, [
    "ai-coding-workflow",
    "all-access",
    "cross-border-store",
    "global-site-seo",
    "indie-saas-launch",
  ]);
});

test("重复事件不会重复写权益", async () => {
  const { db, deps } = setup();

  await processEvent(checkoutEvent(), deps);
  await processEvent(checkoutEvent({ sessionId: "cs_test_123" }, "evt_checkout_2"), deps);

  assert.equal(db._entitlements.size, 1);
});

test("全额退款：权益被回收（revoked_at 非空）", async () => {
  const { db, deps } = setup();
  await processEvent(checkoutEvent(), deps);

  const result = await processEvent(refundEvent(), deps);

  assert.equal(result.outcome, "refunded");
  assert.equal(result.entitlementsRevoked, 1);
  const row = [...db._entitlements.values()][0];
  assert.ok(row.revoked_at, "权益应记录 revoked_at");
});

test("部分退款：权益保留", async () => {
  const { db, deps } = setup();
  await processEvent(checkoutEvent({ amount: 14900 }), deps);

  const result = await processEvent(refundEvent({ amount: 14900, amountRefunded: 5000 }), deps);

  assert.equal(result.outcome, "partially_refunded");
  assert.equal(result.entitlementsRevoked, 0);
  assert.equal([...db._entitlements.values()][0].revoked_at, null);
});

test("拒付：默认保留权益（只标记 disputed 并告警）", async () => {
  const { db, deps } = setup();
  await processEvent(checkoutEvent(), deps);

  const result = await processEvent(
    {
      id: "evt_dispute_keep",
      type: "charge.dispute.created",
      data: { object: { id: "dp_keep", payment_intent: "pi_test_123", amount: 7900, currency: "usd" } },
    },
    deps,
  );

  assert.equal(result.outcome, "disputed");
  assert.equal(result.entitlementsRevoked, 0);
  assert.equal([...db._entitlements.values()][0].revoked_at, null);
});

test("拒付：REVOKE_ON_DISPUTE=1 时立刻回收权益", async () => {
  const { db, deps } = setup({ envOverrides: { REVOKE_ON_DISPUTE: "1" } });
  await processEvent(checkoutEvent(), deps);

  const result = await processEvent(
    {
      id: "evt_dispute_revoke",
      type: "charge.dispute.created",
      data: { object: { id: "dp_revoke", payment_intent: "pi_test_123", amount: 7900, currency: "usd" } },
    },
    deps,
  );

  assert.equal(result.outcome, "disputed");
  assert.equal(result.entitlementsRevoked, 1);
  assert.ok([...db._entitlements.values()][0].revoked_at);
});

test("订单落库成功但写权益失败：事件重投时补齐权益，且不重复发信", async () => {
  const { db, store, mailer, deps } = setup();
  let failuresLeft = 1;
  const flakyStore = {
    ...store,
    async grantEntitlement(ent) {
      if (failuresLeft > 0) {
        failuresLeft -= 1;
        throw new Error("D1 write failed");
      }
      return store.grantEntitlement(ent);
    },
  };

  await assert.rejects(
    processEvent(checkoutEvent(), { ...deps, store: flakyStore }),
    /D1 write failed/,
  );
  assert.equal(db._entitlements.size, 0, "第一次写入失败，不应留下权益");
  assert.equal(db._orders.size, 1, "订单已经落库，重投时应能补权益");

  const retry = await processEvent(
    checkoutEvent({ sessionId: "cs_test_123" }, "evt_checkout_retry"),
    deps,
  );

  assert.equal(retry.outcome, "duplicate");
  assert.equal(db._entitlements.size, 1);
  assert.equal(
    mailer.sent.filter((mail) => mail.to === "buyer@example.com").length,
    0,
    "重投不应重发开通邮件",
  );
});
