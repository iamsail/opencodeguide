# [TASK086] - Update Chinese Agent Skills Documentation

**Status:** Completed
**Added:** 2026-01-26
**Updated:** 2026-01-26

## Original Request
Replace the content of `/zh/docs/configure/agent-skills` with provided translation which uses "智能体技能 (Agent Skills)" and official definitions.

## Thought Process
- The user provided a comprehensive translation for the Agent Skills page.
- Current page uses "代理技能", but the official/provided term is "智能体技能".
- Need to update metadata and body content to match the new translation.
- Need to update the sidebar in `lib/docs-config.ts` for consistency.

## Implementation Plan
- [x] Create task file and update index
- [x] Update `app/(zh)/zh/docs/configure/agent-skills/page.mdx` with new content and metadata
- [x] Update `lib/docs-config.ts` to reflect the name change
- [x] Update Memory Bank files

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1.1 | Create task file and update index | Complete | 2026-01-26 | |
| 1.2 | Update agent-skills/page.mdx | Complete | 2026-01-26 | |
| 1.3 | Update docs-config.ts sidebar | Complete | 2026-01-26 | |
| 1.4 | Update Memory Bank | Complete | 2026-01-26 | |

## Progress Log
### 2026-01-26
- Initialized TASK086 for Chinese Agent Skills documentation update.
- Updated `page.mdx` with the provided translation and "智能体技能" term.
- Updated `lib/docs-config.ts` sidebar label to "智能体技能 (Skills)".
- Updated Memory Bank files (`activeContext.md`, `progress.md`) to reflect the changes.
