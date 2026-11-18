# [TASK104] - 课程板块（Courses）+ Stripe 支付接入（Phase 1）

**Status:** Completed
**Added:** 2026-11-18
**Updated:** 2026-11-18

## Original Request
在现有网站增加课程板块，面向程序员、独立开发者、跨境电商与出海网站人群售卖课程。需要：分析并设计课程板块的功能与课程内容；接入 Stripe 支付；可以分期上线。

## Thought Process
- 站点是 `output: 'export'` 的纯静态站（TASK077 为了压缩托管成本刻意为之），因此**不能**使用 API Route / Server Action 创建 Checkout Session。
- 结论：Phase 1 采用 **Stripe Payment Link**（Stripe 托管结账页，纯静态兼容），并用脚本通过 Stripe REST API 批量创建 Product/Price/Link，产物写入 `content/courses/stripe-links.json` 随构建打进 HTML。Phase 2 再引入 Worker + Webhook + Supabase 做会员中心。
- 课程内容按「能力缺口」而不是「技术栈」划分，形成四条学习路线：AI 编程 → 独立开发 → 出海 SEO → 跨境电商，外加全站通打包。
- 课程数据结构化到 `content/courses/*.json`（单文件一门课，含中英双语），页面只读数据，运营新增课程无需改代码。
- 未配置 Stripe 时自动降级为「开售提醒 / 联系我们」，保证页面可以先上线预售。

## Implementation Plan
- [x] 数据层：`lib/courses.ts`（读取、定价、支付链接解析、跟踪参数）+ `lib/course-copy.ts`（界面文案）
- [x] 内容：4 门课程 + 全站通 JSON（模块/课时/FAQ/交付物/讲师/SEO）
- [x] 页面：`/zh/courses`、`/en/courses` 目录页；`[slug]` 详情页；`thank-you` 回执页
- [x] 组件：课程卡、购买卡、手风琴大纲、购买按钮（GA4 埋点）、等待名单、JSON-LD
- [x] Stripe：`scripts/courses/stripe-payment-links.mjs`（幂等、dry-run、test/live）
- [x] 集成：导航、页脚、首页课程区块、sitemap（含 alternate、排除感谢页）、tailwind 扫描 JSON、搜索索引
- [x] 合规：退款政策页（中英）、隐私政策补充课程购买与等待名单说明
- [x] 文档：`docs/courses/*`（市场分析、功能设计、课程内容、Stripe 方案、路线图、06-todo 进度看板）
- [x] 验证：`next build` 静态导出通过，课程页/结构化数据/sitemap 均产出

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1.1 | 市场与人群分析 | Complete | 2026-11-18 | docs/courses/01-market-analysis.md |
| 1.2 | 功能与数据模型设计 | Complete | 2026-11-18 | docs/courses/02-feature-design.md |
| 1.3 | 四门课程内容规划 | Complete | 2026-11-18 | docs/courses/03-curriculum.md + JSON |
| 1.4 | Stripe 接入方案与实现 | Complete | 2026-11-18 | Payment Link + 生成脚本 |
| 1.5 | 分期上线路线图 | Complete | 2026-11-18 | docs/courses/05-rollout-plan.md |
| 1.6 | 页面/组件实现 | Complete | 2026-11-18 | 中英双语 8 个路由 |
| 1.7 | 构建与输出验证 | Complete | 2026-11-18 | build 158 页 + tsc 通过 |
| 1.8 | 进度看板与 P1 任务登记 | Complete | 2026-11-18 | 06-todo.md + TASK105 |

## Progress Log
### 2026-11-18
- 完成站点技术约束分析：静态导出决定支付方案只能走 Stripe 托管页。
- 落地课程数据层与文案层，课程内容改为 JSON 驱动（新增课程零代码）。
- 实现目录页/详情页/回执页（中英双语）、课程卡与购买卡组件、结构化数据。
- 实现 Stripe Payment Link 生成脚本（幂等、dry-run、metadata、after_completion 回执）。
- 修正两个构建问题：`from-indigo-500` 渐变类需被 Tailwind 扫描（content 加入 JSON）；JSDoc 中 `**/*.json` 的 `*/` 提前终止注释导致解析失败。
- 修复 bundle 未进入 `generateStaticParams` 导致 `/courses/all-access` 404 的问题。
- `next build` 静态导出通过。

### 2026-11-18（收尾）
- 用临时 Stripe 链接构建验证：购买按钮输出 `client_reference_id` 与 4 个 utm 参数；未配置的 plan 正确降级为「联系我们 / 开售提醒」。
- 抽查产物：sitemap 30 条课程 URL 且无 thank-you；`Course` JSON-LD（2 个 Offer）、canonical、hreflang 正常。
- 修复移动端头部导航溢出（`md` 以下隐藏文字导航），目录页统计数字改为从课程数据计算，避免硬编码漂移。
- 新增 `docs/courses/06-todo.md` 进度看板，登记 `TASK105`（P1：正式收款 + 邮件交付）。
- 修复 memory-bank 写入时反引号被 PowerShell 当作转义符导致的文本损坏（改用 Node 脚本写入）。
- 仅本地提交到 `dev` 分支，未 push。
- 待运营侧动作：配置 `STRIPE_SECRET_KEY` 生成正式 Payment Link；配置等待名单端点；准备视频与模板仓库交付。
