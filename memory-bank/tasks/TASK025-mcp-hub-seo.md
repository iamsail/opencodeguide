# [TASK025] - MCP Hub SEO Transformation

**Status:** Completed
**Added:** 2026-01-12
**Updated:** 2026-01-18

## Original Request
Transform \`/en/mcp\` into the single authoritative source for OpenCode MCP information to improve SEO and user navigation.

## Decision Record
**Key Decision:** \`/en/mcp\` is defined as the *only* authoritative Hub for "OpenCode MCP". 
- **Hub Strategy**: It must cover 4 search intents: What, Why, Setup, and Servers (List).
- **Spoke Strategy**: Technical definitions and deep-dives (JSON Schema, etc.) are moved to \`/en/mcp-explained\`.
- **Linking Strategy**: \`mcp-explained\` and other spoke pages must have a visually distinct "Back to MCP Hub" link at the very top.
- **Navigation**: Only \`/en/mcp\` appears in the primary MCP navigation group. \`mcp-explained\` is linked *only* from the content of \`/en/mcp\`.

## Implementation Plan
- [x] **Create Technical Spoke Page**: 
    - Create \`app/(main)/en/(docs)/mcp-explained/page.mdx\`.
    - Content: Protocol definitions, JSON Schema, deep technical details.
    - Requirement: Explicit backlink to \`/en/mcp\` in the first paragraph.
- [x] **Rewrite Hub Page**: 
    - Rewrite \`app/(main)/en/(docs)/mcp/page.mdx\`.
    - Structure: 9 key sections including H1 exact match, 200-word intro, Architecture, Server Table (Critical for CTR), Setup, Use Cases.
- [x] **Update Information Architecture**:
    - Modify \`lib/docs-config.ts\`.
    - Ensure \`/en/mcp\` is labeled "MCP Guide".
    - Ensure \`mcp-explained\` is NOT in the sidebar.
- [x] **Enforce Internal Linking**:
    - Update \`mcp-configuration\`, \`mcp-client\`, \`opencode-mcp-playwright\`.
    - Add standardized backlink: "This page is part of the OpenCode MCP documentation. → See the complete MCP guide".

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1.1 | Update Memory Bank | Completed | 2026-01-18 | Recorded decision and new specs |
| 1.2 | Create mcp-explained | Completed | 2026-01-18 | Technical downgrade page created |
| 1.3 | Rewrite MCP Hub Page | Completed | 2026-01-18 | 9-section structure implemented |
| 1.4 | Update IA (docs-config) | Completed | 2026-01-18 | Sidebar label updated to "MCP Guide" |
| 1.5 | Update Internal Links | Completed | 2026-01-18 | Added standardized headers to spokes |

## Progress Log
### 2026-01-18
- Updated task with refined SEO strategy based on "Hub-Spoke" model.
- Created `mcp-explained` for technical deep dives with explicit Hub backlink.
- Completely rewrote `/en/mcp` to serve as the authoritative Hub with 9-section structure.
- Updated `lib/docs-config.ts` to rename entry to "MCP Guide".
- Standardized backlinking on `mcp-configuration`, `mcp-client`, and `opencode-mcp-playwright`.
### 2026-01-12
- Task created.
- (Previous initial work done, now refining).

## Progress Log
### 2026-01-12
- Task created.
- Overwrote \`app/(main)/en/mcp/page.mdx\` with the new authoritative content.
- Added backlinks to \`app/(main)/en/mcp-configuration/page.mdx\` and \`app/(main)/en/mcp-client/page.mdx\`.
- Added Chinese SEO callout to \`app/(zh)/zh/docs/configure/mcp-servers/page.mdx\`.
- Updated "MCP Ready" card in \`app/(main)/page.tsx\` to link to \`/en/mcp\`.
- Updated reference in \`app/(main)/en/opencode-vs-claude-code/page.mdx\`.- Optimized sitemap priorities for MCP pages.
- P0/P1 tasks complete.