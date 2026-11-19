# 08 · 上线操作手册（DNS / Google / Stripe / Resend）

> 更新时间：2026-11-19 · 分支 `dev` · 适用阶段：P2.3 部署 → P1 正式收款
> 配套文档：[07-access-control.md](./07-access-control.md)（设计）、[06-todo.md](./06-todo.md)（看板）

这份手册只回答一个问题：**从「代码写完了」到「能收真钱」之间，那 4 项外部配置具体怎么点**。
每一步都写清「谁做、在哪做、填什么、怎么验证」。

---

## 0. 先看现状（2026-11-19 21:40 实测，别凭记忆）

| 项 | 实测结果 | 含义 |
| :--- | :--- | :--- |
| `opencodeguide.com` 的 NS | `alla.ns.cloudflare.com` / `tadeo.ns.cloudflare.com` | **域名已经在 Cloudflare 托管**，DNS 决策等于已经做完 |
| `learn.opencodeguide.com` | A `104.21.22.139` / `172.67.205.29`（Cloudflare 代理 IP） | 子域已挂在 Worker 的自定义域上，证书也签好了 |
| `GET /health` | `200`，`db/webhookSecret/adminToken/supportEmail/deliveryMap/sessionSecret/learnUrl` 全是 `true`，`resend:false` | Worker 已部署、D1 已连、大部分 secret 已注入 |
| `/health` 缺 `googleOauth` / `stripeKey` / `catalog` 字段 | 没有这三个字段 | **线上跑的还是改造前的旧版本**（magic link 那版） |
| `/auth/google`、`/buy/...` | `404` | 同上：Google OAuth 与购买回路尚未上线 |
| `/` | `404 {"error":"not found"}` | `env.ASSETS` 没接线（就是 P2.3 要干的事） |
| `RESEND_API_KEY` | `false` | 开通邮件发不出去 |

**结论**：DNS 不用再决策了（第 1 节）。剩下三件事是「拿凭据 → 注入 → 部署」，而部署前需要先把 P2.3 的代码接线补完。

---

## 1. DNS 与托管归属（已定，无需操作）

### 1.1 现状架构

```
opencodeguide.com        → GitHub Pages（185.199.108-111.153，DNS only 未代理）
www.opencodeguide.com    → iamsail.github.io（同上）
learn.opencodeguide.com  → Cloudflare Worker `course-delivery`（proxied，custom_domain）
```

已在 [wrangler.toml](../../workers/course-delivery/wrangler.toml) 里声明：

```toml
routes = [{ pattern = "learn.opencodeguide.com", custom_domain = true }]
```

`custom_domain = true` 的含义：`wrangler deploy` 时 Cloudflare 自动建/更新 DNS 记录并签发证书，**不需要手动加 CNAME**。

### 1.2 决策与理由（写下来，免得以后反复讨论）

**决定：成员站放 Cloudflare Worker + 自有子域，不动顶点域。**

- 顶点域继续由 GitHub Pages 服务 → 保住 TASK077「纯静态、零计算成本」的既有设计，公开站不为鉴权付一分钱。
- 成员站是「有状态」的（登录、权益、门禁），必须跑代码，放 Worker 免费额度内。
- 代价：`learn.` 与公开站跨域，登录态默认不共享（`SESSION_COOKIE_DOMAIN` 留空）。这是**有意为之**——公开站被缓存/被 CDN 分发，不该带会话 cookie。

**已否决**：把成员站放 Vercel（按量计费 + 与静态站两套部署）、用 Cloudflare Access（不认识 Stripe 权益）。

### 1.3 唯一要你确认的两点

1. **顶点域保持 DNS only（灰云）**：如果哪天把 apex 也点亮成橙云，GitHub Pages 的证书校验会失败。除非改用 Cloudflare Pages，否则别动。
2. **SSL 模式**：Cloudflare 后台 SSL/TLS 设为 `Full (strict)`。因为旧部署可能残留 `Flexible`，那个模式下 `Secure` cookie 与回跳链接都可能出问题。

验证命令：

```bash
dig +short NS opencodeguide.com        # 应出现 *.ns.cloudflare.com
dig +short A  learn.opencodeguide.com  # 应是 Cloudflare 网段，不是 GitHub Pages
curl -sS https://learn.opencodeguide.com/health | head -c 200
```

---

## 2. Google OAuth（登录）

### 2.1 操作步骤（约 10 分钟）

1. 打开 <https://console.cloud.google.com/>，新建项目，例如 `opencodeguide-learn`。
2. **APIs & Services → OAuth consent screen**
   - User type：`External`
   - App name：`OpenCode Guide`；User support email：`support@opencodeguide.com`
   - Authorized domains：`opencodeguide.com`
   - Scopes：只加 `openid`、`email`、`profile`（三个都是 non-sensitive，**无需 Google 审核**）
   - 填 Developer contact，保存。
3. **Credentials → Create credentials → OAuth client ID**
   - Application type：`Web application`
   - Name：`learn.opencodeguide.com`
   - **Authorized redirect URIs（必须逐字一致）**：
     ```
     https://learn.opencodeguide.com/auth/google/callback
     ```
   - 本地联调再额外加一条（可选）：`http://localhost:8787/auth/google/callback`
4. 复制 **Client ID** 与 **Client secret**。
5. **Publishing status → PUBLISH APP**（非敏感 scope 立即可用）。停在 `Testing` 的话只有测试用户能登录，且上限 100 人。

### 2.2 代码侧的对应关系（改配置不用改代码）

回调地址由 `GOOGLE_REDIRECT_URI` 决定，未配置时按 `LEARN_URL` 推导：

```js
// workers/course-delivery/src/routes/auth.js
const redirectUri = settings.googleRedirectUri || `${originFor(env, request)}/auth/google/callback`;
```

因为 `wrangler.toml` 里已有 `LEARN_URL = "https://learn.opencodeguide.com"`，**默认推导结果就是上面那个 URI**，所以只需要注入两个 secret：

```bash
cd workers/course-delivery
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
```

### 2.3 已知取舍（写进合同/FAQ 用）

- 只接受 `email_verified: true` 的 Google 账号。
- **大陆网络无法访问 Google** → 这部分用户登录不了。当前定位是出海人群，可接受；若将来要覆盖大陆用户，需另加邮箱验证码登录（回滚点见 §5.3）。
- 不使用 refresh token，所以不涉及「7 天过期」问题。

---

## 3. Stripe（收款）

### 3.1 账户与密钥

1. Stripe Dashboard → 激活账户（主体信息、银行账户、KYB）。
2. **Developers → API keys → Reveal live key**，拿到 `sk_live_...`。
   - 这是**服务端**密钥，只进 `wrangler secret`，绝不进仓库、绝不加 `NEXT_PUBLIC_`。
3. Settings → Public business info：把 **Statement descriptor** 设为可识别字符串（如 `OPENCODEGUIDE`），降低拒付。
4. 税务：按主体所在地决定是否开 Stripe Tax；课程属数字服务，对 EU 个人买家通常要收 VAT。见 [04-stripe-integration.md](./04-stripe-integration.md) §6。

### 3.2 建商品与价格（决定 `/checkout` 能不能用）

新版购买回路不再依赖 Payment Link，而是用 **priceId** 创建 Checkout Session：

```js
// workers/course-delivery/src/routes/buy.js
const checkout = await stripe.createCheckoutSession({
  customerId: customer.id,
  priceId: entry.priceId,   // ← 来自 COURSE_CATALOG
  successUrl: `${origin}/account?paid=1`,
  ...
});
```

`priceId` 的来源链路：`scripts/courses/stripe-payment-links.mjs` 建 Product + Price，写 `content/courses/stripe-products.json` → `sync-worker-catalog.mjs` 合成 `COURSE_CATALOG` 注入 Worker。

**注意：`content/courses/stripe-products.json` 目前不存在**（说明还没用 live 密钥跑过）。先 dry-run 核对，再真跑：

```bash
npm run courses:stripe:dry                              # 只打印，不调 API
STRIPE_SECRET_KEY=sk_live_xxx npm run courses:stripe    # 建商品/价格/Payment Link

node scripts/courses/sync-worker-catalog.mjs            # 检查 COURSE_CATALOG（会列出缺 priceId 的项）
node scripts/courses/sync-worker-catalog.mjs --apply    # wrangler secret bulk 注入
```

跑完会生成两个文件，**都要提交**：

- `content/courses/stripe-products.json`（priceId，`/checkout` 必需）
- `content/courses/stripe-links.json`（Payment Link，公开站降级/兼容用）

> 老的 Payment Link 仍然保留：公开站按钮切到 `learn./buy/...` 之前，它是唯一的兜底入口；切完之后仅作为 `STRIPE_LINK_*` 覆盖用。

### 3.3 Webhook（决定「付了钱能不能读」）

Dashboard → **Developers → Webhooks → Add endpoint**

- Endpoint URL：
  ```
  https://learn.opencodeguide.com/stripe/webhook
  ```
- 只勾这三个事件（代码只处理这三个，多勾只是浪费）：
  - `checkout.session.completed`
  - `charge.refunded`
  - `charge.dispute.created`
- 建好后 Reveal **Signing secret**（`whsec_...`）→ 注入：

```bash
cd workers/course-delivery
npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

### 3.4 已有的 Stripe 相关 secret 清单

| 名称 | 用途 | 现状 |
| :--- | :--- | :--- |
| `STRIPE_WEBHOOK_SECRET` | Webhook 验签 | ✅ 已注入（旧值，换 endpoint 后要重设） |
| `STRIPE_SECRET_KEY` | 服务端建 Customer / Checkout Session | ❌ 未注入 |
| `COURSE_CATALOG` | 课程标题 + 价格 + priceId | ❌ 未注入（`--apply` 注入） |
| `SESSION_SECRET` | 会话 JWT 签名 | ✅ 已注入（**不要轮换**，换了所有人登出） |
| `ADMIN_TOKEN` | `/admin/resend` 管理接口 | ✅ 已注入 |
| `COURSE_DELIVERY` | 开通信里的学习入口 | ✅ 已注入 |

---

## 4. Resend（开通邮件）

### 4.1 域名验证（约 10 分钟，DNS 在 Cloudflare 所以很顺）

1. <https://resend.com> → Domains → Add Domain → 填 `opencodeguide.com`。
2. Resend 给出 3 条记录，在 Cloudflare DNS 里逐条添加（都用 **DNS only / 灰云**，不要代理）：
   - `MX` → `feedback-smtp.us-east-1.amazonses.com`（优先级 10）
   - `TXT` → `v=spf1 include:amazonses.com ~all`（SPF；若已有 SPF 记录，合并到同一条，不要加第二条）
   - `TXT` → `resend._domainkey`（DKIM，值很长，直接粘贴）
3. 回 Resend 点 **Verify**，状态变 `Verified`。
4. **建议**再加一条 DMARC：`TXT _dmarc` → `v=DMARC1; p=none; rua=mailto:support@opencodeguide.com`（先 `p=none` 观察）。

### 4.2 API key 与发信地址

1. Resend → API Keys → Create（权限 `Sending access`）→ 复制 `re_...`。
2. 注入：

```bash
cd workers/course-delivery
npx wrangler secret put RESEND_API_KEY
```

3. 发信地址已在 `wrangler.toml` 固定：`MAIL_FROM = "OpenCode Guide <courses@opencodeguide.com>"`，所以**必须**验证 `opencodeguide.com` 域，不能只验证子域。

### 4.3 本地演练（不花钱、不扰民）

```bash
npx wrangler d1 migrations apply course-delivery --local
EMAIL_DRY_RUN=1 npx wrangler dev     # http://127.0.0.1:8787，邮件只打日志
```

---

## 5. 部署顺序（照这个顺序做，别跳）

### 5.1 前置：先把 P2.3 代码接线补完（开发侧）

现在 `/` 返回 404 就是因为这个没做。需要四处改动（详见 §6）：

1. `COURSE_ACCESS=members npm run build` → 产出 `out-members/`（当前构建脚本只出 `out/`）；
2. `wrangler.toml` 增加 `[assets] directory = "../out-members"` + `binding = "ASSETS"`；
3. `src/index.js` 在 `/account` 之后调用 `authorizeRequest`，放行则 `env.ASSETS.fetch(request)`；
4. 成员构建全站 `X-Robots-Tag: noindex`（可在 Worker 统一加，比逐页加可靠）。

### 5.2 注入与发布（拿到凭据后）

```bash
cd workers/course-delivery
npx wrangler login                                   # 浏览器授权一次
npx wrangler d1 migrations apply course-delivery --remote   # 应用 0003（删除 magic link 表）
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put RESEND_API_KEY
cd ../..
node scripts/courses/sync-worker-catalog.mjs --apply  # 需要 stripe-products.json 已生成
COURSE_ACCESS=members npm run build                   # 产出 out-members/
cd workers/course-delivery && npx wrangler deploy
```

### 5.3 发布后逐项验收

```bash
curl -sS https://learn.opencodeguide.com/health
```

`bindings` 里这些必须全为 `true`：`db`、`webhookSecret`、`resend`、`adminToken`、`sessionSecret`、`learnUrl`、`googleOauth`、`stripeKey`、`catalog`。

然后按顺序点：

| # | 动作 | 期望 |
| :--- | :--- | :--- |
| 1 | 未登录访问 `https://learn.opencodeguide.com/courses/ai-coding-workflow` | 302 到 `/login?next=...` |
| 2 | 点「使用 Google 继续」 | 跳 Google，回跳后落在 `/account`，cookie `ocg_session` 为 HttpOnly+Secure |
| 3 | 未购买用户看课时 | 只能读前 2 节，其余是锁定页 + 购买 CTA |
| 4 | `/buy/<slug>/single` → 点购买 | 302 到 Stripe Checkout，金额正确、email 已锁定（不可改） |
| 5 | 用测试卡付一笔（建议先 `sk_test`，再小额 live） | 回到 `/account?paid=1`，看到该课程 |
| 6 | Stripe Dashboard 看 webhook 投递 | `200 {"received":true,...}`，D1 `entitlements` 有新行 |
| 7 | 收件箱 | 收到开通信，链接指向 `learn.` 对应课程 |
| 8 | Dashboard 全额退款 | `entitlements.revoked_at` 非空；1 分钟内该用户访问 → 403 + 提示 |
| 9 | `curl -I` 任意成员页 | 含 `x-robots-tag: noindex`、`cache-control: no-store` |
| 10 | `curl https://learn.opencodeguide.com/search.json`（未登录） | 302/403，**不能**返回 200 |

第 10 条最容易漏——静态站曾把全文塞进 `search.json`。

### 5.4 回滚点

| 场景 | 回滚动作 |
| :--- | :--- |
| 新版本 Worker 出问题 | `npx wrangler rollback`（保留上一个 deployments 版本） |
| Google 登录不可用 | 暂不接 Google：临时用 `ADMIN_TOKEN` + 手工补权益（`scripts/courses/backfill-entitlements.mjs` 生成的 SQL），或加回邮箱验证码登录 |
| 误把付费正文发到公开站 | GitHub Actions 的 `courses:assert` 会拦；若已发布，立即回退 Pages 部署并检查 `public/search.json` |

---

## 6. 谁能做什么（分工）

| 事项 | 只能你做 | 我可以做 |
| :--- | :---: | :---: |
| Cloudflare 登录 / `wrangler login` 浏览器授权 | ✅ | |
| DNS 记录确认（SSL 模式、是否代理） | ✅ | |
| Google Cloud 建项目 / OAuth client | ✅ | |
| Stripe 账户激活 / KYB / live 密钥 | ✅ | |
| Resend 域名验证（点 Verify） | ✅ | |
| 法务页补主体信息 | ✅ | |
| P2.3 四处代码接线 + 成员构建 + noindex | | ✅ |
| 公开站购买按钮切到 `learn./buy/...` | | ✅ |
| 注入 secret 的命令与核对 | | ✅（需要你已登录 wrangler） |
| 验收清单逐条实测 | | ✅ |

**最短路径**：我先做 §5.1 的四处接线（本地可验证，不依赖任何凭据）→ 你并行去开 Google / Stripe / Resend → 凭据到位后一次部署 + 跑完 §5.3 十项验收 → 才把公开站按钮切过去，最后开真钱。

> 红线：§5.3 第 5~8 项没全绿之前，不要用 live 链接对外宣传收款——付费正文已从公开站下架，此时收款等于卖一个进不去的门。
