import assert from "node:assert/strict";
import test from "node:test";

import {
  SESSION_COOKIE,
  buildClearedSessionCookie,
  buildSessionCookie,
  constantTimeEqual,
  readSessionToken,
  safeNextPath,
  signSession,
  verifySession,
} from "../src/auth.js";
import {
  buildAuthUrl,
  createCodeChallenge,
  createRandomToken,
  exchangeCode,
  fetchGoogleUser,
  readCookie,
  sameState,
} from "../src/oauth.js";

const SECRET = "test_session_secret";

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
  const token = await signSession({ email: "a@example.com", secret: "other" });
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

test("cookie 属性齐全", () => {
  const cookie = buildSessionCookie({ token: "abc" });
  for (const attr of [`${SESSION_COOKIE}=abc`, "Path=/", "HttpOnly", "Secure", "SameSite=Lax", "Max-Age=2592000"]) {
    assert.ok(cookie.includes(attr), `缺少属性 ${attr}`);
  }
  assert.ok(buildClearedSessionCookie().includes("Max-Age=0"));
  assert.ok(buildSessionCookie({ token: "abc", domain: ".example.com" }).includes("Domain=.example.com"));
});

test("从 Cookie 头里读出会话令牌", () => {
  const request = new Request("https://learn.test/account", {
    headers: { cookie: `${SESSION_COOKIE}=token123; other=1` },
  });
  assert.equal(readSessionToken(request), "token123");
  assert.equal(readSessionToken(new Request("https://learn.test/account")), null);
  assert.equal(readCookie(request, "other"), "1");
});

test("safeNextPath 只允许站内路径", () => {
  assert.equal(safeNextPath("/courses/a"), "/courses/a");
  assert.equal(safeNextPath("https://evil.com"), "/account");
  assert.equal(safeNextPath("//evil.com"), "/account");
  assert.equal(safeNextPath("/auth/google"), "/account");
  assert.equal(safeNextPath(null), "/account");
});

test("constantTimeEqual / sameState 行为正确", () => {
  assert.equal(constantTimeEqual("abc", "abc"), true);
  assert.equal(constantTimeEqual("abc", "abd"), false);
  assert.equal(constantTimeEqual("abc", "ab"), false);
  assert.equal(sameState("x".repeat(10), "x".repeat(10)), true);
  assert.equal(sameState("x".repeat(10), "y".repeat(10)), false);
});

test("PKCE challenge 是 verifier 的 sha256（base64url）", async () => {
  const verifier = "test-verifier-value";
  const challenge = await createCodeChallenge(verifier);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const expected = Buffer.from(new Uint8Array(digest)).toString("base64url");
  assert.equal(challenge, expected);
});

test("createRandomToken 长度与字符集", () => {
  const token = createRandomToken(32);
  assert.ok(token.length >= 40);
  assert.match(token, /^[A-Za-z0-9_-]+$/);
  assert.notEqual(token, createRandomToken(32));
});

test("授权地址包含 OAuth 必需参数", () => {
  const url = new URL(
    buildAuthUrl({
      clientId: "client-1",
      redirectUri: "https://learn.test/auth/google/callback",
      state: "state-1",
      codeChallenge: "challenge-1",
    }),
  );

  assert.equal(url.origin + url.pathname, "https://accounts.google.com/o/oauth2/v2/auth");
  assert.equal(url.searchParams.get("client_id"), "client-1");
  assert.equal(url.searchParams.get("response_type"), "code");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.equal(url.searchParams.get("code_challenge"), "challenge-1");
  assert.equal(url.searchParams.get("state"), "state-1");
  assert.match(url.searchParams.get("scope") ?? "", /openid/);
});

test("令牌交换把参数发到 Google token 端点", async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({ access_token: "at-1", id_token: "id-1" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  const tokens = await exchangeCode({
    code: "code-1",
    codeVerifier: "verifier-1",
    clientId: "client-1",
    clientSecret: "secret-1",
    redirectUri: "https://learn.test/auth/google/callback",
    fetchImpl,
  });

  assert.equal(tokens.accessToken, "at-1");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://oauth2.googleapis.com/token");
  const body = new URLSearchParams(calls[0].init.body);
  assert.equal(body.get("grant_type"), "authorization_code");
  assert.equal(body.get("code"), "code-1");
  assert.equal(body.get("code_verifier"), "verifier-1");
  assert.equal(body.get("client_secret"), "secret-1");
});

test("令牌交换失败会抛出明确错误", async () => {
  const fetchImpl = async () =>
    new Response(JSON.stringify({ error: "invalid_grant", error_description: "bad code" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });

  await assert.rejects(
    exchangeCode({
      code: "bad",
      codeVerifier: "v",
      clientId: "c",
      clientSecret: "s",
      redirectUri: "https://learn.test/cb",
      fetchImpl,
    }),
    /bad code/,
  );
});

test("userinfo 归一化邮箱并识别已验证状态", async () => {
  const fetchImpl = async (url, init) => {
    assert.equal(url, "https://openidconnect.googleapis.com/v1/userinfo");
    assert.equal(init.headers.authorization, "Bearer at-1");
    return new Response(
      JSON.stringify({ email: "Buyer@Example.COM", email_verified: true, name: "Buyer", sub: "123" }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  };

  const user = await fetchGoogleUser({ accessToken: "at-1", fetchImpl });
  assert.equal(user.email, "buyer@example.com");
  assert.equal(user.emailVerified, true);
  assert.equal(user.subject, "123");
});
