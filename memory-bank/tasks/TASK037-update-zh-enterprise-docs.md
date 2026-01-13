# [TASK037] - 更新中文企业版 (Enterprise) 文档

**Status:** Completed  
**Added:** 2026-01-13  
**Updated:** 2026-01-13  

## Original Request
将用户提供的 OpenCode 企业版 (Enterprise) 翻译内容替换到 `/zh/docs/enterprise`。

## Thought Process
用户提供了完整的中文企业版文档，包括试用、数据处理、分享对话、代码所有权、定价、部署（中心化配置、SSO、内部网关、私有化部署）以及常见问题。
我将把这些内容替换到 `app/(zh)/zh/docs/enterprise/page.mdx`，并添加了标准的 metadata 导出。

## Implementation Plan
- [x] 创建任务文件并更新索引 (Completed)
- [x] 读取现有的 `app/(zh)/zh/docs/enterprise/page.mdx` 以获取其元数据和布局 (Completed)
- [x] 应用翻译后的内容，并包含 metadata 段落 (Completed)
- [x] 更新 Memory Bank (activeContext.md, progress.md) (Completed)
- [x] 更新任务状态为已完成 (Completed)

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1.1 | 创建任务文件并更新索引 | Completed | 2026-01-13 | |
| 1.2 | 读取现有页面元数据 | Completed | 2026-01-13 | |
| 1.3 | 替换文档内容 | Completed | 2026-01-13 | |
| 1.4 | 更新 Memory Bank | Completed | 2026-01-13 | |

## Progress Log
### 2026-01-13
- 初始化 TASK037。
- 确定目标文件路径为 `app/(zh)/zh/docs/enterprise/page.mdx`。
- 成功应用翻译内容，并添加了 SEO 相关的 metadata（包括 canonical 链接）。
- 将任务标记为已完成。
