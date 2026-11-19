/**
 * Worker 配置与「课程 → 交付物」映射。
 *
 * 设计原则：交付信息（观看链接 / 仓库邀请 / 社群邀请）属于运营配置，
 * 不进代码也不进构建产物，全部通过 Worker 环境变量注入。
 * 这样换视频托管、换社群链接都不需要重新部署静态站。
 */

const PLAN_LABELS = {
  single: { zh: "单课版", en: "Single" },
  pro: { zh: "Pro 版", en: "Pro" },
  "all-access": { zh: "全站通", en: "All-Access" },
};

export function getSettings(env = {}) {
  return {
    siteUrl: env.SITE_URL || "https://opencodeguide.com",
    brandName: env.BRAND_NAME || "OpenCode Guide",
    fromEmail: env.MAIL_FROM || "OpenCode Guide <courses@opencodeguide.com>",
    replyTo: env.MAIL_REPLY_TO || null,
    supportEmail: env.SUPPORT_EMAIL || null,
    resendApiKey: env.RESEND_API_KEY || null,
    adminToken: env.ADMIN_TOKEN || null,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET || null,
    refundDays: Number(env.REFUND_DAYS || 7),
    dryRun: env.EMAIL_DRY_RUN === "1",
    /** 拒付时是否立刻收回权益（默认否：先守住访问、同时举证，避免误伤正常争议） */
    revokeOnDispute: env.REVOKE_ON_DISPUTE === "1",
    /** 会话 JWT 的 HMAC 密钥（wrangler secret put SESSION_SECRET） */
    sessionSecret: env.SESSION_SECRET || null,
    /** 成员站地址；未配置时用请求 origin（本地开发更省事） */
    learnUrl: env.LEARN_URL || null,
  };
}

/**
 * 课程展示名（账户页、登录后列表用）。
 * Worker 运行时读不到 content/courses/*.json，所以这里维护一份短名；
 * 新增课程用 COURSE_NAMES 环境变量覆盖（JSON），不用改代码。
 */
export const COURSE_DISPLAY_NAMES = {
  "ai-coding-workflow": { zh: "AI 编程实战", en: "AI Coding in Practice" },
  "indie-saas-launch": { zh: "独立开发者出海", en: "Indie SaaS Launch" },
  "cross-border-store": { zh: "跨境电商独立站", en: "Cross-border Commerce" },
  "global-site-seo": { zh: "出海网站 SEO", en: "Global Site SEO" },
  "all-access": { zh: "全站通", en: "All-Access" },
};

export function displayCourseName(slug, locale = "zh", env = {}) {
  let overrides = {};
  if (typeof env.COURSE_NAMES === "string" && env.COURSE_NAMES.trim()) {
    try {
      const parsed = JSON.parse(env.COURSE_NAMES);
      if (parsed && typeof parsed === "object") overrides = parsed;
    } catch {
      // 配置写错就退回默认名字，不影响登录
    }
  }

  const entry = overrides[slug] || COURSE_DISPLAY_NAMES[slug];
  if (entry) return entry[locale] || entry.en || entry.zh || slug;

  return String(slug ?? "")
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * 全站通（bundle）展开的目标课程。
 *
 * 为什么要在这里维护一份：Worker 运行时读不到仓库里的 content/courses/*.json，
 * 但「全站通」买家必须一次拿到所有课程的阅读权。新增课程时改这里
 * （或用 ALL_ACCESS_COURSES 环境变量覆盖），否则新课会上架但老 bundle 用户读不到。
 */
export const DEFAULT_ALL_ACCESS_COURSES = [
  "ai-coding-workflow",
  "indie-saas-launch",
  "cross-border-store",
  "global-site-seo",
];

export function allAccessCourses(env = {}) {
  const raw = env.ALL_ACCESS_COURSES;
  if (typeof raw !== "string" || !raw.trim()) return [...DEFAULT_ALL_ACCESS_COURSES];
  const list = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return list.length > 0 ? list : [...DEFAULT_ALL_ACCESS_COURSES];
}

/** 这笔购买是不是「全站通」：bundle 课程（slug=all-access）或 all-access 计划 */
export function isAllAccessPurchase(courseSlug, planId) {
  return courseSlug === "all-access" || planId === "all-access";
}

export function planLabel(planId, locale) {
  const label = PLAN_LABELS[planId];
  if (!label) return planId;
  return label[locale] || label.en;
}

/**
 * 课程 slug → 展示标题（邮件里用）。
 * 优先取 Payment Link 写入的 metadata（course_title_zh / course_title_en），
 * 缺失时退化为 slug 的可读形式，避免邮件里出现裸 slug。
 */
export function courseTitle(session, courseSlug, locale) {
  const metadata = session?.metadata || {};
  const fromMeta =
    locale === "zh"
      ? metadata.course_title_zh || metadata.course_title_en
      : metadata.course_title_en || metadata.course_title_zh;
  if (typeof fromMeta === "string" && fromMeta.trim()) return fromMeta.trim();
  return courseSlug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Stripe Checkout 的 locale 形如 zh / zh-Hans / en / en-US */
export function resolveLocale(session) {
  const raw = typeof session?.locale === "string" ? session.locale.toLowerCase() : "";
  return raw.startsWith("zh") ? "zh" : "en";
}

/**
 * 从 Checkout Session 解析出「买了哪门课的哪个计划」。
 * 优先 client_reference_id（站点链接里带 "slug:plan"），
 * 兜底 Payment Link 的 metadata，最后才认为无法识别。
 */
export function resolvePurchase(session) {
  const metadata = session?.metadata || {};
  const reference =
    typeof session?.client_reference_id === "string" ? session.client_reference_id.trim() : "";

  let courseSlug = null;
  let planId = null;

  if (reference.includes(":")) {
    const [slug, plan] = reference.split(":");
    if (slug && plan) {
      courseSlug = slug.trim();
      planId = plan.trim();
    }
  }

  if (!courseSlug && typeof metadata.course_slug === "string") {
    courseSlug = metadata.course_slug.trim() || null;
  }
  if (!planId && typeof metadata.plan_id === "string") {
    planId = metadata.plan_id.trim() || null;
  }

  return { courseSlug, planId };
}

/**
 * COURSE_DELIVERY 的结构（JSON 字符串）：
 * {
 *   "ai-coding-workflow:*":      { "watch": "https://...", "repo": "https://...", "community": "https://..." },
 *   "ai-coding-workflow:pro":    { "repo": "https://github.com/.../invitations" },
 *   "all-access:*":              { "watch": "https://..." }
 * }
 * 匹配顺序：精确 key → 课程通配（slug:*）→ DEFAULT_* 全局兜底。
 */
function parseDeliveryMap(env) {
  const raw = env.COURSE_DELIVERY;
  if (!raw) return { map: {}, error: null };
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { map: {}, error: "COURSE_DELIVERY 必须是 JSON 对象" };
    }
    return { map: parsed, error: null };
  } catch {
    return { map: {}, error: "COURSE_DELIVERY 不是合法 JSON" };
  }
}

export function resolveDelivery(env, courseSlug, planId) {
  const { map, error } = parseDeliveryMap(env);
  const exact = map[`${courseSlug}:${planId}`] || {};
  const courseWide = map[`${courseSlug}:*`] || {};

  const pick = (field, envDefault) =>
    exact[field] || courseWide[field] || env[envDefault] || null;

  const delivery = {
    watch: pick("watch", "DEFAULT_WATCH_URL"),
    repo: pick("repo", "DEFAULT_REPO_URL"),
    community: pick("community", "DEFAULT_COMMUNITY_URL"),
  };

  return {
    ...delivery,
    /** 只有拿到观看入口才认为可以自动交付 */
    complete: Boolean(delivery.watch),
    configError: error,
  };
}

export function formatMoney(amountCents, currency = "usd") {
  const amount = Number(amountCents || 0) / 100;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: String(currency || "usd").toUpperCase(),
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `$${amount}`;
  }
}
