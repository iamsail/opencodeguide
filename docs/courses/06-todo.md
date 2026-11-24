# 06 · TODO 与进度看板

> 更新时间：2026-11-24（付费墙 + 权益 + Google 登录 + 站内交付已完成；结账改为 `price_data` 动态报价；文章版内容 **123/123 节**）· 分支 `dev`
> 状态图例：`[x]` 已完成 · `[ ]` 未开始 · `[~]` 进行中 · `[!]` 需外部输入

## 0. 总览

| 阶段 | 范围 | 状态 | 完成度 |
| :--- | :--- | :--- | :--- |
| P0 基建与预售 | 课程页、数据层、Stripe 接入、文档 | 已完成 | 100% |
| P1 首发成交 | 正式收款、优惠码、站内交付、发票 | 进行中（动态报价 + 站内交付已就绪，等 live 密钥注入与部署） | 60% |
| P2 会员中心 | 登录、权益、播放页、Webhook | 进行中（P2.0 分流 + P2.1 权益 + P2.2 登录 + P2.3 成员站接线已完成；Google 登录本地验证通过） | 80% |
| 文章版内容 | 4 门课 123 节正文 + 课时阅读页 | 已完成 | 100%（123/123） |
| P3 规模化 | 订阅、企业采购、联盟、训练营 | 未开始 | 0% |

## 0.1 文章版内容进度

| 课程 | 正文 | 字符数 | 代码块 | 阅读时长 | 说明 |
| :--- | ---: | ---: | ---: | ---: | :--- |
| AI 编程实战 | 27/27 | 7.1 万 | 76 | 3.8h | 完成 |
| 独立开发者出海 | 33/33 | 8.0 万 | 50 | 4.7h | 完成 |
| 跨境电商独立站 | 36/36 | 7.0 万 | 40 | 5.3h | 完成（2026-11-19 补齐模块 7–8） |
| 出海网站 SEO | 27/27 | 5.3 万 | 38 | 3.6h | 完成（2026-11-19 全新） |
| **合计** | **123/123** | **27.4 万** | **204** | **17.4h** | **100%** |

> 口径：字符数按正文（含代码块、表格，不含 frontmatter）统计，与旧表口径不同，所以单课数字看起来变低了。

123 节全部写完，课表里不再有「制作中」占位；`npm run courses:validate` 现在是 `123/123`。

免费边界 = **每门前 2 节**（`content/courses/access.json` 的 `freeLessonLimit`）。公开构建只渲染这 8 节正文，其余 115 节是锁定页；`npm run build` 末尾的 `courses:assert` 会断言公开产物里没有付费正文。

写作规格：每节 700–1100 汉字，至少 1 个可复制产物（命令/配置/表格/公式），`## 落地动作` 3 步 + `## 常见坑` 现象→原因→对策；技术课对齐仓库内 OpenCode 文档，商业课不写死税率/费率/平台规则数字（只写判定方法与查询路径）。

## 1. P0 已完成清单（本地已验证）

- [x] 双语课程目录页 `/zh/courses`、`/en/courses`（四条路线、课程卡、全站通、学习路径、FAQ）
- [x] 课程详情页 5 个（4 门课 + 全站通），`generateStaticParams` 静态生成，`dynamicParams = false`
- [x] 付款回执页 `/zh|courses/thank-you`，读取 `?course=&plan=` 展示本地化订单摘要（Suspense 包裹）
- [x] 课程数据层 `lib/courses.ts` + 文案层 `lib/course-copy.ts`
- [x] 课程内容 `content/courses/*.json`（110 节课大纲，中英双语）
- [x] Stripe Payment Link 生成脚本（幂等、`--dry-run`、`--only`、`--force`、`--redirect-locale`）
  - 2026-11-24 起降级为 legacy：结账改走 Worker 的 Checkout Session + `price_data`，不再预建商品
- [x] 支付链接解析优先级：环境变量 > `stripe-links.json` > 降级（等待名单 / 联系）
- [x] 跟踪参数：`client_reference_id` + 4 个 utm 参数
- [x] GA4 `begin_checkout` 埋点
- [x] 退款政策页 `/refund-policy`、`/zh/refund-policy`；隐私政策补充课程购买与等待名单说明
- [x] sitemap 收录课程页（含 hreflang alternate），排除感谢页；搜索索引包含课程
- [x] 导航 / 页脚 / 首页课程区入口；移动端头部导航适配
- [x] 设计文档 `docs/courses/01-05`
- [x] 课时阅读页 `/zh/courses/[slug]/[lesson]`：侧边课表、本节目标、代码高亮、上下篇导航、`TechArticle` JSON-LD
- [x] 课时页收录进站点搜索（`scripts/build-search.mjs` 扫描 `content/courses`）与 sitemap（含 hreflang）
- [x] 课程 JSON 校验脚本接入 `npm run build`：课时 frontmatter 对位大纲、标题漂移、正文长度、免费节上限

- [x] 构建验证：`npm run build` 通过（158 页）、`tsc --noEmit` 通过

## 2. 需要人工完成（阻塞 P1 上线）

- [!] **Stripe 账户与密钥**：确认主体、KYB 通过；提供 `sk_live_...`
  - 命令：`npm run courses:stripe:dry` → `STRIPE_SECRET_KEY=sk_live_xxx npm run courses:stripe`
  - 产物：`content/courses/stripe-links.json`（提交后重新构建生效）
- [!] **等待名单端点**：创建 Formspree / Buttondown 表单，配置 `NEXT_PUBLIC_COURSE_WAITLIST_ENDPOINT`
- [!] **交付物**：视频托管链接（Mux / Cloudflare Stream / 视频号）、模板仓库（私有 GitHub）、社群邀请链接
- [!] **邮件域名**：配置 SPF / DKIM / DMARC，保证开通邮件不进垃圾箱
- [!] **税务与主体确认**：根据主体所在地确认 Stripe Tax / VAT / 收入申报方式（见 04 文档第 6 节）
- [ ] **法务页审阅**：退款政策、隐私政策、服务条款（当前条款为通用版本，建议按主体信息补充公司名与管辖地）

## 3. P1 · 首发成交（建议 2-4 周）

### 3.1 支付与订单

- [x] 结账改为动态报价（`price_data`）：不预建 Product/Price，金额来自 `content/courses/*.json` → `COURSE_CATALOG`（2026-11-24）
- [ ] 用真实小额订单跑通「支付 → /account 对账 → 退款撤权」全链路（live 密钥注入后）
- [ ] 核对购买页金额与 Stripe 结账页一致（$79 / $149 / $399 等 9 档）
- [ ] 配置 Statement descriptor（银行账单可识别，降低拒付）
- [ ] 生成早鸟优惠码（限时 + 限量），在详情页展示入口
- [~] 对账脚本：导出 Stripe Payments（按 `client_reference_id` 分组）与课程维度的订单表
  - [x] Worker 侧提供按课程/计划汇总与漏发清单的 SQL（见 `workers/course-delivery/README.md` 运营 SOP）

### 3.2 交付自动化

- [x] Cloudflare Worker（或 Vercel Function）：接收 `checkout.session.completed` Webhook → `workers/course-delivery`
- [x] 校验 `Stripe-Signature`，按 `event.id` 幂等（WebCrypto，5 分钟容差）
- [x] Resend / Postmark 发送开通邮件（观看链接 + 模板仓库邀请 + 社群邀请）
- [x] 退款（`charge.refunded`）时发送通知并标记订单（全额退款写 `revoked_at`）
- [x] 邮件模板中英双语，含 7 天退款说明与客服邮箱

### 3.3 页面与内容

- [x] 每门课 2 节免费试听（前 2 节），详情页课表与阅读页侧栏显示「试听」
  - [x] 免费额度统一由 `content/courses/access.json` 控制（原 `free: true` 保留为额外开放手段）
  - [ ] 课程 4 写正文后自动获得前 2 节试听（无需额外标记）
- [x] 全部课程正文文章化（123/123 节，2026-11-19）
  - [x] 课程 1（27 节）、课程 2（33 节）
  - [x] 课程 3（36/36 节，补齐模块 7 广告投放与模块 8 数据复购）
  - [x] 课程 4（27/27 节，6 个模块全新撰写）
- [ ] 详情页展示「最近更新 / 更新日志」区块
- [ ] 补充真实 FAQ（来自社群与邮件的高频问题）
- [ ] 英文详情页文案校对（当前为直译初稿）
- [ ] 课程页与相关文档互链（AI 编程课 ↔ `/zh/docs/configure/agents` 等）

### 3.4 运营

- [~] 订单检查 SOP（每日）：新订单 → 交付确认 → 异常跟进
  - [x] 漏发排查 SQL + `POST /admin/resend` 补发接口
- [ ] 客服话术库（付款失败、未收到邮件、退款、发票）
- [ ] 首月复盘：退款率、支付成功率、详情页转化率

## 4. P2 · 会员中心（建议 6-12 周）

> 方案已定稿：[`07-access-control.md`](./07-access-control.md)（只公开每门前 2 节，其余进会员中心）。任务：[TASK107](../memory-bank/tasks/TASK107-course-access-control.md)。
> 免费边界已定（每门 2 节，P2.0 已实施）；`learn.` 子域已在 Cloudflare 且成员站接线完成（P2.3，2026-11-20）；登录已定为 Google OAuth。
> ⚠️ 在 P2.3 完成前不要开启真实收款：付费正文在公开站已读不到，成员站（`learn.`）还没部署。

- [x] 公开/付费分流：付费节在公开构建中渲染为锁定页，CI 断言产物无付费正文（P2.0，2026-11-19）
- [x] 权益表 `entitlements` + Webhook 写入 + 退款撤销 + 历史订单回填（P2.1，2026-11-19）
  - `migrations/0002_entitlements.sql`、`src/entitlements.js`、`store.js` 三个方法、`handlers.js` 接线
  - 全站通展开 4 门课 + bundle；部分退款保留访问；拒付默认不回收（`REVOKE_ON_DISPUTE=1` 可改）
  - 回填：`node scripts/courses/backfill-entitlements.mjs [--execute --remote]`
- [x] 鉴权 Worker：**Google OAuth 登录**（替代 magic link）+ 会话 JWT + `/account`（P2.2，2026-11-19 改造）
  - 端点：`/login`、`GET /auth/google`、`GET /auth/google/callback`、`/auth/logout`、`/account`
  - 删除 magic link 与 `magic_links` / `auth_attempts`（迁移 0003）
  - `src/gate.js` 默认拒绝门禁已实现并有单测；**接线到静态资源**在 P2.3
- [x] **先登录再买**：`/buy/<slug>/<plan>`（需登录）+ `POST /checkout` 服务端创建 Checkout Session，用 Stripe Customer 锁死登录邮箱（2026-11-19）
  - 权益归属改为 `metadata.email`（登录邮箱），不再依赖 Stripe 页面收集的邮箱
  - 公开站购买按钮已改指 `learn./buy/<slug>/<plan>`（2026-11-23，`NEXT_PUBLIC_CHECKOUT_MODE` 默认 `learn`；等成员站部署后生效）
- [x] 成员站接线：`out-members/` 构建 + Worker 静态资源 + 门禁接 `env.ASSETS` + 全站 noindex（P2.3，2026-11-20）
- [x] Google OAuth 凭据：`opencodeguide-learn` 项目建客户端，回调 `https://learn.opencodeguide.com/auth/google/callback` + `http://localhost:3022/auth/google/callback`，scope 仅 `openid email profile`（2026-11-22）
- [x] 本地登录闭环：`npm run dev:proxy`（Miniflare + Node 侧代理）实测 `localhost:3022/login` → Google → `/account` 通过（2026-11-22）
- [x] 成员站部署：`wrangler login` → 注入 secret → `wrangler deploy` + §5.3 验收（2026-11-23；`/health` 绑定齐全、登录 302、search.json 401、noindex 头均通过；Resend 仍缺）
- [x] 成员站页面样式对齐公开站（P2.4，2026-11-23）：`src/ui.js` 设计系统 + 登录/购买/账户/错误页重做，暗色与公开站同策略，`/` 302 到 `/account`
- [x] **交付改为站内为主（TASK111，2026-11-24）**：`/account?paid=1&session_id=…` 主动对账（Stripe 取会话 → 校验邮箱 → 复用 `processEvent` 补权益），课程卡直出正文 + 模板仓/社群链接，付款状态条（成功/正在开通/处理中，pending 自动刷新上限 3 次）；没配 Resend 也能完整交付（`skipped_no_resend`）；管理端 `GET /admin/orders`、`POST /admin/grant`；根级 `/courses/*` 302 到带语言前缀路径。worker 测试 121→143
- [x] 基础设施：D1 `orders`（0001）/ `entitlements` / `magic_links` / `auth_attempts`（0002，不需要 Supabase）
- [x] Checkout Session 接口替换 Payment Link：Worker 端 `/checkout` + 公开站按钮已切换（`learn` 模式），旧 Payment Link 保留为 `NEXT_PUBLIC_CHECKOUT_MODE=stripe` 应急回退
- [x] Webhook 入库：`checkout.session.completed`、`charge.refunded`、`charge.dispute.created`（`invoice.paid` 属订阅，P3）
- [x] 登录方案定稿：Google OAuth（放弃 magic link 与 Supabase Auth）
- [ ] 课程播放页：视频托管 + 防盗链 + 章节导航
- [ ] 学习进度记录与「继续上次学习」
- [~] 退款自动回收权益：数据层已回收（P2.1），读取侧「每次都查权益」的门禁在 P2.2 生效
- [ ] 自助：重发开通邮件、换绑邮箱、申请退款
- [ ] 管理端最小能力：按邮箱查订单、手动补发权益

## 5. P3 · 规模化（3-6 个月）

- [ ] 订阅制（月付/年付）与会员专属内容
- [ ] 企业采购：多席位、统一发票、内训版
- [ ] 联盟分销：Stripe Coupon + 独立推广链接 + 佣金结算
- [ ] 直播训练营：排期、报名、回放
- [ ] A/B 测试：Hero 标题、价格锚点、CTA 文案（单变量）
- [ ] 新课程：Stripe 深度实战 → AI Agent 产品化 → 企业内训

## 6. 技术债与优化（随时可做）

- [x] 课程 JSON 的 schema 校验脚本（`npm run courses:validate`，已接入 build；校验结构、枚举、价格、双语完整度、`stripe-links.json` 有效性、课时正文）
- [x] 课时页代码高亮（rehype-pretty-code）与 `TechArticle` JSON-LD
- [x] 字体自托管（`next/font/local`）：修掉构建期从 gstatic 拉字体超时导致 build/dev 失败
- [x] 本地联调代理（`npm run dev:proxy`）：`wrangler dev` 的 workerd 出站不读系统代理，改用 Miniflare + Node 侧代理重发（2026-11-22）
- [x] `npm run courses:meta`：从大纲与已写正文推导 `lessonCount` / `durationHours`，避免 5 个 JSON 各写一份数字
- [ ] 英文正文（27+33+36+27 节，当前 0 节）：先决定是「全量翻译」还是「英文站只放目录 + 中文正文」
- [ ] 详情页「更新日志」区块（依赖课程内容的版本记录）
- [ ] 课程页视觉回归截图（当前手动用 Chrome headless 抽查）
- [ ] 把 `lib/course-copy.ts` 的文案抽成 JSON（与课程内容同构，便于翻译外包）
- [ ] 详情页价格支持多币种展示（USD 主价 + CNY/EUR 参考）
- [ ] 为课程页增加 OG 图片（当前复用站点默认）
- [ ] 课程卡片的「2026 版」徽章改为数据字段（`edition`），避免硬编码
- [ ] 英文化课程页 SEO 描述超长（5 条 >160 字符，详情页 meta 会被截断）：等英文文案校对时一并收敛

## 7. 下一步建议（优先级排序）

> 更新于 2026-11-24：交付已改为「成员站为主、邮件为辅」（[TASK111](../../memory-bank/tasks/TASK111-in-system-delivery.md)），
> Resend 从「上线阻塞项」降级为「体验项」。现在真正挡在收费前的只有 live 密钥。

1. **公开站发版**：`dev` 仍领先 `main`（课程页线上 404）。发布前确认 `NEXT_PUBLIC_CHECKOUT_MODE` 取默认 `learn`；注意 Stripe 还是测试模式，发版后点「购买」能进 Checkout 但真卡付不了。
2. **切正式收款**：live 模式已开通（2026-11-24），结账已改为 `price_data` 动态报价，**不需要建 9 个 live 商品**。按 [`08-launch-runbook.md`](./08-launch-runbook.md) §3.7 执行：`wrangler deploy` → 注入 `STRIPE_SECRET_KEY`（`sk_live_` 或 `rk_live_`）/ 新的 `STRIPE_WEBHOOK_SECRET`（live endpoint 要勾满 **5 个事件**，含两个 `async_payment_*`）→ `curl /health` 确认 `stripeMode` 变成 `live`。换 live 不改任何被 git 跟踪的文件。
3. **Resend 接入（体验项，不再阻塞交付）**：`RESEND_API_KEY` + 在 Cloudflare 验证 `opencodeguide.com`（`resend._domainkey` TXT、合并 SPF、建议加 DMARC）。配好后无需改代码，新订单自动从 `skipped_no_resend` 转为正常发信；历史订单用 `POST /admin/resend` 补发。
4. **本地跑通一笔真实测试支付**：`npm run dev:proxy`（本地 D1 + `stripe listen`）→ 登录 → `/buy` → 测试卡 `4242…` → `/account` **立即**看到课程（对账生效）→ 测试退款验证 `revoked_at` 与门禁即时失效。
5. **Stripe 收据**：Dashboard 打开 receipt email，让付款凭证由 Stripe 直接发，不依赖我们自己的邮件通道。
6. **英文正文**：0/123，先定策略（全量翻译 vs 英文站只放目录 + 中文正文）。
7. **发布链路（Phase 1 完成，部署基线已补）**：`npm run publish` 收口「元数据同步 + 成员构建 + 自检 + 部署」；全量部署 131.7s、纯 Worker 改动 7.6s，是否改运行时下发仍待一条「改一节」的实测。详见 [TASK109](../../memory-bank/tasks/TASK109-publish-pipeline.md)、[TASK110](../../memory-bank/tasks/TASK110-member-ui-and-release.md) 与 [`10-publish-baseline.md`](./10-publish-baseline.md)。
8. **课程内容的仓库边界（已完成）**：付费正文已从公开仓历史移除（`dev` 只保留 8 节免费正文），私有仓 `iamsail/opencodeCourse` 收下完整旧历史；`manifest.json` 是课表真相源。详见 [TASK108](../../memory-bank/tasks/TASK108-course-content-split.md) 与 [`09-content-repo-boundary.md`](./09-content-repo-boundary.md)。

