import assert from "node:assert/strict";
import test from "node:test";

import { signSession } from "../src/auth.js";
import worker from "../src/index.js";
import { createFakeD1, createTestEnv } from "./fakes.js";

const CATALOG = JSON.stringify({
  "ai-coding-workflow:single": {
    title: "AI 编程实战",
    planLabel: "单课版",
    amount: 7900,
    currency: "usd",
    priceId: "price_test_1",
  },
});

function makeEnv(overrides = {}) {
  return createTestEnv({
    db: createFakeD1(),
    overrides: {
      GOOGLE_CLIENT_ID: "client-1",
      GOOGLE_CLIENT_SECRET: "secret-1",
      STRIPE_SECRET_KEY: "sk_test_fake",
      COURSE_CATALOG: CATALOG,
      LEARN_URL: "https://learn.test",
      ...overrides,
    },
  });
}

function jsonResponse(payload) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function stubFetch({ email = "buyer@example.com", emailVerified = true } = {}) {
  const calls = [];
  const original = globalThis.fetch;

  globalThis.fetch = async (url, init = {}) => {
    const href = String(url);
    calls.push({ url: href, init });
    if (href === "https://oauth2.googleapis.com/token") {
      return jsonResponse({ access_token: "at-1", id_token: "id-1" });
    }
    if (href === "https://openidconnect.googleapis.com/v1/userinfo") {
      return jsonResponse({ email, email_verified: emailVerified, name: "Buyer", sub: "g-1" });
    }
    if (href.startsWith("https://api.stripe.com/v1/customers?")) return jsonResponse({ data: [] });
    if (href === "https://api.stripe.com/v1/customers") return jsonResponse({ id: "cus_1", email });
    if (href === "https://api.stripe.com/v1/checkout/sessions") {
      return jsonResponse({ id: "cs_1", url: "https://checkout.stripe.com/c/pay/cs_1" });
    }
    throw new Error(`unexpected fetch: ${href}`);
  };

  return {
    calls,
    restore: () => {
      globalThis.fetch = original;
    },
  };
}

function setCookies(response) {
  if (typeof response.headers.getSetCookie === "function") return response.headers.getSetCookie();
  const single = response.headers.get("set-cookie");
  return single ? [single] : [];
}

function cookieValue(response, name) {
  const match = setCookies(response).find((cookie) => cookie.startsWith(`${name}=`));
  return match ? match.split(";")[0] : "";
}

function cookieHeader(response) {
  return setCookies(response)
    .map((cookie) => cookie.split(";")[0])
    .filter(Boolean)
    .join("; ");
}

async function sessionCookie(env, email = "buyer@example.com") {
  const token = await signSession({ email, secret: env.SESSION_SECRET });
  return `ocg_session=${token}`;
}

test("GET /login 渲染 Google 登录按钮", async () => {
  const env = makeEnv();
  const response = await worker.fetch(new Request("https://learn.test/login?next=%2Faccount"), env);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /\/auth\/google\?next=%2Faccount/);
  assert.match(html, /noindex/);
});

test("GET /auth/google 跳转到 Google 并下发 state / verifier cookie", async () => {
  const env = makeEnv();
  const response = await worker.fetch(new Request("https://learn.test/auth/google?next=%2Faccount"), env);

  assert.equal(response.status, 302);
  const location = new URL(response.headers.get("location"));
  assert.equal(location.origin + location.pathname, "https://accounts.google.com/o/oauth2/v2/auth");
  assert.equal(location.searchParams.get("client_id"), "client-1");
  assert.equal(location.searchParams.get("code_challenge_method"), "S256");
  assert.ok(location.searchParams.get("state"));

  const stateCookie = cookieValue(response, "ocg_oauth_state");
  const verifierCookie = cookieValue(response, "ocg_oauth_verifier");
  assert.ok(stateCookie.startsWith("ocg_oauth_state="));
  assert.ok(verifierCookie.startsWith("ocg_oauth_verifier="));
  assert.match(setCookies(response).join("|"), /HttpOnly/);
});

test("回调成功：签发会话并回跳", async () => {
  const stub = stubFetch();
  try {
    const env = makeEnv();
    const start = await worker.fetch(new Request("https://learn.test/auth/google?next=%2Faccount"), env);
    const state = new URL(start.headers.get("location")).searchParams.get("state");
    const cookie = cookieHeader(start);

    const callback = await worker.fetch(
      new Request(`https://learn.test/auth/google/callback?code=code-1&state=${encodeURIComponent(state)}`, {
        headers: { cookie },
      }),
      env,
    );

    assert.equal(callback.status, 302);
    assert.equal(callback.headers.get("location"), "/account");
    assert.match(cookieValue(callback, "ocg_session"), /^ocg_session=/);

    const session = cookieValue(callback, "ocg_session");
    const account = await worker.fetch(
      new Request("https://learn.test/account", { headers: { cookie: session } }),
      env,
    );
    const html = await account.text();
    assert.equal(account.status, 200);
    assert.match(html, /buyer@example\.com/);
  } finally {
    stub.restore();
  }
});

test("state 不匹配：400，不签发会话", async () => {
  const stub = stubFetch();
  try {
    const env = makeEnv();
    const start = await worker.fetch(new Request("https://learn.test/auth/google"), env);
    const cookie = cookieHeader(start);

    const callback = await worker.fetch(
      new Request("https://learn.test/auth/google/callback?code=code-1&state=forged", {
        headers: { cookie },
      }),
      env,
    );

    assert.equal(callback.status, 400);
    assert.equal(cookieValue(callback, "ocg_session"), "");
  } finally {
    stub.restore();
  }
});

test("邮箱未验证：403", async () => {
  const stub = stubFetch({ emailVerified: false });
  try {
    const env = makeEnv();
    const start = await worker.fetch(new Request("https://learn.test/auth/google"), env);
    const state = new URL(start.headers.get("location")).searchParams.get("state");

    const callback = await worker.fetch(
      new Request(`https://learn.test/auth/google/callback?code=code-1&state=${encodeURIComponent(state)}`, {
        headers: { cookie: cookieHeader(start) },
      }),
      env,
    );

    assert.equal(callback.status, 403);
  } finally {
    stub.restore();
  }
});

test("/buy 未登录：302 到登录页并带回跳", async () => {
  const env = makeEnv();
  const response = await worker.fetch(new Request("https://learn.test/buy/ai-coding-workflow/single"), env);

  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), "/login?next=%2Fbuy%2Fai-coding-workflow%2Fsingle");
});

test("/buy 已登录：显示课程与价格", async () => {
  const env = makeEnv();
  const response = await worker.fetch(
    new Request("https://learn.test/buy/ai-coding-workflow/single", {
      headers: { cookie: await sessionCookie(env) },
    }),
    env,
  );
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /AI 编程实战/);
  assert.match(html, /\$79/);
  assert.match(html, /action="\/checkout"/);
});

test("POST /checkout：创建 Customer + Checkout Session 并跳转 Stripe", async () => {
  const stub = stubFetch();
  try {
    const env = makeEnv();
    const response = await worker.fetch(
      new Request("https://learn.test/checkout", {
        method: "POST",
        headers: {
          cookie: await sessionCookie(env),
          "content-type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ course: "ai-coding-workflow", plan: "single" }).toString(),
      }),
      env,
    );

    assert.equal(response.status, 303);
    assert.equal(response.headers.get("location"), "https://checkout.stripe.com/c/pay/cs_1");

    const sessionCall = stub.calls.find((call) => call.url === "https://api.stripe.com/v1/checkout/sessions");
    assert.ok(sessionCall, "应该调用 Checkout Session 接口");
    const body = new URLSearchParams(sessionCall.init.body);
    assert.equal(body.get("customer"), "cus_1");
    assert.equal(body.get("line_items[0][price]"), "price_test_1");
    // 权益归属用登录邮箱，而不是 Stripe 页面收集的邮箱
    assert.equal(body.get("metadata[email]"), "buyer@example.com");
    assert.equal(body.get("metadata[course_slug]"), "ai-coding-workflow");
    assert.equal(body.get("metadata[plan_id]"), "single");
  } finally {
    stub.restore();
  }
});

test("POST /checkout 未登录：302 到登录页", async () => {
  const env = makeEnv();
  const response = await worker.fetch(
    new Request("https://learn.test/checkout", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "course=ai-coding-workflow&plan=single",
    }),
    env,
  );

  assert.equal(response.status, 302);
  assert.match(response.headers.get("location"), /^\/login\?next=/);
});

test("POST /checkout 未配置的课程：400", async () => {
  const env = makeEnv();
  const response = await worker.fetch(
    new Request("https://learn.test/checkout", {
      method: "POST",
      headers: {
        cookie: await sessionCookie(env),
        "content-type": "application/x-www-form-urlencoded",
      },
      body: "course=unknown-course&plan=single",
    }),
    env,
  );

  assert.equal(response.status, 400);
});

test("/auth/logout 清 cookie", async () => {
  const env = makeEnv();
  const response = await worker.fetch(
    new Request("https://learn.test/auth/logout", { method: "POST" }),
    env,
  );

  assert.equal(response.status, 302);
  assert.match(setCookies(response).join("|"), /Max-Age=0/);
});

test("/health 暴露 Google / Stripe / 目录绑定开关", async () => {
  const env = makeEnv();
  const response = await worker.fetch(new Request("https://learn.test/health"), env);
  const payload = await response.json();

  assert.equal(payload.bindings.googleOauth, true);
  assert.equal(payload.bindings.stripeKey, true);
  assert.equal(payload.bindings.catalog, true);
  assert.ok(!JSON.stringify(payload).includes("sk_test_fake"));
});

/** 只需应答 Stripe 的会话查询，其它请求一律视为意外 */
function stubStripeSession(session) {
  const calls = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const href = String(url);
    calls.push(href);
    if (href.includes("/v1/checkout/sessions/")) return jsonResponse(session);
    throw new Error(`unexpected fetch: ${href}`);
  };
  return {
    calls,
    restore: () => {
      globalThis.fetch = original;
    },
  };
}

function stripeSession(overrides = {}) {
  return {
    id: "cs_test_paid",
    object: "checkout.session",
    mode: "payment",
    payment_status: "paid",
    amount_total: 7900,
    currency: "usd",
    locale: "zh",
    payment_intent: "pi_paid",
    customer_details: { email: "buyer@example.com" },
    metadata: {
      email: "buyer@example.com",
      course_slug: "ai-coding-workflow",
      plan_id: "single",
    },
    ...overrides,
  };
}

test("/account?paid=1&session_id=… 主动对账：webhook 还没到也能看到课程与交付链接", async () => {
  const env = makeEnv();
  const stub = stubStripeSession(stripeSession());
  try {
    const response = await worker.fetch(
      new Request("https://learn.test/account?paid=1&session_id=cs_test_paid", {
        headers: { cookie: await sessionCookie(env) },
      }),
      env,
    );
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.equal(stub.calls.filter((href) => href.includes("/v1/checkout/sessions/")).length, 1);
    assert.match(html, /支付成功，课程已开通/);
    assert.match(html, /\/zh\/courses\/ai-coding-workflow/);
    // 交付物直接出现在账户页，不再只靠开通邮件
    assert.match(html, /github\.com\/example\/course\/invitations/);
    assert.match(html, /discord\.gg\/example/);
  } finally {
    stub.restore();
  }
});

test("/account：支付方式未结清时提示处理中，不自动刷新", async () => {
  const env = makeEnv();
  const stub = stubStripeSession(stripeSession({ payment_status: "unpaid" }));
  try {
    const response = await worker.fetch(
      new Request("https://learn.test/account?paid=1&session_id=cs_test_paid", {
        headers: { cookie: await sessionCookie(env) },
      }),
      env,
    );
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /支付处理中/);
    assert.doesNotMatch(html, /http-equiv="refresh"/);
    assert.match(html, /这个邮箱还没有已购课程/);
  } finally {
    stub.restore();
  }
});

test("/account：别人的 session_id 不认领，也不显示开通提示", async () => {
  const env = makeEnv();
  const stub = stubStripeSession(stripeSession({ metadata: { email: "other@example.com", course_slug: "ai-coding-workflow", plan_id: "single" } }));
  try {
    const response = await worker.fetch(
      new Request("https://learn.test/account?paid=1&session_id=cs_test_paid", {
        headers: { cookie: await sessionCookie(env) },
      }),
      env,
    );
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /这个邮箱还没有已购课程/);
    // 注意：不能直接匹配文案 —— PAGE_CSS 的注释里也有「正在开通」，会误命中
    assert.doesNotMatch(html, /class="notice/);
  } finally {
    stub.restore();
  }
});

test("/account：非法 session_id 不打 Stripe 接口", async () => {
  const env = makeEnv();
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    throw new Error("should not call stripe");
  };
  try {
    const response = await worker.fetch(
      new Request("https://learn.test/account?paid=1&session_id=javascript:alert(1)", {
        headers: { cookie: await sessionCookie(env) },
      }),
      env,
    );
    assert.equal(response.status, 200);
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = original;
  }
});
