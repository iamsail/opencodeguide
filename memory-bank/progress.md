# Progress Status

## Overview
**Status**: Phase 2.5 Complete (SEO Optimization & Authority Strategy)
**Version**: 0.5.0

## Milestones

### Phase 1: Foundation & Content (Completed)
-   [x] Project Scaffolding
-   [x] English Content Generation
-   [x] Sitemap & Robots Implementation

### Phase 2: User Experience (Completed)
-   [x] Sidebar & TOC
-   [x] Cmd+K Search
-   [x] Dark Mode
-   [x] Flow: Article -> Hub -> Documentation

### Phase 2.5: Documentation & SEO Refinement (Completed)-   [x] **MCP Hub**: Established `/en/mcp` as the authoritative source.
-   [x] **MCP Authority**: Optimized Sitemap and internal links for `/en/mcp`
-   [x] Full restructure of Chinese docs into 4 tiers under `/zh/docs`
-   [x] **SEO Fix**: Established Canonical links to prevent route iç cannibalization.
-   [x] **SEO Fix**: Established hreflang languages alternates for EN/ZH synchronization.
-   [x] **Hub Update**: Redesigned \`/zh/opencode\` as a professional entry point.
-   [x] Fixed all 8 broken English canonical links.
-   [x] Filled missing metadata for all core documentation skeletons.

### Phase 3: Content Enrichment & Engagement (In Progress)
- [x] **OpenCode v2 Docs Sync Pipeline (TASK103, Completed 2026-10-26)**: Automated fetch→translate pipeline syncing `/zh/docs` with official v2 docs. 21 pages updated in place (metadata preserved), 14 legacy pages got migration banners, **45 new pages created** (zh docs 36→81), sidebar extended to 5 groups (incl. Console), ROUTE_MAP fully updated. SEO regression checks all green: zero deleted URLs, sitemap covers all 81 pages, canonical/hreflang intact, search index complete, build green at 142 pages. next upgraded 16.1.1→16.4.3 to fix the #87713 SWC CJK panic. Future updates: run `npm run docs:sync`. Optional backlog: Phase 5 CI weekly check. See TASK103.
- [x] **Homepage API CTA**: Added a high-visibility external API registration CTA to the root homepage hero and shared top navigation while preserving the core documentation CTA ([TASK103]).
- [x] **Chinese CLI Documentation Update (v2)**: Synchronized CLI reference with the latest `session` command logic, updated environment variables, and refactored UI for mobile parity ([TASK102]).
- [x] **Chinese IDE Documentation Update (v2)**: Overhauled the IDE guide with VS Code, Cursor, and Windsurf support, including detailed shortcuts and troubleshooting ([TASK101]).
- [x] **Troubleshooting Documentation Update (ZH)**: Overhauled the Chinese troubleshooting guide with detailed logs, storage, desktop app, and system-specific diagnostics ([TASK100]).
- [x] **Chinese Introduction v2**: Updated the core entry guide for the Chinese locale with improved linking, installation methods, and usage scenarios ([TASK099]).
- [x] **LLM Provider Expansion (ZH)**: Updated the model providers guide to support 75+ sources with updated configuration steps (GitLab Duo, Bedrock, etc.) and fixed global TOC layout issues ([TASK038]).
- [x] **Windows (WSL) Guide (ZH)**: Created a dedicated guide for running OpenCode on Windows via WSL, including installation, desktop app linkage, and file system tips ([TASK098]).
- [x] **Monetization**: Integrated Google AdSense (Script & ads.txt) ([TASK096], [TASK097]).
- [x] **Add New Skills**: Integrated "Web Interface Guidelines" and "Remotion Best Practices" skills and synchronized installation statistics with real-time leaderboard data ([TASK095]).
- [x] **Update Skills Content**: Updated "Vercel React Best Practices" and "Find Skills" with authoritative documentation from skills.sh ([TASK094]).
- [x] **Skills Architecture Upgrade**: Refactored Skills section to "MDX as Database" architecture, enabling file-based content management and dynamic detail pages ([TASK093]).
- [x] **Opencode Agents Guide (EN)**: Created the authoritative English hub for agents at `/en/opencode-agents`, covering mental models, permissions, and tool control ([TASK091]).

- [x] **English Article Navigation**: Integrated 6+ guide articles into a unified sidebar and refactored the English article layout to include TOC and navigation ([TASK090]).
- [x] **Chinese Guide Sidebar Split**: Separated `lib/docs-config.ts` into guide and docs configurations, enabling distinct navigation experiences for guides and technical docs ([TASK084]).
- [x] **Chinese Guide Sidebar**: Added sidebar navigation to all Chinese guide articles for unified UX ([TASK083]).
- [x] **Site-wide Table Fix**: Resolved all `mdxRs` "Paragraph" and Hydration errors by minifying and styling all HTML tables project-wide ([TASK082]).
- [x] **LLM Providers (ZH)**: Overhauled the providers guide with comprehensive documentation for 75+ platforms and minified tables for stability ([TASK081]).
- [x] **Chinese Update Guide**: Implemented the standard official documentation version of the update guide in Chinese with bidirectional SEO links ([TASK080]).
- [x] **Update Guide**: Created authoritative English update guide at `/en/how-to-update-opencode` ([TASK079]).
- [x] **Rendering Stability**: Fixed MDX metadata leakage, code block styling, and table hydration errors across the project ([TASK079]).
- [x] **404 Recovery**: Implemented branded custom 404 page with documentation shortcuts ([TASK078]).
- [x] **Compliance Pages**: Added `/privacy`, `/about`, and `/contact` pages with footer integration and localization support ([TASK076]).
- [x] **Performance Optimization**: Converted project to strict Static Export mode and disabled Link prefetching to drastically reduce Vercel Edge Requests ([TASK077]).
- [x] **ManyOffer Integration**: Added contextual link at `/zh/opencode` to support user career growth ([TASK075]).
- [x] **Korean Entry Page**: Implemented super lightweight landing page at `/ko/opencode` for Korean SEO ([TASK074]).
- [x] **UI Support**: Extended Site Header, Footer, and Language Switcher to support the Korean locale ([TASK074]).
- [x] **Table Rendering Fix**: Corrected MDX table rendering across multiple pages (`/en/mcp`, `/en/opencode-vs-claude-code`, `/zh/docs/zen`, `/zh/docs/configure/formatters`) using HTML-based tables to resolve mdxRs compatibility issues.
- [x] **EN Sidebar Restructure**: Moved Oh My OpenCode content to a dedicated section for better hierarchy ([TASK067]).
- [x] **Oh My OpenCode Hub Refinement**: Updated the hub with SEO-optimized metadata and unified workflow-focused body content ([TASK065]).
- [x] **Oh My OpenCode Quick Start (EN)**: Refined practical engineering-focused guide ([TASK066]).
- [x] **Oh My OpenCode Quick Start (EN)**: Created a dedicated quick start guide for multi-agent workflows ([TASK064]).
- [x] **Oh My OpenCode Hub (EN)**: Created a new entrance hub for multi-agent workflows ([TASK063]).
- [x] **1.0 迁移指南更新**: 替换了中文 1.0 迁移指南，包含 OpenTUI 介绍及 Hydration 报错修复 ([TASK061])。
- [x] **Authoritative CLI Reference**: Replaced the English CLI page with a comprehensive authoritative reference covering advanced modes, agent management, and MCP integration ([TASK060]).
- [x] **English CLI Update**: Updated `/en/cli-commands` with a copy-paste friendly reference and standardized metadata ([TASK058]).
- [x] **中文开发与扩展文档更新**: 完成了 SDK、Server、Plugins 和 Ecosystem 的中文文档更新 ([TASK057])。
-   [x] **中文配置文档更新**: 完成了 ACP 支持、代理技能 (Agent Skills) 和自定义工具 (Custom Tools) 的中文指南更新 ([TASK056])。
-   [x] **Language Navigation**: Updated header language switcher to point Chinese users directly to the documentation center ([TASK055]).
-   [x] **Landing Page Polishing**: Removed unofficial badge from the hero section to simplify the messaging ([TASK054]).
-   [x] **Layout Architecture**: Restructured project using Route Groups `(docs)` and `(articles)` to assign appropriate layouts (Sidebar vs Centered) to different content types ([TASK053]).
-   [x] **Navigation Update**: Added global navigation links to Header to support Sidebar-less pages ([TASK053]).
-   [x] **权限 (Permissions) 文档**: 替换了中文权限控制指南，详细说明了 Allow/Deny/Ask 策略及细粒度规则 ([TASK048])。
-   [x] **LSP 服务器 (LSP Servers) 文档**: 替换了中文 LSP 集成指南，涵盖内置支持、配置禁用及自定义 LSP ([TASK049])。
-   [x] **格式化 (Formatters) 文档**: 替换了中文格式化工具配置指南，涵盖内置工具、禁用方法及自定义配置 ([TASK047])。
-   [x] **Build Stability**: Fixed critical SWC panic in `keybinds`, `themes` and `commands` docs caused by multibyte char boundaries.
-   [x] **Memory Bank Sync**: Reviewed and updated core documentation to reflect "OpenCode Zen" shift.
-   [x] **Critical Fix**: Resolved SWC panic caused by Chinese punctuation in metadata descriptions across all core Chinese documentation pages ([TASK044]).
-   [x] **模型 (Models) 文档**: 替换了中文模型配置指南，涵盖服务商、变体及全局设置 ([TASK042])。- [x] **主题 (Themes) 文档**: 替换了中文主题配置指南，涵盖内置主题、系统高亮及自定义 JSON 主题 ([TASK043])。
- [x] **快捷键 (Keybinds) 文档**: 替换了中文快捷键配置指南，涵盖引导键、配置示例及 Shift+Enter 设置 ([TASK044])。
- [x] **命令 (Commands) 文档**: 替换了中文自定义命令指南，涵盖创建方式、提示词语法及 Shell 注入 ([TASK045])。
-   [x] **智能体 (Agents) 文档**: 替换了中文 Agents 指南，涵盖主代理、子代理及 JSON/Markdown 配置 ([TASK041])。
-   [x] **OpenCode Zen 文档**: 将 `/zh/docs/zen` 更新为模型网关指南 ([TASK039])。
-   [x] **工具 (Tools) 文档**: 替换了中文工具指南，涵盖内置、自定义工具以及权限配置 ([TASK040])。
-   [x] **故障排除文档**: 替换了中文故障排除指南，包含日志、存储和常见问题解决方案 ([TASK038])。
-   [x] **Enterprise Documentation**: Replaced placeholder with full Chinese guide for evaluation, data handling, and deployment ([TASK037]).
-   [x] **Network Documentation**: Replaced placeholder with full Chinese guide for proxy, authentication, and certificates ([TASK036]).
-   [x] **Rules Documentation**: Replaced placeholder with full Chinese guide for custom instructions and `AGENTS.md` ([TASK035]).
-   [x] **IDE Documentation**: Replaced placeholder with full Chinese guide for VS Code and Cursor ([TASK034]).
-   [x] **CLI Documentation**: Replaced placeholder with full Chinese CLI manual using optimized HTML tables ([TASK033]).
-   [x] **MDX & UI Refinement**: Fixed table rendering and added TOC hierarchy ([TASK030]).
-   [x] **MCP Use Cases**: Added comprehensive real-world workflow guide ([TASK026]) to strengthen the English content loop.
-   [x] **SEO Landing Pages**: Deployed 6 high-value landing pages ([TASK027]) targeting specific errors (Claude Credential) and integrations (Playwright, MCP), strictly adhering to `/en/` and `/zh/` routing.
-   [x] **TUI Documentation**: Replaced placeholder with comprehensive Chinese guide ([TASK028]).
-   [x] **MCP Servers Documentation**: Replaced placeholder with detailed Chinese manual ([TASK029]).
-   [x] **Introduction Update**: Simplified and overhauled the Chinese introduction guide with full tiered links ([TASK032]).
-   [x] **Fully translate the core documentation pages**: (Intro, CLI, IDE, Zen, Network, Enterprise, Rules, Tools, Troubleshooting, Models, TUI, MCP are done).
-   [x] Translate remaining documentation pages (Providers, etc.).
-   [x] **Update Guide (EN)**: Created a standard official-style documentation article at `/en/how-to-update-opencode` ([TASK079]).
-   [ ] Add visual screenshots to documentation.
-   [ ] Implement "Edit this page" links.


## 最新进展 (2026-10-24)
- **v2 文档同步流水线落地 (Phase 0+1) ([TASK103])**:
    - **基础设施**: 新增 `scripts/docs-sync/` 流水线（fetch→diff→transform→translate→generate→validate→report）与 4 个 MDX 组件（Callout/Card/CardGroup/CodeTabs）；`npm run docs:sync` 一键同步，术语表 + 内容哈希缓存 + 断点续跑。
    - **SEO 保护**: 原地更新保留 `export const metadata`（canonical/hreflang）；无 metadata 的页拒绝覆盖（已修复 `/zh/docs/config`）；零删页零重定向。
    - **试点 5 页**: `/zh/docs/{intro,config,cli,troubleshooting}` 与 `/zh/docs/configure/agents` 已同步上游 v2 内容，build 全绿，幂等验证通过；已提交 `7b755e4`（dev 分支，未 push）。
    - **关键技术发现**: mdxjs-rs 会在 JSX 属性对象字面量内部逗号处截断表达式，CodeTabs 改用 JSON 字符串属性方案规避。
    - **待办**: 等试点 diff 人工审阅 → Phase 2（16 update + 14 legacy 提示）→ Phase 3（45 新增页 + 侧边栏 Console 组）→ Phase 4（SEO 回归）→ 可选 Phase 5（GitHub Actions 周检）。详见 TASK103。

## 最新进展 (2026-01-27)
- **路线图同步 (Route Map Synchronization)**: 完成了 `ROUTE_MAP.md` 的全面审计与更新 ([TASK087])。
    - **新页面集成**: 添加了 `/about`、`/contact`、`/privacy` 等合规页面以及 `/ko/opencode` 韩国语页面。
    - **SEO 路由映射**: 明确了中文科普文章与 `/zh/docs/` 权威页面的 Canonical 映射。
    - **导航一致性**: 重新核对了所有引流文章的路径，确保与 `lib/docs-config.ts` 中的指南配置保持同步。

## 最新进展 (2026-01-25)
- **中文指南侧边栏 (Chinese Guide Sidebar)**: 完成了中文指南文章区域的侧边栏集成 ([TASK083])。
    - **统一体验**: 所有 `/zh/*` 下的文章现在都使用与 `/zh/docs/*` 相同的侧边栏和 TOC 布局。
    - **导航增强**: 在侧边栏顶部新增"指南 (Guide)"章节，包含 13 个核心文章链接，方便用户浏览所有中文内容。
    - **布局一致性**: 重构了文章布局，采用三列网格（侧边栏 + 内容 + TOC），提升了导航体验。

## 最新进展 (2026-01-27)
- **英文 MCP 枢纽优化 ([TASK088])**: 使用权威、SEO 优化的内容更新了 `/en/mcp`，将其确立为 MCP 文档的核心枢纽。
- **MCP 工具与集成页面更新 ([TASK089])**: 更新了 `/en/opencode-mcp` 文章页，聚焦于具体工具（Playwright, GitHub, Figma, n8n）的应用，并通过 `canonical` 链接将 SEO 权重集中到技术枢纽 `/en/mcp`。

## 最新进展 (2026-01-26)
- **智能体技能文档更新**: 将“代理技能”替换为“智能体技能”，并更新为官方翻译内容，同时更新了侧边栏名称以保持一致 ([TASK086])。
- **中文集成文档更新**: 更新了会话共享 (Share)、GitHub 集成和 GitLab 集成的中文文档，包含最新的配置说明和使用示例 ([TASK085])。

## 最新进展 (2026-01-21)
- **内容更新 (New Content)**: 增加了英文版更新指南 `/en/how-to-update-opencode`。
- **成本优化 (Cost Optimization)**: 完成了架构级的静态化改造 ([TASK077])。
    -   **Zero Compute**: 启用 `output: 'export'`，彻底移除服务端运行时，将 Function Invocations 降为 0。
    -   **请求降噪**: 禁用了 Sidebar 和 Header 的 Link 预加载 (`prefetch={false}`)，解决了单个页面加载触发数十个 Edge Requests 的问题。
    -   **缓存策略**: 引入 `vercel.json` 配置，对构建产物实施 1 年缓存，对 HTML 实施 1 小时缓存。
- **合规性 (Compliance)**: 完成了隐私政策、关于我们等法律页面的上线 ([TASK076])。

## 最新进展 (2026-01-19)
- **多语言扩展**: 完成了韩国市场专用的超轻量落地页 `/ko/opencode`，并适配了 UI 的韩文界面 ([TASK074])。
- **MDX 修复**: 解决了由于 `mdxRs` 编译器限制导致的 Markdown 表格渲染异常，通过 HTML 兼容方案修复了中英文核心页面的表格样式。
- **新增内容 (En)**: 完成 `/en/oh-my-opencode` 社区工作流枢纽页面，针对 "Oh My OpenCode" 及 "OpenCode Workflows" 进行 SEO 优化 ([TASK063])。

## 课程文章化 (2026-11-18)
- **形态**: 四门课由「视频课」改为图文课。课时正文按 `content/courses/<locale>/<course>/<slug>.mdx` 存放，frontmatter（title/summary/module/lesson/duration/free/objectives）通过 module/lesson 对位 JSON 大纲。
- **阅读页**: `/zh/courses/<course>/<lesson>`：侧边课表（含「制作中」占位）、本节目标、MDX 正文（remark-gfm 表格 + rehype-slug 锚点）、上下篇导航、canonical/hreflang。
- **内容**: 课程 1「AI 编程实战」27 节 + 课程 2「独立开发者出海」33 节 + 课程 3「跨境电商独立站」28/36 节，合计 88/123 节中文正文。课程 3 剩余 8 节（广告投放、数据复购）与课程 4 的 27 节待写，英文版待翻译。
- **检索与结构化数据**: 课时页收录进 `public/search.json`（按 content/courses 扫描），并输出 `TechArticle` JSON-LD（isPartOf 指回 Course）；代码块接 rehype-pretty-code，与文档站同主题。
- **一致性**: 商品话术/FAQ/统计数字去掉「视频」；节数校正为 27/33/36/27=123（bundle 110→123）；课程 1 `durationHours` 12→4（按 27×8.5 分钟阅读）。
- **验证**: `npm run build` 通过；`tsc --noEmit` 通过；`courses:validate` 0 错误、66 个课时页（27+33+28，构建数会随正文增加）。
- **构建稳定性**: `next/font/google` 在弱网下 3 秒超时会让 build/dev 直接失败，改为 `next/font/local` 自托管 Inter（47KB woff2），构建不再依赖外网。
- **待决策**: 静态站无法鉴权 —— 正文目前对所有人可见，付费墙需要在「开放/Worker 签名链接/会员中心」之间选一条。

## 课程文章版内容 (2026-11-18)
- **进度**: 88/123 节（课程 1 完成 27、课程 2 完成 33、课程 3 28/36、课程 4 0/27）；26 万字符、158 个代码块；构建 247 页、88 个课时页。
- **已推送**: `04f6f5d` 课时基建 · `159de3d` 88 节正文 + 话术去视频化 · `8482b59` P2 访问控制方案与任务卡。
- **看板**: 内容进度与剩余课时的拆分记录在 `docs/courses/06-todo.md` §0.1 与 `memory-bank/tasks/TASK106-course-articles.md`。

## 课程板块 P1 交付自动化 (2026-11-18)
- **交付 Worker**: 新增 `workers/course-delivery`（Cloudflare Worker，零运行时依赖）：`POST /stripe/webhook` 校验 `Stripe-Signature`（WebCrypto HMAC-SHA256 + 5 分钟容差 + 定长比较）→ `processed_events` 按 `event.id` 幂等 → `orders` 落库（`session_id` 唯一）→ Resend 发中英双语开通邮件；`charge.refunded` 标记退款并回收权益，`charge.dispute.created` 标记拒付并告警举证。
- **失败策略**: 邮件失败不阻断 Webhook（订单已落库，改用 `POST /admin/resend` 补发）；无邮箱/识别不出课程/交付链接未配 → `needs_manual_delivery` + 运营告警，不给买家发半成品邮件；只有 D1 写失败才返回 500 让 Stripe 重试（并撤销幂等标记）。
- **存储**: D1 `orders` / `processed_events`，字段对齐 `docs/courses/02` 的 `orders` 定义，含 `email_status` / `delivery_note` 便于排查漏发。
- **数据自检**: 新增 `scripts/courses/validate-courses.mjs` 并接入 `npm run build`（`courses:validate`）：校验结构/枚举/价格/双语完整度/`stripe-links.json` 指向有效性，并从 `components/courses/course-visuals.tsx` 反查 icon 与 accent 白名单，把静默降级变成构建期警告。
- **测试**: `npm run workers:test` 40/40 通过（验签、幂等、退款、拒付、邮件模板、路由、补发）；`npm run build` 与 `tsc --noEmit` 全绿。
- **待办**: 校验脚本首次运行报 12 条警告（英文化 SEO 描述 5 条超 160 字符 + 尚未配置正式支付链接），已登记 `docs/courses/06-todo.md`。

## 课程板块 (2026-11-18)
- **功能**: 新增课程售卖板块（中英双语）：`/zh/courses`、`/en/courses` 目录页，`[slug]` 详情页（4 门课 + 全站通），`thank-you` 付款回执页。课程内容由 `content/courses/*.json` 驱动，新增课程无需改代码。
- **支付**: 因站点为静态导出，采用 Stripe Payment Link；`scripts/courses/stripe-payment-links.mjs` 幂等创建 Product/Price/Link 并写入 `stripe-links.json`；购买按钮带 `client_reference_id` 与 utm 跟踪；GA4 `begin_checkout` 埋点。未配置链接时自动降级为等待名单/联系。
- **合规**: 新增 `/refund-policy` 与 `/zh/refund-policy`；隐私政策补充课程购买与等待名单的数据说明。
- **设计文档**: `docs/courses/`（市场分析、功能设计、课程内容、Stripe 方案、分期路线图、`06-todo` 进度看板）。
- **验证**: `next build` 静态导出通过（158 页）；`tsc --noEmit` 通过；sitemap 收录 30 条课程 URL 且排除感谢页；`Course` JSON-LD、canonical、hreflang 输出正确；用临时 Stripe 链接构建验证过 `client_reference_id`/utm 参数与未配置时的降级行为。
- **待办**: P1（正式收款 + 邮件交付）见 `docs/courses/06-todo.md` 与 `TASK105`；阻塞项为 Stripe 密钥、等待名单端点、视频/模板/社群交付物。
## 内容仓库边界决策 (2026-11-22)
- **问题**: 仓库公开，付费墙只在构建期生效 → 123 节课时正文（含 115 节付费，984 KB）的源码已在 `dev` 分支公开可读。课程**尚未上线**（`main` 无 `content/courses/`、线上课程 URL 全 404、sitemap 0 条课程 URL），但源码已泄露。
- **决策（方案 B，方向已定未实施）**: 「元数据公开、正文私有」——公开仓保留大纲 + 课时清单 manifest + 8 节免费正文；115 节正文与 `workers/` 搬私有仓。否决 A（整体转私有，会牺牲开源文档站且要改托管）与 C（子模块=假单仓、对象存储丢 git 工作流、加密入库把内容变成不可读密文）。
- **四条硬约束**: 课表目前由 MDX 文件驱动（`lib/course-lessons.ts` 的 `readdirSync`），必须先立 manifest 为真相源，否则删正文会让课表退化成 8 节；拆仓 ≠ 删历史（正文在 `159de3d`、`48b66bc`，需重写历史）；公开仓必须保持可构建；先拆分后发布。
- **文档**: [`docs/courses/09-content-repo-boundary.md`](../docs/courses/09-content-repo-boundary.md)（只定方向与边界，实施步骤另开任务卡）。
- **配套**: 新增 `.githooks/pre-commit` 密钥护栏（拦截 `.dev.vars`/`.env`/私钥文件名 + `sk_live_`/`whsec_`/`GOCSPX-` 等形态，命中值打码，`GIT_ALLOW_SECRETS=yes` 可放行）。

## 本地联调打通 Google 登录 (2026-11-22)
- **凭据**: Google Cloud 新建项目 `opencodeguide-learn`，OAuth 客户端类型「网页应用」，重定向 URI 为 `https://learn.opencodeguide.com/auth/google/callback` 与 `http://localhost:3022/auth/google/callback`；scope 仅 `openid email profile`（non-sensitive，无需审核）。Client ID/Secret 已验证有效（假 code 请求返回 `invalid_grant` 而非 `invalid_client`）。
- **本地跑不通的真因**: `wrangler dev` 的本地模式由 workerd 执行代码，**workerd 的出站 fetch 不读系统代理**，也没有任何 proxy 选项（`workerd serve --help` 无相关 flag）。wrangler 那句 "Proxy environment variables detected" 只作用于它自己的 Node fetch（`undici.setGlobalDispatcher(EnvHttpProxyAgent)`）。表现为回调卡 75 秒后 `[auth] internal error`。
- **解法（路线 B）**: 新增 `scripts/dev/member-dev.mjs` + `npm run dev:proxy`：用 Miniflare 起 Worker，`outboundService` 钩子在 **Node 宿主进程**里重发出站请求，配合 Node 24 的 `NODE_USE_ENV_PROXY=1` 走 `HTTPS_PROXY`。三个坑：Miniflare 需显式 `modulesRules: ESModule`（否则 `.js` 按 CommonJS 解析报 `ERR_MODULE_PARSE`）；workerd 的 `Request` 不能直接喂 Node `fetch`（`ERR_INVALID_URL`，须拆 url+init）；`NODE_USE_ENV_PROXY` 必须在启动前设置。
- **验证**: 假 code 回调从 75 秒超时变为 0.74 秒返回 Google 的 `Malformed auth code.`；浏览器实测 `http://localhost:3022/login` → Google 选账号 → 落到 `/account` 显示登录邮箱与「这个邮箱还没有已购课程」，登录闭环在本地跑通。
- **依赖**: `miniflare@4.20260730.0` 进 devDependencies（与 wrangler 内置的 workerd 版本对齐）。
- **未做**: Stripe live key、Resend 域名验证（DNS 里仍无 `resend._domainkey`，MX 是 Namecheap 转发）、`wrangler login` 超时未完成，因此**尚未部署**。

## 成员站门禁接线 P2.3 (2026-11-20)
- **构建**: 新增 `npm run build:members`（`COURSE_ACCESS=members` + `NEXT_DIST_DIR=out-members`，`next.config.mjs` 支持自定义导出目录），产出 1778 文件 / 78 MB;脚本备份并还原 `public/search.json`，避免含付费正文的索引留在仓库。
- **部署配置**: `wrangler.toml` 增加 `[assets]`：`directory = "../../out-members"`、`binding = "ASSETS"`、`run_worker_first = true`、`html_handling = "auto-trailing-slash"`。
- **门禁**: `src/index.js` 在 `/account` 之后接 `handleMemberAsset` —— 先 `authorizeRequest`、放行才 `env.ASSETS.fetch()`;未登录 HTML → 302 `/login?next=`，非 HTML → 401，无权益 → 403;放行响应强制 `x-robots-tag: noindex` + `cache-control: no-store`。
- **修掉一个门禁绕过**: `courseSlugFromPath` 原来只认 `/courses/<slug>`，而导出产物在 `/zh/courses/`、`/en/courses/` 下——任何登录用户都能用带语言前缀的 URL 读任意付费正文。已支持语言前缀并补路径用例。
- **测试**: 101 → 110（新增 `test/assets.test.js` 9 条：未授权不回源、302/401/403 分流、headers 覆盖、无 ASSETS 时 404、全站通跨课、`/_next` 公开）。
- **验证**: 公开构建 1773 文件 / 公开 8 节 / 锁定 115 节 / 230 探针 0 命中;`wrangler dev` 实测未登录 302、有权益 200（144 KB 正文）、未购买 403、`search.json` 401、`/_next` 200。
- **环境**: 远端 D1 已应用 `0003_drop_magic_link.sql`;SSL 模式确认为 `Full (strict)`。
- **未完成**: `wrangler deploy`（等 Google/Stripe/Resend 凭据）、公开站购买按钮切到 `learn./buy/...`、P2.4 水印与日志看板。

## 课程正文完成 (2026-11-19)
- 四门课 **123/123 节**：AI 编程实战 27、独立开发者出海 33、跨境电商独立站 36（补齐模块 7–8）、出海网站 SEO 27（全新 6 模块）。
- 规模：27.4 万字符、204 个代码块、约 17.4h 阅读；`courses:validate` 0 错误。
- 构建：281 页、123 个课时页；付费墙断言扫描 1773 个文件 / 230 条探针，0 泄露（公开 8 / 锁定 115）。
- 修复：闸门探针在「行内代码/加粗切碎段落」时抽不出候选，改为取最长纯文本片段。
- 待办：英文正文（0 节）。

## 登录改 Google + 先登录再买 (2026-11-19)
- **登录**: Google OAuth（授权码 + PKCE + state cookie），只接受 `email_verified`；会话仍是 HS256 JWT（30 天）。magic link 代码与 `magic_links`/`auth_attempts` 一并删除（迁移 0003）。
- **购买**: `/buy/<slug>/<plan>` 要求登录 → `POST /checkout` 用登录邮箱创建/复用 Stripe Customer（`customer` 锁死邮箱）→ Checkout Session，metadata 带 email/course_slug/plan_id。
- **授权**: handler 优先用 `metadata.email` 写权益，付款人与阅读身份不再依赖「买家在 Stripe 页面填的邮箱」。
- **配置**: `GOOGLE_CLIENT_ID/SECRET`、`STRIPE_SECRET_KEY`、`COURSE_CATALOG`（`scripts/courses/sync-worker-catalog.mjs --apply`）。
- **测试**: 101/101（OAuth state/PKCE、未验证邮箱、buy 需登录、checkout 锁邮箱都有覆盖）。
- **未完成**: 凭证未配、worker 未重新部署、公开站购买按钮仍指向 Payment Link。

## 课程登录与门禁 P2.2 (2026-11-19)
- **登录**: 邮箱 magic link。令牌 32 字节、只存 sha256、15 分钟、单次使用（`update ... where used_at is null` 抢占防并发）；限流邮箱 60s / IP 每小时 5 封，计数 24 小时自动清理。
- **会话**: HS256 JWT（`sub/iat/exp/jti`），30 天，`HttpOnly; Secure; SameSite=Lax`；缺 `SESSION_SECRET` 一律 fail closed。
- **端点**: `/login`、`POST /auth/magic`（防枚举：非法/未购买邮箱响应一致）、`GET /auth/verify`、`/auth/logout`、`/account`。
- **门禁**: `src/gate.js` 默认拒绝；公开白名单仅 `/login`、`/auth/*`、`/health`、`/_next/*`；`/courses/**` 按 slug 查权益（全站通放行），`/search.json` 也受保护。
- **测试**: 100/100（新增 38：令牌/限流/JWT/cookie/门禁/端到端链路）。
- **未做**: P2.3 静态资源接线 + 子域 + 成员构建；P2.4 水印与日志看板。

## 课程权益层 P2.1 (2026-11-19)
- **模型**: `orders`（钱）+ `entitlements`（谁现在能读哪门课，`revoked_at` 可撤销）。迁移 `workers/course-delivery/migrations/0002_entitlements.sql`。
- **写入**: 付款成功先写权益再发信；单课 1 条，全站通展开 4 门课 + `all-access`；重复购买复活同一条并指向新订单。
- **撤销**: 全额退款按 `order_id` 批量撤销；部分退款保留；拒付默认只标记（`REVOKE_ON_DISPUTE=1` 可改为立即回收）。
- **回填**: `node scripts/courses/backfill-entitlements.mjs` 生成幂等 SQL（`--execute --remote` 执行），单课/全站通/部分退款/退款排除均在真实 SQLite 上验证。
- **测试**: `npm run workers:test` 62/62（新增 22 个：权益单元 13 + 事件级 9）。
- **未做**: P2.2 门禁与登录、P2.3 成员站部署。

## 课程付费墙 P2.0 (2026-11-19)
- **目标**: 静态站无法鉴权，先在构建期把付费正文从公开产物里摘掉。
- **规则**: 每门课前 2 节免费（`content/courses/access.json` 的 `freeLessonLimit`），其余渲染锁定页；`frontmatter` 的 `free: true` 可额外开放单节。
- **实现**: `lib/course-access.ts`（模式/额度）+ `lib/course-lessons.ts`（`isLessonLocked`）+ `components/courses/locked-lesson.tsx` + 课时页分流（不把正文 props 传给视图）；`sitemap` 只收录免费节、`build-search.mjs` 不再索引付费正文。
- **闸门**: `scripts/courses/assert-no-gated-content.mjs` 扫描 `out/`：付费正文探针 0 命中 + 每个锁定页必须有 `data-locked-lesson` + 免费页正文对照；已接入 `npm run build` 与 GitHub Actions（`COURSE_ACCESS: public`）。
- **实测**: 88 节 → 公开 6 / 锁定 82；1563 个产物文件、162 条探针，0 泄露；注入正文的负向测试会 exit 1。
- **未做**: P2.1 权益表、P2.2 magic link、P2.3 成员站。因此**暂不可开启真实收款**。

## 课程内容拆仓与 manifest (2026-11-23)
- **问题**: 付费墙只在构建期生效，而仓库公开——123 节正文（115 节付费）已随 `dev` 分支可读；同时课表由 MDX 文件驱动，直接删正文会让商品页退化成 8 节。
- **止血**: 私有仓 `iamsail/opencodeCourse` 收下完整旧历史；公开仓 `main` + `dev` **一起** `filter-repo` 改写后强推（只改 `dev` 会让两条分支对同一次提交产生两个哈希：`main` 上有 64 个带 `gpgsig` 的网页合并提交）；`dev` 现只保留 8 节免费正文。
- **本地**: 正文改由 `../opencodeCourse` 提供，公开仓工作区真的只剩 8 节；`.git/info/exclude` 那套临时规则已删除。
- **manifest**: 新增 `content/courses/manifest.json`（123 节纯元数据，46KB）+ `scripts/courses/build-manifest.mjs`；课表、课时 URL、sitemap、搜索索引、付费清单全部改读 manifest，正文是否存在只看磁盘（刻意不设 `hasBody` 字段）。
- **闸门重写**: `assert-no-gated-content.mjs` 的付费清单改由 manifest 提供，并新增「公开仓不允许出现付费正文文件」检查；**修掉空转**——以前正文搬走后 `gated=0` 仍打印 ✔。
- **护栏**: 双根解析（public 只读公开根；members 私有根优先）、`export-free-lessons` 把 8 节试听变派生产物并维护 `.gitignore` 区块、pre-commit 拦付费正文、members 构建缺正文 fail fast。
- **实测**: 只有 8 节正文时 `npm run build` 通过、课时页 123、锁定页 115、sitemap 课时 URL 8、assert 通过；members 构建 123 页 / 0 锁定页；`tsc --noEmit` 0 错误。
- **残留**: 强推后旧对象仍可按 SHA 访问（实测 `/commit/48b66bc` 仍 200），GitHub 不主动回收；决定不删库（收益只覆盖「手里已有 SHA 的人」，代价是 62 个 PR 与 Actions secret）。

## 发布链路一条命令 (2026-11-23)
- **问题**: 改一节课要跨 2 个仓库、4 个产物、6 个手工步骤。
- **实现**: `npm run publish`（另有 `:content` / `:metadata` / `:check`，开关 `--dry-run` / `--skip-deploy` / `--push`）；只 stage `manifest.json`、`content/courses/zh`、`.gitignore` 三处，默认**不 push**；部署前 `assert-members-pages` 逐节自检（123 页有正文、无锁定页、无死链）。
- **顺带修**: `build-manifest.mjs` 之前只扫公开根，会生成只有 8 节的 manifest（已改双根，私有优先）；sitemap 148 条 URL 全部缺尾斜杠（已修 + 构建期 `assert-sitemap`）；115 个薄锁定页改 `noindex, follow`（`LOCKED_PAGE_INDEX=true` 可回退）。
- **基线**: 公开站构建 12.3s（冷）/ 25.6s（热）、成员站 19.0s、自检 0.2s、`publish --content --skip-deploy` 19.3s；**部署上传量未测**（本机无 wrangler、Cloudflare 未登录）。
- **待定**: 是否改成「内容运行时下发」取决于部署实测——单节部署 ≤90s 且 ≤10MB 就保持静态方案（规则见 `docs/courses/10-publish-baseline.md`）。
- **任务**: [TASK108](tasks/TASK108-course-content-split.md)（拆仓）、[TASK109](tasks/TASK109-publish-pipeline.md)（发布链路）。

## 成员站上线与页面样式 (2026-11-23)
- **公开站购买入口**: 默认 `NEXT_PUBLIC_CHECKOUT_MODE=learn`，按钮从 Stripe Payment Link 改指 `https://learn.opencodeguide.com/buy/<slug>/<plan>`（带 `lang` 与 4 个 utm 参数），强制先 Google 登录、由服务端建 Checkout Session 并锁定登录邮箱；`stripe` 模式保留为应急回退（实测 env 覆盖与降级到「联系我们」都正常）。构建产物里 `buy.stripe.com` 0 处。
- **成员站页面样式 (P2.4)**: 新增 `workers/course-delivery/src/ui.js` 设计系统（zinc 色板、卡片/按钮/明细/课程网格、头部/页脚、主题脚本、`shell()`）；`src/pages.js` 重写登录/购买/账户/无权访问/不可用/错误 6 类页面；错误页按 `reason`（login / unknown-course / payment）分文案，修掉「买课 404 显示登录失败」；购买页渐变头取 catalog 的 `accent`（`sync-worker-catalog.mjs` 新增，白名单 + 回退）；`/` 302 到 `/account`。
- **主题一致**: `<html class="dark">` + `localStorage.theme`，键名与公开站 next-themes 相同；首屏内联脚本先定主题，无 JS 时退回 `prefers-color-scheme`；实测切换后刷新保持。
- **上线**: `wrangler login` → 注入 `GOOGLE_CLIENT_ID/SECRET`、`STRIPE_SECRET_KEY`（测试）、`COURSE_CATALOG` → 成员站全量部署（1153 资源 / 131.7 秒，Version `78723e57`）→ 新样式再部署（`3692beb9`，7.6 秒）。Stripe 测试 webhook `we_1UexDHHaZKTeRe8aCsJpiRKe` 指向 `/stripe/webhook`，新 `whsec_` 已注入，正确签名放行 / 错误签名 400。
- **验证**: `workers:test` 121/121（新增 11 个页面用例）；`/health` 的 db/webhookSecret/sessionSecret/googleOauth/stripeKey/catalog/assets 全 true（`resend` 仍 false）；未登录课程页 302、`search.json` 401、`noindex`+`no-store` 头保持；触发真实测试事件后订单与权益正确落库（已清理）。
- **未完成**: Resend 未配（开信发不出，订单/权益仍写入）；Stripe 仍测试模式；公开站未发版（`dev` 领先 `main` 21 个提交，线上课程页 404）；英文正文 0/123。
- **任务**: [TASK110](tasks/TASK110-member-ui-and-release.md)。

## 结账改动态报价 (2026-11-24)
- **问题**: 换 live 前要先建 9 个 live Product/Price/Payment Link，还要把生成的 `stripe-products.json` / `stripe-links.json` 提交；漏 `--force`、catalog 与密钥不同步都会变成 `No such price` / 静默 skip 这类「看着成功其实没生效」的故障。
- **参照**: `pindou/pindouonline` 的 `shop-checkout` —— 没有 `stripePriceId` 时用 `line_items[0][price_data]` 现场报价；只有订阅那档才预建 Price（subscription 模式必须有）。
- **实现**: `createCheckoutSession({ amount, currency, title })` → `price_data`（`unit_amount` / `currency` / `product_data.name`）；金额来自 `COURSE_CATALOG`（源头 `content/courses/*.json` 的 `priceUSD`）。金额 ≤ 0 时 503 且不打 Stripe。
- **顺带修**: `catalog.js` 去掉 `priceId`，补回被 `normalize()` 丢掉的 `titleEn` / `accent`（购买页渐变头此前一直没生效）；新增 `displayTitle()` 生成发票/收据行项目名（`OpenCode Guide · 课程 · 计划`，标题已含计划名时不重复）。
- **税务**: 新增 `STRIPE_AUTOMATIC_TAX` / `STRIPE_TAX_BEHAVIOR` 开关（默认关）；开启时同时下发 `automatic_tax` 与 `price_data.tax_behavior`。动态报价让「以后开 Stripe Tax」不再需要重建商品。
- **脚本**: `sync-worker-catalog.mjs` 不再读 `stripe-products.json`，改为校验金额 > 0；`validate-courses.mjs` 仅在 `NEXT_PUBLIC_CHECKOUT_MODE=stripe` 时校验 legacy 支付链接（构建警告 12 → 8）。`stripe-payment-links.mjs` 降级为 legacy 回退。
- **取舍**: Stripe 后台失去 Product 维度报表（按 `metadata.course_slug` 筛或看 D1 `orders`）；Payment Link 直链回退失效（公开站保持 learn 模式）。换来：换 live 只注入 2 个 secret + 部署，且 Worker 那把受限密钥只需 `Customers` + `Checkout Sessions` 写权限。
- **验证**: `workers:test` 143 → 147（动态价格字段、英文行项目名、金额为 0、自动计税开关）；`npm run build` 通过（148 URL，付费墙 0 泄露）；`courses:validate` 0 错误 8 警告。
- **待做**: `wrangler deploy`（线上仍是 11-23 的构建，缺 TASK111 对账与 `stripeMode`）→ 建 live webhook（5 个事件）→ 注入 `STRIPE_SECRET_KEY`(`sk_live_`/`rk_live_`) 与 `STRIPE_WEBHOOK_SECRET` → `/health` 验 `stripeMode=live` → 真卡小额 + 退款验收。

## Known Issues
-   Screenshots are still text-based placeholders.
-   Chinese documentation depth still needs to be expanded for Providers/Configuration sections.
-   **[TASK103] `/zh/docs/cli` 暂时变薄**: v2 将 CLI 命令参考移至 `cli/commands`（Phase 3 才建页 `/zh/docs/cli/commands`），当前该页仅为新版 CLI 简介；Phase 3.2 建议优先补 `cli/commands`。
-   **[TASK103] `/zh/docs/configure/agent-skills` 存量多行 HTML table**: validate 报 MDX-RS 风险；该页在 Phase 2 update 名单内，同步时会被替换消解。（2026-10-26 已随 Phase 2 同步消解）
-   **[TASK103] GitHub API 匿名限流**: 60 次/小时；流水线已回退缓存树 + raw 下载兜底，设置 `GITHUB_TOKEN` 可恢复完整树枚举。
-   ~~[TASK103] SWC 多字节 panic~~: 已解决——Next 16.1.x 回归（官方 issue #87713），2026-10-26 升级 next 16.1.1→16.4.3 后 build 全绿。
