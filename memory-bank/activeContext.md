# Active Context

## Current Focus
We are undertaking a major overhaul of the Chinese documentation. The goal is to move from ad-hoc pages to a structured, 4-section documentation site (Intro, Usage, Configure, Develop) containing approximately 30+ pages. This is driven by the need for comprehensive, localized documentation for Chinese developers.

## Recent Changes
-   **Documentation Complete**: Successfully created all ~33 MDX pages for the new Chinese documentation structure, covering Intro, Usage, Configure, and Develop sections.
-   **Updated Sidebar Configuration**: Refactored `docsConfigZh` in `lib/docs-config.ts` to support the new 4-section structure.
-   **Created Intro Section**: Initialized 7 new pages under "Intro" (Introduction, Config, Providers, Network, Enterprise, Troubleshooting, Migration).
-   **Created Usage Section**: Initialized 8 new pages under "Usage" (Terms, TUI, CLI, IDE, Zen, Share, GitHub, GitLab).
-   **Created Configure Section**: Initialized 14 new pages under "Configure" (Tools, Rules, Agents, Models, Themes, Keybinds, Commands, Formatters, Permissions, LSP, MCP, ACP, Skills, Custom Tools).
-   **Created Develop Section**: Initialized 4 new pages under "Develop" (SDK, Server, Plugins, Ecosystem).
-   **Started Structured Chinese Docs**: Created `TASK019` to track the full documentation rewrite.
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
-   **Fixed Build Error**: Updated `next-themes` type import in `theme-provider.tsx` to resolve Vercel deployment failure.
-   **Fixed Copy Button**: Restored functionality by implementing client-side text extraction as a fallback for missing server-side data (due to Turbopack limitations).
-   **Integrated Vercel Analytics**: Added `@vercel/analytics` to both English and Chinese root layouts.
-   **Fixed Footer Language**: Updated `SiteFooter` to accept a `lang` prop, ensuring only the relevant language disclaimer is shown (English or Chinese).
-   **Fixed Hydration Error**: Added `suppressHydrationWarning` to `<body>` tags to prevent warnings caused by browser extensions (e.g., ColorZilla) injecting attributes.
-   **Added Chinese Content**: Added 3 new Chinese documentation pages: What is OpenCode, Usage Guide, and Chinese Support Guide.
-   **Updated Navigation**: Updated sidebar navigation and ROUTE_MAP to include new Chinese guides.
-   **Implemented Hub Page**: Created `/zh/opencode` as the authoritative entry point for Chinese users, linking to key content and improving SEO structure.
-   **Updated /zh/install**: Replaced the Chinese installation guide to emphasize OpenCode as an AI Coding Agent supporting CLI + Desktop App, with Desktop App as the first recommendation and curl as the primary CLI path.
-   **Added SEO Redirect**: Added a permanent redirect from `/zh/opencode-install` to `/zh/install` to consolidate SEO weight on `/zh/install`.
-   **Fixed Install Page Rendering**: Replaced the Markdown table with an explicit HTML `<table>` (MDX without GFM table support) and made TOC generate missing heading IDs at runtime.

## Active Decisions
-   **Documentation Structure**: Adopting a 4-pillar structure (Intro, Usage, Configure, Develop) to better organize the growing documentation.
-   **Layout**: Evolved to a 3-column layout on Desktop: Sidebar (Left) - Content (Center) - TOC (Right).
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
-   **Fixed Build Error**: Updated `next-themes` type import in `theme-provider.tsx` to resolve Vercel deployment failure.
-   **Fixed Copy Button**: Restored functionality by implementing client-side text extraction as a fallback for missing server-side data (due to Turbopack limitations).
-   **Integrated Vercel Analytics**: Added `@vercel/analytics` to both English and Chinese root layouts.
-   **Fixed Footer Language**: Updated `SiteFooter` to accept a `lang` prop, ensuring only the relevant language disclaimer is shown (English or Chinese).
-   **Fixed Hydration Error**: Added `suppressHydrationWarning` to `<body>` tags to prevent warnings caused by browser extensions (e.g., ColorZilla) injecting attributes.
-   **Added Chinese Content**: Added 3 new Chinese documentation pages: What is OpenCode, Usage Guide, and Chinese Support Guide.
-   **Updated Navigation**: Updated sidebar navigation and ROUTE_MAP to include new Chinese guides.
-   **Implemented Hub Page**: Created `/zh/opencode` as the authoritative entry point for Chinese users, linking to key content and improving SEO structure.
-   **Updated /zh/install**: Replaced the Chinese installation guide to emphasize OpenCode as an AI Coding Agent supporting CLI + Desktop App, with Desktop App as the first recommendation and curl as the primary CLI path.
-   **Added SEO Redirect**: Added a permanent redirect from `/zh/opencode-install` to `/zh/install` to consolidate SEO weight on `/zh/install`.
-   **Fixed Install Page Rendering**: Replaced the Markdown table with an explicit HTML `<table>` (MDX without GFM table support) and made TOC generate missing heading IDs at runtime.

## Active Decisions
-   **Layout**: Evolved to a 3-column layout on Desktop: Sidebar (Left) - Content (Center) - TOC (Right).
-   **Theme**: Default to "System" preference. Persistence handled by local storage via `next-themes`.
-   **Search Strategy**: "Static Indexing". The index is built into a JSON file (`public/search.json`) at deployment time. This avoids the need for external search services and ensures speed.
-   **TOC Strategy**: Hybrid approach. Prefer server-side heading IDs when available, but TOC also generates missing IDs client-side for robustness (avoids relying on MDX plugin injection under Turbopack).
-   **MDX Compatibility**: Avoid MDX plugin injection that causes non-serializable loader options under Next 16 + Turbopack; prefer no-plugin content patterns when possible (e.g., explicit HTML tables).
-   **Config**: Navigation structure is defined in `lib/docs-config.ts`.
-   **Images**: Placeholder `<div>`s are used or implicit text descriptions. Real screenshots are a TODO.
-   **Sitemap**: Implemented dynamic sitemap generation in `app/sitemap.ts` to automatically crawl `page.tsx` and `page.mdx` files, ensuring the sitemap stays in sync with the file system.
-   **Hub Page Strategy**: Used a central Hub page (`/zh/opencode`) to aggregate 3 core topics (What, How, Chinese Support) rather than scattering them, to better signal relevance to search engines.

## Next Steps
1.  Deploy to Vercel and verify production build.
2.  Add real screenshots to replace text descriptions where applicable.
3.  Implement "Edit this page" links.
