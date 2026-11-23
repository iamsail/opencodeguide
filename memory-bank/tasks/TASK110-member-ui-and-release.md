# [TASK110] - 成员站上线、页面样式对齐与购买入口切换

**Status:** Completed
**Added:** 2026-11-23
**Updated:** 2026-11-23

## Original Request

1. Stripe 支付必须先 Google 登录（公开站按钮改指 `learn./buy/<slug>/<plan>`）
2. 登录 / 买课 / 账户页太简陋，与公开站风格不符
3. 用测试模式把链路真正跑起来（本地优先，不要直接动线上）

## 落地

### 1. 公开站购买入口（`NEXT_PUBLIC_CHECKOUT_MODE`）

| 改动 | 文件 |
| :--- | :--- |
| 默认 `learn` 模式：按钮指向 `https://learn.opencodeguide.com/buy/<slug>/<plan>?lang=&utm_*` | `lib/courses.ts` |
| 应急回退 `stripe` 模式：仍可直连 Payment Link | 同上 + `.env.example` |
| `CheckoutTarget.requiresLogin` 驱动打开方式（同标签 / 新标签） | `components/courses/buy-button.tsx` |
| 价格卡显示「购买前需用 Google 账号登录」 | `components/courses/course-detail.tsx`、`lib/course-copy.ts` |

验证：构建产物中 `buy.stripe.com` 0 处；`tsc` 与 `npm run build` 通过；回退模式下 env 覆盖生效。

### 2. 成员站页面样式（P2.4）

- 新增 `workers/course-delivery/src/ui.js`：zinc 色板 token、`.card` `.btn` `.facts` `.course-grid`、头部/页脚、主题脚本、`shell()` 骨架
- `src/pages.js` 重写 6 类页面（登录 / 购买 / 账户 / 无权访问 / 不可用 / 错误），文案中英各一套
- 错误页按原因分文案：`renderErrorPage({ reason })` 支持 `login` / `unknown-course` / `payment`，修掉「买课 404 显示登录失败」
- 购买页渐变头取 catalog 的 `accent`（`sync-worker-catalog.mjs` 新增字段，白名单校验 + 默认回退）
- 根路径 `/` → 302 `/account`
- 主题：`<html class="dark">` + `localStorage.theme`（与公开站 next-themes 同键名），首屏内联脚本防白闪

### 3. 部署与凭据

- `wrangler login`（账号 `lichanghangcumt@gmail.com`），注入 `GOOGLE_CLIENT_ID/SECRET`、`STRIPE_SECRET_KEY`（测试）、`COURSE_CATALOG`
- 成员站全量部署：1153 个资源 / 88.9 KB Worker；新增样式后再次部署（Version `3692beb9`）
- Stripe 测试 webhook：`we_1UexDHHaZKTeRe8aCsJpiRKe` → `https://learn.opencodeguide.com/stripe/webhook`，新 `whsec_` 已注入并验签通过

## 验收

| 项 | 结果 |
| :--- | :--- |
| `workers:test` | 121/121（新增 `test/pages.test.js` 11 个用例） |
| `/health` bindings | db / webhookSecret / sessionSecret / googleOauth / stripeKey / catalog / assets 全 true；`resend` 仍 false |
| 未登录访问课程页 | 302 → `/login?next=…` |
| `/auth/google` | 302 → Google，回调 `learn.opencodeguide.com/auth/google/callback` |
| `search.json` 未登录 | 401 |
| 响应头 | `x-robots-tag: noindex, nofollow` + `cache-control: no-store` |
| webhook 验签 | 正确签名通过、错误签名 400；触发测试事件成功写入订单（已清理） |
| 样式 | 浅色 / 暗色 / 移动端截图对照通过；主题切换刷新后保持 |

## 已知未完成

- `RESEND_API_KEY` 缺失 + 域名 DNS 未配 → 开通邮件发不出（订单与权益仍正常写入，`email_status=failed`）
- Stripe 仍是测试模式 → 正式收款前需换 `sk_live_`、重建 webhook/catalog 与支付链接（`--force`）
- 公开站尚未发版（`dev` 领先 `main` 21 个提交），课程页线上仍 404
- 英文正文 0/123；`en` 无课时阅读路由
- 成员站交付邮件里的 `watch` 链接指向 `/courses/<slug>`，而产物只有 `/zh/courses/<slug>`，部署后需实测确认是否需要重定向

## 部署基线（补充 TASK109 未测项）

全量上传 **1153 个文件 / 131.7 秒**，Worker 包 88.9 KB；增量部署（只改 Worker）**7.6 秒**。
按 `10-publish-baseline.md` 的 Phase 2 判定规则（≤90 秒才保持静态方案），**全量部署已超出阈值**。
