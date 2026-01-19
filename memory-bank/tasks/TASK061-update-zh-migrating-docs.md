# [TASK061] - 更新 1.0 迁移指南 (ZH)

**Status:** Completed  
**Added:** 2026-01-19  
**Updated:** 2026-01-19

## Original Request
帮我替换 /zh/docs/migrating-to-1-0 的内容，使用提供的 1.0 迁移文档，包括 OpenTUI 介绍、升级降级命令、UX 变更以及按键绑定调整。

## Thought Process
该任务涉及将 `/zh/docs/migrating-to-1-0` 的占位内容替换为真实的 1.0 迁移说明。
为了确保文档符合项目质量标准和构建稳定性：
1. **SEO 元数据**: 添加 `metadata` 块，设置 `canonical` 为 `/zh/docs/migrating-to-1-0`。
2. **构建安全**: 移出 `metadata.description` 结尾的中文句号，并检查加粗标题中的标点。
3. **表格渲染**: 依据 TASK044 和 TASK049 的经验，Markdown 表格在 Turbopack 下有时会触发序列化错误，因此将按键绑定表格转换为带样式的 HTML `<table>` 容器。
4. **内容对齐**: 整合用户提供的翻译，确保专业术语（如 TUI, OpenTUI, Breaking Changes）的准确性。

## Implementation Plan
- [x] 创建任务记录并更新索引
- [x] 编写 `/app/(zh)/zh/docs/migrating-to-1-0/page.mdx`
    - [x] 添加元数据
    - [x] 转换按键绑定表格为 HTML
    - [x] 移除敏感位置的中文句号
- [x] 验证文档链接一致性

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1.1 | 创建并更新任务索引 | Completed | 2026-01-19 | |
| 1.2 | 更新 migrating-to-1-0/page.mdx 内容 | Completed | 2026-01-19 | 使用 HTML 表格确保构建稳定性 |
| 1.3 | 验证 SEO 与构建兼容性 | Completed | 2026-01-19 | 描述结尾无中文句号 |

## Progress Log
### 2026-01-19
- 初始化任务 TASK061。
- 完成了页面内容替换，集成了元数据，并将对照表转换为 HTML 格式。
- 确认没有遗留中文句号在可能触发构建 Panic 的位置。
