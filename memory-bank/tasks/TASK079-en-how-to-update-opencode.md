# [TASK079] - Create English Update Guide and Fix Rendering

**Status:** Completed  
**Added:** 2024-03-20  
**Updated:** 2024-03-20

## Original Request
Create a "standard official documentation style" English version of the "How to Update OpenCode" guide at /en/how-to-update-opencode. Fix title/metadata rendering, code block backgrounds, and table rendering issues.

## Thought Process
- Created the English guide with structured content.
- Identified that YAML frontmatter was leaking into the rendered page.
- Converted all MDX files to use `export const metadata` instead of YAML.
- Discovered CSS conflict where inline code styles were affecting code blocks.
- Fixed `mdx-components.tsx` and `globals.css` to isolate block code styles.
- Solved Next.js 16 / Turbopack compatibility issues by enabling `mdxRs` and moving `not-found.tsx`.

## Implementation Plan
- [x] Create `/en/how-to-update-opencode/page.mdx`
- [x] Update `ROUTE_MAP.md`
- [x] Convert 7+ files to metadata exports
- [x] Fix code block styling
- [x] Restore dev server stability
- [x] Move to `(docs)` group for sidebar/TOC support
- [x] Add "Update Guide" to `docs-config.ts` sidebar menu

## Progress Log
### 2026-01-21
- Initialized task.
- Created MDX content.
- Fixed frontmatter leak across 7 files.
- Fixed code block background issue.
- Fixed `not-found.tsx` layout warning.
- Project started successfully with `GET 200`.

### 2026-01-22
- Identified missing sidebar/TOC on the update guide page.
- Moved page from `(articles)` to `(docs)` route group to inherit full documentation layout.
- Added "Update Guide" to `lib/docs-config.ts` for English sidebar.
- Verified final rendering and links.
