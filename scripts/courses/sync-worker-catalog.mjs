#!/usr/bin/env node
/**
 * 生成 Worker 运行时用的课程目录（COURSE_CATALOG）。
 *
 * 为什么需要：Worker 读不到仓库里的 content/courses/*.json，但购买页要显示
 * 课程名、价格，Checkout Session 还需要 Stripe 的 price id。这里把三份数据
 * 合成一个 JSON，注入 Worker 环境变量，避免手动维护两份价格。
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
const PRODUCTS_FILE = path.join(COURSE_DIR, "stripe-products.json");
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

const products = readJson(PRODUCTS_FILE, {});
const catalog = {};
const missing = [];

const courses = fs
  .readdirSync(COURSE_DIR)
  .filter((file) => file.endsWith(".json") && !file.startsWith("stripe-") && file !== "access.json")
  .map((file) => readJson(path.join(COURSE_DIR, file), null))
  .filter((course) => course?.slug);

for (const course of courses) {
  for (const plan of course.plans ?? []) {
    const key = `${course.slug}:${plan.id}`;
    const priceId = products[key]?.priceId ?? null;
    if (!priceId) missing.push(key);

    const label = PLAN_LABELS[plan.id] ?? { zh: plan.id, en: plan.id };
    catalog[key] = {
      title: course.locales?.zh?.title ?? course.locales?.en?.title ?? course.slug,
      titleEn: course.locales?.en?.title ?? course.locales?.zh?.title ?? course.slug,
      planLabel: label.zh,
      planLabelEn: label.en,
      amount: Math.round(Number(plan.priceUSD) * 100),
      currency: "usd",
      // 与 content/courses/*.json 的 accent 一致，成员站购买页用它渲染渐变头
      accent: course.accent ?? null,
      priceId,
    };
  }
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });

const payload = { COURSE_CATALOG: JSON.stringify(catalog) };
fs.writeFileSync(OUT_FILE, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 });

console.log(`课程计划：${Object.keys(catalog).length} 条`);
for (const [key, entry] of Object.entries(catalog)) {
  console.log(`  ${key.padEnd(32)} ${String(entry.amount).padStart(6)} ${entry.currency}  ${entry.priceId ?? "（缺 priceId）"}`);
}
if (missing.length > 0) {
  console.error(`\n✖ 以下计划缺少 priceId（先跑 stripe-provision）：${missing.join(", ")}`);
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
