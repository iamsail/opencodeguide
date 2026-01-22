# TASK080 - Implement Chinese Update Guide

**Status:** Completed
**Added:** 2026-01-22
**Updated:** 2026-01-22

## Original Request
The user provided a Chinese translation of the "How to Update OpenCode" guide and requested its implementation as a standard official document at `/zh/how-to-update-opencode`, linked to the English version.

## Thought Process
- The English version is already implemented at `/en/how-to-update-opencode`.
- The Chinese version is placed in `app/(zh)/zh/(articles)/how-to-update-opencode/page.mdx` to provide a clean, centered layout without the documentation sidebar (matching the English article structure).
- SEO bidirectional links (`hreflang`) are established between the EN and ZH versions.
- The guide is kept as a standalone article rather than being integrated into the sidebar to maintain a lean documentation tree.

## Implementation Plan
- [x] Create `app/(zh)/zh/(articles)/how-to-update-opencode/page.mdx` with the provided Chinese content.
- [x] Ensure bidirectional SEO links in both EN and ZH versions.
- [x] Move both EN and ZH guides to the `(articles)` route group to remove the sidebar layout.
- [x] Update `ROUTE_MAP.md` to reflect the new route mapping.
- [x] Update `memory-bank/` files to reflect the new state.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1.1 | Create Chinese MDX file | Completed | 2026-01-22 | |
| 1.2 | Update English MDX metadata | Completed | 2026-01-22 | |
| 1.3 | Update Route Map | Completed | 2026-01-22 | |
| 1.4 | Update Memory Bank | Completed | 2026-01-22 | |

## Progress Log
### 2026-01-22
- Task initialized.
- Implemented Chinese guide with sidebar support using route group `(docs)`.
- Established bidirectional SEO links.
- Verified sidebar integration in `lib/docs-config.ts`.
- All documentation updated.
