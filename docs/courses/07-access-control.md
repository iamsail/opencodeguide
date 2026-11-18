# 07 · 访问控制与会员中心方案（P2 设计稿）

> 决策前提：**只公开每门前 2–3 节，其余正文进入会员中心**（2026-11-18 确认）。
> 本文只做设计，不含实施代码。

## 0. 决策记录

| 日期 | 决策 | 被否掉的选项 | 理由 |
| :--- | :--- | :--- | :--- |
| 2026-11-18 | 只公开每门前 2–3 节，其余进会员中心 | ① 全部公开靠自觉；② 只发签名链接不建账号 | ① 等于白送；② 链接可转发、无法按人撤销、也没有「我的课程」入口 |
| 2026-11-18 | 安全边界放在构建期（公开产物不含付费正文） | 前端隐藏 / 前端加密 | 静态站的 HTML 是公开文件，任何前端手段都能被 `curl` 绕过 |
| 待定 | 免费节数（2 或 3） | — | 影响转化与 SEO，改动成本低 |
| 待定 | `learn.` 子域托管（Cloudflare / Vercel） | — | 取决于 DNS 能否交给 Cloudflare |
| 待定 | 鉴权实现（自建 magic link / Supabase Auth） | — | 已有 Resend + D1，倾向自建 |

## 0.1 实施清单（按文件，可直接照做）

公开构建（P2.0）：

- [ ] `next.config.mjs` / `scripts/courses/build.mjs`：读取 `COURSE_ACCESS`（`public` | `members`）
- [ ] `lib/course-lessons.ts`：新增 `getAccessibleLessons(courseSlug, locale)`，`public` 模式只返回 `free: true`
- [ ] `app/(zh)/zh/courses/[slug]/[lesson]/page.tsx`：`generateStaticParams` 按模式过滤
- [ ] `components/courses/locked-lesson.tsx`：锁定页（大纲 + 试听 + 购买 CTA），替代付费正文
- [ ] `app/sitemap.ts`：public 模式只收录免费节
- [ ] `scripts/courses/assert-no-gated-content.mjs`：扫描 `out/`，命中付费课 `summary` 即 exit 1
- [ ] `.github/workflows/deploy.yml`：public 构建后跑断言；members 构建另行部署

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
| 每门课模块 1 的第 1–2 节 | ✅ | 免费试听，2 节足够判断质量；同时是长尾搜索入口 |
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

## 5. 鉴权设计（magic link，自建）

已有 Resend 与 D1，再加一个供应商（Supabase Auth）会多一处身份源、多一份月费与迁移风险。magic link 的协议面很小，自建可控。

**流程**

1. 用户输入邮箱 → `POST /auth/magic`
   - 生成 32 字节随机 token，DB 只存 `sha256(token)`，TTL 15 分钟，单次使用
   - 同邮箱 60 秒内只发一封；同 IP 每小时上限 5 封
   - 无论邮箱是否购买过，都返回同样的「已发送」页面（防枚举）
2. 邮件里点击 `https://learn.opencodeguide.com/auth/verify?t=<token>`
   - 校验哈希、TTL、未使用 → 标记 `used_at`
   - 若 `entitlements` 无记录：仍允许登录，但只看到「暂无已购课程 + 联系支持」
3. 下发会话：`Set-Cookie: session=<JWT HS256>; HttpOnly; Secure; SameSite=Lax; Domain=.opencodeguide.com; Max-Age=2592000`
   - payload：`sub=email`、`iat`、`exp`、`jti`
4. 每次访问受保护页面：验签 → 取 `sub` → 查 `entitlements`（带 `revoked_at is null`）→ 通过才返回正文
   - 会话是长期的，但**授权每次都查库**，所以退款即时生效

**为什么不用长期签名链接**：链接会被转发、无法按人撤销、也没有「我的课程」入口。magic link 只多一步点击，换来可撤销的会话。

## 6. 数据模型（D1 增量）

```sql
-- 权益：以邮箱为自然键，与现有 orders 对齐
create table if not exists entitlements (
  id          text primary key,
  email       text not null,
  course_slug text not null,          -- 含 'all-access'
  plan_id     text not null,
  order_id    text references orders(id),
  granted_at  text not null,
  revoked_at  text,
  unique (email, course_slug)
);

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

- 公开站：免费节与详情页正常收录；付费节在公开站**不再生成页面**，改为渲染「锁定页」（可索引、可转化，内容为大纲 + 试听入口 + 购买 CTA）。
- 成员站：`X-Robots-Tag: noindex, nofollow`，`robots.txt` 全禁，且不出现在 sitemap。
- sitemap 只列出公开站 URL；`app/sitemap.ts` 增加 `COURSE_ACCESS` 判断。

## 9. 安全细则

1. **构建期隔离**：`COURSE_ACCESS=public` 时，付费 MDX 不进入页面 bundle；验收方式是 `grep` 公开产物确认无付费正文片段（写进 CI）。
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

- [ ] `COURSE_ACCESS=public` 构建产物中，`grep` 不到任何付费课时正文（CI 强制）
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

## 14. 需要你拍板的三件事

1. **免费边界**：每门前 2 节，还是前 3 节？（影响转化与 SEO，改起来很便宜）
2. **DNS**：`learn.opencodeguide.com` 能否交给 Cloudflare？（决定成员站是 Cloudflare 还是 Vercel）
3. **登录形态**：自建 magic link（推荐，复用现有 Resend + D1）还是直接上 Supabase Auth？
