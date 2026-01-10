# [TASK011] - Implement Table of Contents (TOC)

**Status:** Completed
**Added:** 2026-01-10
**Updated:** 2026-01-10

## Original Request
"Start implementation" of the TOC feature (Priority 1) to improve SEO and user experience for long articles.

## Thought Process
- TOC is crucial for SEO (sitelinks) and UX (navigation).
- Standard Next.js MDX approach makes it hard to extract headings server-side without complex plugins.
- **Decision**: Use a client-side approach (`IntersectionObserver`) combined with server-side ID generation (`rehype-slug`).
- This ensures anchor links work (SEO friendly) while the active state highlighting is handled by the browser.

## Implementation Plan
- [x] Configure MDX plugins (`rehype-slug`, `rehype-autolink-headings`) in `next.config.mjs`.
- [x] Create `components/toc.tsx` client component.
- [x] Update Layouts (`en` and `zh`) to support 3-column grid on large screens.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 11.1 | Install & Config MDX Plugins | Completed | 2026-01-10 | IDs are now auto-generated |
| 11.2 | Build TOC Component | Completed | 2026-01-10 | Uses IntersectionObserver for scroll spy |
| 11.3 | Layout Integration | Completed | 2026-01-10 | Added sticky right column |

## Progress Log
### 2026-01-10
- Installed `rehype-slug` and `rehype-autolink-headings`.
- Created robust `TableOfContents` component that scans the DOM for `h2` and `h3` tags.
- Updated both `en` and `zh` layouts to include the TOC on desktop views (`lg:grid-cols-[..._200px]`).
