# 06 · TODO 与进度看板

> 更新时间：2026-11-19（P2.0 付费墙已上线；文章版内容 88/123 节）· 分支 `dev`
> 状态图例：`[x]` 已完成 · `[ ]` 未开始 · `[~]` 进行中 · `[!]` 需外部输入

## 0. 总览

| 阶段 | 范围 | 状态 | 完成度 |
| :--- | :--- | :--- | :--- |
| P0 基建与预售 | 课程页、数据层、Stripe 接入、文档 | 已完成 | 100% |
| P1 首发成交 | 正式收款、优惠码、邮件交付、发票 | 进行中（代码已就绪，等密钥与交付物） | 45% |
| P2 会员中心 | 登录、权益、播放页、Webhook | 进行中（P2.0 分流 + P2.1 权益 + P2.2 登录已完成） | 55% |
| 文章版内容 | 4 门课 123 节正文 + 课时阅读页 | 进行中 | 72%（88/123） |
| P3 规模化 | 订阅、企业采购、联盟、训练营 | 未开始 | 0% |

## 0.1 文章版内容进度

| 课程 | 正文 | 字符数 | 代码块 | 阅读时长 | 说明 |
| :--- | ---: | ---: | ---: | ---: | :--- |
| AI 编程实战 | 27/27 | 8.9 万 | 76 | 3.8h | 完成 |
| 独立开发者出海 | 33/33 | 10.0 万 | 50 | 4.7h | 完成 |
| 跨境电商独立站 | 28/36 | 7.1 万 | 32 | 4.0h | 差模块 7（广告投放）、模块 8（数据复购）共 8 节 |
| 出海网站 SEO | 0/27 | — | — | — | 未开始 |
| **合计** | **88/123** | **26 万** | **158** | — | 72% |

未写正文的节在课表里渲染为「制作中」并置灰，不会产生死链；`npm run courses:validate` 会把缺的节报成警告。

免费边界 = **每门前 2 节**（`content/courses/access.json` 的 `freeLessonLimit`）。公开构建只渲染这 6 节正文，其余 82 节是锁定页；`npm run build` 末尾的 `courses:assert` 会断言公开产物里没有付费正文。

写作规格：每节 700–1100 汉字，至少 1 个可复制产物（命令/配置/表格/公式），`## 落地动作` 3 步 + `## 常见坑` 现象→原因→对策；技术课对齐仓库内 OpenCode 文档，商业课不写死税率/费率/平台规则数字（只写判定方法与查询路径）。

## 1. P0 已完成清单（本地已验证）

- [x] 双语课程目录页 `/zh/courses`、`/en/courses`（四条路线、课程卡、全站通、学习路径、FAQ）
- [x] 课程详情页 5 个（4 门课 + 全站通），`generateStaticParams` 静态生成，`dynamicParams = false`
- [x] 付款回执页 `/zh|courses/thank-you`，读取 `?course=&plan=` 展示本地化订单摘要（Suspense 包裹）
- [x] 课程数据层 `lib/courses.ts` + 文案层 `lib/course-copy.ts`
- [x] 课程内容 `content/courses/*.json`（110 节课大纲，中英双语）
- [x] Stripe Payment Link 生成脚本（幂等、`--dry-run`、`--only`、`--force`、`--redirect-locale`）
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

- [ ] 生成正式 Payment Link，逐条核对价格、币种、回执跳转
- [ ] 用真实小额订单跑通「支付 → 回执 → 邮件 → 退款」全链路
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
- [~] 全部课程正文文章化
  - [x] 课程 1（27 节）、课程 2（33 节）
  - [~] 课程 3（28/36 节）
  - [ ] 课程 4（0/27 节）
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
> 免费边界已定（每门 2 节，P2.0 已实施）；待拍板：`learn.` 子域 DNS 是否交给 Cloudflare、自建 magic link 还是 Supabase Auth。
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
  - 待办：公开站购买按钮改指向 `learn./buy/...` 并重新部署
- [ ] 成员站部署：成员构建 + Cloudflare Worker 静态资源 + `learn.opencodeguide.com` + noindex（P2.3）
- [x] 基础设施：D1 `orders`（0001）/ `entitlements` / `magic_links` / `auth_attempts`（0002，不需要 Supabase）
- [~] Checkout Session 接口替换 Payment Link：Worker 端已完成（`/checkout`），公开站按钮待切换，旧链接保留兼容
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
- [x] `npm run courses:meta`：从大纲与已写正文推导 `lessonCount` / `durationHours`，避免 5 个 JSON 各写一份数字
- [ ] 英文正文（27+33+28+0 节的翻译或改写），决定先做哪门
- [ ] 详情页「更新日志」区块（依赖课程内容的版本记录）
- [ ] 课程页视觉回归截图（当前手动用 Chrome headless 抽查）
- [ ] 把 `lib/course-copy.ts` 的文案抽成 JSON（与课程内容同构，便于翻译外包）
- [ ] 详情页价格支持多币种展示（USD 主价 + CNY/EUR 参考）
- [ ] 为课程页增加 OG 图片（当前复用站点默认）
- [ ] 课程卡片的「2026 版」徽章改为数据字段（`edition`），避免硬编码
- [ ] 英文化课程页 SEO 描述超长（5 条 >160 字符，详情页 meta 会被截断）：等英文文案校对时一并收敛

## 7. 下一步建议（优先级排序）

1. **P2.1 权益表 + P2.2 magic link**：这是能安全开启收款的前置条件（付费正文已从公开站下架，买家需要有地方读）。
2. **P1 邮件交付 Worker 上线**：等 Stripe live 密钥与 Resend 域名到位（代码已就绪，40/40 测试通过）。
3. **补内容**：课程 3 剩 8 节 + 课程 4 的 27 节；写进 `content/courses/zh/...` 后自动获得前 2 节试听。
4. **正式 Payment Link + 早鸟码**：在 1、2 都就绪后再打通真实收款。
