#!/usr/bin/env node
/**
 * 生成 Worker 运行时用的课程目录（COURSE_CATALOG）。
 *
 * 为什么需要：Worker 读不到仓库里的 content/courses/*.json，但购买页要显示课程名、
 * 价格，结账时还要用金额现报（`price_data`），所以把课程名 / 计划名 / 金额 / 币种 /
 * 主题色合成一个 JSON 注入 Worker。
 *
 * 这里**不含** Stripe priceId：结账用动态报价，不再预建 Product / Price / Payment Link，
 * 所以改价格只需要改 `content/courses/*.json` 再跑一次本脚本，不用碰 Stripe 后台。
 *
 * 用法：
 *   node scripts/courses/sync-worker-catalog.mjs           # 打印并写入 .tmp/
 *   node scripts/courses/sync-worker-catalog.mjs --apply   # 顺便 wrangler secret bulk
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const COURSE_DIR = path.join(ROOT, "content/courses");
const OUT_FILE = path.join(ROOT, ".tmp", "course-catalog.json");
const PLAN_LABELS = {
  single: { zh: "单课版", en: "Single" },
  pro: { zh: "Pro 版", en: "Pro" },
  "all-access": { zh: "全站通", en: "All-Access" },
};

const apply = process.argv.includes("--apply");

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

const catalog = {};
const invalid = [];

const courses = fs
  .readdirSync(COURSE_DIR)
  .filter((file) => file.endsWith(".json") && !file.startsWith("stripe-") && file !== "access.json")
  .map((file) => readJson(path.join(COURSE_DIR, file), null))
  .filter((course) => course?.slug);

for (const course of courses) {
  for (const plan of course.plans ?? []) {
    const key = `${course.slug}:${plan.id}`;
    const amount = Math.round(Number(plan.priceUSD) * 100);
    // 0 元或非数字会直接变成 0 元订单，必须在注入前拦住
    if (!Number.isFinite(amount) || amount <= 0) invalid.push(`${key}（priceUSD=${plan.priceUSD}）`);

    const label = PLAN_LABELS[plan.id] ?? { zh: plan.id, en: plan.id };
    catalog[key] = {
      title: course.locales?.zh?.title ?? course.locales?.en?.title ?? course.slug,
      titleEn: course.locales?.en?.title ?? course.locales?.zh?.title ?? course.slug,
      planLabel: label.zh,
      planLabelEn: label.en,
      amount,
      currency: "usd",
      // 与 content/courses/*.json 的 accent 一致，成员站购买页用它渲染渐变头
      accent: course.accent ?? null,
    };
  }
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });

const payload = { COURSE_CATALOG: JSON.stringify(catalog) };
fs.writeFileSync(OUT_FILE, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 });

console.log(`课程计划：${Object.keys(catalog).length} 条`);
for (const [key, entry] of Object.entries(catalog)) {
  const price = `${String(entry.amount).padStart(6)} ${entry.currency}`;
  console.log(`  ${key.padEnd(32)} ${price}  ${entry.title} · ${entry.planLabel}`);
}
if (invalid.length > 0) {
  console.error(`\n✖ 以下计划金额无效（priceUSD 必须是正数）：${invalid.join(", ")}`);
  process.exit(1);
}

console.log(`\n已写入 ${path.relative(ROOT, OUT_FILE)}`);

if (!apply) {
  console.log("\n注入 Worker（二选一）：");
  console.log("  node scripts/courses/sync-worker-catalog.mjs --apply");
  console.log("  或在 Cloudflare 后台把 COURSE_CATALOG 设为该 JSON 字符串");
  process.exit(0);
}

const result = spawnSync(
  "npx",
  ["wrangler", "secret", "bulk", OUT_FILE],
  { stdio: "inherit", cwd: path.join(ROOT, "workers/course-delivery") },
);
fs.rmSync(OUT_FILE, { force: true });
process.exit(result.status ?? 1);
