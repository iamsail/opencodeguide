# [TASK018] - Update /zh/install Content & SEO Redirect

**Status:** Completed  
**Added:** 2026-01-11  
**Updated:** 2026-01-11

## Original Request
- Replace `/zh/install` page with a new official installation guide emphasizing OpenCode as an AI Coding Agent supporting CLI + Desktop App.
- Add new route alias `/zh/opencode-install` that does not render content and 301 redirects to `/zh/install`.
- Ensure SEO weight consolidates on `/zh/install` (canonical remains `/zh/install`).
- Fix rendering regressions: the install-methods table should render correctly; the right-side TOC should appear.

## Thought Process
- The content update is straightforward MDX replacement.
- The alias route should be handled via Next.js `redirects()` in `next.config.mjs` to avoid creating a duplicate page.
- Markdown tables require GFM support; however, injecting MDX plugins (e.g., `remark-gfm`, `rehype-slug`) through `@next/mdx` options can fail production builds under Next 16 + Turbopack due to non-serializable loader options.
- To keep builds reliable, prefer a no-plugin solution: use an explicit HTML `<table>` in MDX and generate missing heading IDs client-side for the TOC.

## Implementation Plan
- Update `app/(zh)/zh/install/page.mdx` with the new content.
- Add 301 redirect `/zh/opencode-install` -> `/zh/install` in `next.config.mjs`.
- Replace the MDX table with an explicit `<table>` to ensure rendering.
- Make TOC resilient by generating missing `id` attributes for `h2/h3` headings at runtime.
- Verify with `npm run build`.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1.1 | Replace `/zh/install` content | Complete | 2026-01-11 | Updated structure (Desktop first, curl as main CLI). |
| 1.2 | Add `/zh/opencode-install` 301 redirect | Complete | 2026-01-11 | Redirect configured in `next.config.mjs`. |
| 1.3 | Fix table rendering | Complete | 2026-01-11 | Use explicit HTML `<table>` (no GFM plugin needed). |
| 1.4 | Restore right-side TOC | Complete | 2026-01-11 | TOC generates missing heading IDs at runtime. |
| 1.5 | Build verification | Complete | 2026-01-11 | `npm run build` passes. |

## Progress Log
### 2026-01-11
- Replaced `/zh/install` content with updated official installation guide.
- Added permanent redirect from `/zh/opencode-install` to `/zh/install`.
- Fixed MDX table rendering by switching to HTML table (avoids requiring `remark-gfm`).
- Updated TOC to generate missing heading IDs at runtime (avoids requiring `rehype-slug` injection).
- Verified production build succeeds.
