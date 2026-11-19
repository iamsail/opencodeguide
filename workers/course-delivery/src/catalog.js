/**
 * 课程目录（运行时）：Worker 读不到仓库里的 content/courses/*.json，
 * 所以用 COURSE_CATALOG 环境变量注入「slug:plan → 标题 / 价格 / Stripe Price ID」。
 *
 * 由 scripts/courses/sync-worker-catalog.mjs 生成，避免手动维护两份价格。
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
    planLabel: String(value.planLabel ?? plan ?? ""),
    amount: Number(value.amount ?? 0),
    currency: String(value.currency ?? "usd").toLowerCase(),
    priceId: typeof value.priceId === "string" ? value.priceId : null,
  };
}

export function getCatalogEntry(env = {}, slug, plan) {
  if (!slug || !plan) return null;
  const raw = readRawCatalog(env);
  const value = raw[`${slug}:${plan}`];
  if (!value) return null;
  return normalize(`${slug}:${plan}`, value);
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
