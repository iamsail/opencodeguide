# [TASK033] - Update Chinese CLI Documentation

**Status:** Completed  
**Added:** 2026-01-13  
**Updated:** 2026-01-13

## Original Request
Replace the placeholder at /zh/docs/cli with full OpenCode CLI documentation, including commands, flags, and environment variables.

## Thought Process
The user provided a comprehensive guide for the OpenCode CLI. During implementation, we encountered an issue where MDX table rendering (using GFM syntax `|`) failed under Next.js 16.1.1 + Turbopack because the required remark/rehype plugins were not serializable in the Turbopack environment.

To maintain development speed and ensure layout stability, we adopted a strategy of using standard HTML `<table>` tags directly within the MDX file. Since we already have styled MDX components for tables, this approach perfectly balances functionality and visual consistency without complicating the build system.

## Implementation Plan
- [x] Extract and translate CLI documentation content.
- [x] Update `app/(zh)/zh/docs/cli/page.mdx` with full content.
- [x] Implement styled HTML tables to bypass Turbopack plugin serialization issues.
- [x] Update `mdx-components.tsx` to include specific `table`, `tr`, `th`, and `td` styles.
- [x] Clean up `next.config.mjs` to maintain server stability.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1.1 | Content Extraction & Translation | Complete | 2026-01-13 | |
| 1.2 | Update `page.mdx` | Complete | 2026-01-13 | |
| 1.3 | Fix Table Rendering (HTML strategy) | Complete | 2026-01-13 | Using HTML tags to bypass Turbopack limitations |
| 1.4 | Refine MDX Component Styles | Complete | 2026-01-13 | Added Tailwind classes to table elements |

## Progress Log
### 2026-01-13
- Updated `app/(zh)/zh/docs/cli/page.mdx` with provided content.
- Discovered that Turbopack does not support custom MDX plugins easily due to serialization errors.
- Pivoted to using HTML `<table>` in MDX for the environment variables section.
- Added comprehensive styles for tables in `mdx-components.tsx`.
- Successfully verified rendering and server stability.
