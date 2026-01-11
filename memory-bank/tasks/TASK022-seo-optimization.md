# [TASK022] - SEO 架构优化 (权重引导与路由关联)

**Status:** Completed
**Added:** 2026-01-11
**Updated:** 2026-01-11

## Original Request
优化项目 SEO 架构，避免「路由内耗 + 权重分散」。明确 `/zh/docs` 为权威中心，通过 Canonical 引导科普文章权重，并建立中英文 hreflang 语言关联。

## Thought Process
我们通过在科普文章中添加指向文档的 Canonical 链接，解决了同类关键词下的多个页面竞争问题。同时修复了英文版的路径错误，并建立了中英对等页面的联系，使搜索引擎能够识别翻译版本。

## Implementation Plan
- [x] **权重导流 (Canonical Updates)**
  - [x] 更新 `/zh/opencode-shi-yong` -> `/zh/docs/usage`
  - [x] 更新 `/zh/opencode-shi-shen-me` -> `/zh/docs/intro`
  - [x] 更新 `/zh/opencode-zhong-wen` -> `/zh/docs/config`
  - [x] 更新 `/zh/install` -> `/zh/docs/intro`
- [x] **Hub 页面升级 (Hub Revamp)**
  - [x] 在 `/zh/opencode` 显著位置添加通往 `/zh/docs` 的引导卡片。
- [x] **英文修正 (English Fixes)**
  - [x] 修正了 8 个英文 MDX 文件的 Canonical 错误（补全了 `/en` 前缀）。
- [x] **语言关联 (Hreflang)**
  - [x] 在 16 个核心页面中设置了 `alternates.languages` (EN/ZH)。

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1.1 | Update Chinese Article Canonicals | Completed | 2026-01-11 | |
| 1.2 | Revamp Chinese Hub Page | Completed | 2026-01-11 | |
| 1.3 | Fix English Canonicals & Add Hreflang | Completed | 2026-01-11 | |
| 1.4 | Sync Memory Bank & Route Map | Completed | 2026-01-11 | |

## Progress Log
### 2026-01-11
- Task completed. Verified bidirectional links and canonical mappings.
