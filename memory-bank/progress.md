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

## Known Issues
-   Screenshots are still text-based placeholders.
-   Chinese documentation depth still needs to be expanded for Providers/Configuration sections.
