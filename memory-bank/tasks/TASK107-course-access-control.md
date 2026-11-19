# [TASK107] - 课程访问控制与会员中心（P2.0 完成，P2.1–P2.4 待做）

**Status:** In Progress (P2.0 + P2.1 + P2.2 done 2026-11-19)
**Added:** 2026-11-18
**Updated:** 2026-11-19

## Original Request
课程内容已写到 88/123 节，但静态站无法鉴权——正文对所有人可见。决定采用「只公开每门前 2 节，其余进会员中心」，先出设计再实施。

## 设计文档
[`docs/courses/07-access-control.md`](../../docs/courses/07-access-control.md)（决策记录 §0、架构 §4、验收标准 §12；P2.0 实施记录 §15）

## 核心结论

1. **安全边界在构建期**：`COURSE_ACCESS=public` 的产物里不能出现付费正文，而不是靠前端隐藏。
2. **两份构建产物**：公开站继续走 GitHub Pages（`out/`）；成员站（`out-members/`）由 Cloudflare Worker 托管静态资源并做鉴权，域名 `learn.opencodeguide.com`。
3. **鉴权用自建 magic link**：复用现有 Resend + D1，不引入 Supabase 这类身份供应商；会话 JWT（30 天），但**每次请求都查 entitlements**，所以退款即时降权。
4. **权益从订单派生**：`checkout.session.completed` 写 `entitlements`，`charge.refunded` 置 `revoked_at`；全站通展开为四门课。
5. **CI 闸门**：`assert-no-gated-content.mjs` 扫描公开产物，发现付费正文特征串即失败。

## 实施计划

- [x] P2.0 公开/付费分流：锁定页、sitemap、搜索索引、构建期断言（2026-11-19）
- [x] P2.1 `entitlements` / `magic_links` / `auth_attempts` 迁移 + Webhook 写入与退款回收 + 历史订单回填（2026-11-19）
- [x] P2.2 鉴权 Worker：magic link、会话 JWT、限流、`/account`、`gate.js` 门禁（2026-11-19）
- [ ] P2.3 成员站部署：`COURSE_ACCESS=members` 构建到 `out-members/`、Worker 静态资源、子域与 DNS、noindex（0.5–1 天）
- [ ] P2.4 水印、邮件模板、登录失败排查、日志看板（0.5–1 天）

合计 4–6 个工程师日，剩约 3–5 天。

### P2.0 落地清单（2026-11-19）

| 文件 | 作用 |
| :--- | :--- |
| `content/courses/access.json` | 免费额度 `freeLessonLimit: 2`，站点/脚本共用 |
| `lib/course-access.ts` | 构建期访问模式与额度读取 |
| `lib/course-lessons.ts` | 按课表顺序解析 `free`；`isLessonLocked` / `getReadableLessons` |
| `components/courses/locked-lesson.tsx` | 锁定页（试听 + 购买 CTA + `data-locked-lesson`） |
| `app/(zh)/zh/courses/[slug]/[lesson]/page.tsx` | 全量生成 URL，按模式渲染正文或锁定页，且不把正文传给视图 |
| `app/sitemap.ts` | public 只收录免费节；members 不收录课时 |
| `scripts/build-search.mjs` | 付费节正文不进 `public/search.json` |
| `scripts/courses/assert-no-gated-content.mjs` | 双向断言：泄露检测 + 锁定标记 + 免费页对照 |
| `scripts/courses/validate-courses.mjs` | 额度配置校验 + 公开/锁定节数统计 |
| `.github/workflows/deploy.yml` | `COURSE_ACCESS: public` + build 末尾自动断言 |

实测：88 节 → 公开 6 / 锁定 82；`courses:assert` 扫描 1563 个文件、162 条探针，0 命中；注入正文的负向测试能拦下（exit 1）。

### P2.1 落地清单（2026-11-19）

| 文件 | 作用 |
| :--- | :--- |
| `workers/course-delivery/migrations/0002_entitlements.sql` | `entitlements` + `magic_links` + `auth_attempts` |
| `workers/course-delivery/src/entitlements.js` | 邮箱规范化、全站通展开、授权/撤销、`hasCourseAccess` |
| `workers/course-delivery/src/store.js` | `grantEntitlement`（upsert 复活）/ `revokeEntitlementsByOrder` / `hasEntitlement` |
| `workers/course-delivery/src/handlers.js` | 付款先写权益再发信；全额退款撤销；拒付按 `REVOKE_ON_DISPUTE`；`duplicate` 分支补授权 |
| `workers/course-delivery/src/config.js` | `ALL_ACCESS_COURSES`、`isAllAccessPurchase`、`revokeOnDispute` |
| `scripts/courses/backfill-entitlements.mjs` | 历史订单 → 权益的幂等 SQL 生成器（`--execute` 才执行） |

测试：`npm run workers:test` 62/62；回填 SQL 在真实 SQLite 上验证（单课 1 条、全站通 5 条、退款排除、部分退款保留、幂等、撤销、复活）。

### P2.2 落地清单（2026-11-19）

| 文件 | 作用 |
| :--- | :--- |
| `workers/course-delivery/src/auth.js` | 令牌签发/校验（sha256、单次、15 分钟）、固定窗口限流、HS256 会话 JWT、cookie 与 `safeNextPath` |
| `workers/course-delivery/src/routes/auth.js` | `/login`、`POST /auth/magic`、`GET /auth/verify`、`/auth/logout`；防枚举、防开放重定向 |
| `workers/course-delivery/src/routes/account.js` | `/account` 我的课程（按权益列表，bundle 排最后） |
| `workers/course-delivery/src/gate.js` | 默认拒绝门禁：公开白名单 + 课程 slug 权益校验（每次请求查库） |
| `workers/course-delivery/src/pages.js` | 登录/已发送/限流/无效链接/无权限/账户页（noindex、深色模式、中英双语） |
| `workers/course-delivery/src/templates.js` | 登录邮件（双语、解释「不是本人怎么办」） |

测试：100/100（新增 38）。**未做**：静态资源接线、`learn.` 子域与成员站构建（P2.3）、水印与日志看板（P2.4）。

## 阻塞项（需要人拍板）

| # | 决策 | 状态 | 影响 |
| :--- | :--- | :--- | :--- |
| 1 | 免费边界：每门前 2 节还是 3 节 | ✅ 定为 2 节（`access.json` 可改） | 转化与 SEO |
| 2 | `learn.` 子域 DNS 能否交给 Cloudflare | 待定 | 决定成员站托管在 Cloudflare 还是 Vercel（Vercel 会产生按量成本） |
| 3 | 自建 magic link 还是 Supabase Auth | 待定（倾向自建） | 多一个供应商 vs 多一份维护 |

## 与其它任务的关系

- 依赖 [TASK105] 的 `course-delivery` Worker（Webhook、D1、Resend 已就绪）。
- 依赖 [TASK106] 的课时正文与 `free` 标记。
- **P2.1–P2.3 完成前不要开启真实收款**：付费正文已从公开站下架，买家暂时没有阅读入口。

## Progress Log
### 2026-11-19（P2.2）
- 登录闭环：magic link（只存哈希、单次、15 分钟）+ 会话 JWT（30 天）+ 限流（邮箱 60s / IP 5h）+ `/account`。
- 门禁 `gate.js` 默认拒绝，已覆盖「只拦 html 不拦 `.txt` / `search.json`」这个最容易漏的口子；撤销后立刻失效有专门测试。
- 测试 62 → 100。剩余 P2.3（静态资源接线 + 子域 + 成员构建）与 P2.4（水印/日志）。

### 2026-11-19
- P2.1 完成：权益表迁移 + 授权/撤销逻辑 + webhook 接线 + 历史订单回填脚本；`npm run workers:test` 62/62。
- 决策：部分退款保留访问；拒付默认不回收（`REVOKE_ON_DISPUTE=1` 可改）；权益与交付物配置解耦。
- 未做：P2.2（magic link / 门禁 / account）、P2.3（成员站部署）、P2.4（水印与日志看板）。
- P2.0 实施完成：免费边界 2 节、锁定页、sitemap/搜索索引收敛、构建期双向断言；`npm run build` 全绿（246 页）。
- 关键取舍：课时 URL 不按免费节过滤（旧外链不 404），锁定页可索引但不进 sitemap。
- 顺带修复：`public/search.json` 原本把 88 节的正文前 400 字全部公开索引，现只保留免费 6 节的正文。

### 2026-11-18
- 设计稿定稿（构建期分流、双产物、magic link、权益派生、CI 闸门）。
