# Active Context

## Current Focus
We have completed the **SEO Landing Pages Expansion ([TASK027])**, adding 6 targeted pages to capture high-intent search traffic around common errors (Claude credentials) and specific integrations (Playwright). This further solidifies the site's authority by addressing specific user pain points directly.

Our focus remains on **Phase 3: Content Enrichment & Engagement**, with immediate priorities on visual assets and community-driven features.

## Recent Changes
-   **CLI Documentation Update ([TASK033])**: Replaced the Chinese CLI placeholder at `/zh/docs/cli` with a complete manual.
    -   **Content**: Added full command references, flags, and an exhaustive list of environment variables.
    -   **MDX Fix**: Used a hybrid approach with styled HTML `<table>` tags to ensure proper rendering under Next.js 16 + Turbopack, bypassing plugin serialization errors.
    -   **UI Enhancement**: Added robust styling for table elements in `mdx-components.tsx` to ensure visual consistency across all documentation.
-   **Introduction Documentation Update ([TASK032])**: Completely overhauled the Chinese introduction guide (`/zh/docs/intro`).
    -   **Simplification**: Replaced the previous fragmented list with a cohesive, logical flow covering prerequisites, installation, initialization, and basic usage.
    -   **Link Integrity**: Synchronized 15+ internal links to match the new tiered routing structure (`/zh/docs/...`).
    -   **SEO**: Enhanced metadata and content keywords for "OpenCode tutorial" and "AI agent installation" in Chinese.
-   **SEO Comparison Page ([TASK031])**: Added Chinese "OpenCode vs Cursor vs Claude" landing page.
    -   **Traffic Generation**: Designed to capture search intent for tool comparison.
    -   **Detailed Implementation**: Fixed MDX table rendering by converting to a styled HTML table + Tailwind.
    -   **Stability Fix**: Reverted `next.config.mjs` to standard `mdxRs: true` (no plugins) to resolve Turbopack 404 errors.
    -   **Strategy**: Phase 1 strategy implemented (no initial canonical) to allow independent indexing before consolidating authority later.
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
