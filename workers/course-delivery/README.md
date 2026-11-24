# course-delivery Worker

课程付款后的自动交付：Stripe Webhook → D1 订单 → Resend 开通邮件。

```
Stripe Payment Link  ──checkout.session.completed──▶  POST /stripe/webhook
                                                        │ 1. 校验 Stripe-Signature（HMAC-SHA256 + 5 分钟容差）
                                                        │ 2. processed_events 幂等（event.id）
                                                        │ 3. orders 落库（session_id 唯一）
                                                        │ 4. Resend 发中英双语开通邮件
                                                        ▼
                                              D1: orders / processed_events
```

退款（`charge.refunded`）会把订单标记为 `refunded` / `partially_refunded`，全额退款同时写
`revoked_at`（权益回收时间），并给买家发退款到账说明。拒付（`charge.dispute.created`）标记
`disputed` 并提示运营举证。

## 为什么单独做成 Worker

站点是 `output: 'export'` 的纯静态导出（Vercel Function Invocations 为 0，这是成本设计的一部分）。
Webhook 需要服务端运行时，所以放在 Cloudflare Worker：静态站不用改架构，Webhook 与邮件发送
也不占用站点托管。方案来源见 [`docs/courses/04-stripe-integration.md`](../../docs/courses/04-stripe-integration.md) 第 7 节。

## 部署（约 20 分钟，一次性）

```bash
cd workers/course-delivery

# 1. 创建 D1 并把 database_id 填进 wrangler.toml
npx wrangler d1 create course-delivery
#   → 复制输出的 database_id 到 wrangler.toml 的 [[d1_databases]]

# 2. 建表
npx wrangler d1 migrations apply course-delivery --remote

# 3. 注入密钥（不要写进 wrangler.toml）
npx wrangler secret put STRIPE_WEBHOOK_SECRET   # Stripe Dashboard → Webhooks 的 whsec_...
npx wrangler secret put RESEND_API_KEY          # Resend → API Keys
npx wrangler secret put ADMIN_TOKEN             # 自己生成：openssl rand -hex 32
npx wrangler secret put COURSE_DELIVERY         # 交付物映射，见下

# 4. 部署
npx wrangler deploy
#   → https://course-delivery.<account>.workers.dev

# 5. Stripe Dashboard → Developers → Webhooks → Add endpoint
#    URL: https://course-delivery.<account>.workers.dev/stripe/webhook
#    事件: checkout.session.completed / checkout.session.async_payment_succeeded
#          charge.refunded / charge.dispute.created
```

上线前用 `curl https://<worker>/health` 自查：所有 binding 应为 `true`。

## 环境变量

| 名称 | 必填 | 说明 |
| :--- | :--- | :--- |
| `STRIPE_WEBHOOK_SECRET` | ✅ | 缺失时拒绝处理任何事件（返回 500），避免裸奔 |
| `RESEND_API_KEY` | ✅ | 缺失时邮件发送失败 → 订单标记 `needs_manual_delivery` 并告警 |
| `ADMIN_TOKEN` | 建议 | `/admin/resend` 的 Bearer token；不配置则该接口禁用 |
| `COURSE_DELIVERY` | ✅ | 交付物映射（JSON 字符串），含邀请 token 时按密钥对待 |
| `SUPPORT_EMAIL` | 建议 | 运营告警收件人；也是邮件里的客服邮箱 |
| `MAIL_FROM` | ✅ | 必须是 Resend 已验证域名下的地址 |
| `MAIL_REPLY_TO` | 可选 | 用户直接回信的地址 |
| `REFUND_DAYS` | 可选 | 邮件里的退款承诺天数，默认 7 |
| `SITE_URL` / `BRAND_NAME` | 可选 | 邮件页脚 |
| `DEFAULT_WATCH_URL` / `DEFAULT_REPO_URL` / `DEFAULT_COMMUNITY_URL` | 可选 | 全局兜底交付链接 |
| `EMAIL_DRY_RUN` | 可选 | `1` 时只打日志不发信，用于本地联调 |

### COURSE_DELIVERY 写法

匹配优先级：精确 `slug:plan` → 课程通配 `slug:*` → `DEFAULT_*`。

```json
{
  "ai-coding-workflow:*": {
    "watch": "https://stream.example.com/ai-coding",
    "repo": "https://github.com/you/course-ai-coding/invitations",
    "community": "https://discord.gg/xxxx"
  },
  "ai-coding-workflow:pro": {
    "community": "https://discord.gg/pro-only"
  },
  "all-access:*": { "watch": "https://stream.example.com/all-access" }
}
```

只强制要求 `watch`（观看入口）；`repo` / `community` 没有时邮件里不会出现空行。

**交付主入口是成员站，不是邮件**（TASK111，2026-11-24）：权益写进 `entitlements` 之后，
买家登录 `/account` 就能看到课程正文与 `repo` / `community` 链接。因此：

- 缺 `watch` 时 `watch` 回退成 `<LEARN_URL>/account`，邮件照发（文案会变成
  「用购买时的 Google 账号登录即可阅读」），订单**不再**落成 `needs_manual_delivery`；
- 只有「拿不到邮箱」和「识别不出课程」才进人工交付队列 —— 那两种情况下权益本身写不进去；
- 没配 `RESEND_API_KEY` 时订单标记 `skipped_no_resend`（不是 `failed`），也不发运营告警。

## 本地联调

```bash
cd workers/course-delivery
npx wrangler d1 migrations apply course-delivery --local
EMAIL_DRY_RUN=1 npx wrangler dev          # 本地 http://127.0.0.1:8787

# 另开终端，用仓库里的密钥生成签名头（等价 Stripe CLI 的 stripe trigger）
node -e '
import("./src/stripe.js").then(async ({ signPayload }) => {
  const body = JSON.stringify({ id: "evt_local_1", type: "checkout.session.completed", data: { object: {
    id: "cs_local_1", mode: "payment", payment_status: "paid", amount_total: 7900, currency: "usd",
    locale: "zh", client_reference_id: "ai-coding-workflow:single",
    payment_intent: "pi_local_1", customer_details: { email: "you@example.com" },
  } } });
  const signature = await signPayload({ payload: body, secret: "whsec_local" });
  console.log(signature); console.log(body);
});
'
# 把上面两行结果贴进 curl：
curl -X POST http://127.0.0.1:8787/stripe/webhook \
  -H "content-type: application/json" \
  -H "stripe-signature: <t=...,v1=...>" \
  --data-raw '<body>'
```

装了 Stripe CLI 的话更简单：`stripe listen --forward-to http://127.0.0.1:8787/stripe/webhook`。

测试（零依赖，Node 内置 runner）：

```bash
cd workers/course-delivery && node --test     # 143 项：签名、幂等、对账、退款、邮件模板、页面、路由、管理接口
# 或在仓库根目录
npm run workers:test
```

## 运营 SOP

**用户说「付了钱看不到课」**：先让他登录 `/account`（权益在 D1，与邮件无关）。
仍看不到时按邮箱查订单与权益：

```bash
curl -H "authorization: Bearer $ADMIN_TOKEN" \
  "https://<worker>/admin/orders?email=buyer@example.com"
```

**确实需要补权益**（webhook 彻底没到、或买家换了 Google 账号）：

```bash
curl -X POST https://<worker>/admin/grant \
  -H "authorization: Bearer $ADMIN_TOKEN" \
  -H "content-type: application/json" \
  -d '{"email":"buyer@example.com","courseSlug":"ai-coding-workflow","planId":"single"}'
```

**用户说没收到开通邮件**：邮件只是通知。先在 D1 查 `email_status`：`failed` 用补发接口，
`skipped_no_resend` 说明还没配 Resend（不影响阅读）。

```bash
curl -X POST https://<worker>/admin/resend \
  -H "authorization: Bearer $ADMIN_TOKEN" \
  -H "content-type: application/json" \
  -d '{"sessionId":"cs_..."}'
```

**每日对账**（也可直接在 Stripe Dashboard 按 `client_reference_id` 筛）：

```bash
npx wrangler d1 execute course-delivery --remote --command \
  "select course_slug, plan_id, count(*) as orders, sum(amount_cents)/100.0 as usd
   from orders where status='paid' group by 1,2 order by orders desc"
```

**漏发的订单**：

```bash
npx wrangler d1 execute course-delivery --remote --command \
  "select id, email, course_slug, plan_id, email_status, delivery_note
   from orders where email_status in ('failed','needs_manual_delivery')"
```

## 边界与后续

- 本 Worker 只做「收款 → 交付 → 退款通知」，**没有**登录、播放页、进度与自助换绑 —— 那些属于 P2 会员中心（`docs/courses/06-todo.md` 第 4 节）。
- 全额退款会同时回收 `entitlements`（P2.1），所以 P2.2 的门禁能分钟级断开访问；部分退款保留访问。
- 事件未覆盖：`invoice.paid`（订阅，P3）、`charge.dispute.closed`（目前靠 Stripe 后台处理）。
- 权益数据模型见 `migrations/0002_entitlements.sql` 与 `docs/courses/07-access-control.md` 第 6 节。

## 权益表（P2.1）

`orders` 记录「钱发生了什么」，`entitlements` 记录「现在谁能读哪门课」。
付款事件会在写订单之后立刻写权益；全额退款会反向撤销。

**表结构**：`migrations/0002_entitlements.sql`（`entitlements` / `magic_links` / `auth_attempts`）

**应用迁移**：

```bash
cd workers/course-delivery
npx wrangler d1 migrations apply course-delivery --remote   # 生产
npx wrangler d1 migrations apply course-delivery --local    # 本地开发
```

**历史订单回填**（幂等，可重复执行）：

```bash
node scripts/courses/backfill-entitlements.mjs                # 生成 SQL 并打印命令
node scripts/courses/backfill-entitlements.mjs --execute --remote
```

**自检**：

```bash
npx wrangler d1 execute course-delivery --remote --command \
  "select course_slug, count(*) from entitlements where revoked_at is null group by 1 order by 2 desc"

# 已付款却没有权益的订单，应为 0
npx wrangler d1 execute course-delivery --remote --command \
  "select count(*) from orders o where o.email <> '' and o.course_slug <> ''
     and o.status in ('paid','partially_refunded')
     and not exists (select 1 from entitlements e where e.order_id = o.id)"
```

**规则**

| 场景 | 行为 |
| :--- | :--- |
| 单课付款 | 写 1 条 `(email, course_slug)` |
| 全站通付款 | 写 4 门课 + `all-access` 共 5 条（课程清单见 `ALL_ACCESS_COURSES`，默认在 `src/config.js`） |
| 重复购买 | 复活同一条记录并指向新订单（`on conflict do update`） |
| 全额退款 | 按 `order_id` 撤销该订单名下全部权益 |
| 部分退款 | 保留访问 |
| 拒付 | 默认只标记 `disputed` + 告警；`REVOKE_ON_DISPUTE=1` 时立即回收 |

**注意**：新增课程时必须把 slug 加进 `ALL_ACCESS_COURSES`（`wrangler.toml` 或 secret），否则「全站通」买家看不到新课。

## 登录与购买（P2.2 改造版，2026-11-19）

登录改为 **Google OAuth**（不再发登录邮件），购买改为 **先登录再买**。

**端点**

| 端点 | 作用 |
| :--- | :--- |
| `GET /login` | 「使用 Google 继续」（`?next=` 回跳） |
| `GET /auth/google` | 生成 state + PKCE，302 到 Google |
| `GET /auth/google/callback` | 校验 state / 换令牌 / 取邮箱（要求 email_verified）→ 写会话 |
| `GET /auth/logout` | 清 cookie |
| `GET /account` | 我的课程 |
| `GET /buy/<slug>/<plan>` | 确认订单页（未登录先跳登录） |
| `POST /checkout` | 用登录邮箱创建 Customer + Checkout Session → 跳 Stripe |

**需要的 secret / 变量**

```bash
npx wrangler secret put SESSION_SECRET          # 会话签名
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put STRIPE_SECRET_KEY       # 服务端创建 Checkout Session
node scripts/courses/sync-worker-catalog.mjs --apply   # COURSE_CATALOG（标题/金额，无 priceId）
```

Google 控制台里的 Authorized redirect URI 必须是
`https://learn.opencodeguide.com/auth/google/callback`（或 `GOOGLE_REDIRECT_URI` 指定的同一个值）。

**安全约束**

- 只接受 `email_verified: true` 的 Google 账号；state + PKCE 防 CSRF 与授权码拦截；
- 会话：HS256 JWT，`HttpOnly; Secure; SameSite=Lax; Max-Age=30d`，默认不带 Domain；
- 权益按登录邮箱写入，Stripe Customer 锁定邮箱（传 `customer` 而非 `customer_email`）；
- 门禁 `src/gate.js` 默认拒绝，正文/`index.txt`/`search.json` 都要求登录并查权益；
- 响应带 `no-store` / `no-referrer` / `noindex`。

**门禁接线**：P2.3 已完成 —— `wrangler.toml` 的 `[assets]` + `run_worker_first = true`，
正文由 `handleMemberAsset` 先判权限、放行后才回源 `out-members/`。

## 页面样式（P2.4，2026-11-23）

Worker 自己渲染的 6 类页面（登录 / 确认订单 / 我的课程 / 无权访问 / 服务不可用 / 错误）与公开站共用一套视觉语言：

| 文件 | 职责 |
| :--- | :--- |
| `src/ui.js` | 设计 token（zinc 色板、字体、圆角）、组件类（`.card` `.btn` `.facts` `.course-grid`）、头部/页脚、主题脚本、`shell()` 骨架 |
| `src/pages.js` | 只负责各页内容与中英文案 |

约定：

- **零外部依赖**：CSS/JS/字体全部内联，不请求任何外部资源，离线可渲染、CSP 友好；
- **主题与公开站一致**：`<html class="dark">`，`localStorage.theme` 键名与 next-themes 默认值相同；首屏前用内联脚本定主题，避免白闪；
- **课程配色**：购买页的渐变头来自 catalog 的 `accent` 字段（由 `sync-worker-catalog.mjs` 从 `content/courses/*.json` 同步，白名单校验，非法值回退默认渐变）；
- **错误文案按原因区分**：`renderErrorPage({ reason })` 支持 `login` / `unknown-course` / `payment`，避免「买课 404」显示成「登录失败」；
- **根路径** `/` 直接 302 到 `/account`（未登录会再跳 `/login`）。

测试：`test/pages.test.js` 覆盖骨架、noindex、文案分支、accent 回退、付款状态条与转义。

## 付款后可见性（TASK111，2026-11-24）

权益由异步 webhook 写入，而 Stripe 付完就跳回 `/account` —— 中间有空窗。现在的处理：

| 环节 | 做法 |
| :--- | :--- |
| success_url | `/account?paid=1&session_id={CHECKOUT_SESSION_ID}` |
| 账户页 | 渲染前先 `reconcileCheckoutSession()`：取会话 → 校验 `metadata.email` 与登录邮箱一致 → 复用 `processEvent` 补订单与权益（`insertOrder` 幂等） |
| 状态条 | `paid`（已开通）/ `pending`（正在开通，最多自动刷新 3 次）/ `unpaid`（异步支付处理中） |
| 交付链接 | 课程卡直接给正文入口 + `repo` / `community`，不再只靠邮件 |
| 根级 `/courses/…` | 302 到 `/zh|courses/…`，兜住旧邮件里的无语言前缀链接 |
