# 04 · Stripe 支付接入

## 1. 硬约束：这是一个纯静态站

`next.config.mjs` 中 `output: 'export'`（为了把托管成本压到接近 0，见 `memory-bank/tasks/TASK077-reduce-edge-requests.md`）。这意味着：

- 没有 API Route、没有 Server Action、没有 Edge Function；
- 不能在浏览器里持有 `sk_` 密钥（会泄露，且违反 PCI）；
- 静态 HTML 在构建时生成，页面里的支付链接必须在构建前就确定。

因此支付方案必须满足：**结账页由 Stripe 托管，站点只负责把用户送过去。**

## 2. 方案对比

| 方案 | 是否需要服务端 | 支持优惠码 | 支持订阅 | 抽成 | 适用阶段 |
| :--- | :---: | :---: | :---: | :--- | :--- |
| **Stripe Payment Link**（本次采用） | 否 | ✅ | ✅ | 仅 Stripe 手续费 | P0/P1 |
| Stripe Checkout Session + 自建 API | 是 | ✅ | ✅ | 仅 Stripe 手续费 | P2 |
| Paddle / Lemon Squeezy（MoR） | 否 | ✅ | ✅ | 约 5% + 手续费 | 无海外主体时 |
| 自建表单 + Payment Intents | 是 | 需自建 | 需自建 | 仅 Stripe 手续费 | 不推荐 |

选择 Payment Link 的三个理由：

1. 与静态导出完全兼容，不需要为了收款改变托管架构；
2. Stripe 负责 3DS、本地支付方式、税务计算（可选）、发票与收据；
3. 价格、优惠码、退款、订阅都可以在 Stripe Dashboard 里改，运营不需要发版。

代价：支付完成后的跳转地址只能有一个（不能在运行时按语言切换），因此统一跳 `/zh/courses/thank-you`，英文用户可在该页切换到英文版；如需彻底分语言，可用 `--redirect-locale=en --force` 重建一套指向英文回执页的链接（会替换现有 SKU，不推荐）。

## 3. 已实现的接入

### 3.1 代码结构

| 文件 | 作用 |
| :--- | :--- |
| `content/courses/*.json` | 课程与价格（唯一事实来源） |
| `content/courses/stripe-links.json` | `课程:plan → Payment Link`，由脚本生成并提交 |
| `content/courses/stripe-products.json` | product/price/link ID，脚本幂等用 |
| `lib/courses.ts` | `getCheckoutTarget` / `getCheckoutUrl` / `withCheckoutTracking` |
| `components/courses/buy-button.tsx` | 客户端购买按钮 + GA4 `begin_checkout` |
| `scripts/courses/stripe-payment-links.mjs` | 调 Stripe API 创建 Product + Price + Payment Link |

### 3.2 链接解析优先级

```
环境变量 STRIPE_LINK_<SLUG>_<PLAN>     ← 最高（临时换链接、灰度、A/B）
        ↓ 未设置
content/courses/stripe-links.json      ← 脚本生成，随仓库提交
        ↓ 未设置
null → 购买按钮降级为「开售提醒 / 联系我们」
```

环境变量命名规则：`slug` 与 `plan` 全部大写、非字母数字转下划线。
例：`STRIPE_LINK_AI_CODING_WORKFLOW_SINGLE`、`STRIPE_LINK_ALL_ACCESS_ALL_ACCESS`。

### 3.3 生成链接

```bash
# 先干跑，确认要创建哪些 SKU
npm run courses:stripe:dry

# 测试模式（不会真实扣款，可用 4242 4242 4242 4242 测试）
STRIPE_SECRET_KEY=sk_test_xxx npm run courses:stripe

# 只处理某一门课
STRIPE_SECRET_KEY=sk_test_xxx npm run courses:stripe -- --only=ai-coding-workflow

# 正式模式（先备份 stripe-products.json）
STRIPE_SECRET_KEY=sk_live_xxx npm run courses:stripe
```

脚本行为：

- 为每个 `课程 × plan` 创建 1 个 Product、1 个 Price、1 个 Payment Link；
- `allow_promotion_codes=true`（支持优惠码）；
- `invoice_creation.enabled=true`（自动生成发票与收据）；
- `after_completion` 重定向到 `/zh/courses/thank-you/?course=<slug>&plan=<plan>`；
- `metadata` 写入 `course_slug` / `plan_id`，便于对账；
- 已存在则跳过（幂等），`--force` 才会重建；
- 生成的 URL 立即写入 `stripe-links.json`，重新构建后生效。

> 价格变更注意：Stripe Price 不可修改金额。改价需 `--force` 生成新 Price/新 Link，旧链接先保留（已投放的广告可能还在用），确认无流量后再在 Dashboard 停用。

### 3.4 跟踪参数

`lib/courses.ts` 会在链接后追加：

| 参数 | 值 | 用途 |
| :--- | :--- | :--- |
| `client_reference_id` | `slug:plan` | Stripe 后台可按此筛单，与站点对账 |
| `utm_source` | `opencodeguide` | 区分渠道 |
| `utm_medium` | `course_page` | 区分媒介 |
| `utm_campaign` | 课程 slug | 区分课程 |
| `utm_content` | `locale_plan` | 区分语言与版本 |

这些参数会出现在 Stripe 的 Payment 记录里（`client_reference_id` 是结构化字段，utm 会进入 metadata/URL 记录）。

## 4. Payment Link 关键配置（Dashboard 侧）

| 配置项 | 建议 | 原因 |
| :--- | :--- | :--- |
| Statement descriptor | `OPENGUIDEGUIDE` 或品牌名（≤22 字符） | 银行账单可识别，显著降低拒付 |
| Receipt emails | 开启 | 用户留存凭证，减少客服 |
| 自动税务 | 视主体开启 Stripe Tax | 跨境 B2C 需按买家地区计税 |
| 优惠码 | 早鸟码、社群码分别建，设过期时间 | 便于归因与止损 |
| 账单地址收集 | 开启 | 税务与风控需要 |
| 3D Secure | 保持自动 | 欧洲 SCA 要求，降低欺诈 |
| 支付方式 | 卡 + Apple Pay + Google Pay；支付宝/微信按账户支持情况 | 覆盖主要客群 |
| 退款 | 7 天内全额，Pro 版已使用 1:1 的可部分退 | 与页面承诺一致 |

## 5. 测试计划

### 5.1 测试卡

| 场景 | 卡号 | 预期 |
| :--- | :--- | :--- |
| 成功 | `4242 4242 4242 4242` | 跳转 thank-you，显示订单摘要 |
| 需要 3DS 验证 | `4000 0025 0000 3155` | 弹出验证，通过后成功 |
| 余额不足 | `4000 0000 0000 9995` | 结账页报错，用户停留在 Stripe |
| 拒付模拟 | `4000 0000 0000 0259` | 在 Dashboard 触发 dispute 流程 |

### 5.2 验收清单

- [ ] 点击购买 → 新标签打开 Stripe 结账页，金额、币种、课程名正确
- [ ] 支付成功后自动跳回 `thank-you`，订单摘要显示正确课程与版本
- [ ] 收据邮件到达（含公司名与金额）
- [ ] GA4 收到 `begin_checkout`，参数含 course/plan/value
- [ ] 未配置链接的课程显示「开售提醒 / 联系我们」，无 404、无死链
- [ ] 优惠码在结账页可用，过期码报错
- [ ] 移动端（iOS Safari / Android Chrome）可完成支付
- [ ] 中文用户在英文结账页可正常完成（Stripe 结账页语言可跟随浏览器）

## 6. 账户、合规与资金

### 6.1 主体与结算

- Stripe 不支持中国大陆主体；常见路径：香港 / 新加坡 / 美国公司 + 当地银行账户。
- 无海外主体时：用 Paddle / Lemon Squeezy 作为 Merchant of Record（他们代收代缴税，抽成更高），或先做「预售 + 人工收款」验证需求。
- 结算周期：新账户通常 T+7 起，随交易历史缩短；需预留现金流。

### 6.2 税务

| 地区 | 关注点 | 处理方式 |
| :--- | :--- | :--- |
| 欧盟 | VAT / OSS，B2C 数字服务按买家国税率 | Stripe Tax 自动计算 + 定期申报 |
| 英国 | VAT 注册门槛 | 视销售额判断 |
| 美国 | 各州 sales tax（数字产品差异大） | Stripe Tax 或第三方（TaxJar） |
| 中国 | 个人所得税/企业所得税 | 按主体所在地申报，收入需入账 |

> 课程是数字服务，多数地区按买家所在地征税。**上线前必须确认主体与税务处理方式**，不要等收到税务信件才处理。

### 6.3 退款与拒付

- 页面承诺「7 天无理由退款」，Stripe 中按原路退回（含手续费损失需自己承担）。
- 拒付（chargeback）：保留交付证据（邮件发送记录、登录记录、模板仓库邀请记录），在举证期内提交。
- 退款率 > 5% 需复盘：是内容不符预期，还是页面过度承诺。

### 6.4 安全

- `STRIPE_SECRET_KEY` 只放在本地 `.env` / CI Secret；`.env*` 已在 `.gitignore` 中忽略。
- 前端只出现 `https://buy.stripe.com/...` 链接，不出现任何密钥。
- 后续接入 Webhook 时必须校验 `Stripe-Signature`，并按 `event.id` 做幂等。

## 7. Phase 2：升级到 Checkout Session + Webhook（会员中心）

当需要「登录后观看、按订单授权、退款自动回收权限」时，必须引入服务端。推荐架构：

```
静态站（保持 output: export）
   │  点击购买 → 调 Worker 的 /checkout
   ▼
Cloudflare Worker（或 Vercel Function）
   │  1) 创建 Checkout Session（mode=payment，client_reference_id）
   │  2) 返回 session.url
   ▼
Stripe Checkout  ──支付成功──▶ Webhook /stripe/webhook
                                 │  校验签名 + 幂等
                                 ▼
                          Supabase (orders/entitlements)
                                 │
                                 ▼
                     会员中心（登录后按邮箱查权益）
```

关键实现要点：

1. **Checkout Session**：`success_url=/zh/courses/thank-you?session_id={CHECKOUT_SESSION_ID}`，`cancel_url` 回课程页；`customer_email` 可选预填。
2. **Webhook 事件**：`checkout.session.completed`、`invoice.paid`（订阅）、`charge.refunded`、`charge.dispute.created`。
3. **幂等**：`orders.stripe_session_id` 唯一索引；重复事件直接返回 200。
4. **权益发放**：以邮箱为自然键写入 `entitlements`，注册时按邮箱合并历史订单。
5. **退款回收**：`charge.refunded` → 标记 `revoked_at`，会员中心即时生效。
6. **签名校验**（Node 示例）：

```ts
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const body = await request.text(); // 必须用原始字符串
  if (!signature) return new Response("missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return new Response("invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    // upsert into orders (on conflict do nothing) + grant entitlement
  }
  return new Response(null, { status: 200 });
}
```

> 迁移期可以两者并存：Payment Link 继续服务老链接，新流量走 Checkout Session；两者都写同一张 `orders` 表。

## 8. 对账与财务

- 每周导出 Stripe Payments（含 `client_reference_id`），与站点订单表比对。
- 每月核对 payout 金额、退款、手续费、汇率差。
- 收入确认：数字课程一般按交付时点确认（预收课程需按上线进度分摊，咨询会计）。
- 保留：收据、退款记录、拒付举证材料、发票（企业客户）。

## 9. 上线检查表（Go-live）

- [ ] Stripe 账户 KYB 通过，可收款、可提现
- [ ] 正式模式 Payment Link 已生成，`stripe-links.json` 已提交
- [ ] 用一个真实小额订单跑通全流程（含退款测试）
- [ ] Statement descriptor、收据邮件模板已配置
- [ ] 退款政策页、隐私政策、服务条款上线且可访问
- [ ] 客服邮箱可用，承诺响应时间写在页面上
- [ ] GA4 事件已验证，Stripe 后台可见 `client_reference_id`
- [ ] 邮件自动交付（P1）已测试，包含观看链接与社群邀请
- [ ] 汇率与人民币参考价已核对（页面明确以美元结算）
- [ ] 备份 `stripe-products.json` 与课程数据
