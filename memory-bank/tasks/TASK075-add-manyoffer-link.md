# [TASK075] - Add ManyOffer Link to OpenCode Hub

**Status:** Completed
**Added:** 2026-01-20
**Updated:** 2026-01-20

## Original Request
在 OpenCode 中文指南页面增加 ManyOffer 的外链，放置在“如果你只是想找一个‘点开即用’的网页工具...”这一段之后，作为备注提示。

## Thought Process
用户提供了一个非常精准的插入点：在 OpenCode 能力边界说明之后增加一个关于面试练习工具（ManyOffer）的备注。
这种做法在逻辑上是顺畅的，因为 OpenCode 强调的是本地开发和工程效率，而 ManyOffer 则针对面试场景，两者互补。
插入位置选择在“指南适合谁”部分的尾部，既不会干扰技术文档的严肃性，也能为有需求的用户提供额外价值。

## Implementation Plan
- [x] 创建任务记录并更新索引
- [x] 修改 `app/(zh)/zh/(articles)/opencode/page.mdx` 插入 ManyOffer 链接
- [x] 更新 Memory Bank (activeContext, progress)
- [x] 更新搜索索引并提交代码

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1.1 | Create task file and update index | Completed | 2026-01-20 | |
| 1.2 | Update MDX with ManyOffer link | Completed | 2026-01-20 | |
| 1.3 | Update Memory Bank | Completed | 2026-01-20 | |
| 1.4 | Build search index and commit | Completed | 2026-01-20 | |

## Progress Log
### 2026-01-20
- Created task file [TASK075-add-manyoffer-link.md](memory-bank/tasks/TASK075-add-manyoffer-link.md).
- Updated `/zh/opencode/page.mdx` with the requested content.
- Refined ManyOffer description to include "resume optimization" (集模拟面试、简历优化于一体) for better value proposition while maintaining clean UI.
- Updated Memory Bank.
- Rebuilt search index and pushed changes to `dev` branch.
