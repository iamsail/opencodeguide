# [TASK083] - Add Sidebar to Chinese Guide Articles

**Status:** Completed  
**Added:** 2026-01-25  
**Updated:** 2026-01-25

## Original Request
看截图，中文指南部分，应该把非文档的文章，也应该弄一个侧边栏把？这样方便用户看所有的文档

用户要求为中文指南文章（`/zh/*` 下的非 `/zh/docs/*` 页面）添加侧边栏，以便用户能够方便地浏览所有中文内容。

## Implementation Plan
- [x] 更新 `lib/docs-config.ts` 添加"指南 (Guide)"章节
- [x] 重构 `app/(zh)/zh/(articles)/layout.tsx` 使用侧边栏布局
- [x] 引入 `DocsSidebar`、`DocsMobileNav` 和 `TableOfContents` 组件
- [x] 验证修改无编译错误
- [x] 更新 Memory Bank

## Progress Log
### 2026-01-25
- ✅ 在 `lib/docs-config.ts` 中的 `docsConfigZh` 顶部成功添加"指南 (Guide)"章节
- ✅ 章节包含 13 个核心文章链接
- ✅ 完全重构 `app/(zh)/zh/(articles)/layout.tsx`
- ✅ 引入所有必要组件
- ✅ 验证无编译错误
- ✅ 更新 Memory Bank
- ✅ 任务完成
