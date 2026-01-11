# Active Context

## Current Focus
We have completed a major architectural overhaul of the Chinese documentation routing system. The focus was to separate "reference documentation" from "articles/blog posts" by moving the structured docs into a tiered \`/zh/docs\` hierarchy.

## Recent Changes
-   **Routing Restructure (Critical Decision)**: Moved all 33+ Chinese documentation pages into a nested hierarchy under \`/zh/docs\`.
    -   Intro & Core guides: \`/zh/docs/*\`
    -   Configuration guides: \`/zh/docs/configure/*\`
    -   Development guides: \`/zh/docs/develop/*\`
    -   This provides a scalable, professional URL structure that mimics official documentation standards.
-   **TOC Persistence Fix**: Fixed a critical bug in \`components/toc.tsx\` where the Table of Contents wouldn't update when navigating between internal documentation pages. Added \`usePathname\` to the dependency array.
-   **Updated Documentation Hub**: Created \`/zh/docs/page.mdx\` as the central entry point for the new technical documentation structure.
-   **Updated Sidebar Configuration**: Refactored \`lib/docs-config.ts\` to map all navigation items to the new tiered paths.
-   **Config Page Content Overhaul**: Fully populated the \`Config\` page with technical details provided by the user (JSON formats, priorities, TUI, Models, Agents, etc.).
-   **Sitemap & Route Map Alignment**: Updated \`ROUTE_MAP.md\` and verified that the dynamic sitemap correctly indexes the new tiered structure.
-   **SEO Redirection Strategy**: Maintained old article paths (e.g., \`/zh/opencode-shi-yong\`) at the root level to preserve SEO/backlinks, while linking them internally to the new \`/zh/docs\` center.

## Active Decisions
-   **Documentation vs. Articles**: Documentation follows a strict tiered hierarchy under \`/zh/docs\`. Articles/Guides follow a flat structure at \`/zh/\` for easier social sharing and distinct SEO targeting.
-   **Navigation Consistency**: The documentation sidebar is exclusive to pages under \`/zh/docs\` and \`/en/\`, providing a focused technical reading environment.
-   **Client-Side TOC Scanning**: TOC continues to use dynamic DOM scanning but now correctly resets on route change using \`usePathname\`.
-   **No-Regret Routing**: The decision to use \`/zh/docs\` as the primary technical documentation home is final and intended for long-term scalability.

## Next Steps
1.  **Visual Polish**: Replace technical/textual descriptions with real screenshots in the documentation.
2.  **Community Metadata**: Add "Edit this page" links pointing to the GitHub repository.
3.  **Content Refinement**: Gradually replace the skeleton templates in the new subsections with full translated content.
