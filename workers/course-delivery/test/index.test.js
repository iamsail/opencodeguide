import assert from "node:assert/strict";
import test from "node:test";

import worker from "../src/index.js";
import { signPayload } from "../src/stripe.js";
import { checkoutEvent, createFakeD1, createTestEnv } from "./fakes.js";

const SECRET = "whsec_test";

async function postWebhook(env, event, { secret = SECRET, header } = {}) {
  const body = JSON.stringify(event);
  const signature = header ?? (await signPayload({ payload: body, secret }));
  return worker.fetch(
    new Request("https://worker.test/stripe/webhook", {
      method: "POST",
      headers: { "content-type": "application/json", "stripe-signature": signature },
      body,
    }),
    env,
  );
}

test("合法事件：200 且 outcome=granted", async () => {
  const db = createFakeD1();
  const env = createTestEnv({ db });

  const response = await postWebhook(env, checkoutEvent());
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.received, true);
  assert.equal(payload.outcome, "granted");
  assert.equal(db._orders.size, 1);
});

test("签名错误：400 且不落单", async () => {
  const db = createFakeD1();
  const env = createTestEnv({ db });

  const response = await postWebhook(env, checkoutEvent(), { secret: "whsec_wrong" });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.error, "invalid signature");
  assert.equal(db._orders.size, 0);
});

test("缺少签名头：400", async () => {
  const db = createFakeD1();
  const env = createTestEnv({ db });
  const response = await worker.fetch(
    new Request("https://worker.test/stripe/webhook", {
      method: "POST",
      body: JSON.stringify(checkoutEvent()),
    }),
    env,
  );
  assert.equal(response.status, 400);
});

test("重复投递同一 event.id：第二次返回 duplicate", async () => {
  const db = createFakeD1();
  const env = createTestEnv({ db });
  const event = checkoutEvent();

  const first = await (await postWebhook(env, event)).json();
  const second = await (await postWebhook(env, event)).json();

  assert.equal(first.outcome, "granted");
  assert.equal(second.duplicate, true);
  assert.equal(db._orders.size, 1);
});

test("未配置 webhook secret：500 而不是放行", async () => {
  const db = createFakeD1();
  const env = createTestEnv({ db, overrides: { STRIPE_WEBHOOK_SECRET: "" } });

  const response = await postWebhook(env, checkoutEvent());
  assert.equal(response.status, 500);
  assert.equal(db._orders.size, 0);
});

test("body 不是 JSON：400", async () => {
  const db = createFakeD1();
  const env = createTestEnv({ db });
  const body = "not-json";
  const signature = await signPayload({ payload: body, secret: SECRET });

  const response = await worker.fetch(
    new Request("https://worker.test/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": signature },
      body,
    }),
    env,
  );
  assert.equal(response.status, 400);
});

test("/health 只暴露布尔开关，不泄露密钥", async () => {
  const db = createFakeD1();
  const env = createTestEnv({ db });

  const response = await worker.fetch(new Request("https://worker.test/health"), env);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.bindings.db, true);
  assert.equal(payload.bindings.webhookSecret, true);
  const text = JSON.stringify(payload);
  assert.ok(!text.includes(env.STRIPE_WEBHOOK_SECRET));
  assert.ok(!text.includes(env.RESEND_API_KEY));
});

test("未知路由：404", async () => {
  const env = createTestEnv({ db: createFakeD1() });
  const response = await worker.fetch(new Request("https://worker.test/nope"), env);
  assert.equal(response.status, 404);
});

test("/admin/resend 未带 token：401", async () => {
  const env = createTestEnv({ db: createFakeD1() });
  const response = await worker.fetch(
    new Request("https://worker.test/admin/resend", {
      method: "POST",
      body: JSON.stringify({ sessionId: "cs_test_123" }),
    }),
    env,
  );
  assert.equal(response.status, 401);
});

test("/admin/resend 补发成功并把状态改为 resent", async () => {
  const db = createFakeD1();
  const env = createTestEnv({ db });
  await postWebhook(env, checkoutEvent());

  const response = await worker.fetch(
    new Request("https://worker.test/admin/resend", {
      method: "POST",
      headers: { authorization: "Bearer admin_test", "content-type": "application/json" },
      body: JSON.stringify({ sessionId: "cs_test_123" }),
    }),
    env,
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal([...db._orders.values()][0].email_status, "resent");
});

test("/admin/resend 订单不存在：404", async () => {
  const env = createTestEnv({ db: createFakeD1() });
  const response = await worker.fetch(
    new Request("https://worker.test/admin/resend", {
      method: "POST",
      headers: { authorization: "Bearer admin_test" },
      body: JSON.stringify({ sessionId: "cs_missing" }),
    }),
    env,
  );
  assert.equal(response.status, 404);
});
