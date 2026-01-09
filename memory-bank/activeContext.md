# Active Context

## Current Focus
We have just completed the **Phase 1 Initialization**. The project is scaffolded, the design system is active, and all initial content (13 pages total) has been written and verified to render correctly.

## Recent Changes
-   Created Next.js App Router project.
-   Configured Route Groups `(main)` and `(zh)` for proper `<html>` lang tags.
-   Implemented Tailwind Design System (Zinc, Inter).
-   Wrote 8 English MDX guides and 5 Chinese MDX guides.
-   Fixed missing `postcss.config.mjs` which caused style loading failure.
-   Initialized Git repository and made the first commit.
-   Moved language switching links to the top right of the header for better UX.
-   Implemented a Dropdown Language Switcher in the header to replace text links.
-   Removed the redundant "中文指南" secondary button from the homepage hero section.
-   Replaced static sitemap with a dynamic generator in `app/sitemap.ts` and verified `robots.ts`.

## Active Decisions
-   **Navigation**: Currently, there is no global sidebar. Navigation relies on the Header and internal links within articles. This is acceptable for Phase 1 but might need a Sidebar component for Phase 2.
-   **Images**: Placeholder `<div>`s are used or implicit text descriptions. Real screenshots are a TODO.
-   **Search**: No search functionality yet.
-   **Sitemap**: Implemented dynamic sitemap generation in `app/sitemap.ts` to automatically crawl `page.tsx` and `page.mdx` files, ensuring the sitemap stays in sync with the file system.

## Next Steps
1.  Add real screenshots to replace text descriptions where applicable.
2.  Implement a proper Sidebar navigation for the `/en/` and `/zh/` documentation sections.
3.  Deploy to Vercel.
