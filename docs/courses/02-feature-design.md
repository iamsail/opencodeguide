# 02 · 功能设计

## 1. 设计原则

1. **静态优先**：站点是 `output: 'export'` 的静态导出（为把 Vercel 成本压到接近 0）。Phase 1 的所有功能必须在不引入服务端的前提下成立。
2. **内容即数据**：课程以 JSON 文件定义，新增/修改课程只改数据，不改页面代码。
3. **降级可用**：Stripe 未配置时页面照常上线，购买按钮自动变成「开售提醒 / 联系我们」，支持先跑预售。
4. **双语同构**：中文页与英文页共用同一套组件与数据，仅切换文案，避免两套实现漂移。
5. **少即是多**：不播放视频、不做拖拽、不引入状态管理；视频托管在外部（后续），站点只负责售卖与内容展示。

## 2. 信息架构与路由

```
/zh/courses                      中文课程总览（主推）
/zh/courses/[slug]               中文课程详情（4 门 + 全站通）
/zh/courses/thank-you            付款成功与开通指引（noindex）
/en/courses                      英文课程总览
/en/courses/[slug]               英文课程详情
/en/courses/thank-you            付款成功（noindex）
```

| 路由 | 文件 | 渲染方式 | 说明 |
| :--- | :--- | :--- | :--- |
| `/zh/courses` | `app/(zh)/zh/courses/page.tsx` | SSG | 目录页，含四条路线、课程卡、学习路径、FAQ |
| `/zh/courses/[slug]` | `app/(zh)/zh/courses/[slug]/page.tsx` | SSG + `generateStaticParams` | 课程详情，`dynamicParams = false` 保证只生成已知课程 |
| `/zh/courses/thank-you` | `app/(zh)/zh/courses/thank-you/page.tsx` | SSG | 读取 `?course=&plan=` 展示订单摘要（客户端） |
| `/en/courses*` | `app/(main)/en/courses/**` | 同上 | 英文版，canonical 与 hreflang 指向中文对应页 |

导航入口：顶部导航（`课程` / `Courses`）、页脚、首页课程区块（英文站）与详情页交叉推荐。

## 3. 页面结构

### 3.1 目录页（`/zh/courses`）

| 区块 | 内容 | 目的 |
| :--- | :--- | :--- |
| Hero | 一句话定位 + 4 个事实数字（4 门课 / 110 节 / 56 小时 / 永久观看） | 3 秒内说清「这里卖什么」 |
| 信任条 | Stripe、7 天退款、永久观看、持续更新 | 降低支付顾虑 |
| 四条路线 | AI 编程 / 独立开发 / 出海增长 / 跨境电商 | 帮用户自我归类 |
| 课程卡网格 | 每张卡：渐变封面、状态徽章、课时/时长、价格、CTA | 主要转化入口 |
| 全站通横幅 | 打包价与原价对比 | 提升客单价 |
| 学习路径 | 01→04 的四步推荐 | 解决「先学哪门」 |
| FAQ | 5 个购买前问题 | 处理异议 |
| 底部 CTA | 文档 / 咨询 | 未准备购买者的出口 |

### 3.2 详情页（`/zh/courses/[slug]`）

两栏布局（移动端单栏）：

**左栏（内容）：**
1. 面包屑 → 课程名
2. 轨道标签 + 状态徽章 + 预售日期
3. 标题 / 副标题 / 讲师导语（tagline）
4. 元信息：课时、时长、难度、最近更新
5. 适合谁（4 条）
6. 学完你能做到（5-6 条，带编号）
7. 课程大纲（`<details>` 手风琴，默认展开第一模块）
8. 交付物（模板、清单）
9. 讲师介绍
10. 等待名单（预售或未配置支付时）
11. FAQ
12. 底部「继续看看其他课程」

**右栏（购买卡，sticky）：**
- 起价 + Stripe 标识
- 每个 plan 一张卡：名称、徽章、价格、原价、人民币参考、包含内容、购买按钮
- 退款保证 + 支付说明
- 支持的支付方式
- 全站通升级入口（非 bundle 时）

> 设计取舍：不做「购物车」，因为单课程客单价高、决策重，购物车只会增加摩擦；多课打包用「全站通」一个 SKU 解决。

### 3.3 付款成功页（`/zh/courses/thank-you`）

- 成功徽章（Stripe 200）
- 三步开通指引：查收邮件 → 加入社群 → 从模块 1 开始
- 订单摘要（客户端读取 `?course=&plan=`）
- 帮助入口与退款说明

## 4. 功能清单与优先级

### P0（本次已实现，可上线预售）

| ID | 功能 | 验收标准 |
| :--- | :--- | :--- |
| F-01 | 双语课程目录与详情页 | `/zh/courses`、`/en/courses` 及 4 个详情页静态生成成功 |
| F-02 | 数据驱动课程内容 | 新增 `content/courses/*.json` 后无需改代码即可出现新课程 |
| F-03 | Stripe Payment Link 购买 | 配置链接后按钮跳转 Stripe 结账页；未配置时降级为等待名单/联系 |
| F-04 | 支付回执与开通页 | 支付成功跳转 `thank-you`，展示课程与 plan |
| F-05 | 等待名单 | 未配置端点时跳转联系页；配置后 POST 收集邮箱 |
| F-06 | SEO | `Course` JSON-LD、hreflang、canonical、sitemap 收录、感谢页 noindex |
| F-07 | 埋点 | 点击购买触发 GA4 `begin_checkout`（含课程、plan、金额） |
| F-08 | 价格展示 | 美元主价 + 人民币参考 + 划线原价 |

### P1（首发后 2-4 周）

| ID | 功能 | 说明 |
| :--- | :--- | :--- |
| F-10 | 优惠码 | Stripe Promotion Code，页面显示「早鸟码」入口 |
| F-11 | 邮件交付自动化 | 付款后自动发送观看链接、模板仓库邀请、社群邀请 |
| F-12 | 发票/收据 | Stripe Invoice 自动生成；企业采购走人工开票 |
| F-13 | 退款政策页 | **已提前实现**：`/refund-policy`、`/zh/refund-policy` |
| F-14 | 学习进度页（轻量） | Notion/飞书公开页 + 邮件课表，不需登录 |
| F-15 | 试听 | 每门课 1 节公开试听（嵌入视频或文章） |

### P2（会员中心，需要脱离纯静态）

| ID | 功能 | 说明 |
| :--- | :--- | :--- |
| F-20 | 用户登录 | Supabase Auth / Auth.js |
| F-21 | 订单与权益表 | `orders`、`entitlements`，Webhook 写入 |
| F-22 | 课程播放页 | 视频托管（Mux / Cloudflare Stream）+ 防盗链 |
| F-23 | 学习进度与证书 | 完成度、结课证书 |
| F-24 | 自助管理 | 换绑邮箱、重发链接、申请退款 |

### P3（规模化）

| ID | 功能 | 说明 |
| :--- | :--- | :--- |
| F-30 | 订阅制会员 | 月付/年付解锁全部课程与更新 |
| F-31 | 企业采购 | 多席位、统一发票、SSO |
| F-32 | 联盟分销 | Stripe Coupon + 独立推广链接 |
| F-33 | 直播训练营 | 排期、报名、回放 |
| F-34 | A/B 测试 | 价格、标题、CTA 文案 |

## 5. 数据模型

### 5.1 当前：JSON 文件（构建期读取）

```
content/courses/
├── ai-coding-workflow.json     # 一门课一个文件
├── indie-saas-launch.json
├── cross-border-store.json
├── global-site-seo.json
├── all-access.json             # kind = "bundle"
├── stripe-links.json           # 由脚本生成：plan -> Payment Link
└── stripe-products.json        # 由脚本生成：plan -> product/price/link id（幂等用）
```

单门课程的核心字段：

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `slug` | string | 路由标识，同时用于 Stripe 链接 key |
| `kind` | `"course" \| "bundle"` | bundle 在目录页单独展示 |
| `track` | string | `ai-coding` / `indie` / `ecommerce` / `global-seo` |
| `status` | `live \| preorder \| coming-soon` | 决定徽章与购买按钮行为 |
| `icon` / `accent` | string | 封面图标与渐变（Tailwind 完整类名） |
| `durationHours` / `lessonCount` | number | 展示用 |
| `plans[]` | array | `id`、`priceUSD`、`priceCNYRef`、`compareAtUSD`、`features`（双语） |
| `locales.zh/en` | object | 标题、副标题、受众、收益、模块、FAQ、SEO、讲师、退款承诺 |

### 5.2 Phase 2：数据库表（建议 Supabase / Postgres）

```sql
-- 课程内容仍可放 JSON/MDX，数据库只存交易与权限
create table orders (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text unique,
  stripe_payment_intent text,
  email text not null,
  course_slug text not null,
  plan_id text not null,
  amount_cents int not null,
  currency text not null default 'usd',
  status text not null,              -- paid | refunded | disputed
  created_at timestamptz default now()
);

create table entitlements (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  course_slug text not null,
  plan_id text not null,
  order_id uuid references orders(id),
  granted_at timestamptz default now(),
  revoked_at timestamptz,
  unique (email, course_slug)
);

create table progress (
  email text not null,
  course_slug text not null,
  lesson_id text not null,
  completed_at timestamptz default now(),
  primary key (email, course_slug, lesson_id)
);
```

关键约束：**权益以邮箱为自然键**（Stripe 一定收集邮箱），用户注册时用邮箱匹配历史订单，避免「先付款后注册」的权益丢失。

## 6. 用户旅程与支付流程

```
搜索/社区 ──▶ 目录页 ──▶ 详情页 ──▶ 点击「立即购买」
                                      │
                                      ▼
                          Stripe 托管结账页（卡 / Apple Pay / 支付宝）
                                      │ 成功
                                      ▼
                    after_completion 重定向 → /zh/courses/thank-you?course=&plan=
                                      │
                    ┌─────────────────┼──────────────────┐
                    ▼                 ▼                  ▼
               页面显示订单摘要    Stripe 邮件收据    我方邮件（P1 自动化）
                                                         │
                                                         ▼
                                              观看链接 + 模板仓库 + 社群
```

**为什么用跳转而不是嵌入表单：** 静态站无服务端，无法安全持有密钥；Stripe 托管页负责 PCI、3DS、货币换算与本地支付方式，转化率通常也更高。

**失败与放弃：** Payment Link 不支持自定义 cancel_url，用户返回即回到来源页；详情页保持原有状态，不丢失上下文（链接带 `client_reference_id`，便于在 Stripe 后台定位放弃来源）。

## 7. 内容运营工作流

新增一门课的标准动作（无需改代码）：

1. 复制任一课程 JSON，修改 `slug`、价格、`locales` 内容。
2. 在 `scripts/courses/` 无需改动的前提下运行 `npm run courses:stripe`（只创建缺失的 plan）。
3. 提交 `content/courses/*.json` 与 `stripe-links.json`。
4. 构建上线；sitemap 与结构化数据自动更新。

**约定：**
- `slug` 一旦上线不可修改（会破坏外链与 Stripe 记录），需要改就用重定向。
- 价格调整只改 `priceUSD`/`priceCNYRef`，**Stripe 里的 Price 不会自动同步**，需要用 `--force` 重建 Payment Link（旧链接保留一段时间用于已投放广告）。
- 状态从 `preorder` 改为 `live` 时，同时更新 `releaseDate` 为实际日期。

## 8. SEO 与结构化数据

- 每门课输出 `Course` JSON-LD：名称、描述、`provider`、`offers`（每个 plan 一个 Offer，含价格、币种、库存状态）、`hasCourseInstance`（online、课时）。
- `alternates.languages` 声明中英文对应页；canonical 固定为当前语言页。
- sitemap：课程详情页 priority 0.9，感谢页排除。
- 标题模板：`课程名 | OpenCode 中文指南`（由根 layout 的 template 统一）。
- 内链策略：课程页链回相关文档（如 AI 编程课 → `/zh/docs/configure/agents`），文档页在相关章节链回课程（P1 再做，避免广告感）。

## 9. 埋点与指标

| 事件 | 触发点 | 关键参数 |
| :--- | :--- | :--- |
| `view_course_catalog` | 目录页加载 | locale |
| `view_course` | 详情页加载（P1） | course, status |
| `begin_checkout` | 点击购买 | course, plan, value, currency |
| `purchase` | 感谢页加载（P2，需服务端校验） | course, plan, value |
| `waitlist_submit` | 提交等待名单 | course |

漏斗：`目录页 PV → 详情页 PV → 点击购买 → 支付成功`。重点看**详情页 → 点击购买**，这是页面质量的核心指标。

## 10. 无障碍、性能与国际化

- 手风琴使用原生 `<details>/<summary>`，键盘可用，无需 JS。
- 所有链接有明确文字，图标带 `aria-hidden`；图片（后续）必须有 alt。
- 静态页面无客户端数据请求；购买按钮是唯一交互组件，含水化成本极低。
- 双语文案集中在 `lib/course-copy.ts`，课程内容在 JSON 的 `locales` 下，避免硬编码散落。
- 中文字体不额外引入（沿用系统字体栈），避免字体加载拖慢首屏。

## 11. 安全与合规要点

- Stripe 密钥只存在于本地/CI 环境变量，绝不加 `NEXT_PUBLIC_` 前缀，不进入前端包。
- 静态站不接触卡号，PCI 责任由 Stripe 承担。
- 页面明确标注「以美元结算」，减少汇率争议与拒付。
- 退款政策、隐私政策、服务条款需在支付前可达（页脚已链接）。
- 收集邮箱仅用于订单与课程通知，需在隐私政策中说明用途与退订方式。
