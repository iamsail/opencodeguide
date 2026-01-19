# TASK060 - Update CLI Commands Reference

**Status:** Completed
**Added:** 2026-01-19
**Updated:** 2026-01-19

## Original Request
The user wants to replace the current English CLI documentation with a more authoritative and comprehensive "Hub" page that covers advanced features like headless mode, MCP integration, and agent management. Synchronizing with the Chinese version is explicitly not required.

## Thought Process
- The current page is "copy-paste friendly" but lacks depth on advanced CLI modes (`serve`, `web`, `acp`).
- The new content provides a structured reference for execution modes, agent management, authentication, model discovery, MCP, and GitHub integration.
- SEO metadata needs to be updated to reflect the "Complete Reference" status.
- Internal links like `/en/opencode/errors` should be checked for validity, though the priority is the content swap.

## Implementation Plan
- [x] Create task file and update index
- [x] Replace content in `app/(main)/en/(docs)/cli-commands/page.mdx`
- [x] Verify metadata and internal links
- [x] Update Memory Bank (activeContext, progress)

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1.1 | Create task file and update index | Complete | 2026-01-19 | |
| 1.2 | Update CLI page content | Complete | 2026-01-19 | |
| 1.3 | Verify SEO and links | Complete | 2026-01-19 | Note: `/en/opencode/errors` link added but page seems to be a directory. |
| 1.4 | Finalize documentation | Complete | 2026-01-19 | |

## Progress Log
### 2026-01-19
- Initialized Task060.
- Replaced `app/(main)/en/(docs)/cli-commands/page.mdx` with authoritative comprehensive content.
- Verified metadata and links. Removed the `/en/opencode/errors` link as requested because the page doesn't exist yet.
- Fixed code block styling for credentials directory by adding `bash` language tag.
- Updated `activeContext.md` and `progress.md`.
- Marked task as completed.
