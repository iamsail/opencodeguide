# [TASK045] - 更新中文命令 (Commands) 文档

**Status:** Completed  
**Added:** 2026-01-14  
**Updated:** 2026-01-14

## Original Request
使用用户提供的翻译内容替换 `/zh/docs/configure/commands` 下的占位符。

## Thought Process
用户提供了详细的“命令 (Commands)”中文文档，涵盖了自定义命令的创建（Markdown/JSON 方式）、提示词配置（参数、Shell 输出、文件引用）以及配置选项。我需要将其整合到分层路由架构中的对应位置，并确保 SEO 元数据和 Canonical 链接配置正确。为了避免 SWC 构建错误，描述结尾将不使用中文句号。

## Implementation Plan
- [x] 创建任务文件并更新索引
- [x] 替换 `app/(zh)/zh/docs/configure/commands/page.mdx` 的内容及元数据
- [x] 确保代码块格式正确
- [x] 验证 Canonical 链接为 `/zh/docs/configure/commands`
- [x] 更新 Memory Bank 进度

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1.1 | 创建任务文件并更新索引 | Complete | 2026-01-14 | |
| 1.2 | 替换 page.mdx 内容及元数据 | Complete | 2026-01-14 | |
| 1.3 | 更新 Memory Bank | Complete | 2026-01-14 | |

## Progress Log
### 2026-01-14
- 启动任务，创建任务文件。
- 完成了 `page.mdx` 的内容迁移，涵盖了命令创建、配置、提示词语法等核心部分。
- 确认了 `metadata` 的 `title`、`description` 和 `canonical` 指向。
- 同步更新了 Memory Bank。
- **修复**: 解决了 Vercel 构建时的 SWC Panic 报错，移除了第一段加粗文本末尾的中文句号。
