# Active Context

## Current Focus
We have completed the **SEO Landing Pages Expansion ([TASK027])**, adding 6 targeted pages to capture high-intent search traffic around common errors (Claude credentials) and specific integrations (Playwright). This further solidifies the site's authority by addressing specific user pain points directly.

Our focus remains on **Phase 3: Content Enrichment & Engagement**, with immediate priorities on visual assets and community-driven features.

## Recent Changes
-   **MDX & UI Refinement ([TASK030])**: Fixed table rendering and enhanced TOC.
    -   **Table Rendering**: Enabled `mdxRs: true` in `next.config.mjs` to resolve GFM/Turbopack compatibility issues.
    -   **Hydration Fix**: Implemented compressed HTML fallback for complex tables in `mcp-servers/page.mdx` to avoid Vercel/Next.js hydration errors.
    -   **TOC Hierarchy**: Added support for H2/H3 levels with indentation and translated the header to "本页内容" for Chinese routes.
-   **MCP Servers Documentation ([TASK029])**: Replaced placeholder with detailed Chinese manual.
-   **TUI Documentation ([TASK028])**: Replaced placeholder with comprehensive Chinese guide.
-   **SEO Landing Pages ([TASK027])**: Deployed 6 new pages including:
    -   **Claude Credential Error Fix**: `/en/opencode/errors/claude-credential-only-authorized`
    -   **Detailed Integrations**: `/en/opencode-mcp-playwright`, `/en/opencode-claude`, etc.
    -   **Routing discipline**: Enforced strict `/en/` and `/zh/` prefixes for all new content to match the established SEO structure.
-   **MCP Use Cases ([TASK026])**: Created a new comprehensive guide at `/en/opencode-mcp-use-cases` featuring 6+ real-world workflows.
    -   **SEO Authority**: Implemented optimized metadata and structured headings to capture "MCP Use Cases" and "Model Context Protocol real world" search intent.
    -   **Navigation**: Strategic placement in the "Introduction" section of the sidebar.
    -   **Content Loop**: Established bidirectional internal linking between the MCP Hub, General Use Cases, comparison guides, and integration pages.
-   **MCP Hub Optimization ([TASK025])**: Consolidated all MCP-related traffic to `/en/mcp`.
    -   **Authority Concentration**: Rewrote `/en/mcp` as a comprehensive Hub to serve as the single source of truth for MCP education.
    -   **Internal Linking**: Updated Home, Comparison, and sub-pages to point to the Hub.
    -   **Chinese Anchor**: Added a callout in `/zh/docs/configure/mcp-servers` directing to the English Hub.
-   **SEO Optimization Completed ([TASK022])**: Successfully implemented the "Authority Concentration" strategy.
    -   **Canonicals**: All supplementary articles now point to \`/zh/docs\` as the single source of truth.
    -   **Hreflang**: Established 8+ bidirectional logic pairs between English and Chinese pages.
    -   **Hub Page**: The \`/zh/opencode\` page was refactored to serve as a proper portal to the documentation.
-   **Documentation Structure**: The tiered routing structure for \`/zh/docs\` is fully functional and indexed.

## Active Decisions
-   **Canonical vs Redirect**: We chose to keep the educational articles at their original URLs but use \`canonical\` instead of \`301 redirects\`. This allows us to keep the viral/SEO-friendly "entry points" while concentrating the actual ranking power on the documentation.
-   **Hreflang Logic**: Even if the content is not a word-for-word translation, we link pages with high semantic overlap (e.g., Use Cases ↔ Usage) to help Google understand the site structure.
-   **Documentation Sovereignty**: The \`/zh/docs/\` path is now explicitly confirmed as the "Single Source of Truth" for all technical details.

## Next Steps
1.  **Visual Assets ([TASK023])**: Start capturing and implementing screenshots for the "Installation" and "CLI" sections.
2.  **Content Population**: Continue filling in the technical details for the \`config\` and \`providers\` sections in Chinese.
3.  **Edit Links ([TASK024])**: Add "Edit this page on GitHub" links to the footer of all documentation pages to encourage community contribution.
