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
缺 `watch` 时判定「无法自动交付」：订单落库为 `needs_manual_delivery`，并发告警给运营，
**不会**给买家发一封没有观看链接的邮件。

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
cd workers/course-delivery && node --test     # 40 项：签名、幂等、退款、邮件模板、路由
# 或在仓库根目录
npm run workers:test
```

## 运营 SOP

**用户说没收到开通邮件**：先在 D1 查 `email_status`，`failed` / `needs_manual_delivery` 时用补发接口。

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
- 退款只改订单状态，不会主动封禁视频/仓库权限；需要人工在托管侧移除，或等 P2 的权益表统一回收。
- 事件未覆盖：`invoice.paid`（订阅，P3）、`charge.dispute.closed`（目前靠 Stripe 后台处理）。
- D1 只是轻量订单表；需要按邮箱做权益查询时，再引入 `entitlements` 表（schema 见 `docs/courses/02-feature-design.md` 第 5.2 节）。
