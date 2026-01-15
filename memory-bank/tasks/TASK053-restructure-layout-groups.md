# TASK053 - Restructure Documentation Layouts

**Status:** Completed
**Added:** 2026-01-15
**Updated:** 2026-01-15

## Original Request
Fix layout issues where articles ("Oh My OpenCode Best Practices") inadvertently included the documentation sidebar. The goal is to distinctively separate "Technical Docs" (Sidebar + TOC) from "Articles/Guides" (Centered, No Sidebar, Focused Reading).

## Thought Process
- **Problem**: The original structure applied a single `layout.tsx` (with sidebar) to all routes under `/en` and `/zh`. This forced articles to look like documentation, which is poor UX for narrative content.
- **Solution Strategy**: Use Next.js **Route Groups** to apply different layouts to the same URL path structure.
    - `(docs)` group: Includes Sidebar, Breadcrumbs, On-This-Page.
    - `(articles)` group: No sidebar, centered `max-w-3xl` container, optimized for reading.
- **Hydration Issue**: During implementation, we discovered `Next.js` MDX hydration errors because MDX content (which spans multiple paragraphs) was being wrapped in a `<p>` tag by the parent component or MDX provider default. 
    - Fix: In `mdx-components.tsx`, map `p` to a `div` with paragraph styling to allow block children without nesting violations.

## Implementation Plan
- [x] **Chinese Layout Restructure**
    - [x] Create `app/(zh)/zh/(docs)` and move doc files there.
    - [x] Create `app/(zh)/zh/(articles)` and move article files there.
    - [x] Create dedicated layout for `(articles)` without sidebar.
- [x] **English Layout Restructure**
    - [x] Mirror the structure: `app/(main)/en/(docs)` and `app/(main)/en/(articles)`.
    - [x] Move "Oh My OpenCode Best Practices" to articles.
- [x] **Header Navigation**
    - [x] Since articles lack a sidebar, they need global navigation.
    - [x] Update `SiteHeader` to include "Docs" / "指南" links depending on the active locale.
- [x] **Hydration Fixes**
    - [x] `mdx-components.tsx`: Remap `p` -> `div` (styled as p).
    - [x] Content cleanup: Remove wrapping `div` or `p` in MDX files where unnecessary.

## Progress Log
### 2026-01-15
- **Restructuring**: Successfully split both EN and ZH routes into `(docs)` and `(articles)` groups.
- **Hydration**: Fixed the generic "p cannot be descendant of p" error globally via `mdx-components.tsx`.
- **Navigation**: Added top-level links to the Header component to ensure users can return to the main documentation hub from standalone articles.
- **Verification**: Verified that URLs remain unchanged (e.g. `/zh/oh-my-opencode-best-practices` works) but now renders with the correct visually distinct layout.
- **Content**: Updated GitHub source links in the "Best Practices" guide for both languages.
