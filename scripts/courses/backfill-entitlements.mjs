#!/usr/bin/env node
/**
 * 历史订单 → 权益回填（P2.1）
 * ------------------------------------------------------------
 * 权益表是「订单的投影」：只要有 orders，就能算出谁该有什么权益。
 * 所以老订单不需要人工对账，一条 INSERT ... SELECT 就够。
 *
 * 为什么生成 SQL 而不是直连 D1：
 *   1. D1 只有 HTTP 接口，直连要带 token，脚本里留凭证是坏习惯；
 *   2. 生成的 SQL 可以先给人看一眼，再执行（--execute 才会真的跑）；
 *   3. 幂等（on conflict do nothing），手滑跑两次也不会复活已撤销的权益。
 *
 * 用法：
 *   node scripts/courses/backfill-entitlements.mjs                    # 打印 SQL 与命令
 *   node scripts/courses/backfill-entitlements.mjs --out .tmp/x.sql
 *   node scripts/courses/backfill-entitlements.mjs --execute --remote  # 真的执行
 *   node scripts/courses/backfill-entitlements.mjs --execute --local   # 本地 D1
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const COURSE_DIR = path.join(ROOT, "content/courses");
const DEFAULT_OUT = path.join(".tmp", "backfill-entitlements.sql");
const VERIFY_FILE = path.join(".tmp", "verify-entitlements.sql");
const ALL_ACCESS_SLUG = "all-access";
const PAID_STATUSES = "('paid', 'partially_refunded')";
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function parseArgs(argv) {
  const args = { out: DEFAULT_OUT, execute: false, local: false, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--out") args.out = argv[++index] ?? args.out;
    else if (arg === "--execute") args.execute = true;
    else if (arg === "--local") args.local = true;
    else if (arg === "--help" || arg === "-h") args.help = true;
  }
  return args;
}

/** 从课程 JSON 读出「非 bundle」的课程 slug，作为全站通展开的目标 */
function trackCourseSlugs() {
  if (!fs.existsSync(COURSE_DIR)) {
    throw new Error(`找不到课程目录：${COURSE_DIR}`);
  }

  const slugs = [];
  for (const file of fs.readdirSync(COURSE_DIR)) {
    if (!file.endsWith(".json") || file.startsWith("stripe-") || file === "access.json") continue;

    let course;
    try {
      course = JSON.parse(fs.readFileSync(path.join(COURSE_DIR, file), "utf8"));
    } catch {
      continue;
    }
    if (!course?.slug || course.kind === "bundle") continue;
    if (!SLUG_PATTERN.test(course.slug)) {
      throw new Error(`课程 slug 不合法：${course.slug}（只允许小写字母、数字与连字符）`);
    }
    slugs.push(course.slug);
  }

  if (slugs.length === 0) throw new Error("没有找到任何课程 JSON（content/courses/*.json）");
  return [...new Set(slugs)].sort();
}

/**
 * @param {object} options
 * @param {string} options.label       SQL 注释
 * @param {string} options.courseExpr  写入 entitlements.course_slug 的表达式：
 *                                     "course_slug"（跟订单走）或 "'<slug>'"（全站通展开）
 * @param {string} options.whereCourse 筛选订单的条件片段
 */
function insertStatement({ label, courseExpr, whereCourse }) {
  // id 用 randomblob 生成，避免在 SQL 里拼 JS 时间戳；
  // granted_at 取订单创建时间，保持与订单时序一致。
  return `-- ${label}
insert into entitlements (id, email, course_slug, plan_id, order_id, granted_at, revoked_at)
select lower(hex(randomblob(16))),
       lower(trim(email)),
       ${courseExpr},
       plan_id,
       id,
       coalesce(created_at, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
       null
  from orders
 where email <> ''
   and ${whereCourse}
   and status in ${PAID_STATUSES}
on conflict(email, course_slug) do nothing;`;
}

function buildBackfillSql(slugs) {
  const header = `-- 由 scripts/courses/backfill-entitlements.mjs 生成
-- 目标：把历史 orders 投影成 entitlements（P2.1）
-- 幂等：on conflict(email, course_slug) do nothing，重复执行不会复活已撤销的权益
-- 全站通展开为：${slugs.join(", ")} + ${ALL_ACCESS_SLUG}
`;

  const blocks = [
    insertStatement({
      label: "1) 单课订单：一门课一条权益",
      courseExpr: "course_slug",
      whereCourse: "course_slug <> 'all-access'",
    }),
    ...slugs.map((slug) =>
      insertStatement({
        label: `2) 全站通订单 → ${slug}`,
        courseExpr: `'${slug}'`,
        whereCourse: "course_slug = 'all-access'",
      }),
    ),
    insertStatement({
      label: `3) 全站通订单 → ${ALL_ACCESS_SLUG}（bundle 自身）`,
      courseExpr: `'${ALL_ACCESS_SLUG}'`,
      whereCourse: "course_slug = 'all-access'",
    }),
  ];

  return `${header}\n${blocks.join("\n\n")}\n`;
}

const VERIFY_SQL = `-- 回填后自检（由 scripts/courses/backfill-entitlements.mjs 生成）
-- 1) 各课程有效学员数：
select course_slug, count(*) as active
  from entitlements
 where revoked_at is null
 group by 1
 order by 2 desc;

-- 2) 已付款但没有权益的订单（应为 0）：
select count(*) as orders_without_entitlement
  from orders o
 where o.email <> ''
   and o.course_slug <> ''
   and o.status in ${PAID_STATUSES}
   and not exists (select 1 from entitlements e where e.order_id = o.id);

-- 3) 已撤销的权益（全额退款的痕迹）：
select count(*) as revoked from entitlements where revoked_at is not null;
`;

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(
      "用法：node scripts/courses/backfill-entitlements.mjs [--out .tmp/backfill-entitlements.sql] [--execute] [--local]",
    );
    return 0;
  }

  const slugs = trackCourseSlugs();
  const sql = buildBackfillSql(slugs);
  const outPath = path.resolve(ROOT, args.out);
  const verifyPath = path.resolve(ROOT, VERIFY_FILE);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, sql, "utf8");
  fs.writeFileSync(verifyPath, VERIFY_SQL, "utf8");

  console.log(`课程（全站通展开目标）：${slugs.join(", ")}`);
  console.log(`回填 SQL：${path.relative(ROOT, outPath)}（${sql.split("\n").length} 行）`);
  console.log(`自检 SQL：${path.relative(ROOT, verifyPath)}`);

  const target = args.local ? "--local" : "--remote";
  const executeCommand = `npx wrangler d1 execute course-delivery ${target} --file=${path.relative(ROOT, outPath)}`;
  const verifyCommand = `npx wrangler d1 execute course-delivery ${target} --file=${path.relative(ROOT, verifyPath)}`;

  if (!args.execute) {
    console.log("\n执行回填（确认无误后）：");
    console.log(`  ${executeCommand}`);
    console.log("回填后自检：");
    console.log(`  ${verifyCommand}`);
    console.log("\n提示：worker 的 ALL_ACCESS_COURSES 必须包含上面这些课程，否则新订单展开不完全。");
    return 0;
  }

  for (const command of [executeCommand, verifyCommand]) {
    console.log(`\n$ ${command}`);
    const result = spawnSync(command, { shell: true, stdio: "inherit", cwd: ROOT });
    if (result.status !== 0) {
      console.error(`✖ 命令失败（exit ${result.status ?? "?"}）`);
      return result.status ?? 1;
    }
  }

  return 0;
}

process.exit(main());
