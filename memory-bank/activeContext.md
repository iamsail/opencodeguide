# Active Context

## Current Focus
We are finalizing the SEO optimization of the documentation structure. The goal is to concentrate search authority on the technical documentation center (\`/zh/docs\`) and establish clear language relationships between English and Chinese content.

## Recent Changes
-   **SEO Authority Guidance (Canonical Strategy)**: Implemented \`canonical\` tags on all supplementary Chinese articles (\`/zh/opencode-*\`, \`/zh/install\`) pointing to their authoritative documentation equivalents under \`/zh/docs\`. This prevents route cannibalization.
-   **Cross-Language Mapping (hreflang)**: Established bidirectional \`hreflang\` connections between 8 English pages and 7 Chinese documentation pages. For example, \`/en/what-is-opencode\` is now linked to \`/zh/docs/intro\` as its linguistic equivalent.
-   **Fixed Broken Canonicals**: Corrected all English documentation pages which were missing the \`/en\` prefix in their canonical links.
-   **Hub Page Refactoring**: Redesigned the [Chinese Hub page](/zh/opencode) to prominently feature the [Documentation Center](/zh/docs) as the primary technical reference, clearly distinguishing "educational articles" from "technical facts".
-   **Completed Metadata for Skeletons**: Added missing \`metadata\` exports to 6 Chinese documentation sections (Intro, Usage, CLI, IDE, Providers, MCP) to ensure proper SEO indexing.
-   **Standardized Route Map**: Updated \`ROUTE_MAP.md\` to reflect the tiered hierarchy and document the SEO strategy.

## Active Decisions
-   **Canonical vs Redirect**: We chose to keep the educational articles at their original URLs but use \`canonical\` instead of \`301 redirects\`. This allows us to keep the viral/SEO-friendly "entry points" while concentrating the actual ranking power on the documentation.
-   **Hreflang Logic**: Even if the content is not a word-for-word translation, we link pages with high semantic overlap (e.g., Use Cases ↔ Usage) to help Google understand the site structure.
-   **Documentation Sovereignty**: The \`/zh/docs/\` path is now explicitly confirmed as the "Single Source of Truth" for all technical details.

## Next Steps
1.  **Content Population**: Gradually replace the "What/When/Usage" templates in the 33+ Chinese doc pages with full technical content.
2.  **Visual Assets**: Add screenshots to the documentation as planned in \`TASK022\`.
3.  **Vercel Deployment**: Monitor the impact of these changes on the Vercel dashboard and Search Console.
