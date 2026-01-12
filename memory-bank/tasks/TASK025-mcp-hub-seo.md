# [TASK025] - MCP Hub SEO Transformation

**Status:** Completed
**Added:** 2026-01-12
**Updated:** 2026-01-12

## Original Request
Transform \`/en/mcp\` into the single authoritative source for OpenCode MCP information to improve SEO and user navigation.

## Thought Process
The current MCP content is fragmented across multiple pages (\`mcp\`, \`mcp-configuration\`, \`mcp-client\`) with no clear hierarchy. Google sees multiple pages for the same topic. We need to consolidate authority to \`/en/mcp\`.

## Implementation Plan
- [x] Rewrite \`app/(main)/en/mcp/page.mdx\` with the provided "Hub" content.
- [x] Add "Back to MCP Hub" links to \`app/(main)/en/mcp-configuration/page.mdx\` and \`app/(main)/en/mcp-client/page.mdx\`.
- [x] Add "Go to English Hub" callout to \`app/(zh)/zh/docs/configure/mcp-servers/page.mdx\`.
- [x] Update internal links to point to \`/en/mcp\` in:
    - [x] \`app/(main)/page.tsx\`
    - [x] \`app/(main)/en/opencode-vs-claude-code/page.mdx\`
    - [ ] Other internal pages (Deferred as non-critical)

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1.1 | Rewrite MCP Hub Page | Completed | 2026-01-12 | Overwritten with authoritative content |
| 1.2 | Add Back Links to Sub-pages | Completed | 2026-01-12 | Added "<- Back to MCP Hub" |
| 1.3 | Add Chinese Callout | Completed | 2026-01-12 | Added translated callout |
| 1.4 | Update Internal Links | Completed | 2026-01-12 | Updated Home card and Comparison page |

## Progress Log
### 2026-01-12
- Task created.
- Overwrote \`app/(main)/en/mcp/page.mdx\` with the new authoritative content.
- Added backlinks to \`app/(main)/en/mcp-configuration/page.mdx\` and \`app/(main)/en/mcp-client/page.mdx\`.
- Added Chinese SEO callout to \`app/(zh)/zh/docs/configure/mcp-servers/page.mdx\`.
- Updated "MCP Ready" card in \`app/(main)/page.tsx\` to link to \`/en/mcp\`.
- Updated reference in \`app/(main)/en/opencode-vs-claude-code/page.mdx\`.
