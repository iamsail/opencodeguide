# 07 · 访问控制与会员中心方案（P2 设计稿）

> 决策前提：**只公开每门前 2 节，其余正文进入会员中心**（2026-11-19 确认）。
> 状态：P2.0（公开/付费分流 + 构建期断言）已实施，见第 15 节；P2.1–P2.4 仍是设计。

## 0. 决策记录

| 日期 | 决策 | 被否掉的选项 | 理由 |
| :--- | :--- | :--- | :--- |
| 2026-11-18 | 只公开每门前 2–3 节，其余进会员中心 | ① 全部公开靠自觉；② 只发签名链接不建账号 | ① 等于白送；② 链接可转发、无法按人撤销、也没有「我的课程」入口 |
| 2026-11-18 | 安全边界放在构建期（公开产物不含付费正文） | 前端隐藏 / 前端加密 | 静态站的 HTML 是公开文件，任何前端手段都能被 `curl` 绕过 |
| 2026-11-19 | 每门前 **2** 节免费 | 前 3 节 | 2 节够判断质量，「试读即通读」的风险更低；额度写在 `content/courses/access.json`，改数字即可调 |
| 2026-11-19 | 部分退款保留访问 | 一律回收 | 部分退款多为补差价/少发一节，不是退货；全额才回收 |
| 2026-11-19 | 拒付默认**不**立即回收（`REVOKE_ON_DISPUTE=1` 可改） | 一律回收 | 拒付常是持卡人误操作，金额未最终判定；先取证举证，避免误伤正常用户 |
| 2026-11-19 | 鉴权用**自建 magic link**（D1 + Resend + WebCrypto） | Supabase Auth | 已有 Resend 与 D1；magic link 协议面小、无月费、按人可撤销；换供应商只增加迁移面 |
| 2026-11-19 | 登录改为 **Google OAuth（唯一方式）**，去掉 magic link | 保留 magic link 兜底 | 用户少一步、少一个邮件依赖；代价是 Google 账号在大陆不可用（已知取舍，后续可加 GitHub provider） |
| 2026-11-19 | 改为**先登录再买**：服务端创建 Checkout Session，用 Customer 锁死邮箱 | 匿名 Payment Link + 事后认领 | 身份与付款人天然一致，不再依赖「付款邮箱 = 登录邮箱」；代价是必须登录才能下单 |
| 待定 | `learn.` 子域托管（Cloudflare / Vercel） | — | 取决于 DNS 能否交给 Cloudflare |
| 待定 | 鉴权实现（自建 magic link / Supabase Auth） | — | 已有 Resend + D1，倾向自建 |

## 0.1 实施清单（按文件，可直接照做）

公开构建（P2.0，已完成 2026-11-19）：

- [x] `lib/course-access.ts` + `scripts/courses/access.mjs`：读 `COURSE_ACCESS`（`public` | `members`），共用 `content/courses/access.json` 的免费额度
- [x] `lib/course-lessons.ts`：`getCourseLessons` 按课表顺序解析 `free`，新增 `isLessonLocked` / `getReadableLessons`
- [x] `app/(zh)/zh/courses/[slug]/[lesson]/page.tsx`：课时 URL 全量生成（旧链接不 404），按模式渲染正文或锁定页
- [x] `components/courses/locked-lesson.tsx`：锁定页（试听入口 + 购买 CTA + `data-locked-lesson` 标记）
- [x] `app/sitemap.ts`：public 只收录免费节；members 模式不收录课时
- [x] `scripts/courses/assert-no-gated-content.mjs`：双向扫描 `out/`（探针找泄露 + 锁定标记 + 免费页对照）
- [x] `.github/workflows/deploy.yml`：固定 `COURSE_ACCESS: public`，`npm run build` 末尾自动跑断言
- [x] `scripts/build-search.mjs`：付费节正文不再进 `public/search.json`（原本会带 400 字正文）
- [x] `scripts/courses/validate-courses.mjs`：校验免费额度配置，输出「公开 N 节 / 锁定 M 节」

成员站（P2.1–P2.3）：

- [ ] `workers/course-delivery/migrations/0002_entitlements.sql`：`entitlements` / `magic_links` / `auth_attempts`
- [ ] `workers/course-delivery/src/entitlements.js`：订单 → 权益写入/回收（webhook 调用）
- [ ] `workers/course-delivery/src/auth.js`：magic link 签发/校验、会话 JWT、限流
- [ ] `workers/course-delivery/src/gate.js`：静态资源请求的鉴权中间件
- [ ] `workers/course-delivery/src/routes/account.js`：我的课程、退出、重发
- [ ] `workers/course-delivery/wrangler.toml`：`assets` 绑定 member 构建产物 + 自定义域
- [ ] `scripts/courses/backfill-entitlements.mjs`：历史订单补齐权益

## 1. 目标与非目标

**目标**

1. 未购买者只能读到每门课的免费节与课程详情页，读不到付费正文。
2. 购买后凭邮箱登录即可阅读全部已购课程，不需要密码、不需要记住链接。
3. 退款/拒付后**当天内**失去访问权（不是靠给链接加过期时间）。
4. 公开页面保持静态、可被搜索引擎收录；付费页面不被收录。
5. 不引入月度固定成本：免费额度内即可运行。

**非目标（本期不做）**

- 视频播放与防盗链（课程是文章版）
- 学习进度、证书、评论、问答
- 团队席位、企业采购（P3）
- 手机 App / 离线下载

## 2. 现状与关键约束

| 现状 | 影响 |
| :--- | :--- |
| 站点 `output: 'export'`，由 **GitHub Pages** 发布 `out/` | 没有任何服务端运行时，**静态产物里的正文等于公开** |
| 课程正文是 MDX，`content/courses/<locale>/<course>/*.mdx` | 正文文件本身不能进入公开构建 |
| 已有 `course-delivery` Worker（Stripe Webhook → D1 → Resend） | 权益写入可以复用这条链路，不必新建支付侧 |
| D1 `orders` 表已记录每笔订单（email / course / plan / status） | 权益表可以从 `orders` 派生，历史订单可补齐 |

**由此推导出的第一原则：安全边界在构建期，不在前端。**

只靠样式隐藏、`display:none`、JS 弹窗拦截都不算数——任何人 `curl` 一下页面就能拿到全文。所以付费正文必须**物理上不出现在公开产物里**。

## 3. 公开 / 付费边界

| 页面 | 公开 | 说明 |
| :--- | :--- | :--- |
| 课程目录 `/zh/courses`、详情页 | ✅ | 营销页，SEO 主力 |
| 每门课课表**前 2 节** | ✅ | 免费试听；额度由 `content/courses/access.json` 控制 |
| 其余课时正文 | ❌ | 只在成员站提供 |
| 法务页、退款政策、定价 FAQ | ✅ | 转化与合规需要 |
| 账户页 `/account` | ❌ | 需登录 |

免费节用 frontmatter 的 `free: true` 标记（已支持），构建时据此分流，不另设白名单。

## 4. 架构

```
                        ┌──────────────────────────────┐
   opencodeguide.com ──▶│ GitHub Pages（公开静态站）      │
                        │ 目录 / 详情 / 免费节 / 法务页    │
                        │ ⚠ 构建时不包含付费正文          │
                        └──────────────┬───────────────┘
                                       │ 「解锁全部 33 节」按钮
                                       ▼
   learn.opencodeguide.com ──▶┌──────────────────────────┐
                              │ Cloudflare Worker         │
                              │ ① 静态资源（成员构建产物）  │
                              │ ② /auth/* magic link      │
                              │ ③ 权益校验（D1）           │
                              │ ④ /account 我的课程       │
                              └──────────┬───────────────┘
                                         │
                                   D1（orders / entitlements / magic_links）
                                         ▲
                              Stripe Webhook（已有 Worker）
```

要点：

- **两份构建产物，同一个代码库**，由环境变量切换：
  - `COURSE_ACCESS=public`（默认）→ 只生成免费节；付费节渲染为「锁定页」
  - `COURSE_ACCESS=members` → 生成全部课时，仅部署到成员站
- 成员站与公开站**同域不同子域**：cookie 可用 `Domain=.opencodeguide.com`，用户从公开站点击后无需二次登录。
- 成员站整个域名 `noindex`（响应头 + robots.txt），且不加入 sitemap。

### 为什么不用「前端加密 + 接口发密钥」

看起来省事，实际把 110 篇正文全部塞进公开产物，只是加了把锁。密钥一泄露（买家一定会分享），全部内容就永久公开，且无法按人撤销。构建期分流是唯一能同时满足「不泄露」和「可撤销」的做法。

## 5. 登录与购买（Google OAuth + 先登录再买）— 已实现

> 最初方案是「邮件 magic link」。2026-11-19 改为 Google OAuth 并去掉 magic link：
> 用户少一步、少一个邮件服务依赖；代价是 Google 账号在中国大陆不可用（已知取舍）。

**登录**

1. `GET /login` → 「使用 Google 继续」→ `GET /auth/google`
2. 生成 state + PKCE verifier，写 HttpOnly cookie（10 分钟），302 到 Google
3. `GET /auth/google/callback`：比对 state → 换令牌 → 取 userinfo → 只接受 `email_verified: true`
4. 写会话 cookie（HS256 JWT，30 天，HttpOnly / Secure / SameSite=Lax）
5. 每个受保护请求：验签 → 查 `entitlements`（每次查库，所以退款即时生效）

**购买（先登录再买）**

1. 公开站购买按钮 → `https://learn.opencodeguide.com/buy/<slug>/<plan>`
2. 未登录 → `/login?next=/buy/...`，登录后回到购买页
3. `POST /checkout`：用**登录邮箱**创建/复用 Stripe Customer，再创建 Checkout Session
   - 传 `customer`（不是 `customer_email`），Stripe 页面上邮箱不可改
   - `metadata` 带 `email` / `course_slug` / `plan_id`
4. Webhook 优先读 `metadata.email` 写权益 → 付款人与阅读身份天然一致
5. 支付成功回跳 `/account?paid=1`

**为什么不保留匿名购买**：身份只能来自「付款时填的邮箱」，而那个邮箱我们无法验证归属；
先登录后购买让身份和付款人是同一个对象，也不需要为对齐身份再发验证邮件。

## 6. 数据模型（D1 增量）

```sql
-- 权益：以邮箱为自然键，与现有 orders 对齐
-- 已实现：workers/course-delivery/migrations/0002_entitlements.sql（2026-11-19）
create table if not exists entitlements (
  id          text primary key,
  email       text not null,          -- 统一小写去空格
  course_slug text not null,          -- 含 'all-access'（bundle 自身也留一条）
  plan_id     text not null,
  order_id    text,                   -- 产生权益的订单；全额退款按它批量撤销
  granted_at  text not null,
  revoked_at  text,                   -- 非空 = 已回收
  unique (email, course_slug)
);
create index if not exists entitlements_email_idx on entitlements (email);
create index if not exists entitlements_order_idx on entitlements (order_id);
create index if not exists entitlements_course_idx on entitlements (course_slug);

-- 登录令牌：只存哈希
create table if not exists magic_links (
  token_hash  text primary key,
  email       text not null,
  expires_at  text not null,
  used_at     text,
  created_at  text not null,
  ip          text
);
create index if not exists magic_links_email_idx on magic_links (email, created_at);

-- 限流计数（也可用 KV，这里少一个绑定）
create table if not exists auth_attempts (
  key         text not null,          -- 'ip:1.2.3.4:2026-11-18T22'
  count       integer not null default 1,
  primary key (key)
);
```

**权益派生规则**

| 购买内容 | 写入的权益 |
| :--- | :--- |
| 单课（`single` / `pro`） | `(email, <course_slug>)` 一条 |
| 全站通（`all-access`） | 展开为四门课各一条 + `(email, all-access)` 一条 |

`all-access` 单独留一条的原因：新课程上线时批量补权益，只需要按 bundle 记录回溯。

**退订/退款**：`charge.refunded` 全额 → 把该订单对应的所有权益置 `revoked_at`；部分退款不回收（与现有策略一致）。

## 7. 页面与路由

| 路径（learn. 子域） | 说明 |
| :--- | :--- |
| `/` | 我的课程列表：已购课程 + 进度（进度 P3） |
| `/courses/<slug>/` | 课程目录（仅已购；未购显示购买引导） |
| `/courses/<slug>/<lesson>/` | 正文页，带「仅限 xxx@example.com 使用」水印 |
| `/account/` | 邮箱、退出登录、重发登录链接、退款状态 |
| `/auth/magic`、`/auth/verify`、`/auth/logout` | 鉴权端点 |

公开站上的付费节链接统一指向 `https://learn.opencodeguide.com/courses/...`，由成员站判断登录态：
未登录 → 登录页（带回跳地址）；已登录但无权益 → 购买页。

## 8. SEO

- 公开站：免费节与详情页正常收录；付费节仍生成 URL，但只渲染「锁定页」（大纲 + 试听入口 + 购买 CTA），正文不入产物。锁定页可索引，但不提交 sitemap。
- 成员站：`X-Robots-Tag: noindex, nofollow`，`robots.txt` 全禁，且不出现在 sitemap。
- sitemap 只列出公开站 URL；`app/sitemap.ts` 增加 `COURSE_ACCESS` 判断。

## 9. 安全细则

1. **构建期隔离**：`COURSE_ACCESS=public` 时，付费 MDX 不进入页面 bundle；验收方式是 `npm run courses:assert` 扫描 `out/`（已写进 `npm run build` 末尾与 CI）。
2. **水印**：正文页右上角固定显示邮箱（半透明、不可通过 CSS 隐藏掉内容本身），降低整页截图传播意愿。
3. **防枚举**：登录请求的响应与耗时对「已购/未购」保持一致。
4. **令牌**：只存哈希、单次使用、15 分钟过期；cookie `HttpOnly` + `Secure` + `SameSite=Lax`。
5. **限流**：邮箱维度（60s/封）+ IP 维度（5 封/小时），超限返回 429 但页面文案不提示「被限流」以外信息。
6. **日志**：记录 `event=login_success|login_fail|entitlement_denied|revoked_access`，不含令牌与正文。
7. **CORS**：成员站不开放跨域 API；所有请求同域。

## 10. 双构建流水线

```
npm run build                      # COURSE_ACCESS=public  → out/            → GitHub Pages
COURSE_ACCESS=members npm run build → out-members/         → wrangler deploy（静态资源）
```

CI 增加一步：public 构建后跑 `node scripts/courses/assert-no-gated-content.mjs`，扫描 `out/` 中是否出现付费课时的正文特征串（例如每节课 frontmatter 里的 `summary`），出现即失败。这是**唯一能防住"不小心把付费内容发出去"的闸门**，必须有。

## 11. 分期与工时

| 阶段 | 内容 | 工时 |
| :--- | :--- | :--- |
| P2.0 | 公开/付费边界：`free` 分流、锁定页、sitemap 调整、`assert-no-gated-content` | 0.5–1 天 |
| P2.1 | 权益表 + Webhook 写入/退款回收 + 历史订单补齐脚本 | 0.5–1 天 |
| P2.2 | 鉴权 Worker：magic link、会话、限流、`/account` | 1.5–2 天 |
| P2.3 | 成员站部署：成员构建、Worker 静态资源、子域与 DNS、noindex | 0.5–1 天 |
| P2.4 | 体验与运营：水印、邮件模板、登录失败排查、日志看板 | 0.5–1 天 |
| 合计 | | **4–6 个工程师日** |

前置条件（需要你确认/操作）：

1. **`learn.opencodeguide.com` 的 DNS 必须能指向 Cloudflare**（Worker 自定义域要求域名托管在 Cloudflare）。若 DNS 在别处，需要把该子域迁到 Cloudflare，或改用 Vercel 部署成员站（成本从 0 变成按量计费）。
2. 明确免费边界是「每门 2 节」还是「3 节」。
3. 会员站是否允许同一邮箱多设备同时登录（默认允许，不做设备数限制）。

## 12. 验收标准

- [x] `COURSE_ACCESS=public` 构建产物中，`grep` 不到任何付费课时正文（CI 强制）
- [x] 付款后 `entitlements` 出现对应记录；同一事件重投不产生重复权益（P2.1）
- [x] 全额退款后该订单名下权益置 `revoked_at`；部分退款保留（P2.1）
- [x] 登录链接只能使用一次，过期后失效；同 IP 一小时内第 6 次请求 → 429（P2.2）
- [x] 未登录访问受保护路径 → 302 登录页并回跳；无权益 → 403（P2.2，`gate.js`）
- [ ] 成员站静态资源接上 `gate.js`、`X-Robots-Tag` 落到每个响应（P2.3）
- [ ] 未登录访问成员站任意正文 → 302 到登录页，登录后回跳原页面
- [ ] 未购买用户登录后只能看到免费节与购买引导
- [ ] 已购用户可用邮箱 + 邮件链接登录，30 天内免登录
- [ ] 退款后 1 分钟内该用户访问已退款课程 → 403 + 明确提示
- [ ] 成员站所有响应带 `X-Robots-Tag: noindex`
- [ ] 登录链接只能使用一次，过期后失效
- [ ] 同 IP 一小时内第 6 次请求登录邮件 → 429
- [ ] 全站不新增月度固定成本（Cloudflare 免费额度内）

## 13. 备选方案与取舍

| 方案 | 优点 | 为什么不选 |
| :--- | :--- | :--- |
| 前端加密 + 接口发密钥 | 不用改托管 | 正文仍在公开产物里；密钥一泄露永久失效，无法按用户撤销 |
| 只发签名链接（无登录） | 最简单，1 天可上线 | 链接可转发；无法「我的课程」；单人撤销只能换密钥，影响所有买家 |
| Cloudflare Access（Zero Trust） | 现成的身份验证 | 它不认识 Stripe 权益；按邮箱白名单维护成本高，且免费版有人数限制 |
| 迁到 Vercel 用 Middleware 鉴权 | 代码最顺 | 违背 TASK077 的零计算成本设计，且 Vercel 免费额度对中间件有限制 |
| Supabase Auth + RLS | 托管省心 | 多一个供应商/月费/迁移面；magic link 协议面小，自建更可控 |

## 14. 还需要拍板的最后一件事

1. ~~**免费边界**~~ ✅ 2026-11-19 定为每门前 2 节（`content/courses/access.json`）。
2. ~~**登录形态**~~ ✅ 2026-11-19 定为自建 magic link（D1 + Resend + WebCrypto）。
3. ~~**DNS**~~ ✅ 2026-11-19 实测确认：`opencodeguide.com` 的 NS 已是 Cloudflare（`alla/tadeo.ns.cloudflare.com`），`learn.opencodeguide.com` 已代理到 Worker 自定义域。结论：成员站走 Cloudflare，顶点域继续 GitHub Pages（DNS only）。操作步骤见 [08-launch-runbook.md](./08-launch-runbook.md) §1。

## 15. P2.0 实施记录（2026-11-19）

**做了什么**

| 环节 | 实现 | 结果 |
| :--- | :--- | :--- |
| 免费额度 | `content/courses/access.json` 的 `freeLessonLimit: 2` | 站点、sitemap、搜索索引、校验、CI 五处共用同一口径 |
| 付费节渲染 | `lesson-view` 收到 `locked` 时只渲染 `locked-lesson.tsx`，且页面不把正文传给视图 | 付费正文不进入 HTML / RSC payload |
| 索引与搜索 | 付费节仍可搜到标题与摘要，正文不进 `search.json` | 搜索不会变成全文泄露口子 |
| 构建闸门 | `scripts/courses/assert-no-gated-content.mjs` | 泄露即 exit 1，`npm run build` 末尾自动执行 |

**当前状态（`npm run build` 实测）**

- 课时正文 123 节：**公开 8 节 / 锁定 115 节**（4 门课 × 前 2 节）。
- 断言扫描 `out/` 1773 个文件、230 条探针，0 命中；每个付费课时页都有 `data-locked-lesson`，免费页正文对照通过。
- 探针抽取已能处理行内代码/加粗（正文被切碎时取其中最长纯文本片段），避免「格式复杂 → 抽不出探针 → 构建失败」。
- 负向测试：往产物副本里塞一节付费正文，断言立即报错并 exit 1。

**怎么调**

```bash
# 改免费节数（改完必须重新构建）
vim content/courses/access.json     # freeLessonLimit
npm run build

# 只跑闸门 / 看探针样本
npm run courses:assert
node scripts/courses/assert-no-gated-content.mjs --report

# 成员构建（P2.3 才会真正用上；会生成全部正文，禁止部署到公开站）
COURSE_ACCESS=members npm run build
```

**重要：上线顺序**

P2.0 之后，付费正文在公开站**已经读不到**了。所以在 P2.1–P2.3（权益表 + magic link + 成员站）上线前**不要开启真实收款**——否则买家付款后没有阅读入口。当前 `stripe-links.json` 没有配置任何链接，站点处于等待名单状态，正好卡在这个安全点上。

**已知取舍**

- 锁定页不提交 sitemap（避免 80+ 条薄页面拉低站点质量信号），但仍可从课程详情页与课表进入、可被索引。
- 免费额度按「课表顺序」而不是「模块 1」计算：课程 3 的模块 1 只有 1 节，第 2 节会自动顺延到模块 2。
- `frontmatter` 的 `free: true` 仍然有效，可用于额外开放某一节；`validate` 会在它超出额度时给出警告。

## 16. P2.1 权益表实施记录（2026-11-19）

**做了什么**

| 环节 | 实现 | 验证 |
| :--- | :--- | :--- |
| 迁移 | `migrations/0002_entitlements.sql`：`entitlements` + `magic_links` + `auth_attempts`（后两张留给 P2.2） | 在真实 SQLite 上跑通建表 + 索引 |
| 权益逻辑 | `src/entitlements.js`：`normalizeEmail` / `resolveEntitlementTargets` / `grantEntitlements` / `revokeEntitlements` / `hasCourseAccess` | 13 个单测 |
| 存储 | `store.js` 新增 `grantEntitlement`（upsert 复活）/ `revokeEntitlementsByOrder` / `hasEntitlement` | 随事件测试覆盖 |
| 接线 | 付款成功先写权益再发信；全额退款撤销；拒付按 `REVOKE_ON_DISPUTE` | 9 个事件级测试 |
| 回填 | `scripts/courses/backfill-entitlements.mjs` 生成幂等 SQL（`--execute` 才执行） | 真实 SQLite 跑通：单课 1 条、全站通 5 条、退款排除、部分退款保留、重复执行不变 |

**关键取舍**

1. **权益与交付物解耦**：只要拿到邮箱与课程就写权益，与 `COURSE_DELIVERY` 是否配置无关——没配外链不该让买家失去已付费的阅读权。
2. **先写权益后发信**：发信失败可补发（`/admin/resend`），但「已付款却没授权」必须让 Stripe 重试（D1 失败 → 500 + 撤销幂等标记）。
3. **重投补偿点**：订单已存在但权益缺失时，`duplicate` 分支会补一次幂等授权——这是 D1 抖动后唯一的自愈路径。
4. **bundle 自身留一条**：新课程上线时按 `all-access` 记录批量补授，不用逐个翻订单。

**测试**：`npm run workers:test` → 62/62 通过（原 40，新增 22）。

**下一步（P2.2）**：`/auth/magic` 签发与校验、会话 JWT、限流、`/account`、静态资源门禁 `gate.js`——门禁每次请求都查 `entitlements`，所以 P2.1 的撤销能直接生效。

## 17. P2.2 实施记录（magic link 版本，已被第 18 节取代）

**做了什么**

| 环节 | 实现 | 验证 |
| :--- | :--- | :--- |
| 令牌 | `generateMagicToken`（32 字节）/ `hashToken`（SHA-256）/ 单次使用 | 单测：重复消费、过期、未知令牌全部拒绝；库里无明文 |
| 限流 | 固定窗口：`email:<邮箱>:<分钟>` 1 次、`ip:<IP>:<小时>` 5 次，24 小时清理 | 单测：同窗第 2 封拒绝、下个窗口放行、第 6 个 IP 请求拒绝 |
| 会话 | HS256 JWT（`sub/iat/exp/jti`），30 天，`HttpOnly; Secure; SameSite=Lax` | 单测：篡改签名/换密钥/过期全部拒绝；缺 `SESSION_SECRET` 一律 fail closed |
| 端点 | `/login`、`POST /auth/magic`、`GET /auth/verify`、`/auth/logout`、`/account` | 集成测试：付款 → 收信 → 点链接 → 看到课程 → 退出全链路 |
| 防枚举 | 非法邮箱与未购买邮箱的响应完全一致；限流才返回 429 | 集成测试 |
| 防开放重定向 | `safeNextPath` 只接受站内路径 | 单测 |
| 门禁 | `gate.js` 默认拒绝；按路径解析课程 slug，查权益或全站通 | 单测：未登录 401、无权益 403、全站通放行、撤销后立刻失效 |

**测试**：`npm run workers:test` → 100/100（P2.1 时 62，新增 38）。

**尚未做（P2.3）**

1. `env.ASSETS.fetch()` 接在门禁之后，保护**所有文件类型**（`index.txt`、`__next.*.txt`、`search.json`）；
2. `learn.` 子域与 DNS、成员站构建（`COURSE_ACCESS=members`）；
3. 全站的 `X-Robots-Tag: noindex` 与 `robots.txt` 全禁；
4. 正文页水印（邮箱）与登录失败排查日志看板（P2.4）。

## 18. 登录与购买改造（2026-11-19）

**改了什么**

| 环节 | 之前 | 现在 |
| :--- | :--- | :--- |
| 登录 | 邮件 magic link（依赖 Resend） | Google OAuth（`src/oauth.js` + `routes/auth.js`） |
| 删除 | `magic_links` / `auth_attempts` 表与相关代码 | 迁移 `0003_drop_magic_link.sql` |
| 购买 | 公开站跳 Stripe Payment Link（匿名） | 公开站 → `learn./buy/<slug>/<plan>`（需登录）→ `POST /checkout` |
| 支付会话 | Payment Link 托管 | 服务端创建 Checkout Session（`src/stripe-api.js`） |
| 身份 | 用 Stripe 页面填的邮箱 | 用登录邮箱，并绑定 Stripe Customer（邮箱不可改） |
| 权益归属 | `customer_details.email` | `metadata.email` 优先，回退旧逻辑 |

**新增配置（Worker）**

| 名称 | 说明 |
| :--- | :--- |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth 客户端 |
| `GOOGLE_REDIRECT_URI` | 可选，默认 `${LEARN_URL}/auth/google/callback`，必须与控制台一致 |
| `STRIPE_SECRET_KEY` | 服务端创建 Customer / Checkout Session |
| `COURSE_CATALOG` | 运行时课程目录（标题 / 金额 / 主题色），由 `scripts/courses/sync-worker-catalog.mjs` 生成；结账用 `price_data` 现场报价，无 priceId |
| `SESSION_SECRET` | 会话签名（已有） |

**测试**：`npm run workers:test` → 101/101（覆盖 OAuth state/PKCE、邮箱未验证、buy 需登录、
checkout 用 Customer 锁邮箱、metadata 带登录邮箱）。

**遗留**：公开站的购买按钮仍指向 Payment Link（需要改 `lib/courses.ts` / `BuyButton` 指向
`learn./buy/...` 并重新构建部署）；旧 Payment Link 继续可用作兼容。
