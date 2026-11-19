/**
 * Google 登录（OpenID Connect，授权码 + PKCE）。
 *
 * 为什么是 OAuth 而不是发登录邮件：
 *   - 用户少一步（不用等信、不用点链接），也少一个外部服务依赖；
 *   - Google 返回的 email 经过验证（email_verified），身份更硬；
 *   - 代价是需要用户有 Google 账号（大陆不可用），这是已知取舍。
 *
 * 安全要点：
 *   1. state 与 PKCE verifier 存 HttpOnly cookie（10 分钟），回调时比对 → 防 CSRF/会话固定；
 *   2. 只接受 email_verified 为 true 的账号；
 *   3. 令牌交换用 client_secret（服务端持有），不暴露给浏览器。
 */

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo";

const encoder = new TextEncoder();

export const OAUTH_STATE_COOKIE = "ocg_oauth_state";
export const OAUTH_VERIFIER_COOKIE = "ocg_oauth_verifier";
export const OAUTH_COOKIE_TTL_SECONDS = 600;

function toBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function createRandomToken(bytes = 32) {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return toBase64Url(buffer);
}

/** PKCE S256：code_challenge = base64url(sha256(verifier)) */
export async function createCodeChallenge(verifier) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(verifier));
  return toBase64Url(new Uint8Array(digest));
}

export function buildAuthUrl({ clientId, redirectUri, state, codeChallenge, loginHint }) {
  const url = new URL(AUTH_ENDPOINT);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("prompt", "select_account");
  if (loginHint) url.searchParams.set("login_hint", loginHint);
  return url.toString();
}

/**
 * 授权码换令牌。
 * @returns {Promise<{accessToken: string, idToken?: string}>}
 */
export async function exchangeCode({
  code,
  codeVerifier,
  clientId,
  clientSecret,
  redirectUri,
  fetchImpl = fetch,
}) {
  const response = await fetchImpl(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      code_verifier: codeVerifier,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }).toString(),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.access_token) {
    const reason = payload?.error_description || payload?.error || response.statusText;
    throw new Error(`Google 令牌交换失败：${reason}`);
  }
  return { accessToken: payload.access_token, idToken: payload.id_token };
}

/**
 * 取用户信息。用 userinfo 端点而不是本地验 ID token：
 * 少一套 JWKS 缓存与 RS256 验签，代价是多一次请求，登录频率低，划算。
 */
export async function fetchGoogleUser({ accessToken, fetchImpl = fetch }) {
  const response = await fetchImpl(USERINFO_ENDPOINT, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.email) {
    throw new Error(`Google 用户信息获取失败：${payload?.error?.message || response.statusText}`);
  }
  return {
    email: String(payload.email).trim().toLowerCase(),
    emailVerified: payload.email_verified === true,
    name: payload.name ?? null,
    subject: payload.sub ?? null,
  };
}

export function buildOAuthCookie(name, value, domain) {
  const parts = [
    `${name}=${value}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${OAUTH_COOKIE_TTL_SECONDS}`,
  ];
  if (domain) parts.push(`Domain=${domain}`);
  return parts.join("; ");
}

export function clearOAuthCookie(name, domain) {
  const parts = [`${name}=`, "Path=/", "HttpOnly", "Secure", "SameSite=Lax", "Max-Age=0"];
  if (domain) parts.push(`Domain=${domain}`);
  return parts.join("; ");
}

export function readCookie(request, name) {
  const header = request?.headers?.get?.("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator <= 0) continue;
    if (part.slice(0, separator).trim() === name) {
      return part.slice(separator + 1).trim() || null;
    }
  }
  return null;
}

/** 定长比较，防 state 比对被时间侧信道利用 */
export function sameState(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return diff === 0;
}
