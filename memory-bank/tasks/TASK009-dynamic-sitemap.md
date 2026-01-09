# [TASK009] - Dynamic Sitemap Generation

**Status:** Completed
**Added:** 2026-01-09
**Updated:** 2026-01-09

## Original Request
The user requested "help me generate sitemap" (auto-translated). The project previously had a manual sitemap or needed one. The goal was to ensure `sitemap.xml` is generated dynamically based on the actual content structure.

## Thought Process
- The current `sitemap.ts` might be static or missing (in this case, I checked and it was a static list).
- A static list is error-prone as new pages are added.
- Next.js supports dynamic sitemap generation via `app/sitemap.ts`.
- I should write a script that traverses the `app/` directory, finds `page.tsx` and `page.mdx` files, and generates the URL entries.
- It needs to handle Route Groups (e.g., `(main)`, `(zh)`) by stripping them from the URL.

## Implementation Plan
- [x] Analyze current `app/` structure.
- [x] Create/Update `app/sitemap.ts`.
- [x] Implement recursive file walker to find pages.
- [x] Normalize paths (remove route groups).
- [x] Set priority and change frequency.
- [x] Sort entries for stability.
- [x] Verify `robots.ts` points to the sitemap.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 9.1 | Implement file crawler in `sitemap.ts` | Completed | 2026-01-09 | Uses `fs.readdir` and recursion |
| 9.2 | Handle Route Groups logic | Completed | 2026-01-09 | Filters out segments starting with `(` |
| 9.3 | Verify `robots.ts` | Completed | 2026-01-09 | Confirmed it exists and points to `/sitemap.xml` |

## Progress Log
### 2026-01-09
- Replaced static `app/sitemap.ts` with a dynamic version.
- Content is now automatically discovered from the file system.
- Verified that `robots.ts` is correct.
