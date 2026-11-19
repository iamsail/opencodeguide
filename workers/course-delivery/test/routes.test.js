import assert from "node:assert/strict";
import test from "node:test";

import worker from "../src/index.js";
import { signPayload } from "../src/stripe.js";
import { checkoutEvent, createFakeD1, createTestEnv } from "./fakes.js";

const WEBHOOK_SECRET = "whsec_test";

/** 拦截 Resend 请求：既拿到登录链接，又不真的发信 */
function stubResend() {
  const calls = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify({ id: `msg_${calls.length}` }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  return {
    calls,
    restore: () => {
      globalThis.fetch = original;
    },
  };
}

async function sendWebhook(env, event = checkoutEvent()) {
  const body = JSON.stringify(event);
  const signature = await signPayload({ payload: body, secret: WEBHOOK_SECRET });
  return worker.fetch(
    new Request("https://learn.test/stripe/webhook", {
      method: "POST",
      headers: { "content-type": "application/json", "stripe-signature": signature },
      body,
    }),
    env,
  );
}

function postForm(url, fields) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fields).toString(),
  });
}

function tokenFromEmail(calls) {
  const mail = calls
    .map((call) => JSON.parse(call.init.body))
    .find((payload) => String(payload.html).includes("/auth/verify?t="));
  assert.ok(mail, "应发送过登录邮件");
  const match = /\/auth\/verify\?t=([^"&]+)/.exec(mail.html);
  assert.ok(match, "登录邮件里应有 verify 链接");
  return decodeURIComponent(match[1]);
}

test("GET /login 渲染邮箱表单且不索引", async () => {
  const env = createTestEnv({ db: createFakeD1() });
  const response = await worker.fetch(new Request("https://learn.test/login?next=%2Faccount"), env);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /action="\/auth\/magic"/);
  assert.match(html, /name="email"/);
  assert.match(html, /noindex/);
});

test("POST /auth/magic 发送登录邮件，库里只存哈希", async () => {
  const stub = stubResend();
  try {
    const db = createFakeD1();
    const env = createTestEnv({ db, overrides: { EMAIL_DRY_RUN: "0" } });

    const response = await worker.fetch(
      postForm("https://learn.test/auth/magic", { email: "buyer@example.com", next: "/account" }),
      env,
    );
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /去邮箱点一下链接|Check your inbox/);
    assert.equal(db._magicLinks.size, 1);

    const token = tokenFromEmail(stub.calls);
    const stored = [...db._magicLinks.keys()][0];
    assert.notEqual(stored, token, "库里不能存明文令牌");
    assert.equal(stored.length, 64);
  } finally {
    stub.restore();
  }
});

test("完整链路：付款 → 登录 → 看到课程 → 退出", async () => {
  const stub = stubResend();
  try {
    const db = createFakeD1();
    const env = createTestEnv({ db, overrides: { EMAIL_DRY_RUN: "0" } });

    await sendWebhook(env);

    const magic = await worker.fetch(
      postForm("https://learn.test/auth/magic", { email: "buyer@example.com", next: "/account" }),
      env,
    );
    assert.equal(magic.status, 200);

    const token = tokenFromEmail(stub.calls);
    const verify = await worker.fetch(
      new Request(`https://learn.test/auth/verify?t=${encodeURIComponent(token)}&next=%2Faccount`),
      env,
    );

    assert.equal(verify.status, 302);
    assert.equal(verify.headers.get("location"), "/account");
    const setCookie = verify.headers.get("set-cookie") || "";
    assert.match(setCookie, /ocg_session=/);
    assert.match(setCookie, /HttpOnly/);
    const cookie = setCookie.split(";")[0];

    const account = await worker.fetch(
      new Request("https://learn.test/account", { headers: { cookie } }),
      env,
    );
    const html = await account.text();
    assert.equal(account.status, 200);
    assert.match(html, /buyer@example\.com/);
    assert.match(html, /AI 编程实战/);

    const logout = await worker.fetch(
      new Request("https://learn.test/auth/logout", { method: "POST", headers: { cookie } }),
      env,
    );
    assert.equal(logout.status, 302);
    assert.match(logout.headers.get("set-cookie") || "", /Max-Age=0/);
  } finally {
    stub.restore();
  }
});

test("同一链接点第二次：400 且不再签发会话", async () => {
  const stub = stubResend();
  try {
    const db = createFakeD1();
    const env = createTestEnv({ db, overrides: { EMAIL_DRY_RUN: "0" } });

    await worker.fetch(postForm("https://learn.test/auth/magic", { email: "buyer@example.com" }), env);
    const token = tokenFromEmail(stub.calls);

    const first = await worker.fetch(new Request(`https://learn.test/auth/verify?t=${token}`), env);
    const second = await worker.fetch(new Request(`https://learn.test/auth/verify?t=${token}`), env);

    assert.equal(first.status, 302);
    assert.equal(second.status, 400);
    assert.equal(second.headers.get("set-cookie"), null);
  } finally {
    stub.restore();
  }
});

test("同一邮箱 60 秒内第二次请求：429", async () => {
  const stub = stubResend();
  try {
    const db = createFakeD1();
    const env = createTestEnv({ db, overrides: { EMAIL_DRY_RUN: "0" } });

    const first = await worker.fetch(
      postForm("https://learn.test/auth/magic", { email: "buyer@example.com" }),
      env,
    );
    const second = await worker.fetch(
      postForm("https://learn.test/auth/magic", { email: "buyer@example.com" }),
      env,
    );

    assert.equal(first.status, 200);
    assert.equal(second.status, 429);
    assert.equal(db._magicLinks.size, 1, "被限流时不应再签发令牌");
  } finally {
    stub.restore();
  }
});

test("未登录访问 /account：302 到登录页", async () => {
  const env = createTestEnv({ db: createFakeD1() });
  const response = await worker.fetch(new Request("https://learn.test/account"), env);
  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), "/login?next=%2Faccount");
});

test("非法邮箱也返回「已发送」，不泄露是否买过", async () => {
  const db = createFakeD1();
  const env = createTestEnv({ db, overrides: { EMAIL_DRY_RUN: "0" } });
  const response = await worker.fetch(
    postForm("https://learn.test/auth/magic", { email: "not-an-email" }),
    env,
  );

  assert.equal(response.status, 200);
  assert.equal(db._magicLinks.size, 0);
});

test("SESSION_SECRET 未配置时 verify 返回 503（不签发弱会话）", async () => {
  const db = createFakeD1();
  const env = createTestEnv({ db, overrides: { SESSION_SECRET: "" } });
  const response = await worker.fetch(
    new Request("https://learn.test/auth/verify?t=some-token-value-1234567890"),
    env,
  );
  assert.equal(response.status, 503);
});

test("/health 暴露登录相关绑定开关但不泄露密钥", async () => {
  const env = createTestEnv({ db: createFakeD1() });
  const response = await worker.fetch(new Request("https://learn.test/health"), env);
  const payload = await response.json();

  assert.equal(payload.bindings.sessionSecret, true);
  assert.ok(!JSON.stringify(payload).includes(env.SESSION_SECRET));
});
