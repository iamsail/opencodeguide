# [TASK106] - 课程文章化改造与内容补全（已完成）

**Status:** Completed
**Added:** 2026-11-18
**Updated:** 2026-11-19

**当前进度：123/123 节（100%）** — 四门课全部完成（27 / 33 / 36 / 27）。构建 281 页 / 123 个课时页；`courses:validate` 0 错误；付费墙断言 0 泄露（公开 8 / 锁定 115）。

## Original Request
课程全部为**文章版本**（不做视频），并由我方设计补全全部课程内容。第一阶段先完成课程 1「AI 编程实战」。

## Thought Process
- 原先四门课按「视频课」上架，但仓库里没有任何录制内容，页面承诺（「24 节视频课 · 随时开学」）与可交付物不符，真实收款后会直接变成退款与拒付风险。
- 文章化是更快的路径：不需要录制、可版本化、可直接搜索、复用现有 MDX 基础设施，也符合站点「文档站」的定位。
- 因此把商品话术统一改为「图文课」，并用 `lessonCount` / `durationHours` 对齐真实课时与阅读时长。

## 内容架构

```
content/courses/
├── ai-coding-workflow.json          # 商品信息 + 大纲（模块标题、价格、FAQ）
├── <locale>/<courseSlug>/           # 正文：一节一个 MDX
│   └── <lesson-slug>.mdx
└── zh/ai-coding-workflow/*.mdx      # 已写入 27 节
```

课时 frontmatter 契约：

```yaml
title:     "与 JSON 大纲一致的节标题"
summary:   "≤60 字，一句话说清解决什么"
module:    2      # 对应 JSON locales.<locale>.modules[1]
lesson:    3      # 模块内第 3 节
duration:  9      # 阅读分钟数
free:      false  # true = 免费试听
objectives: ["可检验目标", "..."]
```

正文结构：痛点开场 → 3–5 个 `##` 小节（≥1 代码块、≥1 表格/清单）→ `## 落地动作`（3 步）→ `## 常见坑`（现象/原因/对策）。

## 代码改动

| 文件 | 作用 |
| :--- | :--- |
| `lib/course-lessons.ts` | 解析 MDX、按模块排序、课表（JSON 大纲 + 已写正文）、上下篇 |
| `components/courses/lesson-view.tsx` | 阅读页：侧边课表、目标卡、正文、上下篇导航 |
| `app/(zh)/zh/courses/[slug]/[lesson]/page.tsx` | 中文课时路由（`generateStaticParams` + canonical/hreflang） |
| `components/courses/course-detail.tsx` | 课表接入课时链接、显示「文章版 · 已上线 N/M 节」，hero 用真实节数 |
| `app/sitemap.ts` | 收录课时页并声明中英 alternate |
| `scripts/courses/validate-courses.mjs` | 课时校验：frontmatter、大纲槽位、标题漂移、正文长度、代码块、免费节数量 |
| `app/fonts.ts` + `app/fonts/inter-latin-var.woff2` | 字体自托管，修掉构建期从 gstatic 下载字体超时导致的构建失败 |

## 进度

| 课程 | 大纲节数 | 中文正文 | 英文正文 |
| :--- | :--- | :--- | :--- |
| AI 编程实战 | 27 | ✅ 27/27 | ⬜ 0 |
| 独立开发者出海 | 33 | ✅ 33/33 | ⬜ 0 |
| 跨境电商独立站 | 36 | ✅ 36/36 | ⬜ 0 |
| 出海网站 SEO | 27 | ✅ 27/27 | ⬜ 0 |
| 全站通（bundle） | 123 | — | — |

## 待办

- [x] 文章化路由与数据层、详情页接入、sitemap
- [x] 课程 1 中文正文 27 节
- [x] 商品话术去「视频」化（faq/features/统计数字）
- [x] 节数校正：27 / 33 / 36 / 27 = 123，bundle 同步
- [x] 课程 2–4 中文正文（33 + 36 + 27 = 96 节，2026-11-19 全部完成）
  - [x] 课程 2「独立开发者出海」33 节
  - [x] 课程 3「跨境电商独立站」36/36 节（补齐模块 7 广告投放、模块 8 数据复购）
  - [x] 课程 4「出海网站 SEO」27/27 节（6 个模块，全新撰写）

最后 35 节的拆分与结果（全部完成）：
- 课程 3 模块 7（4 节）：`ad-cold-start-structure`、`creative-test-matrix`、`funnel-diagnosis-pdp-cart-checkout`、`abandoned-cart-email-sms`
- 课程 3 模块 8（4 节）：`core-ecommerce-metrics`、`ltv-subscription-bundles`、`reviews-ugc-compliance`、`quarterly-review-template`
- 课程 4 模块 1–6（27 节）：基础判断、多语言架构、技术 SEO、内容生产、外链分发、度量迭代
- [ ] 英文正文（或先做「英文版目录 + 中文正文」的过渡策略）
- [x] **付费墙决策**：已定为「每门前 2 节免费，其余进会员站」（P2.0 已实施，见 TASK107）
- [x] 课时页代码高亮（rehype-pretty-code，与文档站同主题）
- [x] 课时页加入 `TechArticle` JSON-LD，并收录进站点搜索索引
- [ ] 更新日志区块、试听入口的购买转化埋点

## Progress Log
### 2026-11-19（完成）
- 补齐课程 3 模块 7–8（8 节）与课程 4 全部 27 节，合计 **123/123**。
- 校验 `courses:validate` 0 错误；构建 281 页 / 123 个课时页；付费墙断言扫描 1773 个文件、230 条探针，0 泄露（公开 8 / 锁定 115）。
- 顺带修复闸门探针抽取：行内代码/加粗把段落切碎时取最长纯文本片段，避免新增内容导致构建误报。
- `npm run courses:meta` 重算：课 4 27 节/4h、课 3 36 节/6h、bundle 123 节/19h。

### 2026-11-18
- 建立课时数据层与阅读页路由，构建通过（186 页，其中课程 1 课时 27 页）。
- 已提交并推送（`04f6f5d`、`159de3d`、`8482b59`）：课时基建 + 88 节正文 + 访问控制方案文档。
- 课程 3「跨境电商独立站」已写 28/36 节（模块 1–6 完成：选品、建站、支付风控、履约、合规、AI 素材）；模块 7 广告投放与模块 8 数据复购待补。
- 课程 2「独立开发者出海」33 节完成（7 个模块：选题验证 → 最小架构 → 多租户 → Stripe → 上线 → 增长 → 合规）。构建 219 页、课时 60 页；校验 0 错误。课程 2 `lessonCount` 30→33、`durationHours` 16→5（按 33 节 × 约 8.5 分钟）。
- 并行写作完成课程 1 的 27 节中文正文（约 7.9 万字符，含代码块），校验 0 错误。
- 字体改自托管：`next/font/google` 在弱网下 3 秒超时会让 `next build` / `next dev` 直接失败（`Can't resolve '@vercel/turbopack-next/internal/font/google/font'`），改为 `next/font/local` 后构建完全离线。
