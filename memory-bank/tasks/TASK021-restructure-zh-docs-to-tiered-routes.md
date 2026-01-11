# [TASK021] - Restructure Chinese Docs to Tiered Routes & Fix TOC

**Status:** Completed
**Added:** 2026-01-11
**Updated:** 2026-01-11

## Original Request
"Documentation must be independent of the blog/article system, and the path should 'look like official documentation'." -> Move Chinese docs to `/zh/docs` with tiered subfolders. Also fix the issue where the Table of Contents (TOC) doesn't update on route change.

## Thought Process
To professionalize the documentation, we moved from a flat structure (e.g., `/zh/config`) to a tiered one (e.g., `/zh/docs/config` and `/zh/docs/configure/tools`). This required moving ~33 files and updating the sidebar configuration. Additionally, we identified that the TOC component used a `useEffect` with an empty dependency array, causing it to remain stuck on the previous page's headers.

## Implementation Plan
- [x] Move files from `app/(zh)/zh/` to `app/(zh)/zh/docs/` and its subdirectories.
- [x] Update `lib/docs-config.ts` to reflect the new nested routes.
- [x] Create a new hub page at `app/(zh)/zh/docs/page.mdx`.
- [x] Update existing Chinese hub (`/zh/opencode`) to link to the new docs center.
- [x] Modify `components/toc.tsx` to include `usePathname` and update its effect on route change.
- [x] Update `ROUTE_MAP.md` to reflect the new structure.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1.1 | Move MDX files | Completed | 2026-01-11 | Moved 33 pages |
| 1.2 | Update Sidebar Config | Completed | 2026-01-11 | Updated `docsConfigZh` |
| 1.3 | Fix TOC Bug | Completed | 2026-01-11 | Added `pathname` dependency |
| 1.4 | Update Route Map | Completed | 2026-01-11 | Reflected tiered hierarchy |

## Progress Log
### 2026-01-11
- Decision made to use `/zh/docs` for all technical documentation.
- Moved files into `docs/`, `docs/configure/`, and `docs/develop/`.
- Updated `lib/docs-config.ts` with new absolute paths.
- Added `usePathname` to `components/toc.tsx` to ensure header re-scanning.
- Verified navigation and TOC functionality on localhost.
- Updated documentation center and landing pages.
