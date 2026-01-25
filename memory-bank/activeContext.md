# Active Context

## Current Focus
- **Unified Navigation Experience**: 扩展侧边栏功能到中文指南文章区域，确保所有中文内容（文章和文档）使用统一的导航体验。
- Maintaining site stability while expanding the Chinese documentation suite.
- Ensuring all MDX files are free from hydration errors caused by multi-line HTML tables.

## Recent Changes
- **中文指南侧边栏 ([TASK083])**:
    - **统一布局**: 为 `/zh/*` 下的所有文章（非 `/zh/docs/*` 的文档）添加了侧边栏和 TOC，与文档页面保持一致的导航体验。
    - **配置更新**: 在 `docsConfigZh` 顶部新增"指南 (Guide)"章节，包含 13 个文章链接（OpenCode 介绍、安装指南、对比文章、MCP 介绍、Ollama 部署、最佳实践等）。
    - **布局重构**: 重构 `app/(zh)/zh/(articles)/layout.tsx`，采用与 `app/(zh)/zh/docs/layout.tsx` 相同的三列网格布局（侧边栏 + 内容 + TOC）。
    - **组件集成**: 引入 `DocsSidebar`、`DocsMobileNav` 和 `TableOfContents` 组件到文章布局中。
- **MDX Table Hydration Fix ([TASK082])** (之前):
    - **Site-wide Refactor**: Minified 100+ raw HTML tables into single-line strings to satisfy the `mdxRs` compiler and prevent React hydration errors (error #418/425).
    - **Key Pages Fixed**: `server/page.mdx` (18 tables), `sdk/page.mdx`, `providers/page.mdx`, `opencode-vs-claude-code`, and more.
    - **UX Enhancement**: Wrapped minified tables in `<div className="my-6 w-full overflow-y-auto">` for better mobile responsiveness.

[... 其余内容保持不变 ...]

## Active Decisions
-   **统一侧边栏策略**: 决定将所有中文内容（文章和文档）统一使用相同的侧边栏配置（`docsConfigZh`），提升用户导航体验和内容发现能力。指南章节放置在侧边栏顶部，作为入口级内容。
-   **Canonical vs Redirect**: We chose to keep the educational articles at their original URLs but use `canonical` instead of `301 redirects`. This allows us to keep the viral/SEO-friendly "entry points" while concentrating the actual ranking power on the documentation.
-   **Hreflang Logic**: Even if the content is not a word-for-word translation, we link pages with high semantic overlap (e.g., Use Cases ↔ Usage) to help Google understand the site structure.
-   **Documentation Sovereignty**: The `/zh/docs/` path is now explicitly confirmed as the "Single Source of Truth" for all technical details.

## Next Steps
1.  **Visual Assets ([TASK023])**: 开始为"安装"和"命令行"章节制作并集成实际截图。
2.  **Edit Links ([TASK024])**: 在所有文档页面底部添加"在 GitHub 上编辑此页"链接。
3.  **Deployment Verification**: 监控 Vercel 构建状态，确保所有布局修改正常工作。
