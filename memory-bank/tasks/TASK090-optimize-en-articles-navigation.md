# TASK090 - Optimize English Article Navigation

**Status:** Completed  
**Added:** 2026-01-27  
**Updated:** 2026-01-27

## Original Request
Optimize the English version layout to include a sidebar for articles that currently lack it (e.g., `/en/opencode-mcp`). Integrate missing English articles into the sidebar menu to ensure a unified navigation experience across all English content.

## Thought Process
- Noticed that English articles in the `(articles)` route group were using a minimal layout without sidebar or TOC.
- Decided to adopt a "Unified Guide" strategy for the English version since it is currently lightweight and doesn't require the complex "Docs vs Guide" split used in the Chinese version.
- Planned to consolidate all English content under `docsConfigEn` and refactor the article layout to support this unified navigation.

## Implementation Plan
- [x] Identify all missing English articles in `app/(main)/en/(articles)`.
- [x] Update `docsConfigEn` in `lib/docs-config.ts` to include these articles in appropriate categories (Oh My OpenCode, Getting Started, Guides & Integrations).
- [x] Refactor `app/(main)/en/(articles)/layout.tsx` to match the `(docs)` three-column layout (Sidebar + Content + TOC).
- [x] Verify the changes on local dev server.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1.1 | Update `docsConfigEn` with missing articles | Complete | 2026-01-27 | Added 6 new articles |
| 1.2 | Refactor English article layout | Complete | 2026-01-27 | Unified with docs layout |
| 1.3 | Verify layout and navigation | Complete | 2026-01-27 | Fixed Turbopack cache issue |

## Progress Log
### 2026-01-27
- Updated `lib/docs-config.ts` to include articles like "Best Practices", "Update Guide", "MCP Tools", etc.
- Overhauled `app/(main)/en/(articles)/layout.tsx` to include `DocsSidebar`, `DocsMobileNav`, and `TableOfContents`.
- Resolved a Turbopack internal error by clearing `.next` cache and restarting the server.
- Verified that all English guide articles now have a consistent sidebar navigation experience.
