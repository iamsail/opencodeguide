# 课程板块（Courses）设计文档

本目录是「在现有文档站上增加课程售卖板块」的完整设计记录，配合仓库中的 Phase 1 实现（已落地，可直接上线预售）。

| 文档 | 内容 |
| :--- | :--- |
| [01-market-analysis.md](./01-market-analysis.md) | 为什么做课程、卖给谁、竞品与价格带、需求验证与收入模型 |
| [02-feature-design.md](./02-feature-design.md) | 页面结构、功能清单（含优先级）、数据模型、用户旅程、SEO 与埋点 |
| [03-curriculum.md](./03-curriculum.md) | 四门课程的完整大纲、交付物、制作规范与后续课程池 |
| [04-stripe-integration.md](./04-stripe-integration.md) | 为什么用 Payment Link、如何接入、如何升级到 Checkout + Webhook、税务与合规 |
| [05-rollout-plan.md](./05-rollout-plan.md) | 分期上线路线图（P0-P3）、验收标准、指标与风险 |
| [06-todo.md](./06-todo.md) | **进度看板与 TODO**：已完成 / 待人工 / P1-P3 任务清单 |

## 当前实现状态（Phase 1 / P0：已完成）

- 路由：`/zh/courses`、`/en/courses`，课程详情页与付款成功页；中英双语。
- 数据：`content/courses/*.json`（一门课一个文件），`lib/courses.ts` 负责读取、定价与支付链接解析。
- 支付：Stripe Payment Links（静态导出兼容），链接由 `scripts/courses/stripe-payment-links.mjs` 生成，落在 `content/courses/stripe-links.json`。
- 没有配置 Stripe 时：页面照常上线，购买按钮自动降级为「开售提醒 / 联系我们」，可以先跑预售。
- SEO：`Course` 结构化数据、hreflang alternate、sitemap 收录（感谢页 noindex）。
- 埋点：GA4 `begin_checkout`，带课程 slug、plan 与价格。
- 合规：`/refund-policy`、`/zh/refund-policy`；隐私政策已补充课程购买与等待名单的数据说明。
- 验证：`npm run build` 通过（158 页静态导出），`tsc --noEmit` 通过。

> 尚未开始：P1（正式收款/邮件交付）、P2（会员中心）、P3（订阅/企业/联盟）。逐项任务见 [06-todo.md](./06-todo.md)。

## 快速开始

```bash
# 1) 预览（无需 Stripe）
npm run dev            # http://localhost:3012/zh/courses

# 2) 查看将创建的 Stripe 商品（不调用 API）
npm run courses:stripe:dry

# 3) 测试链接（需要 Stripe 测试密钥）
STRIPE_SECRET_KEY=sk_test_xxx npm run courses:stripe

# 4) 正式链接
STRIPE_SECRET_KEY=sk_live_xxx npm run courses:stripe
```

生成后把 `content/courses/stripe-links.json` 一并提交，构建时会被打进静态 HTML；也可以用 `STRIPE_LINK_<SLUG>_<PLAN>` 环境变量临时覆盖。
