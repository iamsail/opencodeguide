# TASK082 - Site-wide MDX Table Hydration Fix

**Status:** Completed
**Added:** 2026-01-22
**Updated:** 2026-01-22

## Original Request
Fix hydration errors (React error #418/425) and mdxRs build errors ("Expected a closing tag... before the end of Paragraph") caused by multi-line HTML tables in MDX files.

## Thought Process
The `mdxRs` compiler in Next.js preserves newlines and indentation inside raw HTML tags like `<table>`, `<thead>`, `<tbody>`, etc. It often incorrectly interprets these newlines as Markdown paragraph breaks, leading to illegal JSX nesting (e.g., `<table><p>...`). The fix involves minifying these HTML blocks into single-line strings and wrapping them in an overflow `div` with specific Tailwind classes for styling and mobile responsiveness.

## Implementation Plan
- [x] Audit all MDX files for unminified raw `<table>` tags using grep.
- [x] Minify tables in core English/SEO articles (`install`, `opencode-vs-cursor-claude`, `how-to-update`).
- [x] Minify tables in high-density Chinese docs (`mcp-servers`, `formatters`, `lsp-servers`, `ecosystem`, `cli`).
- [x] Apply standard Tailwind styling (`w-full border-collapse`) to ensure visual consistency.
- [x] Update `systemPatterns.md` to formalize the "Table Pattern".

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1.1 | Audit workspace for HTML tables | Complete | 2026-01-22 | Identified multiple survivors in `configure/` and `zh/docs/`. |
| 1.2 | Refactor core SEO and guide pages | Complete | 2026-01-22 | Fixed `install`, `comparisons`, and `update-guides`. |
| 1.3 | Comprehensive Chinese docs cleanup | Complete | 2026-01-22 | Fixed `mcp-servers`, `formatters`, `lsp-servers`, `ecosystem`, `cli`. |
| 1.4 | Update System Patterns | Complete | 2026-01-22 | Documented the mandatory Minified Table pattern. |

## Progress Log
### 2026-01-22
- Discovered that `mdxRs` sensitivity to whitespace causes build failures in addition to hydration mismatches.
- Minified tables site-wide in batch.
- Specifically cleaned up `app/(zh)/zh/docs/configure/mcp-servers/page.mdx`, `app/(zh)/zh/docs/configure/formatters/page.mdx`, `app/(zh)/zh/docs/configure/lsp-servers/page.mdx`, `app/(zh)/zh/docs/develop/ecosystem/page.mdx`, and `app/(zh)/zh/docs/cli/page.mdx`.
- Confirmed zero remaining multiline tables in docs via `grep -r "^<table" app/`.
- Pushed all changes to `dev` branch.
