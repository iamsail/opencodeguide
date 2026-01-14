# [TASK049] - 更新中文 LSP 服务器 (LSP Servers) 文档

**Status:** Completed  
**Added:** 2026-01-14  
**Updated:** 2026-01-14

## Original Request
Update /zh/docs/configure/lsp-servers with full content. Replace content, add metadata, avoid Chinese periods in metadata/bold headers.

## Thought Process
该任务涉及集成 LSP 服务器配置的中文指南。
- **SEO 优化**: 添加 metadata 块，包括 `title`, `description` 和 `canonical` 链接。
- **构建稳定性**: 遵循 TASK046 经验，严格移除元数据 `description` 和正文加粗标题末尾的中文句号，这些字符在特定偏移量下会导致 SWC 编译器崩掉。
- **技术细节**: 确保 JSON 配置示例（如 `opencode.json` 中的 `lsp_servers` 字段）能够正确呈现。

## Implementation Plan
1. [x] 准备 MDX 内容并整合 metadata
2. [x] 替换 [app/(zh)/zh/docs/configure/lsp-servers/page.mdx](app/(zh)/zh/docs/configure/lsp-servers/page.mdx) 内容
3. [x] 更新 Memory Bank (activeContext.md, progress.md)
4. [ ] 验证本地构建

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1.1 | 整合 MDX 内容与 Metadata | Complete | 2026-01-14 | |
| 1.2 | 更新 page.mdx 文件 | Complete | 2026-01-14 | |
| 1.3 | 同步 Memory Bank | Complete | 2026-01-14 | |

## Progress Log
### 2026-01-14
- 初始化任务 TASK049。
- 完成 MDX 替换，包含内置支持表格、配置示例及特定服务器说明。
- 修复：将 Markdown 表格转换为 HTML 表格以解决 Turbopack 渲染异常。
- 确认 metadata 描述及正文标题不含中文句号。
- 同步 Memory Bank。
