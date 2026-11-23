#!/usr/bin/env node
/**
 * 一条命令发布课程内容
 * ------------------------------------------------------------
 * 以前改一节课要 6 步、跨 2 个仓库、4 个产物。这个脚本把它们串成一条命令：
 *
 *   npm run publish               # 全量：同步元数据 + 构建成员站 + 部署
 *   npm run publish:content       # 只发正文（不动公开站、不产生公开仓提交）
 *   npm run publish:metadata      # 只同步 manifest / 免费试听节
 *   npm run publish:check         # CI 用：只校验一致性，不写、不构建、不部署
 *
 * 常用开关：
 *   --dry-run      只打印将要做什么（不写文件、不构建、不部署）
 *   --skip-deploy  构建 + 自检，但不 wrangler deploy
 *   --push         提交后真的 push（默认只提交，不推送）
 *
 * 推送策略（仓库约定）：默认不 push。加 --push 时必须显式给出网络确认：
 *   GIT_PUSH_CONFIRMED=yes GIT_PUSH_NETWORK=<网络名> npm run publish -- --push
 *
 * 设计原则：
 *   - 只 stage 自己产出的文件（manifest / 免费试听节 / .gitignore 区块），绝不 git add -A
 *   - 每一步失败立即停止，不产生半截状态
 *   - 每步打印耗时，方便判断瓶颈
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const argv = process.argv.slice(2);
const flags = new Set(argv.filter((item) => item.startsWith("--")));

const dryRun = flags.has("--dry-run");
const push = flags.has("--push");
const skipDeploy = flags.has("--skip-deploy");
const onlyContent = flags.has("--content");
const onlyMetadata = flags.has("--metadata");
const checkMode = flags.has("--check");

const doMetadata = !onlyContent;
const doContent = !onlyMetadata;

const steps = [];

function log(message) {
  console.log(message);
}

function run(label, command, args, options = {}) {
  const started = Date.now();
  log(`\n▶ ${label}`);
  if (dryRun && !options.readOnly) {
    log("  （--dry-run：跳过）");
    steps.push({ label, seconds: 0, skipped: true });
    return { status: 0, skipped: true };
  }

  const result = spawnSync(command, args, {
    cwd: options.cwd ?? ROOT,
    stdio: "inherit",
    env: { ...process.env, ...(options.env ?? {}) },
  });

  const seconds = (Date.now() - started) / 1000;
  steps.push({ label, seconds, skipped: false });

  if (result.error) {
    console.error(`  ✖ ${label} 无法执行：${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`  ✖ ${label} 失败（exit ${result.status}），已停止`);
    process.exit(1);
  }
  log(`  ✔ ${label}（${seconds.toFixed(1)}s）`);
  return { status: 0, skipped: false };
}

function node(script, args = [], options = {}) {
  return run(`node ${script}${args.length ? " " + args.join(" ") : ""}`, process.execPath, [script, ...args], options);
}

function git(args, options = {}) {
  return spawnSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    ...options,
  });
}

/** 只关注发布产物的改动 */
const WATCHED_PATHS = ["content/courses/manifest.json", "content/courses/zh", ".gitignore"];

function changedPublishFiles() {
  const result = git(["status", "--porcelain", "--", ...WATCHED_PATHS]);
  if (result.status !== 0) return [];
  return result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[A-Z?]{1,2}\s+/, ""));
}

function privateRoot() {
  const configured = process.env.COURSE_PRIVATE_DIR?.trim();
  if (configured) return path.isAbsolute(configured) ? configured : path.resolve(ROOT, configured);
  return path.resolve(ROOT, "..", "opencodeCourse", "content", "courses");
}

function wranglerInstalled() {
  const candidates = [
    path.join(ROOT, "workers/course-delivery/node_modules/wrangler"),
    path.join(ROOT, "node_modules/wrangler"),
  ];
  return candidates.some((candidate) => fs.existsSync(candidate));
}

// ---------------------------------------------------------------------------
// 0. 前置检查
// ---------------------------------------------------------------------------
log("课程内容发布");
log(`  仓库根：${ROOT}`);
log(`  私有正文根：${privateRoot()}`);
log(`  模式：${checkMode ? "check" : dryRun ? "dry-run" : "publish"}` +
  `${onlyContent ? "（只发正文）" : onlyMetadata ? "（只同步元数据）" : "（全量）"}`);

if (!fs.existsSync(privateRoot())) {
  console.error(`\n✖ 找不到私有正文根：${privateRoot()}`);
  console.error("  设置 COURSE_PRIVATE_DIR，或把私有仓 clone 到 ../opencodeCourse");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 1. 元数据：manifest + 免费试听节
// ---------------------------------------------------------------------------
if (doMetadata) {
  if (checkMode || dryRun) {
    run("校验 manifest 与正文一致", process.execPath, ["scripts/courses/build-manifest.mjs", "--check"], { readOnly: true });
    run("校验免费试听节一致", process.execPath, ["scripts/courses/export-free-lessons.mjs", "--check"], { readOnly: true });
  } else {
    node("scripts/courses/build-manifest.mjs");
    node("scripts/courses/export-free-lessons.mjs");
  }
}

// ---------------------------------------------------------------------------
// 2. 公开仓提交（只 stage 自己产出的文件）
// ---------------------------------------------------------------------------
let pendingCommit = null;
if (doMetadata && !checkMode && !dryRun) {
  const changed = changedPublishFiles();
  if (changed.length === 0) {
    log("\n· 公开仓没有变化（manifest / 免费节都与正文一致）");
  } else {
    log(`\n· 公开仓需要提交 ${changed.length} 个文件：`);
    for (const file of changed.slice(0, 8)) log(`    ${file}`);
    if (changed.length > 8) log(`    …其余 ${changed.length - 8} 个省略`);

    if (push && !(process.env.GIT_PUSH_CONFIRMED === "yes" && process.env.GIT_PUSH_NETWORK)) {
      console.error("\n✖ 要求 --push，但缺少推送确认：");
      console.error("  GIT_PUSH_CONFIRMED=yes GIT_PUSH_NETWORK=<网络名> npm run publish -- --push");
      process.exit(1);
    }

    git(["add", "--", ...WATCHED_PATHS]);
    const lessonCount = changed.filter((file) => file.endsWith(".mdx")).length;
    const message = [
      "content: sync manifest and free trial lessons",
      "",
      `- 变更文件：${changed.length} 个${lessonCount ? `（含 ${lessonCount} 节免费正文）` : ""}`,
      "- 由 npm run publish 自动生成，手改无效",
    ].join("\n");
    const commit = git(["commit", "-m", message, "--", ...WATCHED_PATHS]);
    if (commit.status !== 0) {
      console.error("  ✖ 提交失败：");
      console.error(commit.stdout || commit.stderr || "");
      process.exit(1);
    }
    log("  ✔ 已提交（未推送）");
    pendingCommit = "content: sync manifest and free trial lessons";
  }
}

// ---------------------------------------------------------------------------
// 3. 成员站：构建 + 自检 + 部署
// ---------------------------------------------------------------------------
if (doContent && !checkMode) {
  run("构建成员站", process.execPath, ["scripts/courses/build-members.mjs"], {
    env: { COURSE_PRIVATE_DIR: privateRoot() },
  });
  // 注意：这一步依赖刚构建出的 out-members，所以 dry-run 时必须跳过
  node("scripts/courses/assert-members-pages.mjs", ["--dir", process.env.MEMBERS_OUT_DIR || "out-members"], {
    env: { COURSE_PRIVATE_DIR: privateRoot() },
  });

  if (skipDeploy) {
    log("\n· 跳过部署（--skip-deploy）");
  } else if (!wranglerInstalled()) {
    console.error("\n✖ 没有安装 wrangler，无法部署成员站：");
    console.error("  cd workers/course-delivery && npm install");
    console.error("  或者加 --skip-deploy 只构建 + 自检");
    process.exit(1);
  } else {
    run("部署成员站", "npx", ["wrangler", "deploy"], { cwd: path.join(ROOT, "workers/course-delivery") });
  }
}

// ---------------------------------------------------------------------------
// 4. 推送（默认不做，需要显式 --push）
// ---------------------------------------------------------------------------
if (pendingCommit) {
  if (push) {
    run("推送公开仓", "git", ["push"], { env: { GIT_PUSH_CONFIRMED: "yes" } });
  } else {
    log("\n· 公开仓已提交但未推送。要发布公开站，执行：");
    log("    git push        # 或 npm run publish -- --push（需网络确认）");
  }
}

// ---------------------------------------------------------------------------
// 5. 摘要
// ---------------------------------------------------------------------------
const total = steps.reduce((sum, step) => sum + step.seconds, 0);
log("\n────────────────────────────────");
log(`完成：${steps.length} 步，用时 ${total.toFixed(1)}s`);
for (const step of steps) {
  log(`  ${step.skipped ? "跳过" : "  ✔ "} ${step.label}${step.skipped ? "" : ` ${step.seconds.toFixed(1)}s`}`);
}
if (checkMode) log("（check 模式：未写入、未构建、未部署）");
