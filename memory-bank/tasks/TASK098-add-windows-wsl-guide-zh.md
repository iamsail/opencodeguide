# [TASK098] - 增加 Windows (WSL) 中文指南

**Status:** Completed
**Added:** 2026-02-02
**Updated:** 2026-02-02

## Original Request
增加 Windows (WSL) 运行 OpenCode 的简体中文 Markdown 教程。

## Thought Process
用户提供了一份关于在 Windows WSL 环境下运行 OpenCode 的详细指南。为了保持文档的一致性和 SEO 权重，我完成了以下工作：
1. 在 `(articles)` 路由组下创建了 `windows-wsl` 页面。
2. 设置 `canonical` 指向 `/zh/docs/intro`。
3. 在导航栏 `guideConfigZh` 和安装页面 `install/page.mdx` 中增加入口。

## Implementation Plan
- [x] 创建 `app/(zh)/zh/(articles)/windows-wsl/page.mdx`
- [x] 更新 `lib/docs-config.ts` 中的 `guideConfigZh`
- [x] 更新 `ROUTE_MAP.md`
- [x] 在 `app/(zh)/zh/(articles)/install/page.mdx` 中增加链接
- [x] 更新 Memory Bank

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1.1 | 创建 MDX 页面 | Complete | 2026-02-02 | |
| 1.2 | 更新导航配置 | Complete | 2026-02-02 | |
| 1.3 | 更新路由映射表 | Complete | 2026-02-02 | |
| 1.4 | 更新安装指南链接 | Complete | 2026-02-02 | |

## Progress Log
### 2026-02-02
- 初始化任务文件。
- 规划实施方案。
- 创建了 `app/(zh)/zh/(articles)/windows-wsl/page.mdx` 并填入内容。
- 根据用户反馈，将文章移至官方文档目录 `/zh/docs/windows-wsl`。
- 更新了 `lib/docs-config.ts` 中的 `docsConfigZh` 侧边栏配置，将其放在 "Intro" 部分。
- 在 `ROUTE_MAP.md` 中修正了新路由。
- 在 `install/page.mdx` 中更新了指向新文档路径 `/zh/docs/windows-wsl` 的链接。
- 将页面 `canonical` 修改为自指向 `/zh/docs/windows-wsl`。

