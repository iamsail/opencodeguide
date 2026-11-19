/**
 * 会话（P2.2）：HS256 JWT + cookie 工具。
 *
 * 登录方式已改为 Google OAuth（见 oauth.js / routes/auth.js），这里只负责
 * 「登录之后怎么记住他」：签发、校验、读写 cookie、回跳地址白名单。
 *
 * 注意：会话是无状态的，但**授权不是**——gate.js 每次请求都查 entitlements，
 * 所以退款/拒付撤销后立即失效。
 */

export const SESSION_COOKIE = "ocg_session";
export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

const encoder = new TextEncoder();

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

/** 定长比较，避免按字符提前 return 泄漏签名前缀 */
export function constantTimeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return diff === 0;
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
