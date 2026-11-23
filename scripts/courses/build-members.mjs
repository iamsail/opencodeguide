#!/usr/bin/env node
/**
 * 成员站构建（P2.3）
 * ------------------------------------------------------------
 * 公开站产物在 out/（`npm run build`，末尾带付费正文泄露断言）。
 * 成员站要多一份「全文」产物：COURSE_ACCESS=members 渲染全部课时正文，
 * 输出到 out-members/，由 Cloudflare Worker 回源并做门禁（src/gate.js）。
 *
 * 注意 public/search.json 是入库文件，而 members 构建会把它写成「含付费正文」的版本。
 * 所以本脚本会备份并在结束时还原它 —— 否则仓库里会留下一份付费正文全文索引，
 * 下一次有人提交就把内容发布出去了。
 */

import { spawnSync } from "node:child_process";
import { requirePrivateRootForMembers } from "./content-paths.mjs";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT_DIR = process.env.MEMBERS_OUT_DIR || "out-members";
const OUT_PATH = path.join(ROOT, OUT_DIR);
const SEARCH_INDEX = path.join(ROOT, "public/search.json");

const env = {
  ...process.env,
  COURSE_ACCESS: "members",
  NEXT_DIST_DIR: OUT_DIR,
  NEXT_TELEMETRY_DISABLED: "1",
};

function run(label, args) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(process.execPath, args, { stdio: "inherit", env, cwd: ROOT });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} 失败（exit ${result.status}）`);
}

function countCoursePages() {
  let count = 0;
  for (const locale of ["zh", "en"]) {
    const dir = path.join(OUT_PATH, locale, "courses");
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory() && fs.existsSync(path.join(dir, entry.name, "index.html"))) count += 1;
    }
  }
  return count;
}

const searchBackup = fs.existsSync(SEARCH_INDEX) ? fs.readFileSync(SEARCH_INDEX) : null;

try {
  // 0) 成员站必须有私有正文：缺了会产出一个只剩免费节的「假成员站」，宁可直接失败
  const privateRootUsed = requirePrivateRootForMembers("members");
  console.log(`私有正文根：${privateRootUsed}`);

  // 1) 搜索索引：members 构建要能搜到付费正文（站点本身在登录态内）
  run("生成搜索索引", ["scripts/build-search.mjs"]);
  // 2) 课程数据校验（免费额度、双语完整度、课时对位）
  run("校验课程数据", ["scripts/courses/validate-courses.mjs"]);
  // 3) Next 静态导出 → out-members/
  run("Next 静态导出（members）", ["node_modules/next/dist/bin/next", "build"]);

  // 4) 产物核对
  if (!fs.existsSync(OUT_PATH)) {
    throw new Error(`构建完成但找不到 ${OUT_DIR}/（NEXT_DIST_DIR 是否被 next.config.mjs 接管？）`);
  }

  const pages = countCoursePages();
  if (pages === 0) throw new Error(`${OUT_DIR}/ 下没有任何课程详情页，成员站会是个空壳`);

  console.log(`\n✓ 成员站构建完成：${OUT_DIR}/（课程详情页 ${pages} 个）`);
  console.log("  本地自测：cd workers/course-delivery && npx wrangler dev");
} catch (error) {
  console.error(`\n✖ ${error.message ?? error}`);
  process.exitCode = 1;
} finally {
  // 无论成功失败都还原入库的搜索索引（members 版本含付费正文）
  if (searchBackup) {
    fs.writeFileSync(SEARCH_INDEX, searchBackup);
    console.log("↩ 已还原 public/search.json（members 版本含付费正文，不入库）");
  } else {
    fs.rmSync(SEARCH_INDEX, { force: true });
  }
}
