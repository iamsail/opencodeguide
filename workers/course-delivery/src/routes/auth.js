/**
 * 登录路由（Google OAuth，P2.2 改造版）。
 *
 * 流程：
 *   GET /login              → 渲染「使用 Google 继续」按钮
 *   GET /auth/google        → 生成 state + PKCE，写 cookie，302 到 Google
 *   GET /auth/google/callback → 校验 state，换令牌，取邮箱，写会话 cookie，302 回跳
 *   /auth/logout            → 清 cookie
 *
 * 不再有 magic link：登录不依赖任何邮件服务。
 */

import { buildClearedSessionCookie, buildSessionCookie, safeNextPath, signSession } from "../auth.js";
import { getSettings } from "../config.js";
import {
  OAUTH_STATE_COOKIE,
  OAUTH_VERIFIER_COOKIE,
  buildAuthUrl,
  buildOAuthCookie,
  clearOAuthCookie,
  createCodeChallenge,
  createRandomToken,
  exchangeCode,
  fetchGoogleUser,
  readCookie,
  sameState,
} from "../oauth.js";
import {
  renderErrorPage,
  renderLoginPage,
  renderUnavailablePage,
  resolveLocale,
} from "../pages.js";

const HTML_HEADERS = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "no-store",
  "x-robots-tag": "noindex, nofollow",
  "referrer-policy": "no-referrer",
};

function htmlPage(body, status = 200, cookies = []) {
  const headers = new Headers(HTML_HEADERS);
  for (const cookie of cookies) headers.append("set-cookie", cookie);
  return new Response(body, { status, headers });
}

function redirect(location, cookies = []) {
  const headers = new Headers({
    location,
    "cache-control": "no-store",
    "referrer-policy": "no-referrer",
  });
  for (const cookie of cookies) headers.append("set-cookie", cookie);
  return new Response(null, { status: 302, headers });
}

function cookieDomain(env = {}) {
  return env.SESSION_COOKIE_DOMAIN || undefined;
}

function originFor(env, request) {
  return (env.LEARN_URL || new URL(request.url).origin).replace(/\/$/, "");
}

export async function handleAuthRoutes(request, env = {}) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method.toUpperCase();
  const locale = resolveLocale(request);

  if (pathname === "/login" && method === "GET") {
    if (!getSettings(env).googleClientId) {
      console.error("[auth] GOOGLE_CLIENT_ID 未配置");
      return htmlPage(renderUnavailablePage({ locale }), 503);
    }
    return htmlPage(
      renderLoginPage({ locale, next: safeNextPath(url.searchParams.get("next")) }),
    );
  }

  if (pathname === "/auth/google" && method === "GET") {
    const settings = getSettings(env);
    if (!settings.googleClientId || !settings.googleClientSecret) {
      console.error("[auth] Google OAuth 未配置");
      return htmlPage(renderUnavailablePage({ locale }), 503);
    }

    const next = safeNextPath(url.searchParams.get("next"));
    const state = createRandomToken(24);
    const verifier = createRandomToken(32);
    const challenge = await createCodeChallenge(verifier);
    const redirectUri =
      settings.googleRedirectUri || `${originFor(env, request)}/auth/google/callback`;

    const authUrl = buildAuthUrl({
      clientId: settings.googleClientId,
      redirectUri,
      state,
      codeChallenge: challenge,
    });

    // state 里带上回跳地址，回调时不用再多一个 cookie
    return redirect(authUrl, [
      buildOAuthCookie(OAUTH_STATE_COOKIE, `${state}.${encodeURIComponent(next)}`),
      buildOAuthCookie(OAUTH_VERIFIER_COOKIE, verifier),
    ]);
  }

  if (pathname === "/auth/google/callback" && method === "GET") {
    const settings = getSettings(env);
    if (!settings.googleClientId || !settings.googleClientSecret) {
      return htmlPage(renderUnavailablePage({ locale }), 503);
    }

    const error = url.searchParams.get("error");
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    const stateCookie = readCookie(request, OAUTH_STATE_COOKIE);
    const verifier = readCookie(request, OAUTH_VERIFIER_COOKIE);
    const [expectedState, encodedNext] = (stateCookie || "").split(".");
    const next = safeNextPath(encodedNext ? decodeURIComponent(encodedNext) : "/account");

    const clearOauth = [
      clearOAuthCookie(OAUTH_STATE_COOKIE, cookieDomain(env)),
      clearOAuthCookie(OAUTH_VERIFIER_COOKIE, cookieDomain(env)),
    ];

    if (error) {
      console.warn(`[auth] Google 返回错误：${error}`);
      return htmlPage(renderErrorPage({ locale, next }), 400, clearOauth);
    }
    if (!code || !state || !expectedState || !sameState(state, expectedState) || !verifier) {
      console.warn("[auth] OAuth state 校验失败");
      return htmlPage(renderErrorPage({ locale, next }), 400, clearOauth);
    }

    let user;
    try {
      const tokens = await exchangeCode({
        code,
        codeVerifier: verifier,
        clientId: settings.googleClientId,
        clientSecret: settings.googleClientSecret,
        redirectUri:
          settings.googleRedirectUri || `${originFor(env, request)}/auth/google/callback`,
      });
      user = await fetchGoogleUser({ accessToken: tokens.accessToken });
    } catch (exchangeError) {
      console.error(`[auth] ${exchangeError?.message ?? exchangeError}`);
      return htmlPage(renderErrorPage({ locale, next }), 400, clearOauth);
    }

    if (!user.emailVerified) {
      console.warn(`[auth] Google 账号邮箱未验证：${user.email}`);
      return htmlPage(renderErrorPage({ locale, next }), 403, clearOauth);
    }

    if (!settings.sessionSecret) {
      console.error("[auth] SESSION_SECRET 未配置，拒绝签发会话");
      return htmlPage(renderUnavailablePage({ locale }), 503, clearOauth);
    }

    const sessionToken = await signSession({
      email: user.email,
      secret: settings.sessionSecret,
    });

    return redirect(next, [
      buildSessionCookie({ token: sessionToken, domain: cookieDomain(env) }),
      ...clearOauth,
    ]);
  }

  if (pathname === "/auth/logout" && (method === "POST" || method === "GET")) {
    return redirect("/login", [buildClearedSessionCookie({ domain: cookieDomain(env) })]);
  }

  return null;
}
