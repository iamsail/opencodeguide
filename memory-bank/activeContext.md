# Active Context

## Current Focus
We have completed **Phase 2 User Experience** implementations (Sidebar, TOC, Search, Dark Mode). The current focus is on **Quality Assurance (QA) and Bug Fixing** to ensure these features work flawlessly before final deployment.

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
-   Verified Google Search Console submission (14 pages successfully indexed).
-   **Implemented Sidebar**: Added a responsive sidebar for consistent navigation.
-   **Implemented TOC**: Added a right-side "Table of Contents" for better reading experience on large screens.
-   **Implemented Search**: Added a fast, client-side "Cmd+K" search using Fuse.js and build-time indexing.
-   **Implemented Dark Mode**: Added system-aware theme switching with `next-themes`.
-   **Fixed Search Config**: Tuned Fuse.js (`threshold: 0.4`, `ignoreLocation: true`) to fix fuzzy matching issues.
-   **Fixed Homepage Dark Mode**: Refactored `page.tsx` with `dark:` variants to ensure text visibility in dark mode.

## Active Decisions
-   **Layout**: Evolved to a 3-column layout on Desktop: Sidebar (Left) - Content (Center) - TOC (Right).
-   **Theme**: Default to "System" preference. Persistence handled by local storage via `next-themes`.
-   **Search Strategy**: "Static Indexing". The index is built into a JSON file (`public/search.json`) at deployment time. This avoids the need for external search services and ensures speed.
-   **TOC Strategy**: Hybrid approach. IDs are generated server-side (for SEO anchors), but the list of links is generated client-side to simplify MDX data passing.
-   **Config**: Navigation structure is defined in `lib/docs-config.ts`.
-   **Images**: Placeholder `<div>`s are used or implicit text descriptions. Real screenshots are a TODO.
-   **Sitemap**: Implemented dynamic sitemap generation in `app/sitemap.ts` to automatically crawl `page.tsx` and `page.mdx` files, ensuring the sitemap stays in sync with the file system.

## Next Steps
1.  Deploy to Vercel and verify production build.
2.  Add real screenshots to replace text descriptions where applicable.
3.  Implement "Edit this page" links.
