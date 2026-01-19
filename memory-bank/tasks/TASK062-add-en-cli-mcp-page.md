# [TASK062] - Add English CLI MCP Documentation Page

**Status:** Completed
**Added:** 2026-01-19
**Updated:** 2026-01-19

## Original Request
Create the `/en/cli-mcp` documentation page based on the provided MDX template, ensuring it links correctly to English MCP resources and avoids modifying Chinese content.

## Thought Process
- Use the real OpenCode CLI documentation as a base.
- Standard documentation layout using `app/(main)/en/(docs)/cli-mcp/page.mdx`.
- Adjust links: `/en/mcp-explained` -> `/en/mcp`.
- Ensure `zh-CN` alternate points to `/zh/docs/cli`.
- Update sidebar in `lib/docs-config.ts` under "Getting Started".
- Register in `ROUTE_MAP.md`.

## Implementation Plan
- [x] Create task documentation (TASK062)
- [x] Create `app/(main)/en/(docs)/cli-mcp/page.mdx`
- [x] Update `lib/docs-config.ts` for English sidebar
- [x] Update `ROUTE_MAP.md`
- [x] Update `memory-bank/progress.md`

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1.1 | Create task file | Complete | 2026-01-19 | |
| 1.2 | Update _index.md | Complete | 2026-01-19 | |
| 2.1 | Create CLI MCP MDX page | Complete | 2026-01-19 | |
| 3.1 | Update English sidebar | Complete | 2026-01-19 | |
| 4.1 | Update ROUTE_MAP.md | Complete | 2026-01-19 | |
| 5.1 | Finalize memory bank | Complete | 2026-01-19 | |

## Progress Log
### 2026-01-19
- Initialized TASK062.
- Planned implementation steps.
- Created `app/(main)/en/(docs)/cli-mcp/page.mdx` with metadata and content.
- Updated `lib/docs-config.ts` to include "CLI MCP Commands" in the sidebar.
- Updated `ROUTE_MAP.md` to register the new route.
- Ran `scripts/build-search.mjs` to update search index.
- Updated `memory-bank/progress.md`.
- Marked task as completed.
