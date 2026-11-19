/**
 * 登录（P2.2）：magic link 签发 + 会话 JWT + 限流。
 *
 * 为什么不用密码、也不引入 Supabase Auth：
 *   - 密码要存哈希、要做重置流程、还要防撞库，收益远小于成本；
 *   - 已有 Resend 与 D1，magic link 的协议面很小，自建反而更可控。
 *
 * 安全取舍（与 docs/courses/07-access-control.md 第 5/9 节一致）：
 *   1. 令牌只存 sha256，明文只在邮件里出现一次；
 *   2. 15 分钟过期、单次使用（用 update ... where used_at is null 抢占，天然防并发重放）；
 *   3. 限流：邮箱 60 秒 1 封、同一 IP 每小时 5 封；
 *   4. 会话是 HMAC-SHA256 的 JWT，但**授权每次请求都查 entitlements**，
 *      所以退款/拒付的撤销是分钟级生效，而不是等 cookie 过期。
 */

import { getSettings } from "./config.js";

export const SESSION_COOKIE = "ocg_session";
export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;
export const MAGIC_TTL_MINUTES = 15;

const EMAIL_WINDOW_MS = 60 * 1000;
const IP_WINDOW_MS = 60 * 60 * 1000;
const IP_MAX_PER_WINDOW = 5;
const ATTEMPT_RETENTION_MS = 24 * 60 * 60 * 1000;

const encoder = new TextEncoder();

/* ------------------------------------------------------------------ */
/* 编码工具                                                            */
/* ------------------------------------------------------------------ */

function toBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function toHex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** 定长比较，避免按字符提前 return 泄漏签名前缀 */
export function constantTimeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return diff === 0;
}

/** 32 字节随机 token（base64url 43 字符） */
export function generateMagicToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

export async function hashToken(token) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(token));
  return toHex(new Uint8Array(digest));
}

async function hmacSha256(data, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return toBase64Url(new Uint8Array(signature));
}

/* ------------------------------------------------------------------ */
/* 限流与签发                                                          */
/* ------------------------------------------------------------------ */

/**
 * 固定窗口限流。key 里带窗口序号，过期窗口自然失效；
 * 顺手清掉 24 小时前的计数，避免 auth_attempts 无限增长。
 */
export async function checkIssueRate({ store, email, ip, now = () => new Date() }) {
  const at = now().getTime();
  const atIso = new Date(at).toISOString();
  const emailKey = `email:${email}:${Math.floor(at / EMAIL_WINDOW_MS)}`;
  const ipKey = `ip:${ip || "unknown"}:${Math.floor(at / IP_WINDOW_MS)}`;

  await store.pruneAttempts(new Date(at - ATTEMPT_RETENTION_MS).toISOString());

  const emailCount = await store.incrementAttempt(emailKey, atIso);
  const ipCount = await store.incrementAttempt(ipKey, atIso);

  if (emailCount > 1) return { allowed: false, reason: "email_rate_limited" };
  if (ipCount > IP_MAX_PER_WINDOW) return { allowed: false, reason: "ip_rate_limited" };
  return { allowed: true };
}

/**
 * 签发登录令牌。
 * @returns {Promise<{ok: true, token: string, expiresAt: string} | {ok: false, reason: string}>}
 */
export async function issueMagicLink({ store, email, ip, now = () => new Date() }) {
  const rate = await checkIssueRate({ store, email, ip, now });
  if (!rate.allowed) return { ok: false, reason: rate.reason };

  const issuedAt = now();
  const expiresAt = new Date(issuedAt.getTime() + MAGIC_TTL_MINUTES * 60 * 1000);
  const token = generateMagicToken();

  await store.insertMagicLink({
    tokenHash: await hashToken(token),
    email,
    ip: ip || null,
    createdAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  });

  return { ok: true, token, expiresAt: expiresAt.toISOString() };
}

/**
 * 校验并消费令牌。
 * 先查再用「where used_at is null」抢占：并发两次点击只有一次能成功。
 * @returns {Promise<{ok: true, email: string} | {ok: false, reason: string}>}
 */
export async function consumeMagicToken({ store, token, now = () => new Date() }) {
  if (typeof token !== "string" || token.length < 16) {
    return { ok: false, reason: "malformed_token" };
  }

  const tokenHash = await hashToken(token);
  const link = await store.findMagicLink(tokenHash);
  if (!link) return { ok: false, reason: "not_found" };
  if (link.used_at) return { ok: false, reason: "already_used" };

  const nowDate = now();
  if (new Date(link.expires_at).getTime() <= nowDate.getTime()) {
    return { ok: false, reason: "expired" };
  }

  const claimed = await store.markMagicLinkUsed(tokenHash, nowDate.toISOString());
  if (!claimed) return { ok: false, reason: "already_used" };

  return { ok: true, email: link.email };
}

/* ------------------------------------------------------------------ */
/* 会话 JWT                                                            */
/* ------------------------------------------------------------------ */

export async function signSession({
  email,
  secret,
  now = () => new Date(),
  ttlSeconds = SESSION_TTL_SECONDS,
}) {
  if (!secret) throw new Error("SESSION_SECRET 未配置");
  const issuedAt = Math.floor(now().getTime() / 1000);
  const header = toBase64Url(encoder.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const payload = toBase64Url(
    encoder.encode(
      JSON.stringify({
        sub: email,
        iat: issuedAt,
        exp: issuedAt + ttlSeconds,
        jti: crypto.randomUUID(),
      }),
    ),
  );
  const signature = await hmacSha256(`${header}.${payload}`, secret);
  return `${header}.${payload}.${signature}`;
}

export async function verifySession({ token, secret, now = () => new Date() }) {
  if (!secret) return { valid: false, reason: "missing_session_secret" };
  if (typeof token !== "string" || token.split(".").length !== 3) {
    return { valid: false, reason: "malformed_token" };
  }

  const [header, payload, signature] = token.split(".");
  const expected = await hmacSha256(`${header}.${payload}`, secret);
  if (!constantTimeEqual(signature, expected)) return { valid: false, reason: "bad_signature" };

  let claims;
  try {
    claims = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
  } catch {
    return { valid: false, reason: "bad_payload" };
  }

  if (!claims?.sub) return { valid: false, reason: "missing_sub" };
  const nowSeconds = Math.floor(now().getTime() / 1000);
  if (typeof claims.exp !== "number" || claims.exp <= nowSeconds) {
    return { valid: false, reason: "expired" };
  }

  return { valid: true, email: String(claims.sub), expiresAt: claims.exp };
}

/* ------------------------------------------------------------------ */
/* Cookie                                                              */
/* ------------------------------------------------------------------ */

export function buildSessionCookie({ token, domain, maxAge = SESSION_TTL_SECONDS }) {
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (domain) parts.push(`Domain=${domain}`);
  return parts.join("; ");
}

export function buildClearedSessionCookie({ domain } = {}) {
  return buildSessionCookie({ token: "", domain, maxAge: 0 });
}

export function readSessionToken(request) {
  const header = request?.headers?.get?.("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator <= 0) continue;
    if (part.slice(0, separator).trim() === SESSION_COOKIE) {
      return part.slice(separator + 1).trim() || null;
    }
  }
  return null;
}

/** 登录后的回跳地址只允许站内路径，避免开放重定向 */
export function safeNextPath(value, fallback = "/account") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return fallback;
  if (trimmed.startsWith("/auth/")) return fallback;
  return trimmed;
}

export function getSessionSecret(env = {}) {
  return getSettings(env).sessionSecret;
}
