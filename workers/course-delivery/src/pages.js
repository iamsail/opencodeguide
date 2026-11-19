/**
 * 登录 / 购买 / 账户页（P2.2+，手写 HTML）。
 *
 * P2.2 只服务少数几个页面，而正文页由 P2.3 的静态构建负责。
 * 为这几个页面引入模板引擎不划算，手写字符串也更容易审计转义。
 */

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const STRINGS = {
  zh: {
    lang: "zh-CN",
    loginTitle: "登录 · 课程阅读区",
    loginHeading: "登录后开始学习",
    loginLead: "用 Google 账号登录。你购买课程时使用的邮箱需要与 Google 账号一致。",
    googleButton: "使用 Google 账号继续",
    loginHint: "我们只读取你的邮箱和昵称，不会访问 Gmail、Drive 或任何其它数据。",
    buyTitle: "确认订单",
    buyHeading: "确认订单",
    buyLead: "支付宝/微信或银行卡都在 Stripe 页面完成，我们不接触你的卡号。",
    buyCourse: "课程",
    buyPlan: "版本",
    buyTotal: "应付",
    buyButton: "前往 Stripe 支付",
    buyNote: "支付完成后会自动回到阅读区；7 天内可无理由退款。",
    accountTitle: "我的课程",
    accountHeading: "我的课程",
    accountLead: "退款或拒付后，对应课程会在几分钟内从列表中消失。",
    logout: "退出登录",
    noCourses: "这个邮箱还没有已购课程。",
    browse: "去看看课程",
    deniedTitle: "需要购买",
    deniedHeading: "这门课还没开通",
    deniedLead: "这个账号没有这门课的阅读权。购买后立即可读；如果刚买过，稍等 1 分钟再刷新。",
    unavailableTitle: "暂时不可用",
    unavailableHeading: "服务暂时不可用",
    unavailableLead: "请过 1 分钟再试；如果一直这样，回信告诉我们。",
    errorTitle: "登录未完成",
    errorHeading: "登录没有完成",
    errorLead: "可能是取消了授权，或者链接已经过期。再试一次即可。",
    retry: "重新登录",
    footer: "OpenCode Guide · 课程阅读区",
  },
  en: {
    lang: "en",
    loginTitle: "Sign in · Course library",
    loginHeading: "Sign in to start learning",
    loginLead: "Sign in with Google. The email on your Google account must match the one you used at checkout.",
    googleButton: "Continue with Google",
    loginHint: "We only read your email and display name — no access to Gmail, Drive or anything else.",
    buyTitle: "Confirm order",
    buyHeading: "Confirm order",
    buyLead: "Card, Alipay and WeChat Pay are handled on Stripe's page. We never see your card details.",
    buyCourse: "Course",
    buyPlan: "Plan",
    buyTotal: "Total",
    buyButton: "Continue to Stripe",
    buyNote: "You'll be brought back to the library after payment. 7-day refund window.",
    accountTitle: "My courses",
    accountHeading: "My courses",
    accountLead: "After a refund or dispute, the related course disappears within a few minutes.",
    logout: "Sign out",
    noCourses: "No courses on this account yet.",
    browse: "Browse courses",
    deniedTitle: "Purchase required",
    deniedHeading: "You don't have access to this course",
    deniedLead:
      "This account has no access to that course. Purchase unlocks it immediately; if you just bought it, refresh in a minute.",
    unavailableTitle: "Temporarily unavailable",
    unavailableHeading: "The service is temporarily unavailable",
    unavailableLead: "Try again in a minute. If it keeps failing, reply to any of our emails.",
    errorTitle: "Sign-in incomplete",
    errorHeading: "Sign-in didn't complete",
    errorLead: "The authorisation was cancelled or the link expired. Please try again.",
    retry: "Sign in again",
    footer: "OpenCode Guide · Course library",
  },
};

export function resolveLocale(request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("lang");
  if (query === "en" || query === "zh") return query;

  const accept = (request.headers.get("accept-language") || "").toLowerCase();
  if (accept.startsWith("en")) return "en";
  return "zh";
}

export function normalizeLocale(value) {
  return value === "en" ? "en" : "zh";
}

function strings(locale) {
  return STRINGS[normalizeLocale(locale)];
}

function shell({ locale, title, body }) {
  const t = strings(locale);
  return `<!doctype html>
<html lang="${t.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${escapeHtml(title)}</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,'PingFang SC','Microsoft YaHei',sans-serif;
    background:#f6f7f9; color:#111827; font-size:15px; line-height:1.65; }
  .card { width:100%; max-width:460px; background:#fff; border:1px solid #e5e7eb; border-radius:16px; padding:28px 24px; }
  h1 { margin:0 0 8px; font-size:22px; line-height:1.35; }
  p { margin:0 0 14px; color:#4b5563; }
  .google { display:flex; align-items:center; justify-content:center; gap:10px; width:100%; margin-top:18px;
    padding:12px 16px; border:1px solid #d1d5db; border-radius:10px; background:#fff; color:#111827;
    font-size:15px; font-weight:600; text-decoration:none; }
  .google:hover { background:#f3f4f6; }
  .primary { display:block; width:100%; margin-top:18px; padding:12px 16px; border:0; border-radius:10px;
    background:#111827; color:#fff; font-size:15px; font-weight:600; text-align:center; text-decoration:none; cursor:pointer; }
  .hint, .footer { font-size:12px; color:#6b7280; }
  .footer { margin-top:22px; border-top:1px solid #f3f4f6; padding-top:14px; }
  ul { list-style:none; margin:18px 0 0; padding:0; }
  li { display:flex; justify-content:space-between; gap:12px; padding:12px 0; border-bottom:1px solid #f3f4f6; }
  dl { margin:18px 0 0; display:grid; grid-template-columns:auto 1fr; gap:8px 16px; }
  dt { color:#6b7280; font-size:13px; }
  dd { margin:0; text-align:right; font-weight:600; }
  a { color:#1d4ed8; }
  .row { display:flex; justify-content:space-between; align-items:center; gap:12px; }
  .muted { color:#6b7280; font-size:13px; }
  @media (prefers-color-scheme: dark) {
    body { background:#0b0d10; color:#f3f4f6; }
    .card { background:#111418; border-color:#23272e; }
    p { color:#9ca3af; }
    .google { background:#0b0d10; border-color:#2b3038; color:#f3f4f6; }
    .google:hover { background:#161a1f; }
    .primary { background:#f3f4f6; color:#111827; }
    li, dl { border-color:#23272e; }
    .footer { border-color:#23272e; }
  }
</style>
</head>
<body>
  <main class="card">${body}</main>
</body>
</html>`;
}

function googleMark() {
  return `<span aria-hidden="true" style="display:inline-flex;width:18px;height:18px;">
    <svg viewBox="0 0 48 48" width="18" height="18"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.2C12.4 13.5 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-2.8-.4-4.1H24v8.1h12.5c-.3 2.1-1.6 5.2-4.6 7.3l7.7 6c4.5-4.2 6.5-10.3 6.5-17.3z"/><path fill="#FBBC05" d="M10.5 28.6A14.6 14.6 0 0 1 9.7 24c0-1.6.3-3.1.8-4.6l-7.9-6.2A24 24 0 0 0 0 24c0 3.9.9 7.6 2.6 10.8l7.9-6.2z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.6-5.8l-7.7-6c-2.1 1.4-4.9 2.4-7.9 2.4-6.3 0-11.6-4-13.5-9.9l-7.9 6.2C6.5 42.6 14.6 48 24 48z"/></svg>
  </span>`;
}

export function renderLoginPage({ locale = "zh", next = "/account", error = null } = {}) {
  const t = strings(locale);
  const href = `/auth/google?next=${encodeURIComponent(next)}`;
  const body = `
    <h1>${escapeHtml(t.loginHeading)}</h1>
    <p>${escapeHtml(t.loginLead)}</p>
    ${error ? `<p style="color:#b91c1c;">${escapeHtml(error)}</p>` : ""}
    <a class="google" href="${escapeHtml(href)}">${googleMark()}${escapeHtml(t.googleButton)}</a>
    <p class="hint" style="margin-top:14px;">${escapeHtml(t.loginHint)}</p>
    <div class="footer">${escapeHtml(t.footer)}</div>`;
  return shell({ locale, title: t.loginTitle, body });
}

export function renderBuyPage({ locale = "zh", courseTitle, planLabel, total, form = {} } = {}) {
  const t = strings(locale);
  const body = `
    <h1>${escapeHtml(t.buyHeading)}</h1>
    <p>${escapeHtml(t.buyLead)}</p>
    <dl>
      <dt>${escapeHtml(t.buyCourse)}</dt><dd>${escapeHtml(courseTitle)}</dd>
      <dt>${escapeHtml(t.buyPlan)}</dt><dd>${escapeHtml(planLabel)}</dd>
      <dt>${escapeHtml(t.buyTotal)}</dt><dd>${escapeHtml(total)}</dd>
    </dl>
    <form method="post" action="/checkout">
      <input type="hidden" name="course" value="${escapeHtml(form.course ?? "")}">
      <input type="hidden" name="plan" value="${escapeHtml(form.plan ?? "")}">
      <button class="primary" type="submit">${escapeHtml(t.buyButton)}</button>
    </form>
    <p class="hint" style="margin-top:14px;">${escapeHtml(t.buyNote)}</p>
    <div class="footer">${escapeHtml(t.footer)}</div>`;
  return shell({ locale, title: t.buyTitle, body });
}

export function renderAccountPage({ locale = "zh", email, courses = [] } = {}) {
  const t = strings(locale);
  const list =
    courses.length === 0
      ? `<p style="margin-top:16px;" class="muted">${escapeHtml(t.noCourses)}</p>`
      : `<ul>${courses
          .map(
            (course) => `<li>
        <span>${escapeHtml(course.title)}</span>
        <span class="muted">${escapeHtml(course.planLabel || "")}</span>
      </li>`,
          )
          .join("")}</ul>`;

  const body = `
    <div class="row">
      <h1 style="margin:0;">${escapeHtml(t.accountHeading)}</h1>
      <form method="post" action="/auth/logout" style="margin:0;">
        <button type="submit" style="width:auto;margin:0;padding:8px 12px;font-size:13px;border:1px solid #d1d5db;border-radius:8px;background:transparent;cursor:pointer;">${escapeHtml(t.logout)}</button>
      </form>
    </div>
    <p class="muted" style="margin-top:6px;">${escapeHtml(email)}</p>
    <p style="margin-top:14px;">${escapeHtml(t.accountLead)}</p>
    ${list}
    <div class="footer">${escapeHtml(t.footer)}</div>`;
  return shell({ locale, title: t.accountTitle, body });
}

export function renderDeniedPage({ locale = "zh", courseTitle = "" } = {}) {
  const t = strings(locale);
  const body = `
    <h1>${escapeHtml(t.deniedHeading)}</h1>
    ${courseTitle ? `<p class="muted">${escapeHtml(courseTitle)}</p>` : ""}
    <p>${escapeHtml(t.deniedLead)}</p>
    <p style="margin-top:18px;"><a href="https://opencodeguide.com/zh/courses">${escapeHtml(t.browse)}</a></p>
    <div class="footer">${escapeHtml(t.footer)}</div>`;
  return shell({ locale, title: t.deniedTitle, body });
}

export function renderUnavailablePage({ locale = "zh" } = {}) {
  const t = strings(locale);
  const body = `
    <h1>${escapeHtml(t.unavailableHeading)}</h1>
    <p>${escapeHtml(t.unavailableLead)}</p>
    <div class="footer">${escapeHtml(t.footer)}</div>`;
  return shell({ locale, title: t.unavailableTitle, body });
}

export function renderErrorPage({ locale = "zh", next = "/account" } = {}) {
  const t = strings(locale);
  const body = `
    <h1>${escapeHtml(t.errorHeading)}</h1>
    <p>${escapeHtml(t.errorLead)}</p>
    <p style="margin-top:18px;"><a href="/login?next=${encodeURIComponent(next)}">${escapeHtml(t.retry)}</a></p>
    <div class="footer">${escapeHtml(t.footer)}</div>`;
  return shell({ locale, title: t.errorTitle, body });
}
