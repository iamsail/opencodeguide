# [TASK105] - 课程板块 P1：正式收款与邮件交付（进行中）

**Status:** In Progress
**Added:** 2026-11-18
**Updated:** 2026-11-24

## Original Request
课程板块 P0 已完成（[TASK104]）。按 `docs/courses/05-rollout-plan.md` 的分期计划，下一步进入 P1：打通正式收款与付款后的自动交付。

## Thought Process
- P0 已支持 Stripe Payment Link 与降级预售，但没有真实订单，也没有自动交付：付款后的开通动作目前是人工。
- P1 的目标不是「加功能」，而是让「付款 → 收到观看链接 → 进社群」这条链路不依赖人工，否则每单都会变成客服成本。
- 站点保持静态导出不变，Webhook 与发信用外部服务（Cloudflare Worker + Resend），避免为了收款改造整体托管架构。
- 代码部分不依赖 Stripe 密钥即可先写完并用测试覆盖；真实密钥只影响「上线验证」，所以先把 Worker 与校验脚本落地。

## Implementation Plan
- [x] 结账改 `price_data` 动态报价（2026-11-24）：去掉预建 Product/Price/Payment Link，金额来自 `COURSE_CATALOG`
- [ ] 人工：注入 live 密钥（`sk_live_` 或 `rk_live_`）与 live webhook 签名密钥，部署后验收
- [ ] 人工：配置 `NEXT_PUBLIC_COURSE_WAITLIST_ENDPOINT`（Formspree/Buttondown）
- [ ] 人工：准备视频托管链接、私有模板仓库、社群邀请（写入 Worker 的 `COURSE_DELIVERY`）
- [x] `workers/course-delivery`：接收 `checkout.session.completed` / `charge.refunded`，校验签名 + 幂等
- [x] 集成 Resend：中英双语开通邮件（观看链接 + 仓库邀请 + 社群 + 退款说明）
- [x] 订单记录：D1 `orders` / `processed_events`，字段与 `docs/courses/02` 的 `orders` 对齐
- [ ] 详情页增加「试听」入口与「更新日志」区块
- [ ] 早鸟优惠码展示（Stripe Promotion Code）
- [x] 对账脚本：`wrangler d1 execute` 查询已写进 Worker README（按课程/计划汇总、漏发清单）
- [ ] 首单真实退款演练，确认邮件与权益回收
- [x] 课程数据构建期自检：`scripts/courses/validate-courses.mjs`（已接入 `npm run build`）

## 交付物（2026-11-18 落地）

| 文件 | 作用 |
| :--- | :--- |
| `workers/course-delivery/src/index.js` | 路由：`/stripe/webhook`、`/admin/resend`、`/health` |
| `workers/course-delivery/src/stripe.js` | WebCrypto 验签（HMAC-SHA256 + 5 分钟容差 + 定长比较） |
| `workers/course-delivery/src/handlers.js` | 付款/退款/拒付处理，区分「基础设施错误」与「业务不完整」 |
| `workers/course-delivery/src/templates.js` | 中英双语开通邮件、退款通知、运营告警（全量 HTML 转义） |
| `workers/course-delivery/src/store.js` | D1 读写，幂等靠 `event_id` 主键 + `session_id` 唯一索引 |
| `workers/course-delivery/migrations/0001_init.sql` | `orders` / `processed_events` 建表与索引 |
| `workers/course-delivery/test/` | 40 项 `node --test` 用例：验签、幂等、退款、模板、路由、补发 |
| `scripts/courses/validate-courses.mjs` | 课程 JSON 构建期校验（结构/枚举/双语完整度/链接有效性） |

**关键设计取舍**

- 邮件发送失败**不**让 Webhook 失败：订单已落库，用 `/admin/resend` 补发；否则 Stripe 重试只会重复轰炸。
- 业务不完整（无邮箱、识别不出课程、交付链接未配）不发半成品邮件给买家，只落库 + 告警运营。
- 基础设施错误（D1 写失败）才返回 500，并撤销幂等标记让 Stripe 重试。
- Payment Link 现在会写入 `course_title_zh/en` metadata，交付邮件标题不再出现裸 slug。

## Progress Tracking

**Overall Status:** In Progress - 45%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1.1 | 正式收款通道（动态报价 + live 密钥） | In Progress | 2026-11-24 | 已改 `price_data`（无需建商品）；等注入 live 密钥与部署 |
| 1.2 | 交付 Worker + Webhook | Code Complete | 2026-11-18 | 40 项测试通过，待真实 webhook 联调 |
| 1.3 | 开通邮件（Resend） | Code Complete | 2026-11-18 | 待域名 SPF/DKIM 验证后发真信（不阻塞交付） |
| 1.4 | 试听内容与更新日志 | Not Started | 2026-11-18 | 依赖录制进度 |
| 1.5 | 对账与订单检查 SOP | In Progress | 2026-11-18 | SQL 查询已写入 README，待首单验证 |
| 1.6 | 退款演练 | Not Started | 2026-11-18 | 代码路径有测试，需真实退款走一遍 |
| 1.7 | 课程数据校验 | Done | 2026-11-24 | 接入 build，0 错误 8 警告（支付链接噪音已消除） |

## Progress Log
### 2026-11-24
- Stripe **live 模式已开通**（账号 `deeplove`，已有其它产品的真实流水）；课程侧仍是 test 密钥 / test priceId / 测试模式 webhook。
- 定下**账号结构**：单账号多产品，不按产品开账号（详见 `docs/courses/08-launch-runbook.md` §3.1 与 `memory-bank/activeContext.md` 的 Active Decisions）。
- 重写 runbook §3：补账号结构决策、`--force` 的必要性（不带会把 9 条全 skip）、live webhook 必须勾 5 个事件（支付宝/微信是异步支付，只勾 3 个会永远拿不到权益）、`stripeMode` 自检项。
- 交付侧已不依赖邮件（TASK111），所以 `RESEND_API_KEY` 不再阻塞收款。

### 2026-11-18
- 创建任务文件，登记 P1 范围与阻塞项（Stripe 密钥、交付物）。
- 详细清单同步在 `docs/courses/06-todo.md` 第 3 节。
- 落地 `workers/course-delivery`（零运行时依赖，Node 内置 runner 测试）与课程数据校验脚本；
  `npm run build` + `tsc --noEmit` 全绿，`npm run workers:test` 40/40 通过。
- 校验脚本首次运行发现 12 条警告，其中英文化 SEO 描述 5 条超过 160 字符（详情页 meta 会被截断），
  记录在 `docs/courses/06-todo.md` 第 6 节待处理。

### 2026-11-24（续）
- 支持 **受限 live 密钥**（`rk_live_…`）：`scripts/courses/stripe-payment-links.mjs` 的前缀判定与
  `workers/course-delivery/src/index.js` 的 `/health` `stripeMode` 统一成 `/^[sr]k_(live|test)_/`。
  原来只认 `sk_`，用受限密钥会被脚本直接拒绝、`/health` 还会误报 `unset`。
- runbook 新增 §3.2.1：标准密钥 vs 受限密钥的分工（Worker 只给 `Customers` + `Checkout Sessions` 写权限、
  建商品时用一次性更宽的密钥、不要给 Worker 那把绑 IP 白名单、不要复用其它产品的 key）。
- 配套测试：`test/index.test.js` 覆盖 `rk_live_` → `live`、`rk_test_` → `test` 且不泄露密钥。

### 2026-11-24（动态报价）
- **去掉「预建 9 个 live 商品」这一步**：参照 `pindou/pindouonline` 的 `shop-checkout`，
  `/checkout` 改用 `line_items[0][price_data]` 现场报价（`unit_amount` / `currency` /
  `product_data.name` 来自 `COURSE_CATALOG`）。课程是买断制，没有订阅那种「必须有 Price」的约束。
- 顺带消掉三类故障：`--force` 漏跑、`stripe-products.json` 与 catalog 不同步导致的
  `No such price`、以及「catalog 必须先于密钥」的顺序约束。
- `catalog.js`：去掉 `priceId`；补回被 `normalize()` 丢掉的 `titleEn` / `accent`（购买页渐变头此前一直没生效）；
  新增 `displayTitle()` 作为发票/收据上的行项目名。
- 新增 `STRIPE_AUTOMATIC_TAX` / `STRIPE_TAX_BEHAVIOR` 开关：开启时同时下发 `automatic_tax`
  与 `price_data.tax_behavior`（默认关闭，价格口径不变）。动态报价让「以后开 Stripe Tax」不再需要重建商品。
- 脚本：`sync-worker-catalog.mjs` 不再读 `stripe-products.json`，改为校验金额 > 0；
  `validate-courses.mjs` 仅在 `NEXT_PUBLIC_CHECKOUT_MODE=stripe` 时校验 legacy 支付链接。
- 代价：Stripe 后台没有 Product 维度报表（按 `metadata.course_slug` 筛或看 D1 `orders`），
  Payment Link 直链回退失效（公开站保持 learn 模式）。
- 测试：worker 143 → 147（动态价格字段、英文行项目名、金额为 0 拒绝下单、自动计税开关）。


