# [TASK102] - 更新中文 CLI 文档 (v2)

**Status:** Completed
**Added:** 2026-02-04
**Updated:** 2026-02-04

## Original Request
帮我看下/zh/docs/cli/ 这篇文章有没有可以更新的地方，上面是最新的文档内容（用户提供了最新的 CLI 文档内容，包含 session 子命令更新、更全的环境变量和实验性选项）。

## Thought Process
用户提供了 OpenCode CLI 的最新官方文档内容。现有的 `/zh/docs/cli/page.mdx` 需要同步这些更改：
- 结构调整：`stats`, `export`, `import` 现在是 `session` 的子命令。
- `auth login` 新增。
- 环境变量列表补齐（特别是和 Claude Code 兼容性相关的变量）。
- 实验性选项补齐（`PLAN_MODE` 等）。
- 保持 MDX 兼容性，采用紧凑型 HTML 表格并包裹在 `overflow-y-auto` 的 div 中。

## Implementation Plan
- [x] 更新 `app/(zh)/zh/docs/cli/page.mdx` 的正文内容。
- [x] 确保所有表格都包裹在 `overflow-y-auto` 的 div 中。
- [x] 确保表格 HTML 是单行的，以避免 `mdxRs` 的空白字符导致渲染不匹配。
- [x] 增加 `--file`, `--format`, `--title` 等缺少的核心选项。
- [x] 更新 Memory Bank。

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1.1 | 更新 CLI 文档内容 | Completed | 2026-02-04 | |
| 1.2 | 同步 Memory Bank | Completed | 2026-02-04 | |

## Progress Log
### 2026-02-04
- 创建任务文件。
- 准备更新内容。
- 完成了 `/zh/docs/cli/page.mdx` 的全面更新，包括 Intro, Flags, Subcommands, Env Vars 及 Experimental Flags。
- 修复了 GitHub 子命令表格中的 HTML 语法错误。
- 任务全部完成并已验证。
