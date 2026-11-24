/**
 * 登录 / 购买 / 账户页（P2.2+，手写 HTML）。
 *
 * 页面骨架、配色与组件样式在 ui.js（与公开站对齐的设计系统）；
 * 这里只负责内容与文案。手写字符串便于逐处审计转义。
 */

import { ICONS, accentFor, escapeHtml, googleMark, shell } from "./ui.js";

const STRINGS = {
  zh: {
    lang: "zh-CN",
    loginTitle: "登录 · 课程阅读区",
    loginHeading: "登录后开始学习",
    loginLead: "用 Google 账号登录。你购买课程时使用的邮箱需要与 Google 账号一致。",
    googleButton: "使用 Google 账号继续",
    loginHint: "我们只读取你的邮箱和昵称，不会访问 Gmail、Drive 或任何其它数据。",
    loginCardFoot: "7 天内可无理由退款 · 支持支付宝 / 微信 / 银行卡",
    buyTitle: "确认订单",
    buyHeading: "确认订单",
    buyLead: "支付宝/微信或银行卡都在 Stripe 页面完成，我们不接触你的卡号。",
    buyCourse: "课程",
    buyPlan: "版本",
    buyTotal: "应付",
    buyButton: "前往 Stripe 支付",
    buyNote: "支付完成后会自动回到阅读区；7 天内可无理由退款。",
    buyBack: "返回课程页",
    buyGuarantee: "7 天无理由退款：不满意写封邮件即可全额退款。",
    buySecure: "支付由 Stripe 托管，支持 3D Secure，我们不接触你的卡号。",
    buyMethods: "Visa · Mastercard · Amex · Apple Pay · Google Pay · 支付宝 / 微信支付（以 Stripe 结账页为准）",
    accountTitle: "我的课程",
    accountHeading: "我的课程",
    accountLead: "退款或拒付后，对应课程会在几分钟内从列表中消失。",
    accountCount: "{count} 门课",
    logout: "退出登录",
    noCourses: "这个邮箱还没有已购课程。",
    noCoursesLead: "购买后课程会出现在这里，也可以直接回公开站看看课程大纲与试听。",
    browse: "去看看课程",
    continueLearning: "继续学习",
    accountPaidTitle: "支付成功，课程已开通",
    accountPaidLead: "下面就是你的课程，点进去即可开始阅读；开通邮件稍后也会发到你的邮箱。",
    accountPendingTitle: "支付已收到，正在开通",
    accountPendingLead: "通常几秒内完成，这个页面会自动刷新；也可以点下面的「手动刷新」。",
    accountUnpaidTitle: "支付处理中",
    accountUnpaidLead: "银行转账等支付方式到账后会自动开通，不需要重复付款。",
    accountRefreshing: "正在刷新…",
    accountRefreshNow: "手动刷新",
    accountRepo: "私有模板仓库",
    accountCommunity: "社群邀请",
    deniedTitle: "需要购买",
    deniedHeading: "这门课还没开通",
    deniedLead: "这个账号没有这门课的阅读权。购买后立即可读；如果刚买过，稍等 1 分钟再刷新。",
    unavailableTitle: "暂时不可用",
    unavailableHeading: "服务暂时不可用",
    unavailableLead: "请过 1 分钟再试；如果一直这样，回信告诉我们。",
    errorTitle: "操作未完成",
    errorHeading: "登录没有完成",
    errorLead: "可能是取消了授权，或者链接已经过期。再试一次即可。",
    retry: "重新登录",
    errorCourseTitle: "课程暂时无法购买",
    errorCourseLead: "这门课或这个版本暂时没有开放购买。回到课程页看看其它选择。",
    errorCourseAction: "返回课程页",
    errorPaymentTitle: "支付没有完成",
    errorPaymentLead: "本次没有扣款。可以回到订单页重新发起支付。",
    errorPaymentAction: "重新支付",
    footer: "OpenCode Guide · 课程阅读区",
  },
  en: {
    lang: "en",
    loginTitle: "Sign in · Course library",
    loginHeading: "Sign in to start learning",
    loginLead: "Sign in with Google. The email on your Google account must match the one you used at checkout.",
    googleButton: "Continue with Google",
    loginHint: "We only read your email and display name — no access to Gmail, Drive or anything else.",
    loginCardFoot: "7-day refund window · Card, Alipay and WeChat Pay",
    buyTitle: "Confirm order",
    buyHeading: "Confirm order",
    buyLead: "Card, Alipay and WeChat Pay are handled on Stripe's page. We never see your card details.",
    buyCourse: "Course",
    buyPlan: "Plan",
    buyTotal: "Total",
    buyButton: "Continue to Stripe",
    buyNote: "You'll be brought back to the library after payment. 7-day refund window.",
    buyBack: "Back to course",
    buyGuarantee: "7-day no-questions refund: email us and we refund in full.",
    buySecure: "Payments are hosted by Stripe with 3D Secure. We never see your card details.",
    buyMethods: "Visa · Mastercard · Amex · Apple Pay · Google Pay · Alipay / WeChat Pay where available",
    accountTitle: "My courses",
    accountHeading: "My courses",
    accountLead: "After a refund or dispute, the related course disappears within a few minutes.",
    accountCount: "{count} courses",
    logout: "Sign out",
    noCourses: "No courses on this account yet.",
    noCoursesLead: "Purchased courses show up here. You can also browse the public catalogue and free previews.",
    browse: "Browse courses",
    continueLearning: "Continue learning",
    accountPaidTitle: "Payment received — your courses are ready",
    accountPaidLead: "Open a course below to start reading. Your receipt email is on its way too.",
    accountPendingTitle: "Payment received, unlocking now",
    accountPendingLead: "This usually takes a few seconds and the page refreshes itself. You can also refresh manually.",
    accountUnpaidTitle: "Payment is processing",
    accountUnpaidLead: "Bank transfers unlock automatically once settled — no need to pay again.",
    accountRefreshing: "Refreshing…",
    accountRefreshNow: "Refresh now",
    accountRepo: "Private template repo",
    accountCommunity: "Community",
    deniedTitle: "Purchase required",
    deniedHeading: "You don't have access to this course",
    deniedLead:
      "This account has no access to that course. Purchase unlocks it immediately; if you just bought it, refresh in a minute.",
    unavailableTitle: "Temporarily unavailable",
    unavailableHeading: "The service is temporarily unavailable",
    unavailableLead: "Try again in a minute. If it keeps failing, reply to any of our emails.",
    errorTitle: "Action not completed",
    errorHeading: "Sign-in didn't complete",
    errorLead: "The authorisation was cancelled or the link expired. Please try again.",
    retry: "Sign in again",
    errorCourseTitle: "This course isn't purchasable right now",
    errorCourseLead: "That course or plan isn't open for purchase. Head back to the catalogue for other options.",
    errorCourseAction: "Back to courses",
    errorPaymentTitle: "Payment didn't complete",
    errorPaymentLead: "Nothing was charged. You can go back to the order page and try again.",
    errorPaymentAction: "Try payment again",
    footer: "OpenCode Guide · Course library",
  },
};

const SITE = "https://opencodeguide.com";

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

function coursesHome(locale) {
  return `${SITE}/${normalizeLocale(locale) === "en" ? "en" : "zh"}/courses`;
}

/* ------------------------------------------------------------------ */
/* 登录                                                                */
/* ------------------------------------------------------------------ */

export function renderLoginPage({ locale = "zh", next = "/account", error = null } = {}) {
  const t = strings(locale);
  const href = `/auth/google?next=${encodeURIComponent(next)}`;
  const body = `
    <div class="card">
      <div class="card-body">
        <h1>${escapeHtml(t.loginHeading)}</h1>
        <p class="lead">${escapeHtml(t.loginLead)}</p>
        ${error ? `<div class="alert">${ICONS.alert}<span>${escapeHtml(error)}</span></div>` : ""}
        <a class="btn btn-primary" href="${escapeHtml(href)}">${googleMark(18)}<span>${escapeHtml(t.googleButton)}</span></a>
        <p class="muted" style="margin:14px 0 0">${escapeHtml(t.loginHint)}</p>
      </div>
      <div class="card-foot">${escapeHtml(t.loginCardFoot)}</div>
    </div>`;
  return shell({ locale, title: t.loginTitle, body, narrow: true });
}

/* ------------------------------------------------------------------ */
/* 确认订单                                                            */
/* ------------------------------------------------------------------ */

export function renderBuyPage({
  locale = "zh",
  courseTitle,
  planLabel,
  total,
  form = {},
  accent = null,
} = {}) {
  const t = strings(locale);
  const body = `
    <div class="page-head">
      <h1>${escapeHtml(t.buyHeading)}</h1>
      <p class="lead">${escapeHtml(t.buyLead)}</p>
    </div>
    <div class="buy-grid">
      <div class="card">
        <div class="card-accent" style="background-image:${accentFor({ accent })}"></div>
        <div class="card-body">
          <h2 style="margin-bottom:16px">${escapeHtml(courseTitle)}</h2>
          <dl class="facts">
            <dt>${escapeHtml(t.buyPlan)}</dt><dd>${escapeHtml(planLabel)}</dd>
          </dl>
          <div class="divider"></div>
          <dl class="facts">
            <dt>${escapeHtml(t.buyTotal)}</dt><dd class="total">${escapeHtml(total)}</dd>
          </dl>
        </div>
        <div class="card-foot">
          <a class="course-link" href="${escapeHtml(coursesHome(locale))}">${escapeHtml(t.buyBack)} →</a>
        </div>
      </div>
      <aside class="buy-aside">
        <div class="card">
          <div class="card-body">
            <form method="post" action="/checkout">
              <input type="hidden" name="course" value="${escapeHtml(form.course ?? "")}">
              <input type="hidden" name="plan" value="${escapeHtml(form.plan ?? "")}">
              <div class="buy-actions">
                <button class="btn btn-primary" type="submit">${ICONS.card}<span>${escapeHtml(t.buyButton)}</span></button>
              </div>
            </form>
            <p class="muted" style="margin:14px 0 0">${escapeHtml(t.buyNote)}</p>
            <div class="divider"></div>
            <p class="note">${ICONS.shield}<span>${escapeHtml(t.buyGuarantee)}</span></p>
            <p class="note">${ICONS.lock}<span>${escapeHtml(t.buySecure)}</span></p>
            <p class="note" style="margin-bottom:0">${ICONS.card}<span>${escapeHtml(t.buyMethods)}</span></p>
          </div>
        </div>
      </aside>
    </div>`;
  return shell({ locale, title: t.buyTitle, body });
}

/* ------------------------------------------------------------------ */
/* 我的课程                                                            */
/* ------------------------------------------------------------------ */

export function renderAccountPage({
  locale = "zh",
  email,
  courses = [],
  status = null,
  retry = 0,
  refreshHref = null,
} = {}) {
  const t = strings(locale);
  const lang = normalizeLocale(locale);
  const count = t.accountCount.replace("{count}", String(courses.length));

  // pending 时自动刷新，但最多 3 次：真卡住就停下来，别把人锁在刷新循环里
  const autoRefresh = status === "pending" && retry < 3 && Boolean(refreshHref);
  const head = autoRefresh ? '<meta http-equiv="refresh" content="4">' : "";

  const grid =
    courses.length === 0
      ? `<div class="empty">
          ${ICONS.book}
          <h2>${escapeHtml(t.noCourses)}</h2>
          <p class="muted">${escapeHtml(t.noCoursesLead)}</p>
          <a class="btn btn-ghost btn-auto" href="${escapeHtml(coursesHome(locale))}" style="margin-top:8px">${escapeHtml(t.browse)}</a>
        </div>`
      : `<div class="course-grid">${courses
          .map((course) => {
            const href = `/${lang}/courses/${escapeHtml(course.courseSlug ?? "")}`;
            const extras = [
              course.repo
                ? `<a class="course-sub" href="${escapeHtml(course.repo)}" target="_blank" rel="noopener">${escapeHtml(t.accountRepo)}</a>`
                : "",
              course.community
                ? `<a class="course-sub" href="${escapeHtml(course.community)}" target="_blank" rel="noopener">${escapeHtml(t.accountCommunity)}</a>`
                : "",
            ]
              .filter(Boolean)
              .join("");
            return `<article class="course-card">
          <div class="course-icon" style="background-image:${accentFor({ accent: course.accent })}">${ICONS.book}</div>
          <div>
            <h2 class="course-title">${escapeHtml(course.title)}</h2>
            <p class="course-meta">${escapeHtml(course.planLabel || "")}</p>
          </div>
          <div class="course-links">
            <a class="course-link" href="${href}">${escapeHtml(t.continueLearning)} →</a>
            ${extras}
          </div>
        </article>`;
          })
          .join("")}</div>`;

  const body = `
    <div class="page-head account-head">
      <div>
        <h1>${escapeHtml(t.accountHeading)}</h1>
        <p class="account-email">${escapeHtml(email)} · ${escapeHtml(count)}</p>
      </div>
      <form method="post" action="/auth/logout" style="margin:0">
        <button class="btn btn-ghost btn-auto" type="submit" style="padding:8px 12px;font-size:13px">${escapeHtml(t.logout)}</button>
      </form>
    </div>
    ${noticeFor({ status, t, refreshHref })}
    <p class="lead">${escapeHtml(t.accountLead)}</p>
    ${grid}`;
  return shell({ locale, title: t.accountTitle, body, active: "account", head });
}

/** 付款状态条；status 为 null 时完全不出现在页面上 */
function noticeFor({ status, t, refreshHref }) {
  const labels = {
    paid: { className: "notice-ok", title: t.accountPaidTitle, lead: t.accountPaidLead },
    pending: { className: "notice-wait", title: t.accountPendingTitle, lead: t.accountPendingLead },
    unpaid: { className: "notice-wait", title: t.accountUnpaidTitle, lead: t.accountUnpaidLead },
  };
  const entry = labels[status];
  if (!entry) return "";
  const refresh = refreshHref
    ? `<a href="${escapeHtml(refreshHref)}">${escapeHtml(t.accountRefreshNow)}</a>`
    : "";
  const hint = status === "pending" ? `<span class="muted">${escapeHtml(t.accountRefreshing)}</span>` : "";
  return `<div class="notice ${entry.className}">
      <div>
        <strong>${escapeHtml(entry.title)}</strong>
        <p>${escapeHtml(entry.lead)}</p>
        ${refresh || hint ? `<div class="notice-foot">${refresh}${hint}</div>` : ""}
      </div>
    </div>`;
}

/* ------------------------------------------------------------------ */
/* 拒绝 / 不可用 / 错误                                                */
/* ------------------------------------------------------------------ */

export function renderDeniedPage({ locale = "zh", courseTitle = "" } = {}) {
  const t = strings(locale);
  const body = `
    <div class="card">
      <div class="card-body">
        <h1>${escapeHtml(t.deniedHeading)}</h1>
        ${courseTitle ? `<p class="muted" style="margin-bottom:12px">${escapeHtml(courseTitle)}</p>` : ""}
        <p class="lead">${escapeHtml(t.deniedLead)}</p>
        <a class="btn btn-primary" href="${escapeHtml(coursesHome(locale))}">${escapeHtml(t.browse)}</a>
      </div>
    </div>`;
  return shell({ locale, title: t.deniedTitle, body, narrow: true });
}

export function renderUnavailablePage({ locale = "zh" } = {}) {
  const t = strings(locale);
  const body = `
    <div class="card">
      <div class="card-body">
        <h1>${escapeHtml(t.unavailableHeading)}</h1>
        <p class="lead">${escapeHtml(t.unavailableLead)}</p>
        <a class="btn btn-ghost" href="/login">${escapeHtml(t.retry)}</a>
      </div>
    </div>`;
  return shell({ locale, title: t.unavailableTitle, body, narrow: true });
}

/**
 * 错误页：按原因给不同文案，避免「买课 404」显示成「登录失败」。
 * reason: "login" | "unknown-course" | "payment"
 */
export function renderErrorPage({ locale = "zh", next = "/account", reason = "login" } = {}) {
  const t = strings(locale);

  if (reason === "unknown-course") {
    const body = `
      <div class="card">
        <div class="card-body">
          <h1>${escapeHtml(t.errorCourseTitle)}</h1>
          <p class="lead">${escapeHtml(t.errorCourseLead)}</p>
          <a class="btn btn-primary" href="${escapeHtml(coursesHome(locale))}">${escapeHtml(t.errorCourseAction)}</a>
        </div>
      </div>`;
    return shell({ locale, title: t.errorCourseTitle, body, narrow: true });
  }

  if (reason === "payment") {
    const body = `
      <div class="card">
        <div class="card-body">
          <h1>${escapeHtml(t.errorPaymentTitle)}</h1>
          <p class="lead">${escapeHtml(t.errorPaymentLead)}</p>
          <a class="btn btn-primary" href="${escapeHtml(next)}">${escapeHtml(t.errorPaymentAction)}</a>
        </div>
      </div>`;
    return shell({ locale, title: t.errorPaymentTitle, body, narrow: true });
  }

  const body = `
    <div class="card">
      <div class="card-body">
        <h1>${escapeHtml(t.errorHeading)}</h1>
        <p class="lead">${escapeHtml(t.errorLead)}</p>
        <a class="btn btn-primary" href="/login?next=${encodeURIComponent(next)}">${escapeHtml(t.retry)}</a>
      </div>
    </div>`;
  return shell({ locale, title: t.errorTitle, body, narrow: true });
}
