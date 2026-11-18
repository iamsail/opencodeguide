# [TASK105] - 课程板块 P1：正式收款与邮件交付（待启动）

**Status:** Pending
**Added:** 2026-11-18
**Updated:** 2026-11-18

## Original Request
课程板块 P0 已完成（[TASK104]）。按 `docs/courses/05-rollout-plan.md` 的分期计划，下一步进入 P1：打通正式收款与付款后的自动交付。

## Thought Process
- P0 已支持 Stripe Payment Link 与降级预售，但没有真实订单，也没有自动交付：付款后的开通动作目前是人工。
- P1 的目标不是「加功能」，而是让「付款 → 收到观看链接 → 进社群」这条链路不依赖人工，否则每单都会变成客服成本。
- 站点保持静态导出不变，Webhook 与发信用外部服务（Cloudflare Worker + Resend），避免为了收款改造整体托管架构。

## Implementation Plan
- [ ] 人工：Stripe 主体/KYB 完成，执行 `npm run courses:stripe` 生成正式链接并验证
- [ ] 人工：配置 `NEXT_PUBLIC_COURSE_WAITLIST_ENDPOINT`（Formspree/Buttondown）
- [ ] 人工：准备视频托管链接、私有模板仓库、社群邀请
- [ ] `workers/course-delivery`：接收 `checkout.session.completed` / `charge.refunded`，校验签名 + 幂等
- [ ] 集成 Resend：中英双语开通邮件（观看链接 + 仓库邀请 + 社群 + 退款说明）
- [ ] 订单记录：先用轻量存储（D1 / Supabase 表），字段与 `docs/courses/02` 的 `orders` 对齐
- [ ] 详情页增加「试听」入口与「更新日志」区块
- [ ] 早鸟优惠码展示（Stripe Promotion Code）
- [ ] 对账脚本：按 `client_reference_id` 导出订单
- [ ] 首单真实退款演练，确认邮件与权益回收

## Progress Tracking

**Overall Status:** Not Started - 0%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1.1 | 正式 Payment Link 生成与验证 | Blocked | 2026-11-18 | 等 Stripe 密钥与主体 |
| 1.2 | 交付 Worker + Webhook | Not Started | 2026-11-18 | 方案见 04 文档第 7 节 |
| 1.3 | 开通邮件（Resend） | Not Started | 2026-11-18 | 中英双语模板 |
| 1.4 | 试听内容与更新日志 | Not Started | 2026-11-18 | 依赖录制进度 |
| 1.5 | 对账与订单检查 SOP | Not Started | 2026-11-18 | |
| 1.6 | 退款演练 | Not Started | 2026-11-18 | 与权益回收一起验证 |

## Progress Log
### 2026-11-18
- 创建任务文件，登记 P1 范围与阻塞项（Stripe 密钥、交付物）。
- 详细清单同步在 `docs/courses/06-todo.md` 第 3 节。
