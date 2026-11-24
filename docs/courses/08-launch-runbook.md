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

> 状态（2026-11-22）：已在项目 `opencodeguide-learn` 建好客户端（网页应用），重定向 URI 为 `https://learn.opencodeguide.com/auth/google/callback` 与 `http://localhost:3022/auth/google/callback`，scope 仅 `openid email profile`。发布状态仍是「测试」（未点发布）——本地登录不受影响，但**买家能否登录要在部署后用非 owner 账号实测**。

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

> 2026-11-24 更新：live 模式**已开通**（账号 `deeplove`，已有其它产品的真实流水）。
> 课程侧目前仍是 test 密钥 / 测试模式 webhook；结账已改为 `price_data` 现场报价（§3.3），
> **不再需要预建 9 个商品**，换 live 的完整顺序见 §3.7。

### 3.1 账号结构（已定：单账号，多产品）

一个 Stripe 账号 = 一个法人/收款主体（对应 KYB、银行账户、税号、提现）；Product / Price 只是账号里的目录项。

- **不要按产品开账号**：管理成本翻倍，而且同 owner 的账号会被 Stripe 关联，不能用来隔离风险或规避限额；
- **「创建组织」不是品牌隔离工具**：组织用于管理多个账号与团队权限；
- 只有这几种情况才值得开独立账号：不同法人/不同国家、需要不同提现银行卡、品牌完全独立且愿意再做一次 KYB。

共用一个账号的三个副作用，上线前要接受：

| 副作用 | 处理 |
| :--- | :--- |
| 结账页 / 发票 / 银行账单显示**账号级业务名**（当前是 `deeplove`），课程买家会疑惑 | 改 Settings → Business details 的 **Public business name**；或给课程这笔支付加账单后缀（见 §3.2） |
| 余额与报表混在一起（「今天 £X」包含其它产品） | 对账看 `orders` 表，或按 Stripe metadata `course_slug` / `plan_id` 筛；**不要用余额差算课程收入** |
| 争议率、风险评级共享 | 无法隔离，只能靠退款与沟通质量控制 |

> 切换成本提醒：我们是一次性买断、没有订阅，所以「以后想分账号」的代价几乎为零
> （重建 9 个 Product/Price + 换两次 secret）。不必现在为了「万一」拆号。

### 3.2 密钥与账户设置

1. Developers → API keys → Reveal **live** key（`sk_live_…`）。只进 `wrangler secret`，绝不进仓库、绝不加 `NEXT_PUBLIC_`。
2. Settings → Public business info：
   - **Statement descriptor 是账号级的**。直接改成课程品牌，会把你其它产品在客户账单上的名字一起改掉；
   - 需要区分时用 `payment_intent_data[statement_descriptor_suffix]`（创建 Checkout 时传，账单显示「账号前缀 * 后缀」）。
3. 税务：课程是数字服务，对 EU 个人买家通常要收 VAT；按主体所在地决定是否开 Stripe Tax（见 [04-stripe-integration.md](./04-stripe-integration.md) §6）。
4. 收据：Dashboard → Customer emails 打开 receipt，让付款凭证由 Stripe 直发 —— 这样即使 Resend 一直没接，买家也有凭证。

### 3.2.1 密钥类型：标准密钥 vs 受限密钥（2026-11-24 补充）

界面上有两类可用的 live 密钥，**都能用**，代码与 `/health` 从 2026-11-24 起两种前缀都认：

| 类型 | 前缀 | 位置 | 适合 |
| :--- | :--- | :--- | :--- |
| 标准密钥 | `sk_live_…` | 开发人员 → API 密钥 → 标准密钥 → Reveal | 本地临时排查、跑一次性脚本；不长期保存 |
| 受限密钥 | `rk_live_…` | 开发人员 → API 密钥 → **受限的密钥** → 创建受限的密钥 | 注入 Worker 长期使用（推荐） |

**受限密钥的权限是按「资源类型 + 账号级」给的，不能按产品隔离**：给它 `Products` 写权限，就是能改这个账号里所有产品。所以推荐这样分工：

- **Worker 长期用的那把**：只给 `Customers`（Write）+ `Checkout Sessions`（Write）。对应 `ensureCustomer` / `createCheckoutSession` / `retrieveCheckoutSession`，不接受退款、不碰资金；
- **不需要为「建目录」放宽权限**：结账用 `price_data` 现场报价（见 §3.3），所以 `Products` / `Prices` / `Payment Links` 这三类写权限一次都用不上；
- **不要**给 Worker 那把加 IP 白名单（访问策略列显示「无」是对的）：Cloudflare 出口 IP 不固定，绑了 IP 会直接 403；
- **不要**复用账号里原有的 `autoxhs-*` / `pindou-*` / `originteaware-*`：它们各自服务其它产品，混用会把泄露面放大到一个 key；给课程单独一把，建议命名 `opencodeguide-course-live`；
- 列表里那把 `CLI key for SaildeMacBook-Air.local` 是 Stripe CLI 的密钥（自带过期时间，51 天后失效），只在本地 `stripe listen` 调 webhook 时用，不用就删掉。

> 为什么改代码：原来两处前缀判断只认 `sk_`，`rk_live_` 会被脚本直接拒绝（"必须以 sk_test_ 或 sk_live_ 开头"）、`/health` 还会误报 `stripeMode: unset`。现已统一成 `/^[sr]k_(live|test)_/`。

### 3.3 报价方式：动态价格（不需要预建商品）

`/checkout` 用 **`price_data` 现场报价**，金额来自 `COURSE_CATALOG`（最终源头是 `content/courses/*.json` 的 `priceUSD`）。

- 不在 Stripe 建 9 个 Product / Price / Payment Link；
- 换 live 只换密钥，不存在「catalog 变了、price 还是 test」导致的 `No such price`；
- 改价 = 改内容文件 → `node scripts/courses/sync-worker-catalog.mjs --apply`，不碰 Stripe 后台。

> 为什么不用 Payment Link / 预建 Price：Payment Link 是匿名的，买家自己填邮箱，权益会落到与登录账号无关的地址；课程又是买断制，没有订阅那种「必须有 Price」的约束（订阅那一档才需要，见 [04-stripe-integration.md](./04-stripe-integration.md)）。
>
> 代价要接受：Stripe 后台没有「按 Product 分组」的收入报表 —— 对账看 D1 `orders`，或在 Dashboard 按 `metadata.course_slug` / `plan_id` 筛；发票与收据上的行项目名来自 `product_data.name`（形如 `OpenCode Guide · AI 编程实战 · 单课版`）。
>
> `scripts/courses/stripe-payment-links.mjs` 与 `content/courses/stripe-{products,links}.json` 降级为 **legacy**：只有把公开站切回 `NEXT_PUBLIC_CHECKOUT_MODE=stripe` 才用得上，默认路径不碰。

### 3.4 注入 COURSE_CATALOG

```bash
node scripts/courses/sync-worker-catalog.mjs           # 打印 9 条：金额 / 币种 / 标题
node scripts/courses/sync-worker-catalog.mjs --apply   # wrangler secret bulk
```

> catalog 里只有 `title / titleEn / planLabel / amount / currency / accent`，**没有 priceId**。金额为 0 或缺失时脚本直接失败 —— 0 元订单比报错更糟。
>
> 这一步与换密钥**不再有先后依赖**（原来「catalog 必须先于密钥」的约束随 priceId 一起消失了），改价后单独重跑即可。

### 3.5 Webhook（决定「付了钱能不能读」）

Dashboard → Developers → Webhooks → **Add endpoint**（注意要在 **live 模式**下建，测试模式那个列表里的不算）

- Endpoint URL：`https://learn.opencodeguide.com/stripe/webhook`
- 事件：勾满这 5 个
  - `checkout.session.completed`
  - `checkout.session.async_payment_succeeded`
  - `checkout.session.async_payment_failed`
  - `charge.refunded`
  - `charge.dispute.created`

> ⚠️ **为什么必须勾 async 那两个**：支付宝 / 微信等是**异步**支付方式，`checkout.session.completed`
> 触发时 `payment_status` 还是 `unpaid`，真正的开通靠 `async_payment_succeeded`。
> 只勾三个事件的话，这类买家付了钱永远拿不到权益。

建好后 Reveal **Signing secret**（`whsec_…`）并注入：

```bash
cd workers/course-delivery
npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

### 3.6 本机与账号前提

- 需要 `wrangler` 已登录且能部署（本仓库的部署基线是在 macOS 本机测的；WSL 里要先用 `npx wrangler login`）；
- live 密钥只在这台机器的终端里出现，别贴进聊天、别写进 `.env`、别提交；
- 换 live **不改任何被 git 跟踪的文件**：金额来自 `content/courses/*.json`，密钥只在 `wrangler secret` 里。

### 3.7 换 live 的执行顺序（照抄，别跳）

```bash
cd /Users/sail/repo/opencodeguide

# 1. 部署新代码（含 TASK111 对账、动态报价与 /courses 重定向）
cd workers/course-delivery && npx wrangler deploy

# 2. 注入 live 服务端密钥（交互式输入，别写进 shell 历史）
npx wrangler secret put STRIPE_SECRET_KEY        # sk_live_… 或 rk_live_…

# 3. 注入 live webhook 的签名密钥
npx wrangler secret put STRIPE_WEBHOOK_SECRET    # whsec_…

# 4. 自检
curl -sS https://learn.opencodeguide.com/health
```

> 1→3 之间别对公网宣传：旧版本代码 + live 密钥会拿 test priceId 去建会话（必然失败），新版本代码 + test 密钥会把买家导到测试结账页。两步连着做，中间没人访问就没事。

### 3.8 验收

```bash
curl -sS https://learn.opencodeguide.com/health | grep -o '"stripeMode":"[a-z]*"'
# 期望 "live"；仍是 "test" 说明密钥没换成功
```

然后逐项确认：

| # | 动作 | 期望 |
| :--- | :--- | :--- |
| 1 | 真卡买最便宜的一门（$79） | 跳回 `/account?paid=1&session_id=…`，**立刻**看到课程（TASK111 对账生效，不等 webhook） |
| 2 | D1 `orders` 查最新一单 | 有记录；`email_status` 可能是 `skipped_no_resend`（Resend 没接，不影响阅读） |
| 3 | Stripe Dashboard → 该 endpoint 的投递记录 | `200 {"received":true,…}`，不应有 `processing failed` |
| 4 | Dashboard 全额退款 | `entitlements.revoked_at` 非空；1 分钟内该用户访问正文 → 403 |
| 5 | `/buy/ai-coding-workflow/single` 与 Stripe 结账页的金额 | 两处一致（$79），行项目名形如 `OpenCode Guide · AI 编程实战 · 单课版` |

### 3.9 现有 secret 清单（2026-11-24 实测）

| 名称 | 用途 | 现状 |
| :--- | :--- | :--- |
| `STRIPE_SECRET_KEY` | 服务端建 Customer / Checkout Session | ⚠️ 已注入，但是 **test** 值，待换 live（`sk_live_` 与 `rk_live_` 均可） |
| `STRIPE_WEBHOOK_SECRET` | Webhook 验签 | ⚠️ 已注入，对应**测试模式** endpoint，换 live 时重设 |
| `COURSE_CATALOG` | 课程标题 + 金额（无 priceId） | ⚠️ 已注入；换代码后建议重跑一次 `sync-worker-catalog.mjs --apply` |
| `STRIPE_AUTOMATIC_TAX` | 可选：`1` 时开启 Stripe Tax | ❌ 未设 = 不代扣税 |
| `STRIPE_TAX_BEHAVIOR` | 可选：`exclusive`（默认）/ `inclusive` | ❌ 未设 |
| `SESSION_SECRET` | 会话 JWT 签名 | ✅ 已注入（**不要轮换**，换了所有人登出） |
| `ADMIN_TOKEN` | `/admin/*` 管理接口 | ✅ 已注入 |
| `COURSE_DELIVERY` | 交付入口（模板仓/社群） | ✅ 已注入（配的是根级 `/courses/…`，Worker 会 302 到 `/zh/…`） |
| `RESEND_API_KEY` | 开通邮件 | ❌ 未注入；**不影响交付**（`/account` 可读，订单记 `skipped_no_resend`） |
| `GOOGLE_CLIENT_ID` / `SECRET` | 登录 | ✅ 已注入 |

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

### 4.4 本地联调：workerd 不走系统代理（2026-11-22 踩过）

`wrangler dev` 的本地模式用 workerd 执行代码，而 **workerd 的出站 `fetch` 不读系统代理，也没有任何 proxy 选项**（`workerd serve --help` 里没有相关 flag）。wrangler 打印的 “Proxy environment variables detected” 只作用于它自己的 Node fetch（`undici.setGlobalDispatcher(new EnvHttpProxyAgent())`）。

后果：国内网络下回调卡 75 秒，然后报 `[auth] internal error; reference = ...` + `GET /auth/google/callback 400`，看起来像代码 bug，其实是从没连上 Google。

本地方案（已入库）：

```bash
cd workers/course-delivery
npm run dev:proxy        # 默认代理 127.0.0.1:7890，可用 HTTPS_PROXY 覆盖
# 浏览器开 http://localhost:3022/login（必须 localhost，不能 127.0.0.1）
```

它做的事：Miniflare 起 Worker → `outboundService` 在 **Node 宿主进程**重发出站请求 → Node 24 的 `NODE_USE_ENV_PROXY=1` 让 `fetch` 认 `HTTPS_PROXY`。脚本见 [`scripts/dev/member-dev.mjs`](../../scripts/dev/member-dev.mjs)，三个坑写在注释里（`modulesRules` 要显式 ESModule、workerd 的 `Request` 不能直接喂 Node `fetch`、`NODE_USE_ENV_PROXY` 必须启动前设）。

判断是否真的连上 Google 的快速方法：用假 code 打一次回调，**看耗时**——

```bash
curl -sS -m 60 -o /dev/null -w "status=%{http_code} time=%{time_total}s\n" \
  -H "Cookie: ocg_oauth_state=abc.%2Faccount; ocg_oauth_verifier=v" \
  "http://127.0.0.1:3022/auth/google/callback?code=bogus&state=abc"
```

- `time≈0.7s` + 日志 `Google 令牌交换失败：Malformed auth code.` → 通了
- `time≈75s` → 还是没走代理

### 4.5 本地 `.dev.vars`

`workers/course-delivery/.dev.vars`（已 gitignore）放本地的 `SESSION_SECRET`、`GOOGLE_CLIENT_ID/SECRET`、`GOOGLE_REDIRECT_URI=http://localhost:3022/auth/google/callback`、`EMAIL_DRY_RUN=1`。线上这些走 `wrangler secret put`，**不要**复用本地生成的 SESSION_SECRET。

## 5. 部署顺序（照这个顺序做，别跳）

### 5.1 前置：P2.3 代码接线（已完成 2026-11-20）

四处改动都已落地，并在本地 `wrangler dev` 端到端验证过（未登录 302 / 有权益 200 / 未购买 403 / `search.json` 401）：

1. `npm run build:members` → `COURSE_ACCESS=members` + `NEXT_DIST_DIR=out-members`，产出 `out-members/`；
2. `wrangler.toml` 的 `[assets]`：`directory = "../../out-members"`、`binding = "ASSETS"`、**`run_worker_first = true`**；
3. `src/index.js` 在 `/account` 之后调用 `authorizeRequest`，放行才 `env.ASSETS.fetch(request)`；
4. Worker 统一加 `X-Robots-Tag: noindex` 与 `cache-control: no-store`（比逐页加可靠）。

> ⚠️ `run_worker_first` 默认是 `false`：静态资源会先于 Worker 返回、Worker 根本不执行，门禁等于不存在。
> ⚠️ `assets.directory` 是相对 `wrangler.toml` 所在目录（`workers/course-delivery/`），不是仓库根目录。

### 5.2 注入与发布（拿到凭据后）

```bash
cd workers/course-delivery
npx wrangler login                                   # 浏览器授权一次
npx wrangler d1 migrations apply course-delivery --remote   # 应用 0003（删除 magic link 表）
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put STRIPE_SECRET_KEY      # live 值，见 §3.7
npx wrangler secret put STRIPE_WEBHOOK_SECRET  # live endpoint 的 whsec
npx wrangler secret put RESEND_API_KEY         # 可选：没有它也能交付，只是不发信
cd ../..
node scripts/courses/sync-worker-catalog.mjs --apply  # 金额/标题来自 content/courses/*.json
COURSE_ACCESS=members npm run build                   # 产出 out-members/
cd workers/course-delivery && npx wrangler deploy
```

### 5.3 发布后逐项验收

```bash
curl -sS https://learn.opencodeguide.com/health
```

`bindings` 里这些必须全为 `true`：`db`、`webhookSecret`、`adminToken`、`sessionSecret`、`learnUrl`、`googleOauth`、`stripeKey`、`catalog`、`assets`。
`resend` 允许为 `false`（TASK111 之后交付走站内，邮件只是通知）；`stripeMode` 必须是 `live`。

然后按顺序点：

| # | 动作 | 期望 |
| :--- | :--- | :--- |
| 1 | 未登录访问 `https://learn.opencodeguide.com/courses/ai-coding-workflow` | 302 到 `/login?next=...` |
| 2 | 点「使用 Google 继续」 | 跳 Google，回跳后落在 `/account`，cookie `ocg_session` 为 HttpOnly+Secure |
| 3 | 未购买用户看课时 | 只能读前 2 节，其余是锁定页 + 购买 CTA |
| 4 | `/buy/<slug>/single` → 点购买 | 302 到 Stripe Checkout，金额正确、email 已锁定（不可改） |
| 5 | 用测试卡付一笔（建议先 `sk_test`，再小额 live） | 回到 `/account?paid=1&session_id=…`，**立刻**看到该课程（对账补权益，不等 webhook） |
| 6 | Stripe Dashboard 看 webhook 投递 | `200 {"received":true,...}`，D1 `entitlements` 有新行 |
| 7 | 收件箱（**仅当已配 Resend**） | 收到开通信；未配时订单为 `skipped_no_resend`，以 `/account` 为准 |
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
| Cloudflare 登录 / D1 迁移 / 部署 / secret 注入 | | ✅ 已完成登录与迁移 0003（2026-11-20） |
| DNS / SSL 模式确认 | 已完成（`Full (strict)`、apex 灰云） | |
| Google Cloud 建项目 / OAuth client | ✅ | |
| Stripe 账户激活 / KYB / live 密钥 | live 已开通（2026-11-24），密钥待注入 | |
| Resend 域名验证（点 Verify） | ✅ | |
| 法务页补主体信息 | ✅ | |
| P2.3 四处代码接线 + 成员构建 + noindex | | ✅ 已完成（2026-11-20） |
| 公开站购买按钮切到 `learn./buy/...` | | ✅ |
| 注入 secret 的命令与核对 | | ✅（需要你已登录 wrangler） |
| 验收清单逐条实测 | | ✅ |

**最短路径**：我先做 §5.1 的四处接线（本地可验证，不依赖任何凭据）→ 你并行去开 Google / Stripe / Resend → 凭据到位后一次部署 + 跑完 §5.3 十项验收 → 才把公开站按钮切过去，最后开真钱。

> 红线：§5.3 第 5~8 项没全绿之前，不要用 live 链接对外宣传收款——付费正文已从公开站下架，此时收款等于卖一个进不去的门。
