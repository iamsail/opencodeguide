# [TASK043] - 更新中文主题 (Themes) 文档

**Status:** In Progress  
**Added:** 2026-01-14  
**Updated:** 2026-01-14

## Original Request
用户提供了一份关于 OpenCode 主题 (Themes) 的翻译内容，要求替换 `/zh/docs/configure/themes` 下的占位符内容。

## Thought Process
1.  **位置确认**: 目标文件是 `app/(zh)/zh/docs/configure/themes/page.mdx`。
2.  **内容整合**: 
    *   保留用户提供的翻译内容。
    *   添加必要的 SEO Metadata（标题、描述、规范链接）。
    *   为了兼容 Next.js 的编译（避免 Turbopack 下的 GFM 表格序列化问题），将内置主题列表转换为带有 Tailwind 样式的 HTML `<table>`。
3.  **导航对齐**: 确认侧边栏和相关文档（如 `/zh/docs/intro`）中对主题页面的引用。

## Implementation Plan
- [ ] 创建任务文件并更新索引 (DONE)
- [ ] 编写并替换 `app/(zh)/zh/docs/configure/themes/page.mdx`
    - [ ] 添加 Metadata
    - [ ] 转换 “内置主题” 为 HTML Table
    - [ ] 格式化配置文件示例
- [ ] 验证 MDX 语法，确保没有会导致 SWC panic 的特殊标点
- [ ] 更新 Memory Bank

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1.1 | 创建任务文件并更新索引 | Complete | 2026-01-14 | |
| 1.2 | 更新 Themes MDX 内容 | Complete | 2026-01-14 | 添加了 Metadata 和 HTML 表格 |
| 1.3 | 更新 Memory Bank | Complete | 2026-01-14 | |

## Progress Log
### 2026-01-14
- 启动任务 TASK043。
- 确认目标路径 `app/(zh)/zh/docs/configure/themes/page.mdx`。
- 完成了 Themes 文档的翻译替换。
- 将内置主题表格转换为 HTML 格式以确保 Turbopack 兼容性。
- 更新了 _index.md, activeContext.md 和 progress.md。
