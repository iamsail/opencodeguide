# [TASK111] - 交付改为「成员站为主、邮件为辅」

**Status:** Completed
**Added:** 2026-11-24
**Updated:** 2026-11-24

## Original Request

> 卖完之后能交付？这个发邮件需要吗？不能做在我们系统后台吗

结论：**不需要邮件**。权益已经在 D1（`entitlements`），登录 `/account` 就能读正文。
邮件只是「通知 + 顺带放模板仓库和社群链接」。但要让这句话真正站得住，有三个洞要补。

## 三个洞

| # | 问题 | 后果 |
| :--- | :--- | :--- |
| 1 | 竞态：Stripe 付完立刻跳回 `/account`，权益是**异步 webhook** 写的 | 用户看到「这个邮箱还没有已购课程」→ 以为被骗 |
| 2 | `/account` 完全没读 `paid=1`，付完回来和平时一模一样 | 没有任何「已收到 / 正在开通」反馈 |
| 3 | 模板仓库 / 社群邀请只在邮件里，账户页从不渲染 | 没配 Resend 就真的少两样交付物 |

## 落地

### 1. 付款会话对账（`src/reconcile.js`）

- `routes/buy.js`：`success_url` 改为 `/account?paid=1&session_id={CHECKOUT_SESSION_ID}`；
- `stripe-api.js` 新增 `retrieveCheckoutSession()`（`GET /checkout/sessions/{id}`）；
- 账户页在查库**之前**调 `reconcileCheckoutSession()`：
  1. `cs_…` 形状校验（长度/字符集），不合法直接拒绝，不拼进请求路径；
  2. 取会话失败 → `error`（页面降级为 pending，绝不 500）；
  3. `payment_status` 未结清 → `unpaid`（银行转账等异步方式）；
  4. **归属校验**：`metadata.email` 必须等于当前登录邮箱，否则 `foreign` 且不写库；
  5. 复用 `processEvent({ type: "checkout.session.completed" })` 补齐订单与权益 ——
     `insertOrder` 的 `insert or ignore` 保证两个标签页同时刷新只建一单、只发一封信。

### 2. 账户页成为交付入口（`routes/account.js` + `pages.js`）

- 课程卡：正文入口 `/<locale>/courses/<slug>` + `COURSE_DELIVERY` 的 `repo` / `community`（新开标签）；
- 付款状态条：`paid` / `pending`（自动刷新，**上限 3 次**）/ `unpaid`；只有带 `session_id` 的跳转才显示，
  避免收藏的 `/account?paid=1` 永远显示「支付成功」；
- 空态与「对账结果」解耦：`foreign` / `refunded` / `already` / `invalid` 一律回到普通空态。

### 3. 邮件降级为通知（`handlers.js` + `config.js` + `templates.js`）

- 新增 `resolveEmailDelivery()`：缺 `watch` 时回退 `<LEARN_URL>/account`，带 `accountFallback` 标志，
  模板把「观看链接 / 建议收藏本邮件」换成「用购买时的 Google 账号登录即可阅读」；
- `delivery_links_not_configured` **不再**判 `needs_manual_delivery`：只有「拿不到邮箱」「识别不出课程」
  才进人工队列（那两种情况下权益本身写不进去）；
- 新增状态 `skipped_no_resend`：没配 `RESEND_API_KEY` 时标记它，且**不发运营告警**
  （原行为是每单刷一次 `failed` + 一封发不出去的告警）；
- `/admin/resend` 同样走回退，没配交付链接也能补发。

### 4. 运营兜底（`index.js`）

- `GET /admin/orders?email=…`：按邮箱返回订单与权益（判断「钱到了、权益写了没有」）；
- `POST /admin/grant { email, courseSlug, planId }`：手工补权益，`order_id` 用 `manual:<uuid>` 留痕，
  退款按订单号撤销时不会误伤人工授权；
- 两个接口复用 `requireAdmin()`（`ADMIN_TOKEN`，定长比较）。

### 5. 根级 `/courses/*` 防呆

门禁认 `/courses/x` 与 `/zh/courses/x` 两种写法，但静态产物只在带语言前缀的目录下 —
旧邮件里若配成根级路径会 404。`index.js` 前置一条 302：`/courses/…` → `/<lang>/courses/…`
（`?lang=en` 走英文，保留原查询串）。

## 验收

| 项 | 结果 |
| :--- | :--- |
| `node --test`（worker） | **143/143**（121 → 143，新增 `test/reconcile.test.js` 9 条 + 路由/页面/管理接口用例） |
| `npm run build` | ✅ 148 URL、付费墙 0 泄露 |
| `npm run publish:check` | ✅ manifest 与正文一致 |
| 无 `RESEND_API_KEY` 时 | 订单 `skipped_no_resend`、权益照写、`/account` 可读 |
| 别人的 `session_id` | `foreign`，不写库、不提示 |
| 非法 `session_id` | 不请求 Stripe |

## 已知未完成

- 未部署：本机无 wrangler 二进制，需在已登录的机器 `cd workers/course-delivery && npx wrangler deploy`（纯 Worker 改动，增量约 8 秒）。
- 线上实测（一笔测试支付 + 退款）待部署后做。
- 邮件通道仍未接（Resend），但它已不阻塞交付。
- 自助退款、换绑邮箱、学习进度仍属 P3。
