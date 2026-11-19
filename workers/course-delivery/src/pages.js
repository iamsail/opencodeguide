/**
 * 登录 / 账户页（P2.2）。
 *
 * 为什么在这里手写 HTML：P2.2 只服务「登录、已发送、账户」这几个页面，
 * 而成员站的正文页由 P2.3 的静态构建负责。为 4 个页面引入模板引擎不划算，
 * 手写字符串也更容易审计转义。
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
    loginHeading: "用邮箱登录",
    loginLead: "输入购买时用的邮箱，我们会发一个一次性登录链接，15 分钟内有效。",
    emailLabel: "邮箱",
    submit: "发送登录链接",
    loginHint: "不需要密码。链接只能用一次，过期就再发一封。",
    sentTitle: "邮件已发送",
    sentHeading: "去邮箱点一下链接",
    sentLead: "如果该邮箱有购买记录，你会收到一封登录邮件；没收到就检查垃圾箱，或在 60 秒后重试。",
    rateTitle: "请求过于频繁",
    rateHeading: "稍等一会儿再试",
    rateLead: "同一邮箱 60 秒内只能发一封，同一 IP 每小时最多 5 封。",
    invalidTitle: "链接不可用",
    invalidHeading: "这个登录链接已经失效",
    invalidLead: "链接只能用一次，且 15 分钟后过期。重新发一封即可。",
    backToLogin: "重新发送",
    accountTitle: "我的课程",
    accountHeading: "我的课程",
    accountLead: "退款或拒付后，对应课程会在几分钟内从列表中消失。",
    logout: "退出登录",
    noCourses: "这个邮箱还没有已购课程。",
    browse: "去看看课程",
    deniedTitle: "需要购买",
    deniedHeading: "这门课还没开通",
    deniedLead: "当前邮箱没有这门课的阅读权。购买后立即可读；如果刚买过，稍等 1 分钟再刷新。",
    unavailableTitle: "暂时不可用",
    unavailableHeading: "登录服务暂时不可用",
    unavailableLead: "请过 1 分钟再试；如果一直这样，回信告诉我们。",
    footer: "OpenCode Guide · 课程阅读区",
  },
  en: {
    lang: "en",
    loginTitle: "Sign in · Course library",
    loginHeading: "Sign in with email",
    loginLead: "Enter the email you used at checkout. We'll send a one-time link valid for 15 minutes.",
    emailLabel: "Email",
    submit: "Send sign-in link",
    loginHint: "No password. The link works once; request a new one if it expires.",
    sentTitle: "Email sent",
    sentHeading: "Check your inbox",
    sentLead:
      "If that email has a purchase, a sign-in link is on its way. Nothing yet? Check spam, or retry after 60 seconds.",
    rateTitle: "Too many requests",
    rateHeading: "Give it a minute",
    rateLead: "One email per 60 seconds per address, at most 5 per hour per IP.",
    invalidTitle: "Link unavailable",
    invalidHeading: "This sign-in link is no longer valid",
    invalidLead: "Links work once and expire after 15 minutes. Request a fresh one.",
    backToLogin: "Send a new link",
    accountTitle: "My courses",
    accountHeading: "My courses",
    accountLead: "After a refund or dispute, the related course disappears within a few minutes.",
    logout: "Sign out",
    noCourses: "No courses on this email yet.",
    browse: "Browse courses",
    deniedTitle: "Purchase required",
    deniedHeading: "You don't have access to this course",
    deniedLead:
      "This email has no access to that course. Purchase unlocks it immediately; if you just bought it, refresh in a minute.",
    unavailableTitle: "Temporarily unavailable",
    unavailableHeading: "Sign-in is temporarily unavailable",
    unavailableLead: "Try again in a minute. If it keeps failing, reply to any of our emails.",
    footer: "OpenCode Guide · Course library",
  },
};

export function resolveLocale(request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("lang");
  if (query === "en" || query === "zh") return query;

  const cookie = request.headers.get("cookie") || "";
  if (/locale=en/.test(cookie)) return "en";
  if (/locale=zh/.test(cookie)) return "zh";

  const accept = (request.headers.get("accept-language") || "").toLowerCase();
  if (accept.startsWith("en")) return "en";
  return "zh";
}
/** 测试与路由用：把 locale 收敛成受支持的两种 */
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
  label { display:block; font-size:13px; font-weight:600; margin:18px 0 6px; }
  input { width:100%; padding:11px 12px; border:1px solid #d1d5db; border-radius:10px; font-size:15px; }
  button { margin-top:14px; width:100%; padding:12px 16px; border:0; border-radius:10px; background:#111827; color:#fff;
    font-size:15px; font-weight:600; cursor:pointer; }
  .hint, .footer { font-size:12px; color:#6b7280; }
  .footer { margin-top:22px; border-top:1px solid #f3f4f6; padding-top:14px; }
  ul { list-style:none; margin:18px 0 0; padding:0; }
  li { display:flex; justify-content:space-between; gap:12px; padding:12px 0; border-bottom:1px solid #f3f4f6; }
  a { color:#1d4ed8; }
  .row { display:flex; justify-content:space-between; align-items:center; gap:12px; }
  .muted { color:#6b7280; font-size:13px; }
  @media (prefers-color-scheme: dark) {
    body { background:#0b0d10; color:#f3f4f6; }
    .card { background:#111418; border-color:#23272e; }
    p { color:#9ca3af; }
    input { background:#0b0d10; border-color:#2b3038; color:#f3f4f6; }
    button { background:#f3f4f6; color:#111827; }
    li { border-color:#23272e; }
    .footer { border-color:#23272e; }
  }
</style>
</head>
<body>
  <main class="card">${body}</main>
</body>
</html>`;
}

export function renderLoginPage({ locale = "zh", next = "/account", error = null } = {}) {
  const t = strings(locale);
  const body = `
    <h1>${escapeHtml(t.loginHeading)}</h1>
    <p>${escapeHtml(t.loginLead)}</p>
    ${error ? `<p style="color:#b91c1c;">${escapeHtml(error)}</p>` : ""}
    <form method="post" action="/auth/magic">
      <input type="hidden" name="next" value="${escapeHtml(next)}">
      <label for="email">${escapeHtml(t.emailLabel)}</label>
      <input id="email" name="email" type="email" inputmode="email" autocomplete="email" required placeholder="you@example.com">
      <button type="submit">${escapeHtml(t.submit)}</button>
    </form>
    <p class="hint" style="margin-top:14px;">${escapeHtml(t.loginHint)}</p>
    <div class="footer">${escapeHtml(t.footer)}</div>`;
  return shell({ locale, title: t.loginTitle, body });
}

export function renderSentPage({ locale = "zh", email = "" } = {}) {
  const t = strings(locale);
  const body = `
    <h1>${escapeHtml(t.sentHeading)}</h1>
    <p>${escapeHtml(t.sentLead)}</p>
    ${email ? `<p class="muted">${escapeHtml(email)}</p>` : ""}
    <p style="margin-top:18px;"><a href="/login">${escapeHtml(t.backToLogin)}</a></p>
    <div class="footer">${escapeHtml(t.footer)}</div>`;
  return shell({ locale, title: t.sentTitle, body });
}

export function renderRateLimitedPage({ locale = "zh" } = {}) {
  const t = strings(locale);
  const body = `
    <h1>${escapeHtml(t.rateHeading)}</h1>
    <p>${escapeHtml(t.rateLead)}</p>
    <p style="margin-top:18px;"><a href="/login">${escapeHtml(t.backToLogin)}</a></p>
    <div class="footer">${escapeHtml(t.footer)}</div>`;
  return shell({ locale, title: t.rateTitle, body });
}

export function renderInvalidLinkPage({ locale = "zh" } = {}) {
  const t = strings(locale);
  const body = `
    <h1>${escapeHtml(t.invalidHeading)}</h1>
    <p>${escapeHtml(t.invalidLead)}</p>
    <p style="margin-top:18px;"><a href="/login">${escapeHtml(t.backToLogin)}</a></p>
    <div class="footer">${escapeHtml(t.footer)}</div>`;
  return shell({ locale, title: t.invalidTitle, body });
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
        <button type="submit" style="width:auto;margin:0;padding:8px 12px;font-size:13px;">${escapeHtml(t.logout)}</button>
      </form>
    </div>
    <p class="muted" style="margin-top:6px;">${escapeHtml(email)}</p>
    <p style="margin-top:14px;">${escapeHtml(t.accountLead)}</p>
    ${list}
    <div class="footer">${escapeHtml(t.footer)}</div>`;
  return shell({ locale, title: t.accountTitle, body });
}

export function renderUnavailablePage({ locale = "zh" } = {}) {
  const t = strings(locale);
  const body = `
    <h1>${escapeHtml(t.unavailableHeading)}</h1>
    <p>${escapeHtml(t.unavailableLead)}</p>
    <p style="margin-top:18px;"><a href="/login">${escapeHtml(t.backToLogin)}</a></p>
    <div class="footer">${escapeHtml(t.footer)}</div>`;
  return shell({ locale, title: t.unavailableTitle, body });
}
