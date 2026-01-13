# [TASK030] - MDX Table Support and UI Refinement

**Status:** Completed
**Added:** 2026-01-13
**Updated:** 2026-01-13

## Original Request
The user reported that Markdown tables were not rendering correctly (showing raw pipes) and requested hierarchical indentation in the TOC. Additionally, complex tables were causing hydration errors.

## Thought Process
- **Tables**: Discovered that `@next/mdx` with Turbopack has issues with serializing plugin functions (like `remark-gfm`). Enabled `experimental.mdxRs: true` in `next.config.mjs` to use the Rust-based MDX compiler, which includes built-in GFM support and is compatible with Turbopack.
- **Hydration Errors**: Large/complex tables in MDX can sometimes lead to hydration mismatches. Implemented a compressed HTML fallback (raw HTML) for the largest table in `mcp-servers/page.mdx` as a stable workaround.
- **TOC**: Updated `toc.tsx` to extract heading levels (H2, H3) and apply `pl-4` padding to H3 items to show clear hierarchy.
- **I18n**: Translated "On This Page" to "本页内容" for Chinese routes.
- **Styling**: Added custom table components (table, tr, th, td) to `mdx-components.tsx` with Tailwind classes to ensure they match the site's design even without `remark-gfm` styling plugins.

## Implementation Plan
- [x] Extract heading levels (H2/H3) in `toc.tsx`
- [x] Apply indentation to H3 items in `toc.tsx`
- [x] Translate TOC header for Chinese pages
- [x] Enable `mdxRs: true` in `next.config.mjs`
- [x] Add Table components to `mdx-components.tsx`
- [x] Use compressed HTML fallback for complex tables in `mcp-servers/page.mdx`

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1.1 | TOC Hierarchical Indentation | Complete | 2026-01-13 | Added pl-4 for H3 |
| 1.2 | TOC Translation | Complete | 2026-01-13 | "本页内容" |
| 1.3 | Enable MDX Table Support | Complete | 2026-01-13 | via mdxRs: true |
| 1.4 | Table Visual Styling | Complete | 2026-01-13 | Added to mdx-components.tsx |
| 1.5 | Hydration Fix | Complete | 2026-01-13 | HTML fallback in mcp-servers/page.mdx |

## Progress Log
### 2026-01-13
- Resolved the "not serializable" error by switching to `mdxRs`.
- Confirmed TOC now supports H2/H3 levels with indentation.
- Fixed the table rendering issue site-wide.
- Resolved hydration errors in `mcp-servers/page.mdx` with HTML fallback.
- Updated `mdx-components.tsx` with refined styling.
