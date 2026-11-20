/**
 * 成员站门禁接线测试（P2.3）
 * ------------------------------------------------------------
 * 这里测的不是 gate.js 的判定逻辑（那个在 gate.test.js），
 * 而是「Worker 入口有没有按正确顺序使用它」：
 *   1. 先判权限、后回源 —— 未放行时 ASSETS 一次都不能被调用；
 *   2. 未登录的 HTML 请求 302 到 /login，非 HTML 请求给 401；
 *   3. 放行后仍然覆盖缓存头与 robots 头（源站可能带 public, max-age）。
 */

import assert from "node:assert/strict";
import test from "node:test";

import { SESSION_COOKIE, signSession } from "../src/auth.js";
import { grantEntitlements } from "../src/entitlements.js";
import worker from "../src/index.js";
import { createStore } from "../src/store.js";
import { createFakeD1, createTestEnv } from "./fakes.js";

const SECRET = "test_session_secret";
const ALL_ACCESS_COURSES = "ai-coding-workflow,indie-saas-launch,cross-border-store,global-site-seo";

/** 假静态资源：记录被回源的路径，顺带返回一个「可缓存」的响应头便于验证覆盖 */
function createFakeAssets({ body = "<!doctype html><p>lesson body</p>" } = {}) {
  const calls = [];
  return {
    calls,
    binding: {
      async fetch(request) {
        calls.push(new URL(request.url).pathname);
        return new Response(body, {
          status: 200,
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  };
}

async function setup({ email = "buyer@example.com", entitled = [], withAssets = true } = {}) {
  const db = createFakeD1();
  const store = createStore(db);

  for (const target of entitled) {
    const [courseSlug, planId] = target.includes(":") ? target.split(":") : [target, "single"];
    await grantEntitlements({
      store,
      env: { ALL_ACCESS_COURSES },
      logger: { warn() {}, error() {}, info() {} },
      order: { id: `order-${courseSlug}-${planId}`, email, course_slug: courseSlug, plan_id: planId },
    });
  }

  const assets = createFakeAssets();
  const overrides = withAssets ? { ASSETS: assets.binding } : {};
  return { db, assets, env: createTestEnv({ db, overrides }) };
}

async function get(path, { env, email, accept = "text/html" } = {}) {
  const headers = { accept };
  if (email) headers.cookie = `${SESSION_COOKIE}=${await signSession({ email, secret: SECRET })}`;
  return worker.fetch(new Request(`https://learn.test${path}`, { headers }), env);
}

test("未登录访问课时页：302 到登录页，且完全没有回源", async () => {
  const { env, assets } = await setup();

  const response = await get("/zh/courses/ai-coding-workflow/lesson-3/", { env });

  assert.equal(response.status, 302);
  assert.match(response.headers.get("location"), /^\/login\?next=/);
  assert.equal(assets.calls.length, 0, "未授权时不能先把正文取回来再判断");
});

test("未登录访问 RSC / .txt：401 而不是跳登录页，且不回源", async () => {
  const { env, assets } = await setup();

  const response = await get("/zh/courses/ai-coding-workflow/index.txt", {
    env,
    accept: "text/x-component",
  });

  assert.equal(response.status, 401);
  assert.equal(assets.calls.length, 0);
});

test("未登录访问 search.json：不能把全文索引发出去", async () => {
  const { env, assets } = await setup();

  const response = await get("/search.json", { env, accept: "application/json" });

  assert.equal(response.status, 401);
  assert.equal(assets.calls.length, 0);
});

test("已登录但没买这门课：403 页面，且不回源", async () => {
  const { env, assets } = await setup({ entitled: ["indie-saas-launch"] });

  const response = await get("/zh/courses/ai-coding-workflow/lesson-3/", {
    env,
    email: "buyer@example.com",
  });

  assert.equal(response.status, 403);
  assert.match(response.headers.get("content-type"), /text\/html/);
  assert.equal(assets.calls.length, 0);
});

test("已登录且有权益：回源 200，并覆盖成 noindex + no-store", async () => {
  const { env, assets } = await setup({ entitled: ["ai-coding-workflow"] });

  const response = await get("/zh/courses/ai-coding-workflow/lesson-3/", {
    env,
    email: "buyer@example.com",
  });

  assert.equal(response.status, 200);
  assert.equal(assets.calls.length, 1);
  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.match(await response.text(), /lesson body/);
});

test("全站通买家能读没单买过的课", async () => {
  const { env } = await setup({ entitled: ["all-access:all-access"] });

  const response = await get("/zh/courses/global-site-seo/lesson-5/", {
    env,
    email: "buyer@example.com",
  });

  assert.equal(response.status, 200);
});

test("登录页要用的 /_next/ 静态文件公开：未登录也能取", async () => {
  const { env, assets } = await setup();

  const response = await get("/_next/static/chunks/main.js", { env, accept: "*/*" });

  assert.equal(response.status, 200);
  assert.equal(assets.calls.length, 1);
});

test("没绑定 ASSETS 时保持 404，不能静默返回空页面", async () => {
  const { env } = await setup({ withAssets: false });

  const response = await get("/zh/courses/ai-coding-workflow/lesson-3/", { env });

  assert.equal(response.status, 404);
});

test("健康检查公开，且不依赖静态资源绑定", async () => {
  const { env } = await setup({ withAssets: false });

  const response = await get("/health", { env, accept: "application/json" });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
});
