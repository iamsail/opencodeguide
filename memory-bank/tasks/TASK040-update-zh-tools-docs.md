# [TASK040] - 更新中文工具 (Tools) 文档

**Status:** Completed  
**Added:** 2026-01-14  
**Updated:** 2026-01-14

## Original Request
将 OpenCode 工具 (Tools) 文档翻译内容替换至 `/zh/docs/configure/tools/page.mdx`。

## Thought Process
该任务涉及将 `/zh/docs/configure/tools` 的占位符内容替换为完整的中文指南。为了保持文档的一致性，我：
1. 添加了 SEO 元数据块。
2. 将 `> 注意：` 块转换为 GFM 警告语法（例如 `> [!NOTE]`）以获得更好的视觉效果。
3. 确保内部链接（权限、MCP 服务器、自定义工具）正确指向中文文档路径。
4. 遵循项目在 Next.js 16 + Turbopack 环境下的 MDX 渲染规范，并为代码块添加了文件名注释（如 `*opencode.json*`）。

## Implementation Plan
- [x] 创建任务文件并更新索引。
- [x] 为 `app/(zh)/zh/docs/configure/tools/page.mdx` 添加 SEO 元数据。
- [x] 按照翻译内容更新 MDX，并优化格式（警告块、代码注释）。
- [x] 更新 Memory Bank 以反映进度。

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1.1 | 创建任务文件与索引更新 | Complete | 2026-01-14 | |
| 1.2 | 添加 SEO 元数据 | Complete | 2026-01-14 | |
| 1.3 | 更新 MDX 内容与格式优化 | Complete | 2026-01-14 | 使用了 GFM 警告语法和文件名注释 |
| 1.4 | 更新 Memory Bank | Complete | 2026-01-14 | |

## Progress Log
### 2026-01-14
- 初始化任务文件并更新任务索引。
- 完成了 `/zh/docs/configure/tools/page.mdx` 的内容更新，添加了元数据和优化的格式。
- 将任务状态更新为“已完成”。
