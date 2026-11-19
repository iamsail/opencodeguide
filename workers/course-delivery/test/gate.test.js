import assert from "node:assert/strict";
import test from "node:test";

import { SESSION_COOKIE, signSession } from "../src/auth.js";
import { grantEntitlements } from "../src/entitlements.js";
import { authorizeRequest, courseSlugFromPath, isProtectedPath, loginRedirectFor } from "../src/gate.js";
import { createStore } from "../src/store.js";
import { createFakeD1 } from "./fakes.js";

const SECRET = "test_session_secret";

async function setupWithEntitlement({ planId = "single", courseSlug = "ai-coding-workflow" } = {}) {
  const db = createFakeD1();
  const store = createStore(db);
  await grantEntitlements({
    store,
    env: { ALL_ACCESS_COURSES: "ai-coding-workflow,indie-saas-launch,cross-border-store,global-site-seo" },
    logger: { warn() {}, error() {}, info() {} },
    order: { id: "order-1", email: "buyer@example.com", course_slug: courseSlug, plan_id: planId },
  });
  return { db, store };
}

async function request(path, { email, secret = SECRET } = {}) {
  const headers = { accept: "text/html" };
  if (email) {
    headers.cookie = `${SESSION_COOKIE}=${await signSession({ email, secret })}`;
  }
  return new Request(`https://learn.test${path}`, { headers });
}

test("公开路径白名单：登录、鉴权、静态资源", () => {
  for (const path of ["/login", "/login/", "/auth/magic", "/auth/verify", "/_next/static/x.css", "/robots.txt", "/health"]) {
    assert.equal(isProtectedPath(path), false, `${path} 应为公开`);
  }
});

test("正文、账户、首页、搜索索引都受保护", () => {
  for (const path of ["/", "/account", "/courses/ai-coding-workflow/lesson-1", "/courses/ai-coding-workflow/index.txt", "/search.json"]) {
    assert.equal(isProtectedPath(path), true, `${path} 应受保护`);
  }
});

test("从路径解析课程 slug", () => {
  assert.equal(courseSlugFromPath("/courses/ai-coding-workflow"), "ai-coding-workflow");
  assert.equal(courseSlugFromPath("/courses/ai-coding-workflow/setup"), "ai-coding-workflow");
  assert.equal(courseSlugFromPath("/courses/ai-coding-workflow/setup/index.txt"), "ai-coding-workflow");
  assert.equal(courseSlugFromPath("/courses"), null);
  assert.equal(courseSlugFromPath("/account"), null);
});

test("未登录访问正文：需要登录", async () => {
  const { store } = await setupWithEntitlement();
  const decision = await authorizeRequest({
    request: await request("/courses/ai-coding-workflow/setup"),
    env: { SESSION_SECRET: SECRET },
    store,
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.status, 401);
  assert.equal(decision.needsLogin, true);
  assert.equal(loginRedirectFor("/courses/x"), "/login?next=%2Fcourses%2Fx");
});

test("已登录但没有该课权益：403", async () => {
  const { store } = await setupWithEntitlement();
  const decision = await authorizeRequest({
    request: await request("/courses/indie-saas-launch/setup", { email: "buyer@example.com" }),
    env: { SESSION_SECRET: SECRET },
    store,
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.status, 403);
  assert.equal(decision.reason, "no_entitlement");
});

test("已购买该课：放行", async () => {
  const { store } = await setupWithEntitlement();
  const decision = await authorizeRequest({
    request: await request("/courses/ai-coding-workflow/setup", { email: "buyer@example.com" }),
    env: { SESSION_SECRET: SECRET },
    store,
  });

  assert.equal(decision.allowed, true);
  assert.equal(decision.email, "buyer@example.com");
  assert.equal(decision.courseSlug, "ai-coding-workflow");
});

test("全站通权益可以读其它课程", async () => {
  const { store } = await setupWithEntitlement({
    courseSlug: "all-access",
    planId: "all-access",
  });
  const decision = await authorizeRequest({
    request: await request("/courses/cross-border-store/checkout", { email: "buyer@example.com" }),
    env: { SESSION_SECRET: SECRET },
    store,
  });

  assert.equal(decision.allowed, true);
});

test("bundle 课程页只认全站通权益", async () => {
  const { store } = await setupWithEntitlement();
  const denied = await authorizeRequest({
    request: await request("/courses/all-access", { email: "buyer@example.com" }),
    env: { SESSION_SECRET: SECRET },
    store,
  });
  assert.equal(denied.allowed, false);
});

test("退款撤销后立刻失去访问（每次请求都查库）", async () => {
  const { store } = await setupWithEntitlement();
  const env = { SESSION_SECRET: SECRET };
  const req = () => request("/courses/ai-coding-workflow/setup", { email: "buyer@example.com" });

  assert.equal((await authorizeRequest({ request: await req(), env, store })).allowed, true);

  await store.revokeEntitlementsByOrder("order-1", new Date().toISOString());

  assert.equal((await authorizeRequest({ request: await req(), env, store })).allowed, false);
});

test("/account 只要求登录，不要求课程权益", async () => {
  const { store } = await setupWithEntitlement();
  const decision = await authorizeRequest({
    request: await request("/account", { email: "nobody@example.com" }),
    env: { SESSION_SECRET: SECRET },
    store,
  });

  assert.equal(decision.allowed, true);
});

test("公开路径不查会话", async () => {
  const { store } = await setupWithEntitlement();
  const decision = await authorizeRequest({
    request: await request("/login"),
    env: { SESSION_SECRET: SECRET },
    store,
  });

  assert.equal(decision.allowed, true);
  assert.equal(decision.public, true);
});

test("签名密钥不对的会话不能通过", async () => {
  const { store } = await setupWithEntitlement();
  const decision = await authorizeRequest({
    request: await request("/courses/ai-coding-workflow/setup", {
      email: "buyer@example.com",
      secret: "attacker_secret",
    }),
    env: { SESSION_SECRET: SECRET },
    store,
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.needsLogin, true);
});
