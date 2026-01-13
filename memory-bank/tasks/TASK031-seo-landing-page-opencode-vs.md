# [TASK031] - Create SEO Landing Page: OpenCode vs Cursor vs Claude

**Status:** Completed
**Added:** 2026-01-13
**Updated:** 2026-01-13

## Original Request
Create a Chinese SEO landing page comparing OpenCode with Cursor and Claude Code (`/zh/opencode-vs-cursor-claude`). Use specific content provided by the user.

## Thought Process
The user wants to drive traffic to the documentation via a comparison article.
Key SEO strategy:
1.  **Phase 1 (Initial):** Do not set `canonical` URL to the main docs immediately. Allow this page to be indexed independently to rank for comparison keywords.
2.  **Phase 2 (Later):** Once established, set `canonical` to `/zh/docs/intro` to consolidate authority.
3.  **Hreflang:** Link to English equivalent `/en/opencode-vs-claude-code`.

## Implementation Plan
- [x] Create page `app/(zh)/zh/opencode-vs-cursor-claude/page.mdx` with content and metadata.
- [x] Configure metadata (Phase 1 strategy: commented out canonical).
- [x] Update `ROUTE_MAP.md` with new route.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1.1 | Create page content | Completed | 2026-01-13 | Using user provided content |
| 1.2 | Update ROUTE_MAP | Completed | 2026-01-13 | Added to SEO articles section |

## Progress Log
### 2026-01-13
- Created `app/(zh)/zh/opencode-vs-cursor-claude/page.mdx`.
- Implemented Phase 1 SEO strategy (canonical commented out).
- Updated `ROUTE_MAP.md`.
- **Troubleshooting**: Encountered MDX table rendering issues (raw markdown displayed). Initial attempt to enable `remark-gfm` in `next.config.mjs` caused server instability (404 errors) due to Turbopack/Rust compiler conflict.
- **Resolution**:
    - Reverted `next.config.mjs` to clean state (`mdxRs: true`, no plugins).
    - Replaced Markdown table with semantic HTML `<table>` styled with Tailwind CSS in the MDX file.
    - Verified page load (200 OK) and visual rendering.
