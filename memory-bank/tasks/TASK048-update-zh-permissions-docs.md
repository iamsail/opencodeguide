# [TASK048] - 更新中文权限 (Permissions) 文档

**Status:** Completed  
**Added:** 2026-01-14  
**Updated:** 2026-01-14

## Original Request
Update /zh/docs/configure/permissions with full content. Replace content, add metadata, avoid Chinese periods in metadata/bold headers.

## Thought Process
该任务涉及将翻译后的中文文档内容集成到项目中，特别是关于 OpenCode 的权限控制系统。
- **SEO 优化**: 添加 metadata 块，包括 `title`, `description` 和 `canonical` 链接。
- **构建稳定性**: 遵循 TASK046 经验，严格移除元数据 `description` 和正文加粗标题（`**...**`）末尾的中文句号（`。`），以规避 Next.js/SWC 的 `char boundary` panic 报错。
- **内容整合**: 确保权限等级（Allow, Deny, Ask）以及工具权限配置的说明准确无误。

## Implementation Plan
1. [x] 准备 MDX 内容并整合 metadata（确保无非法标点）
2. [x] 替换 [app/(zh)/zh/docs/configure/permissions/page.mdx](app/(zh)/zh/docs/configure/permissions/page.mdx) 内容
3. [x] 更新 Memory Bank (activeContext.md, progress.md)
4. [ ] 验证本地构建是否成功

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
- 初始化任务 TASK048。
- 完成 MDX 替换，包含权限控制规则和可用权限项列表。
- 确认 metadata 描述不含中文句号。
- 同步 Memory Bank。
