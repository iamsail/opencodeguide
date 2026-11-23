# [TASK108] - 课程内容的仓库拆分（止血已完成，manifest 待做）

**Status:** In Progress（2026-11-23 公开仓历史已改写、私有仓已播种；manifest 未做 —— 公开仓目前是"半成品"：只有 8 节正文，课表会退化、115 个课时 URL 404）
**Added:** 2026-11-23
**Updated:** 2026-11-23

## Original Request

课程是公开仓库，而付费墙只在**构建期**生效：123 节正文（其中 115 节付费）已随 `dev` 分支公开可读。方向定为方案 B「元数据公开、正文私有」，并明确**拆分完成前不要把课程合到 `main`**。

设计文档：[`docs/courses/09-content-repo-boundary.md`](../../docs/courses/09-content-repo-boundary.md)

## 已完成（2026-11-23）

| 动作 | 结果 |
| :--- | :--- |
| 全量备份 | `/home/sail/backups/opencodeguide-mirror-20261123.git`（改写前 210 提交）+ 123 个 `.mdx` 副本 |
| 私有仓播种 | `iamsail/opencodeCourse`：`dev`=`5336b94`、`main`=`d4a9802`（完整旧历史） |
| 公开仓历史改写 | `git filter-repo --path content/courses/zh --invert-paths`，`main` 与 `dev` **一起**改写后强推 |
| 公开仓现状 | `dev`=`9286fff`：8 节免费正文 + 7 个课程 JSON；`main`=`340a3d6`：0 个课程文件 |
| 免费课恢复 | 8 节（每门前 2 节）以新提交加回，历史从零开始 |
| 本地开发不停摆 | 115 节正文从备份恢复到工作区，写进 `.git/info/exclude`，`git status` 干净、`courses:validate` 仍 123/123 |
| 校验 | `dev` 树 = 旧树 − 115 个 `.mdx`（无其他改动）；`main`/`gh` 树完全未变；62 个 PR 引用逐个查过，均不含正文 |

### 意外发现：`main` 必须一起改写

`main` 上有 64 个带 `gpgsig` 的网页合并提交，`filter-repo` 无法保留签名。若只改 `dev`，两条分支会对同一次提交产生两个哈希（实测 `main..dev` 从 18 条涨到 141 条），以后无法正常 merge。代价是这些合并提交在 GitHub 上显示 unverified，树完全不变。

## 文档没覆盖的三个坑（实施时才暴露）

1. **构建期闸门会静默空转。** `assert-no-gated-content.mjs` 的付费清单是从 `.mdx` 反推的（`readLessons` → `collectLessons` → `gated = lessons.filter(!free)`）。正文一搬走，`gated` 变成 0 条，脚本照样打印 ✔——闸门还在，但已经没有验证对象。
2. **拆完不是"课表退化"，是 115 个 URL 直接 404。** 课时页 `generateStaticParams` 用 `getCourseLessons()` 的 `readdirSync` 结果，文件不在 → 页面不生成 → `dynamicParams = false` → 404，而不是锁定页。
3. **`main` / `gh` 本来就没正文**，所以泄漏面只有 `dev` 的 4 个提交；这也让"改历史"从大工程变成一次 0.2 秒的操作。

## 残留风险（已决定接受）

强推后旧对象仍可按 SHA 访问（实测 `/commit/48b66bc`、`/blob/48b66bc/...` 均返回 200），GitHub 不会主动回收。选择**不删库**：收益只覆盖"手里已有 SHA 的人"，而删库要付出 62 个 PR、Actions secret、Pages 配置的代价。若要零残留，走 GitHub Support 请求 GC，不删库。

## 待做

- [x] **manifest 生成器**（2026-11-23）：`scripts/courses/build-manifest.mjs` + `npm run courses:manifest`，产出 `content/courses/manifest.json`（46 KB、4 份课表 / 123 节、字段只有 slug/title/summary/module/lesson/duration/trial，实测无正文、重复生成字节一致、`--check` 可做 CI 一致性校验）
- [x] **Phase A · 读取侧改读 manifest**（2026-11-23 完成）
  - 新增 `lib/course-paths.ts` + `lib/course-manifest.ts`（脚本侧有等价实现 `scripts/courses/{content-paths,manifest}.mjs`，两份要同步）
  - `lib/course-lessons.ts`：课表读 manifest，正文按需读文件，新增 `hasBody`；**顺带修掉一个隐患**——以前免费额度按「磁盘上有哪些文件」排序，缺文件会把付费节错标成免费，现在按 manifest 顺序算
  - 课时页：无正文一律渲染锁定页（不再可能渲染空文章）；`generateStaticParams` 由 manifest 驱动，123 个 URL 全部生成
  - `build-search.mjs`：课时条目改读 manifest（123 条），公开构建只有免费节带正文
  - `validate-courses.mjs`：manifest 驱动，模式感知（public 缺正文=正常并说明，members 缺正文=错误），新增「正文不在 manifest」孤儿检查、免费节双根漂移检查
  - `assert-no-gated-content.mjs`：重写。付费清单改读 manifest；新增「公开仓里不许有付费正文文件」检查（`git ls-files`）；**修掉空转**——以前正文搬走后 `gated=0` 仍打印 ✔，现在会明确说明「本 checkout 无付费正文，探针检查无可检对象」，而仓库检查与锁定页检查照常生效
  - `build-manifest.mjs`：加护栏，在只有免费正文的机器上拒绝覆盖完整 manifest（需 `--force`）
  - `build-members.mjs` / `validate-courses.mjs`：members 构建缺私有根时立刻失败并给出可操作路径

  **验收实测（把 115 节付费正文真的移出工作区后）**：`npm run build` 通过；课时页 123 个；锁定页 115 个、正文页 8 个；sitemap 课时 URL 8 条；`courses:assert` → 公开 8 / 锁定 115 / 仓库内付费正文 0；`tsc --noEmit` 通过。负向：往 git 索引里塞一节付费正文 → assert exit 1；members 构建无私有根 → exit 1。
- [x] **Phase B · 私有内容接入**（2026-11-23 完成）
  - 双根解析落地：public 只读公开根；members 读「私有根 → 公开根」，缺私有根 fail fast
  - `scripts/courses/export-free-lessons.mjs`：8 节免费正文改为派生产物（`--check` 给 CI），同时自动维护 `.gitignore` 的免费试听区块
  - `scripts/courses/check-staged-lessons.mjs` + `.githooks/pre-commit`：拦强制 add 进来的付费正文
  - 本地正文已迁到私有仓 clone（`../opencodeCourse`），`.git/info/exclude` 的临时规则已清除，公开仓工作区现在真的只有 8 节正文
  - 实测：付费正文拷进公开根被忽略；`git add -f` 后被 pre-commit 拦下；成员构建产出 123 个课时页、0 个锁定页；`courses:export-free:check` 通过
- [ ] 文档收尾：`06-todo` 第 6 条、`07-access-control` 的"正文位置"、`08-launch-runbook` 的构建前置

## 验收标准（不许降低）

在**只有 8 节正文**的公开仓里：

1. `npm run build` 通过
2. 课程页课表仍是 123 节，付费节显示为锁定页而不是 404（`data-locked-lesson` 存在）
3. `sitemap.xml` 只收录 8 个课时 URL
4. `courses:assert` 报告 `gated=115` 并通过 —— **不是 `gated=0` 的空转通过**

## 风险

- manifest 与正文不同步：manifest 必须由私有仓侧生成再提交到公开仓，手工改容易漂。先用"生成器 + CI 校验一致性"，自动化等到摩擦真的出现。
- `freeLessonLimit` 与 manifest 的 `trial` 字段重叠：`trial` 只记 frontmatter 的显式 `free: true`，按序免费仍由 `access.json` 的额度决定，避免两份真相源。
