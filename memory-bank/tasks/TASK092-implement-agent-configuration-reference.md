# [TASK092] - Implement Agent Configuration Reference (EN)

**Status:** Completed
**Added:** 2026-01-31
**Updated:** 2026-01-31

## Original Request
Create an English reference page for "Agent Configuration" at `/en/docs/configure/agents` to match the Chinese version `/zh/docs/configure/agents`.

## Thought Process
The user requested a specific reference page for agent configuration. This page should be part of the documentation section, not the guide section.
We need to:
1. Create the MDX file at the correct route.
2. Ensure it uses HTML tables for stability (known issue).
3. Update the `docs-config.ts` sidebar to include it.
4. Update `ROUTE_MAP.md`.
5. Ensure bidirectionality with the Chinese version.

## Implementation Plan
- [x] Create MDX file at `app/(main)/en/(docs)/docs/configure/agents/page.mdx`
- [x] Implement content with HTML tables to avoid hydration errors
- [x] Update `lib/docs-config.ts` (English Sidebar)
- [x] Update `ROUTE_MAP.md`
- [x] Update cross-links (e.g., in `/en/opencode-skills`)

## Progress Log
### 2026-01-31
- Created the initial page at `app/(task)/en/docs/configure/agents/page.mdx` (initially incorrect path).
- Moved to `app/(main)/en/(docs)/docs/configure/agents/page.mdx` to correct 404 and layout issues.
- Fixed MDX table rendering by replacing Markdown tables with raw HTML tables.
- Updated `lib/docs-config.ts` to add "Reference" -> "Agent Configuration".
- Updated `ROUTE_MAP.md`.
- Updated `/en/opencode-skills` footer link to point to the new English page.
- Verified in browser (user confirmed success).
