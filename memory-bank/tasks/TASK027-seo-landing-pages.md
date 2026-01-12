# [TASK027] - Create SEO Landing Pages for High-Traffic Keywords

**Status:** Completed
**Added:** 2026-01-12
**Updated:** 2026-01-12

## Original Request
Create 6 "ready-to-deploy, buildable, SEO-friendly" MDX templates to capture high-value traffic for specific error messages and integrations (Claude, MCP, Playwright).
Ensure strict adherence to the project's language routing (English in `/en/`, Chinese in `/zh/`) to maintain SEO health.

## Thought Process
The user identified specific high-traffic keywords and error messages (e.g., "credential only authorized for use with Claude Code") that are currently missing from the documentation. Creating dedicated landing pages for these topics is a high-value, low-effort SEO win.
Crucially, we must respect the existing `/en/` and `/zh/` structure to avoid creating "ghost" pages or confusing Google's index. All English pages must be explicit `/en/` routes, and internal links must be absolute (e.g., `/en/opencode-claude`) to prevent drift.

## Implementation Plan
- [x] Create `app/(main)/en/opencode/errors/claude-credential-only-authorized/page.mdx`
- [x] Create `app/(main)/en/opencode-claude/page.mdx`
- [x] Create `app/(main)/en/opencode-mcp/page.mdx`
- [x] Create `app/(main)/en/opencode-anthropic-auth/page.mdx`
- [x] Create `app/(main)/en/opencode-mcp-playwright/page.mdx`
- [x] Create `app/(zh)/zh/opencode-claude/page.mdx`
- [x] Verify internal linking strategy (all links explicit `/en/` or `/zh/`).

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1.1 | Create Claude Credential Error Page | Complete | 2026-01-12 | High priority error fix page |
| 1.2 | Create Opencode x Claude Guide | Complete | 2026-01-12 | General setup and auth guide |
| 1.3 | Create Opencode MCP Hub | Complete | 2026-01-12 | Distinguishes from generic /mcp |
| 1.4 | Create Anthropic Auth Page | Complete | 2026-01-12 | Specifics on API keys vs Claude Code |
| 1.5 | Create Playwright MCP Page | Complete | 2026-01-12 | Specific integration landing page |
| 1.6 | Create Chinese Claude Guide | Complete | 2026-01-12 | Located in /zh/ to match SEO structure |

## Progress Log
### 2026-01-12
- Created all 6 MDX files with optimized metadata (title, description, keywords).
- Ensured all file paths strictly follow the `(main)/en/` and `(zh)/zh/` convention.
- Implemented explicit internal linking (e.g., `[Link](/en/target)`) to prevent routing ambiguity.
- Updated `ROUTE_MAP.md` to reflect the new additions.
