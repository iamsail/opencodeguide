#!/usr/bin/env node
/**
 * 用 Stripe API 为每门课程 × 每个计划创建 Product + Price + Payment Link。
 *
 * 为什么用 Payment Link：
 *   - 本站是 `output: 'export'` 的纯静态导出（为了把 Vercel 成本压到 0），
 *     没有 API Route / Server Function，无法在服务端创建 Checkout Session。
 *   - Payment Link 由 Stripe 托管，支持优惠码、税务、发票、3DS，
 *     并且可以直接把结账页 URL 写进静态 HTML。
 *   - 后续要升级为自建 Checkout Session + Webhook 时，本脚本生成的
 *     Product / Price 仍然可以复用（见 docs/courses/04-stripe.md）。
 *
 * 用法：
 *   STRIPE_SECRET_KEY=sk_test_xxx node scripts/courses/stripe-payment-links.mjs
 *   node scripts/courses/stripe-payment-links.mjs --dry-run
 *   node scripts/courses/stripe-payment-links.mjs --only=indie-saas-launch --force
 *
 * 产物：content/courses/stripe-links.json（提交到仓库，静态站构建时读取）
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const COURSE_DIR = path.join(ROOT, "content/courses");
const LINKS_FILE = path.join(COURSE_DIR, "stripe-links.json");
const PRODUCTS_FILE = path.join(COURSE_DIR, "stripe-products.json");
const API = "https://api.stripe.com/v1";
const API_VERSION = "2024-06-20";

const PLAN_LABELS = {
  single: { zh: "单课版", en: "Single" },
  pro: { zh: "Pro 版", en: "Pro" },
  "all-access": { zh: "全站通", en: "All-Access" },
};

function parseArgs(argv) {
  const args = { dryRun: false, force: false, only: null, baseUrl: "https://opencodeguide.com", redirectLocale: "zh" };
  for (const raw of argv) {
    const [key, value] = raw.replace(/^--/, "").split("=");
    if (key === "dry-run") args.dryRun = true;
    else if (key === "force") args.force = true;
    else if (key === "only") args.only = value;
    else if (key === "base-url") args.baseUrl = value;
    else if (key === "redirect-locale") args.redirectLocale = value === "en" ? "en" : "zh";
  }
  return args;
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function loadCourses() {
  return fs
    .readdirSync(COURSE_DIR)
    .filter((file) => file.endsWith(".json") && !file.startsWith("stripe-"))
    .map((file) => readJson(path.join(COURSE_DIR, file), null))
    .filter((course) => course?.slug);
}

/** 把嵌套对象拍平成 Stripe 需要的 a[b][c]=v 形式 */
function encode(params, prefix = "", out = []) {
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    const name = prefix ? `${prefix}[${key}]` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      encode(value, name, out);
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (item !== null && typeof item === "object") {
          encode(item, `${name}[${index}]`, out);
        } else {
          out.push([`${name}[${index}]`, String(item)]);
        }
      });
    } else {
      out.push([name, String(value)]);
    }
  }
  return out;
}

async function stripe(pathname, body, secretKey) {
  const response = await fetch(`${API}${pathname}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": API_VERSION,
    },
    body: new URLSearchParams(encode(body)).toString(),
  });

  const payload = await response.json();
  if (!response.ok) {
    const message = payload?.error?.message ?? response.statusText;
    throw new Error(`Stripe ${pathname} failed: ${message}`);
  }
  return payload;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const mode = secretKey?.startsWith("sk_live_")
    ? "live"
    : secretKey?.startsWith("sk_test_")
      ? "test"
      : null;

  if (!secretKey && !args.dryRun) {
    console.error("缺少 STRIPE_SECRET_KEY。可先用 --dry-run 查看将要创建的内容。");
    process.exit(1);
  }
  if (secretKey && !mode) {
    console.error("STRIPE_SECRET_KEY 必须以 sk_test_ 或 sk_live_ 开头。");
    process.exit(1);
  }

  const courses = loadCourses().filter(
    (course) => !args.only || course.slug === args.only,
  );
  if (!courses.length) {
    console.error("没有匹配的课程。");
    process.exit(1);
  }

  const products = readJson(PRODUCTS_FILE, {});
  const links = readJson(LINKS_FILE, { plans: {} });
  links.plans = links.plans || {};

  for (const course of courses) {
    for (const plan of course.plans) {
      const key = `${course.slug}:${plan.id}`;
      const label = PLAN_LABELS[plan.id]?.["en"] ?? plan.id;
      const title = `${course.locales.en.title} — ${label}`;
      const amount = Math.round(plan.priceUSD * 100);
      const redirectUrl = `${args.baseUrl}/${args.redirectLocale}/courses/thank-you/?course=${course.slug}&plan=${plan.id}`;

      if (products[key]?.url && !args.force) {
        links.plans[key] = products[key].url;
        console.log(`= skip ${key} (${products[key].url})`);
        continue;
      }

      if (args.dryRun) {
        console.log(`+ would create ${key} | ${amount} usd | ${title}`);
        console.log(`  redirect: ${redirectUrl}`);
        continue;
      }

      console.log(`+ creating product for ${key}`);
      const product = await stripe(
        "/products",
        {
          name: title,
          description: course.locales.en.seo.description,
          metadata: { course_slug: course.slug, plan_id: plan.id, locale: "en" },
        },
        secretKey,
      );

      console.log(`+ creating price for ${key}`);
      const price = await stripe(
        "/prices",
        {
          product: product.id,
          currency: "usd",
          unit_amount: amount,
          nickname: label,
          metadata: { course_slug: course.slug, plan_id: plan.id },
        },
        secretKey,
      );

      console.log(`+ creating payment link for ${key}`);
      const link = await stripe(
        "/payment_links",
        {
          line_items: [{ price: price.id, quantity: 1 }],
          allow_promotion_codes: true,
          invoice_creation: { enabled: true },
          after_completion: {
            type: "redirect",
            redirect: { url: redirectUrl },
          },
          metadata: {
            course_slug: course.slug,
            plan_id: plan.id,
            // 交付 Worker 用它渲染邮件标题，避免把 slug 直接写进用户邮箱
            course_title_zh: course.locales.zh.title.slice(0, 500),
            course_title_en: course.locales.en.title.slice(0, 500),
          },
        },
        secretKey,
      );

      products[key] = {
        mode,
        productId: product.id,
        priceId: price.id,
        paymentLinkId: link.id,
        url: link.url,
      };
      links.plans[key] = link.url;
      writeJson(PRODUCTS_FILE, products);
      writeJson(LINKS_FILE, {
        generatedAt: new Date().toISOString(),
        mode,
        plans: links.plans,
      });
      console.log(`  -> ${link.url}`);
    }
  }

  if (!args.dryRun) {
    writeJson(LINKS_FILE, {
      generatedAt: new Date().toISOString(),
      mode,
      plans: links.plans,
    });
    console.log(`\n已写入 ${path.relative(ROOT, LINKS_FILE)}（mode=${mode}）`);
    console.log("如需在环境变量中覆盖，可使用 STRIPE_LINK_<SLUG>_<PLAN> 形式。");
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
