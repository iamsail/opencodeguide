# [TASK087] - Synchronize Route Map with New Pages and Korean Locale

**Status:** Completed  
**Added:** 2026-01-27
**Updated:** 2026-01-27

## Original Request
更新ROUTE_MAP.md文档

## Thought Process
The project has recently added compliance pages (About, Contact, Privacy), detailed Chinese SEO articles, and a Korean landing page. `ROUTE_MAP.md` was out of sync with these changes. This task involves updating the mapping to reflect the current state of the filesystem, sidebar configurations, and SEO strategy.

## Implementation Plan
- [x] Identify new routes across all route groups (`app/(main)`, `app/(zh)`, `app/(ko)`).
- [x] Synchronize `ROUTE_MAP.md` sections (Core Pages, English Docs, Chinese Articles, Chinese Docs Hub, Korean Version).
- [x] Verify terminology consistency (e.g., "智能体技能" instead of "代理技能").

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1.1 | Audit current routes in `app/` | Complete | 2026-01-27 | |
| 1.2 | Update `ROUTE_MAP.md` with new pages and localizations | Complete | 2026-01-27 | |
| 1.3 | Synchronize Chinese article list with `lib/docs-config.ts` | Complete | 2026-01-27 | |

## Progress Log
### 2026-01-27
- Audited the workspace for new pages.
- Found missing compliance pages (`/about`, `/contact`, `/privacy`).
- Found missing Korean landing page (`/ko/opencode`).
- Found several Chinese SEO articles added to the `guideConfigZh` but missing from the route map.
- Updated `ROUTE_MAP.md` with comprehensive tables for all route categories.
- Merged the changes into `ROUTE_MAP.md`.
