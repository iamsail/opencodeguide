# TASK082 - Site-wide MDX Table Hydration Fix

**Status:** Completed
**Added:** 2025-05-24
**Updated:** 2025-05-24

## Original Request
Fix hydration errors (React error #418/425) caused by multi-line HTML tables in MDX files when using `mdxRs`.

## Thought Process
The `mdxRs` compiler in Next.js preserves newlines and indentation inside raw HTML tags like `<table>`, `<thead>`, `<tbody>`, etc. React expects these to be clean elements without unexpected text (newline) nodes, leading to "Hydration failed" errors. The fix involves minifying these HTML blocks into single-line strings and wrapping them in an overflow `div` for better mobile UX.

## Implementation Plan
- [x] Audit all MDX files for raw `<table>` tags.
- [x] Minify all multi-line tables in `app/(zh)/zh/docs/develop/server/page.mdx` (18 API sections).
- [x] Update `app/(zh)/zh/docs/providers/page.mdx` with new content and minified tables.
- [x] Fix `app/(main)/en/(articles)/how-to-update-opencode/page.mdx`.
- [x] Fix `app/(main)/en/(articles)/opencode-vs-claude-code/page.mdx`.
- [x] Verify site-wide consistency with grep.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1.1 | Audit workspace for HTML tables | Complete | 2025-05-24 | Identified multiple files with multi-line tables. |
| 1.2 | Refactor Server API docs | Complete | 2025-05-24 | Minified 18 major tables. |
| 1.3 | Update Providers content | Complete | 2025-05-24 | Updated content and minified Helicone/Vercel tables. |
| 1.4 | Fix English articles | Complete | 2025-05-24 | Fixed comparison and update guides. |

## Progress Log
### 2025-05-24
- Successfully minified all tables in `server/page.mdx`.
- Completed content update for `providers/page.mdx`.
- Verified English articles and applied fixes to `opencode-vs-claude-code` and `how-to-update-opencode`.
- Confirmed most other docs were already minified.
