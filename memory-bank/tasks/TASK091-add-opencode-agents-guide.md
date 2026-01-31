# [TASK091] - Add Opencode Agents Guide (English)

**Status:** In Progress
**Added:** 2026-01-29
**Updated:** 2026-01-29

## Original Request
Add a new documentation page for "Opencode Agents" in English at `/en/opencode-agents`.

## Thought Process
The user provided a final version of the content for `/en/opencode-agents`. This page acts as a "Hub" for agents, explaining their mental model and providing entry points for configuration. It complements existing guides like Agent Skills and MCP. The task involves creating the MDX file, updating the sidebar configuration, and syncing the route map.

## Implementation Plan
- [ ] Create directory `app/(main)/en/(docs)/opencode-agents/`
- [ ] Implement `app/(main)/en/(docs)/opencode-agents/page.mdx` with the provided content
- [ ] Update `lib/docs-config.ts` to include the new page in the English sidebar under "Guides & Integrations"
- [ ] Update `ROUTE_MAP.md` to reflect the new route
- [ ] Update `progress.md` and `activeContext.md`

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1.1 | Initialize Task in Memory Bank | Complete | 2026-01-29 | |
| 1.2 | Create MDX page | Complete | 2026-01-29 | |
| 1.3 | Update sidebar config | Complete | 2026-01-29 | |
| 1.4 | Sync Route Map | Complete | 2026-01-29 | |

## Progress Log
### 2026-01-29
- Created task file and updated task index.
- Created `/en/opencode-agents/page.mdx` with provided content.
- Added link to `lib/docs-config.ts`.
- Updated `ROUTE_MAP.md`.
- Updated `progress.md` and `activeContext.md`.
- **Refinement**: Switched from YAML frontmatter to `export const metadata` to fix rendering issue where metadata was being displayed as plain text. Added `zh-CN` language alternate.
