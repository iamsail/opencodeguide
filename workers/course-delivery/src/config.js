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
  };
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
