import assert from "node:assert/strict";
import test from "node:test";

import {
  MAGIC_TTL_MINUTES,
  SESSION_COOKIE,
  buildClearedSessionCookie,
  buildSessionCookie,
  consumeMagicToken,
  generateMagicToken,
  hashToken,
  issueMagicLink,
  readSessionToken,
  safeNextPath,
  signSession,
  verifySession,
} from "../src/auth.js";
import { createStore } from "../src/store.js";
import { createFakeD1 } from "./fakes.js";

const SECRET = "test_session_secret";

function setup() {
  const db = createFakeD1();
  return { db, store: createStore(db) };
}

test("hashToken 稳定、定长，且不含明文", async () => {
  const token = "abc123";
  const first = await hashToken(token);
  const second = await hashToken(token);
  assert.equal(first, second);
  assert.equal(first.length, 64);
  assert.ok(!first.includes(token));
});

test("generateMagicToken 每次不同、URL 安全", () => {
  const first = generateMagicToken();
  const second = generateMagicToken();
  assert.notEqual(first, second);
  assert.ok(first.length >= 40);
  assert.match(first, /^[A-Za-z0-9_-]+$/);
});

test("同一邮箱 60 秒内只能发一封", async () => {
  const { store } = setup();
  const now = () => new Date("2026-11-19T10:00:00Z");

  const first = await issueMagicLink({ store, email: "a@example.com", now });
  const second = await issueMagicLink({ store, email: "a@example.com", now });

  assert.equal(first.ok, true);
  assert.equal(second.ok, false);
  assert.equal(second.reason, "email_rate_limited");
});

test("下一个 60 秒窗口可以再发", async () => {
  const { store } = setup();
  let clock = new Date("2026-11-19T10:00:00Z");
  const now = () => clock;

  await issueMagicLink({ store, email: "a@example.com", now });
  clock = new Date(clock.getTime() + 61_000);
  const second = await issueMagicLink({ store, email: "a@example.com", now });

  assert.equal(second.ok, true);
});

test("同一 IP 每小时最多 5 封", async () => {
  const { store } = setup();
  let clock = new Date("2026-11-19T10:00:00Z");
  const now = () => clock;

  for (let index = 0; index < 5; index += 1) {
    clock = new Date(clock.getTime() + 61_000);
    const result = await issueMagicLink({
      store,
      email: `user${index}@example.com`,
      ip: "1.2.3.4",
      now,
    });
    assert.equal(result.ok, true, `第 ${index + 1} 封应放行`);
  }

  clock = new Date(clock.getTime() + 61_000);
  const sixth = await issueMagicLink({ store, email: "user9@example.com", ip: "1.2.3.4", now });
  assert.equal(sixth.ok, false);
  assert.equal(sixth.reason, "ip_rate_limited");
});

test("令牌单次使用：第二次消费失败", async () => {
  const { store } = setup();
  const issued = await issueMagicLink({ store, email: "a@example.com" });

  const first = await consumeMagicToken({ store, token: issued.token });
  const second = await consumeMagicToken({ store, token: issued.token });

  assert.equal(first.ok, true);
  assert.equal(first.email, "a@example.com");
  assert.equal(second.ok, false);
  assert.equal(second.reason, "already_used");
});

test("过期令牌不可用", async () => {
  const { store } = setup();
  const issued = await issueMagicLink({ store, email: "a@example.com" });
  const later = () => new Date(Date.now() + (MAGIC_TTL_MINUTES + 1) * 60 * 1000);

  const result = await consumeMagicToken({ store, token: issued.token, now: later });

  assert.equal(result.ok, false);
  assert.equal(result.reason, "expired");
});

test("未知令牌不可用", async () => {
  const { store } = setup();
  const result = await consumeMagicToken({ store, token: "x".repeat(43) });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "not_found");
});

test("库里只存哈希，不存明文令牌", async () => {
  const { db, store } = setup();
  const issued = await issueMagicLink({ store, email: "a@example.com" });

  const rows = [...db._magicLinks.values()];
  assert.equal(rows.length, 1);
  assert.equal(rows[0].token_hash, await hashToken(issued.token));
  assert.ok(!JSON.stringify(rows).includes(issued.token));
});

test("会话签名可验证，且带出邮箱", async () => {
  const token = await signSession({ email: "a@example.com", secret: SECRET });
  const result = await verifySession({ token, secret: SECRET });

  assert.equal(result.valid, true);
  assert.equal(result.email, "a@example.com");
});

test("篡改签名会被拒绝", async () => {
  const token = await signSession({ email: "a@example.com", secret: SECRET });
  const tampered = `${token.slice(0, -1)}${token.endsWith("A") ? "B" : "A"}`;
  const result = await verifySession({ token: tampered, secret: SECRET });
  assert.equal(result.valid, false);
  assert.equal(result.reason, "bad_signature");
});

test("换密钥签名无法通过", async () => {
  const token = await signSession({ email: "a@example.com", secret: "other_secret" });
  const result = await verifySession({ token, secret: SECRET });
  assert.equal(result.valid, false);
});

test("过期会话被拒绝", async () => {
  const token = await signSession({
    email: "a@example.com",
    secret: SECRET,
    now: () => new Date("2026-01-01T00:00:00Z"),
  });
  const result = await verifySession({
    token,
    secret: SECRET,
    now: () => new Date("2026-03-01T00:00:00Z"),
  });

  assert.equal(result.valid, false);
  assert.equal(result.reason, "expired");
});

test("缺少 SESSION_SECRET 时一律拒绝（fail closed）", async () => {
  const token = await signSession({ email: "a@example.com", secret: SECRET });
  const result = await verifySession({ token, secret: "" });
  assert.equal(result.valid, false);
  assert.equal(result.reason, "missing_session_secret");
});

test("cookie 属性齐全（HttpOnly / Secure / SameSite / Max-Age）", () => {
  const cookie = buildSessionCookie({ token: "abc" });
  for (const attr of [
    `${SESSION_COOKIE}=abc`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Max-Age=2592000",
  ]) {
    assert.ok(cookie.includes(attr), `缺少属性 ${attr}`);
  }

  assert.ok(buildSessionCookie({ token: "abc", domain: ".example.com" }).includes("Domain=.example.com"));
  assert.ok(buildClearedSessionCookie().includes("Max-Age=0"));
});

test("从 Cookie 头里读出会话令牌", () => {
  const request = new Request("https://learn.test/account", {
    headers: { cookie: `locale=zh; ${SESSION_COOKIE}=token123; other=1` },
  });
  assert.equal(readSessionToken(request), "token123");
  assert.equal(readSessionToken(new Request("https://learn.test/account")), null);
});

test("safeNextPath 只允许站内路径（防开放重定向）", () => {
  assert.equal(safeNextPath("/courses/a"), "/courses/a");
  assert.equal(safeNextPath("https://evil.com"), "/account");
  assert.equal(safeNextPath("//evil.com"), "/account");
  assert.equal(safeNextPath("/auth/verify"), "/account");
  assert.equal(safeNextPath(null), "/account");
  assert.equal(safeNextPath(""), "/account");
  assert.equal(safeNextPath("/x", "/fallback"), "/x");
});
