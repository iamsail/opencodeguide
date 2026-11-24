/**
 * 课程目录（运行时）：Worker 读不到仓库里的 content/courses/*.json，
 * 所以用 COURSE_CATALOG 环境变量注入「slug:plan → 标题 / 价格 / 主题色」。
 *
 * 由 scripts/courses/sync-worker-catalog.mjs 生成，避免手动维护两份价格。
 *
 * 这里**没有** Stripe priceId：结账用 `price_data` 现场报价（金额来自本目录），
 * 不再预建 Product / Price。详见 docs/courses/04-stripe-integration.md。
 */

function readRawCatalog(env = {}) {
  const raw = env.COURSE_CATALOG;
  if (typeof raw !== "string" || !raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    console.error("[catalog] COURSE_CATALOG 不是合法 JSON，按空目录处理");
    return {};
  }
}

export function listCatalogEntries(env = {}) {
  return Object.entries(readRawCatalog(env)).map(([key, value]) => ({
    key,
    ...normalize(key, value),
  }));
}

function normalize(key, value = {}) {
  const [slug, plan] = String(key).split(":");
  return {
    slug: slug ?? "",
    plan: plan ?? "",
    title: String(value.title ?? slug ?? ""),
    // 英文标题只影响结账页/发票上的行项目名，缺失时回退中文标题
    titleEn: String(value.titleEn ?? value.title ?? slug ?? ""),
    planLabel: String(value.planLabel ?? plan ?? ""),
    planLabelEn: String(value.planLabelEn ?? value.planLabel ?? plan ?? ""),
    amount: Number(value.amount ?? 0),
    currency: String(value.currency ?? "usd").toLowerCase(),
    // 购买页渐变头用的主题色（来自 content/courses/*.json 的 accent）
    accent: typeof value.accent === "string" ? value.accent : null,
  };
}

export function getCatalogEntry(env = {}, slug, plan) {
  if (!slug || !plan) return null;
  const raw = readRawCatalog(env);
  const value = raw[`${slug}:${plan}`];
  if (!value) return null;
  return normalize(`${slug}:${plan}`, value);
}

/**
 * 结账行项目名：发票、收据、银行账单上显示的就是它。
 * 带品牌前缀 + 课程名 + 计划名，买家在 Stripe 页面和邮件里认得出这是哪门课。
 */
export function displayTitle(entry, locale = "zh", brand = "OpenCode Guide") {
  const course = locale === "en" ? entry?.titleEn : entry?.title;
  const plan = locale === "en" ? entry?.planLabelEn : entry?.planLabel;
  // 标题里已经含计划名时（例如「全站通：四门课一次拿下」+「全站通」）不再重复拼
  const suffix = plan && !String(course ?? "").includes(plan) ? plan : "";
  const name = [course, suffix].filter(Boolean).join(" · ");
  return name ? `${brand} · ${name}` : brand;
}

export function formatPrice(entry, locale = "zh") {
  const amount = Number(entry?.amount ?? 0);
  const currency = String(entry?.currency ?? "usd").toUpperCase();
  try {
    return new Intl.NumberFormat(locale === "en" ? "en-US" : "zh-CN", {
      style: "currency",
      currency,
      maximumFractionDigits: amount % 100 === 0 ? 0 : 2,
    }).format(amount / 100);
  } catch {
    return `$${(amount / 100).toFixed(amount % 100 === 0 ? 0 : 2)}`;
  }
}
