# Active Context

## Current Focus
We have completed the **MCP Hub SEO Transformation ([TASK025])**, establishing `/en/mcp` as the single authoritative source. Our focus remains on **Phase 3: Content Enrichment & Engagement**, with immediate priorities on visual assets.

## Recent Changes
-   **MCP Hub Optimization ([TASK025])**: Consolidated all MCP-related traffic to `/en/mcp`.
    -   **Authority**: Rewrote `/en/mcp` as a comprehensive Hub.
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
