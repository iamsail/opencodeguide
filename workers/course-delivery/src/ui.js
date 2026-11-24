/**
 * 成员站页面的设计系统层（P2.4）
 * ------------------------------------------------------------
 * Worker 直接渲染登录 / 购买 / 账户 / 错误页，不经过 Next 构建，
 * 所以这里手写一份与公开站对齐的 token 与组件样式：
 *
 *   - 色板取 tailwind.config.ts 里的 zinc 系（gray 50–950）
 *   - 字体与公开站一致（Inter + 系统中文字体兜底）
 *   - 卡片 16px / 按钮 8px 圆角，主按钮黑底白字（暗色反色）
 *   - 暗色跟随公开站的 class 策略：<html class="dark">，localStorage 键名
 *     与 next-themes 默认的 "theme" 保持一致，两个站点的偏好互不覆盖
 *
 * 约束：不引任何外部 CSS / JS / 字体，页面离线可渲染，CSP 友好。
 */

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ------------------------------------------------------------------ */
/* 设计 token                                                          */
/* ------------------------------------------------------------------ */

const DARK_VARS = `--bg:#09090b;--fg:#fafafa;--muted:#a1a1aa;--border:#27272a;
  --surface:#111113;--surface-2:#18181b;--primary-bg:#fafafa;--primary-fg:#18181b;
  --ring:#52525b;--shadow:0 1px 2px rgba(0,0,0,.5);`;

const LIGHT_VARS = `--bg:#ffffff;--fg:#18181b;--muted:#71717a;--border:#e4e4e7;
  --surface:#ffffff;--surface-2:#fafafa;--primary-bg:#18181b;--primary-fg:#ffffff;
  --ring:#a1a1aa;--shadow:0 1px 2px rgba(24,24,27,.06);`;

export const PAGE_CSS = `
:root{${LIGHT_VARS}color-scheme:light}
.dark{${DARK_VARS}color-scheme:dark}
@media (prefers-color-scheme:dark){html:not(.light){${DARK_VARS}color-scheme:dark}}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--fg);font-size:15px;line-height:1.65;
  font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"PingFang SC","Microsoft YaHei",sans-serif;
  -webkit-font-smoothing:antialiased;display:flex;flex-direction:column;min-height:100vh}
a{color:inherit}
.container{width:100%;max-width:1040px;margin:0 auto;padding:0 20px}
.container-narrow{max-width:520px}

/* 头部 */
.site-header{position:sticky;top:0;z-index:50;border-bottom:1px solid var(--border);
  background:var(--bg);backdrop-filter:saturate(180%) blur(8px)}
.site-header .inner{display:flex;align-items:center;justify-content:space-between;gap:16px;height:56px}
.brand{display:flex;align-items:center;gap:8px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:-.01em}
.brand .chip{font-size:11px;font-weight:500;padding:2px 8px;border:1px solid var(--border);border-radius:999px;color:var(--muted)}
.nav{display:flex;align-items:center;gap:20px;font-size:14px;font-weight:500}
.nav a{color:var(--muted);text-decoration:none;transition:color .15s}
.nav a:hover{color:var(--fg)}
.nav a[aria-current="page"]{color:var(--fg)}
.tools{display:flex;align-items:center;gap:6px}
.icon-btn{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;
  border:1px solid var(--border);border-radius:8px;background:transparent;color:var(--muted);cursor:pointer;transition:.15s}
.icon-btn:hover{color:var(--fg);border-color:var(--ring)}
.icon-btn svg{width:16px;height:16px}
.lang-link{font-size:13px;color:var(--muted);text-decoration:none;padding:6px 8px;border-radius:8px}
.lang-link:hover{color:var(--fg)}
@media (max-width:720px){.nav{display:none}}

/* 页面骨架 */
.page{flex:1;padding:40px 0 64px}
.page-head{margin-bottom:24px}
h1{margin:0 0 8px;font-size:26px;line-height:1.3;letter-spacing:-.02em}
h2{margin:0 0 6px;font-size:17px;line-height:1.35}
p{margin:0 0 14px;color:var(--muted)}
.lead{color:var(--muted);margin:0 0 20px}
.muted{color:var(--muted);font-size:13px}
.stack>*+*{margin-top:16px}

/* 卡片 */
.card{background:var(--surface);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow);overflow:hidden}
.card-body{padding:28px 24px}
.card-accent{height:6px;background-image:linear-gradient(90deg,#6366f1,#8b5cf6,#d946ef)}
.card-head{padding:20px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:12px}
.card-foot{padding:16px 24px;border-top:1px solid var(--border);background:var(--surface-2);font-size:12px;color:var(--muted)}

/* 按钮 */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;
  padding:12px 16px;border-radius:8px;border:1px solid transparent;font-size:15px;font-weight:600;
  text-decoration:none;cursor:pointer;transition:.15s;font-family:inherit}
.btn svg{width:18px;height:18px}
.btn-primary{background:var(--primary-bg);color:var(--primary-fg)}
.btn-primary:hover{opacity:.88}
.btn-ghost{border-color:var(--border);background:transparent;color:var(--fg)}
.btn-ghost:hover{background:var(--surface-2)}
.btn-auto{width:auto}
.btn:focus-visible,.icon-btn:focus-visible,a:focus-visible{outline:2px solid var(--ring);outline-offset:2px}

/* 明细列表 */
.facts{margin:0;display:grid;grid-template-columns:auto 1fr;gap:12px 20px;font-size:14px}
.facts dt{color:var(--muted)}
.facts dd{margin:0;text-align:right;font-weight:600}
.facts .total{font-size:22px;letter-spacing:-.02em}
.divider{height:1px;background:var(--border);margin:20px 0}
.note{display:flex;gap:8px;align-items:flex-start;font-size:12px;color:var(--muted);margin:0 0 8px}
.note svg{width:14px;height:14px;flex:0 0 auto;margin-top:2px}

/* 提示条 */
.alert{display:flex;gap:8px;align-items:flex-start;padding:12px 14px;border-radius:10px;
  border:1px solid #fecaca;background:#fef2f2;color:#b91c1c;font-size:13px;margin:0 0 16px}
.dark .alert{border-color:#7f1d1d;background:#1c1113;color:#fca5a5}

/* 账户页课程卡 */
.course-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}
.course-card{display:flex;flex-direction:column;gap:12px;padding:18px;background:var(--surface);
  border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow);transition:.15s}
.course-card:hover{border-color:var(--ring);transform:translateY(-1px)}
.course-icon{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;
  color:#fff;background-image:linear-gradient(135deg,#6366f1,#8b5cf6)}
.course-icon svg{width:20px;height:20px}
.course-title{font-weight:600;font-size:15px;line-height:1.4;margin:0}
.course-meta{font-size:12px;color:var(--muted);margin:0}
.empty{padding:40px 24px;text-align:center;border:1px dashed var(--border);border-radius:16px}
.empty svg{width:28px;height:28px;color:var(--muted);margin-bottom:10px}

/* 状态提示条（付款成功 / 正在开通 / 处理中） */
.notice{display:flex;gap:10px;align-items:flex-start;padding:14px 16px;border-radius:12px;
  border:1px solid var(--border);background:var(--surface-2);margin:0 0 20px;font-size:13px}
.notice strong{display:block;font-size:14px;color:inherit;margin-bottom:2px}
.notice p{margin:0;color:inherit;opacity:.9}
.notice-foot{display:flex;gap:12px;align-items:center;margin-top:8px;font-size:12px}
.notice-foot a{color:inherit;text-decoration:underline}
.notice-ok{border-color:#a7f3d0;background:#ecfdf5;color:#065f46}
.dark .notice-ok{border-color:#064e3b;background:#062e25;color:#6ee7b7}
.notice-wait{border-color:#fde68a;background:#fffbeb;color:#92400e}
.dark .notice-wait{border-color:#78350f;background:#2a1c05;color:#fcd34d}

/* 账户页头部 */
.account-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}
.account-email{font-size:13px;color:var(--muted);margin:4px 0 0}

/* 购买页两栏 */
.buy-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:20px;align-items:start}
.buy-aside{position:sticky;top:76px}
@media (max-width:820px){.buy-grid{grid-template-columns:1fr}.buy-aside{position:static}}
.buy-price{font-size:32px;font-weight:700;letter-spacing:-.03em;margin:0 0 4px}
.buy-actions{display:flex;flex-direction:column;gap:12px}
.course-link{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:var(--fg);text-decoration:none}
.course-links{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;margin-top:auto}
.course-sub{font-size:12px;color:var(--muted);text-decoration:none}
.course-sub:hover{color:var(--fg);text-decoration:underline}
.course-link:hover{text-decoration:underline}

/* 页脚 */
.site-footer{border-top:1px solid var(--border);margin-top:auto;padding:24px 0;font-size:13px;color:var(--muted)}
.site-footer .inner{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;align-items:center}
.site-footer nav{display:flex;gap:16px;flex-wrap:wrap}
.site-footer a{color:var(--muted);text-decoration:none}
.site-footer a:hover{color:var(--fg);text-decoration:underline}
`;

/* ------------------------------------------------------------------ */
/* 图标                                                                */
/* ------------------------------------------------------------------ */

export function googleMark(size = 18) {
  return `<svg viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.2C12.4 13.5 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-2.8-.4-4.1H24v8.1h12.5c-.3 2.1-1.6 5.2-4.6 7.3l7.7 6c4.5-4.2 6.5-10.3 6.5-17.3z"/><path fill="#FBBC05" d="M10.5 28.6A14.6 14.6 0 0 1 9.7 24c0-1.6.3-3.1.8-4.6l-7.9-6.2A24 24 0 0 0 0 24c0 3.9.9 7.6 2.6 10.8l7.9-6.2z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.6-5.8l-7.7-6c-2.1 1.4-4.9 2.4-7.9 2.4-6.3 0-11.6-4-13.5-9.9l-7.9 6.2C6.5 42.6 14.6 48 24 48z"/></svg>`;
}

const SUN = `<svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`;
const MOON = `<svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>`;
const BOOK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`;
const LOCK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
const SHIELD = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>`;
const CARD = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>`;
const ALERT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/></svg>`;

export const ICONS = { sun: SUN, moon: MOON, book: BOOK, lock: LOCK, shield: SHIELD, card: CARD, alert: ALERT };

/* ------------------------------------------------------------------ */
/* 课程配色（与 content/courses/*.json 的 accent 白名单一致）            */
/* ------------------------------------------------------------------ */

const ACCENTS = {
  "from-indigo-500 via-violet-500 to-fuchsia-500": "linear-gradient(135deg,#6366f1,#8b5cf6,#d946ef)",
  "from-emerald-500 via-teal-500 to-cyan-500": "linear-gradient(135deg,#10b981,#14b8a6,#06b6d4)",
  "from-amber-500 via-orange-500 to-rose-500": "linear-gradient(135deg,#f59e0b,#f97316,#f43f5e)",
  "from-sky-500 via-blue-500 to-indigo-500": "linear-gradient(135deg,#0ea5e9,#3b82f6,#6366f1)",
  "from-slate-900 via-slate-800 to-indigo-900": "linear-gradient(135deg,#0f172a,#1e293b,#312e81)",
};

const DEFAULT_ACCENT = ACCENTS["from-indigo-500 via-violet-500 to-fuchsia-500"];

/** accent 可能是 tailwind 类名（catalog）或 slug（无 catalog 时兜底） */
export function accentFor(course = {}) {
  const raw = typeof course === "string" ? course : course.accent;
  if (raw && ACCENTS[raw]) return ACCENTS[raw];
  return DEFAULT_ACCENT;
}

/* ------------------------------------------------------------------ */
/* 头部 / 页脚 / 骨架                                                   */
/* ------------------------------------------------------------------ */

const SITE = "https://opencodeguide.com";

const NAV = {
  zh: [
    { label: "课程", href: `${SITE}/zh/courses` },
    { label: "文档", href: `${SITE}/zh/docs` },
    { label: "我的课程", href: "/account", self: true },
  ],
  en: [
    { label: "Courses", href: `${SITE}/en/courses` },
    { label: "Docs", href: `${SITE}/en/docs` },
    { label: "My courses", href: "/account", self: true },
  ],
};

const FOOT = {
  zh: {
    home: "学习首页",
    privacy: "隐私政策",
    refund: "退款政策",
    contact: "联系我们",
    copyright: "OpenCode Guide · 课程阅读区",
  },
  en: {
    home: "Course home",
    privacy: "Privacy",
    refund: "Refund policy",
    contact: "Contact",
    copyright: "OpenCode Guide · Course library",
  },
};

/** 首屏前定主题，避免白闪；键名与公开站的 next-themes 一致 */
export function themeScript() {
  return `<script>(function(){try{var s=localStorage.getItem("theme");var d=s==="dark"||((!s||s==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.classList.toggle("light",!d);}catch(e){}})();</script>`;
}

const TOGGLE_SCRIPT = `<script>(function(){var b=document.getElementById("theme-toggle");if(!b)return;b.addEventListener("click",function(){var r=document.documentElement;var dark=!r.classList.contains("dark");r.classList.toggle("dark",dark);r.classList.toggle("light",!dark);b.setAttribute("aria-pressed",String(dark));try{localStorage.setItem("theme",dark?"dark":"light");}catch(e){}});})();</script>`;

export function renderHeader({ locale = "zh", active = null } = {}) {
  const lang = locale === "en" ? "en" : "zh";
  const items = NAV[lang]
    .map((item) => {
      const current = active && item.self && active === "account" ? ' aria-current="page"' : "";
      const external = item.self ? "" : ' rel="noopener"';
      return `<a href="${escapeHtml(item.href)}"${current}${external}>${escapeHtml(item.label)}</a>`;
    })
    .join("");
  const otherLang = lang === "zh" ? "en" : "zh";
  const otherLabel = lang === "zh" ? "EN" : "中文";
  return `<header class="site-header"><div class="container inner">
  <a class="brand" href="${SITE}/">OpenCode Guide<span class="chip">${lang === "zh" ? "阅读区" : "Library"}</span></a>
  <nav class="nav">${items}</nav>
  <div class="tools">
    <a class="lang-link" href="?lang=${otherLang}" hreflang="${otherLang}">${otherLabel}</a>
    <button class="icon-btn" id="theme-toggle" type="button" aria-label="${lang === "zh" ? "切换主题" : "Toggle theme"}" aria-pressed="false">${SUN}${MOON}</button>
  </div>
</div></header>`;
}

export function renderFooter({ locale = "zh" } = {}) {
  const lang = locale === "en" ? "en" : "zh";
  const t = FOOT[lang];
  const prefix = lang === "en" ? "/en" : "/zh";
  return `<footer class="site-footer"><div class="container inner">
  <span>${escapeHtml(t.copyright)}</span>
  <nav>
    <a href="${SITE}${prefix}/courses">${escapeHtml(t.home)}</a>
    <a href="${SITE}/privacy">${escapeHtml(t.privacy)}</a>
    <a href="${SITE}${prefix}/refund-policy">${escapeHtml(t.refund)}</a>
    <a href="${SITE}/contact">${escapeHtml(t.contact)}</a>
  </nav>
</div></footer>`;
}

/** 主题按钮的图标显隐由 CSS 控制，这里补一段最简样式 */
const THEME_ICON_CSS = `#theme-toggle .sun{display:block}#theme-toggle .moon{display:none}
.dark #theme-toggle .sun{display:none}.dark #theme-toggle .moon{display:block}`;

/**
 * 统一页面骨架
 * @param {{ locale?: string, title: string, body: string, narrow?: boolean, active?: string, head?: string }} options
 */
export function shell({ locale = "zh", title, body, narrow = false, active = null, head = "" }) {
  const lang = locale === "en" ? "en" : "zh";
  return `<!doctype html>
<html lang="${lang === "en" ? "en" : "zh-CN"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="color-scheme" content="light dark">
<title>${escapeHtml(title)}</title>
${head}
${themeScript()}
<style>${PAGE_CSS}${THEME_ICON_CSS}</style>
</head>
<body>
${renderHeader({ locale: lang, active })}
<main class="page"><div class="container${narrow ? " container-narrow" : ""}">
${body}
</div></main>
${renderFooter({ locale: lang })}
${TOGGLE_SCRIPT}
</body>
</html>`;
}
