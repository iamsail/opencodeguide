#!/usr/bin/env node
/**
 * pre-commit 护栏：暂存区里不允许出现付费课时正文
 * ------------------------------------------------------------
 * 课程正文的真相源在私有仓。公开仓只允许出现「免费试听」的那几节，
 * 名单由 manifest + access.json 算出——与课时页、sitemap、导出脚本同一套规则。
 *
 * 由 .githooks/pre-commit 调用；也可以手动跑：
 *   node scripts/courses/check-staged-lessons.mjs
 *
 * 退出码：0 通过 / 1 暂存区里有付费正文
 */

import { execFileSync } from "node:child_process";

import { readAccessConfig } from "./access.mjs";
import { readLessonManifest } from "./manifest.mjs";

const manifest = readLessonManifest();
if (!manifest) {
  // 还没生成 manifest 时不做判断，避免拦住正常提交
  process.exit(0);
}

const { freeLessonLimit } = readAccessConfig();
const allowed = new Set();

for (const course of manifest.courses) {
  for (const [locale, lessons] of Object.entries(course.locales ?? {})) {
    lessons.forEach((lesson, index) => {
      const free = lesson.trial === true || index < freeLessonLimit;
      if (free) allowed.add(`content/courses/${locale}/${course.slug}/${lesson.slug}.mdx`);
    });
  }
}

let staged = [];
try {
  staged = execFileSync("git", ["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"], {
    encoding: "utf8",
  })
    .split("\0")
    .filter(Boolean);
} catch {
  process.exit(0);
}

const lessonPattern = /^content\/courses\/(zh|en)\/[^/]+\/[^/]+\.mdx$/;
const stagedLessons = staged.filter((file) => lessonPattern.test(file));
const blocked = stagedLessons.filter((file) => !allowed.has(file));

if (blocked.length > 0) {
  console.error("");
  console.error(`  ✘ 暂存区里有 ${blocked.length} 个付费课时正文（公开仓不允许）：`);
  for (const file of blocked.slice(0, 10)) console.error(`      ${file}`);
  if (blocked.length > 10) console.error(`      …其余 ${blocked.length - 10} 个省略`);
  console.error("");
  console.error("  课程正文的真相源在私有仓（iamsail/opencodeCourse）。");
  console.error("  公开仓只保留免费试听节；要更新试听节请跑：npm run courses:export-free");
  console.error("  确认无误要强行提交：GIT_ALLOW_SECRETS=yes git commit ...（不推荐）");
  process.exit(1);
}

process.exit(0);
