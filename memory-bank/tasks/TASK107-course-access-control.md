# [TASK107] - 课程访问控制与会员中心（设计完成，待实施）

**Status:** Pending (design approved pending 3 decisions)
**Added:** 2026-11-18
**Updated:** 2026-11-18

## Original Request
课程内容已写到 60/123 节，但静态站无法鉴权——正文对所有人可见。决定采用「只公开每门前 2–3 节，其余进 P2 会员中心」，先出设计。

## 设计文档
[`docs/courses/07-access-control.md`](../../docs/courses/07-access-control.md)

## 核心结论

1. **安全边界在构建期**：`COURSE_ACCESS=public` 的产物里不能出现付费正文，而不是靠前端隐藏。
2. **两份构建产物**：公开站继续走 GitHub Pages（`out/`）；成员站（`out-members/`）由 Cloudflare Worker 托管静态资源并做鉴权，域名 `learn.opencodeguide.com`。
3. **鉴权用自建 magic link**：复用现有 Resend + D1，不引入 Supabase 这类身份供应商；会话 JWT（30 天），但**每次请求都查 entitlements**，所以退款即时降权。
4. **权益从订单派生**：`checkout.session.completed` 写 `entitlements`，`charge.refunded` 置 `revoked_at`；全站通展开为四门课。
5. **CI 闸门**：`assert-no-gated-content.mjs` 扫描公开产物，发现付费正文特征串即失败。

## 实施计划

- [ ] P2.0 公开/付费分流：锁定页、sitemap、构建期断言（0.5–1 天）
- [ ] P2.1 `entitlements` / `magic_links` / `auth_attempts` 迁移 + Webhook 写入与退款回收 + 历史订单补齐（0.5–1 天）
- [ ] P2.2 鉴权 Worker：magic link、会话、限流、`/account`（1.5–2 天）
- [ ] P2.3 成员站部署：成员构建、Worker 静态资源、子域与 DNS、noindex（0.5–1 天）
- [ ] P2.4 水印、邮件模板、登录失败排查、日志看板（0.5–1 天）

合计 4–6 个工程师日。

## 阻塞项（需要人拍板）

| # | 决策 | 影响 |
| :--- | :--- | :--- |
| 1 | 免费边界：每门前 2 节还是 3 节 | 转化与 SEO，改动便宜 |
| 2 | `learn.` 子域 DNS 能否交给 Cloudflare | 决定成员站托管在 Cloudflare 还是 Vercel（Vercel 会产生按量成本） |
| 3 | 自建 magic link 还是 Supabase Auth | 自建复用现有栈、无月费；Supabase 省心但多一个供应商 |

## 与其它任务的关系

- 依赖 [TASK105] 的 `course-delivery` Worker（Webhook、D1、Resend 已就绪）。
- 依赖 [TASK106] 的课时正文与 `free` 标记。
- 内容写作不受阻塞：剩下 63 节仍按现有结构写，只是渲染时按 `COURSE_ACCESS` 分流。
