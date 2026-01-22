# System Patterns

## Architecture
The project is built as a **Pure Static Site (Exported)** using **Next.js App Router**.

### Deployment & Performance
-   **Static Export**: configured with `output: 'export'` in `next.config.mjs`. This generates a purely static HTML/CSS/JS payload at build time.
    -   **Rationale**: To eliminate Serverless Function execution costs and minimizes Edge Requests.
    -   **No Runtime**: There is NO Node.js or Edge Runtime on the server. `runtime`, `middleware.ts`, `headers()`, and `cookies()` usage are strictly forbidden in production paths.
-   **Caching Strategy**: Controlled via `vercel.json`.
    -   **HTML**: `public, max-age=3600, must-revalidate` (1 hour)
    -   **Assets**: `public, max-age=31536000, immutable` (1 year)
    -   **Images**: `images.unoptimized = true` to avoid Image Optimization costs.
-   **Link Prefetching**: Disabled globally for navigation lists.
    -   **Constraint**: All Sidebar and Header links MUST have `prefetch={false}`.
    -   **Reason**: With deep sidebars, default prefetching triggers 50+ unnecessary requests per page view.

### Routing & Internationalization
We utilize **Route Groups** to distinguish contexts.
-   **Root Layouts**:
    -   `app/(main)/`: Handles Homepage (`/`) and English Content (`/en/...`). Sets `<html lang="en">`.
    -   `app/(zh)/`: Handles Chinese Content (`/zh/...`). Sets `<html lang="zh">`.
-   **Content Layouts (Sub-groups)**:
    -   `(docs)`: Contains standard technical documentation. Includes **Sidebar** and **On-This-Page**.
    -   `(articles)`: Contains narrative guides and SEO pages (e.g., Best Practices). **No Sidebar**, centered layout (`max-w-3xl`) for focused reading.
-   This architecture avoids complex i18n middleware and allows distinct UI paradigms (Docs vs Blog) without changing the URL structure.

### Documentation Routing Strategy
We distinguish between "Technical Reference" and "Educational Articles/Blog" to create a high-converting content loop:
-   **Technical Reference**: Tiered hierarchy under `/zh/docs/` (e.g., `/zh/docs/configure/tools`). This is the "Single Source of Truth" for technical precision and community contribution.
-   **Educational Articles**: Flat structure under `/zh/` (e.g., `/zh/opencode-shi-yong`). These serve as high-intent SEO entry points designed to attract viral traffic and guide them towards the technical documentation.
-   **Authority Concentration**: 
    -   Supplementary articles use `canonical` tags pointing to their most relevant technical documentation equivalent.
    -   Hub pages (like `/en/mcp`, `/en/oh-my-opencode`, and `/zh/opencode`) act as authoritative portals, consolidating weight and distributing it to sub-pages.
-   **Content Loop Pattern**: 
    -   Entry Point (Article/Search) -> Contextual Hub -> Deep Dive (Technical Docs) -> Practical Application (Use Cases) -> Ecosystem (Reference).
    -   This loop ensures high user retention and strong topical authority for search engines.

### Content Engine
-   **Source**: Local `.mdx` files stored in `app/(main)/en/**/*.mdx` and `app/(zh)/zh/**/*.mdx`.
-   **Processor**: `@next/mdx` (Native Next.js MDX implementation).
    -   **Compiler**: `experimental.mdxRs: true` enabled in `next.config.mjs` for Rust-based compilation. This is the **standardized pattern** to ensure compatibility with Next.js 16 Turbopack while providing built-in GFM support for tables.
    -   **Stability & Hydration**: When using HTML `<table>` tags in MDX with `mdxRs` enabled, the compiler may preserve newlines and indentation inside raw HTML blocks. This triggers React hydration errors (e.g., Error #418/425). 
    -   **Fix Pattern**: All raw HTML blocks (`<table>`, `<tbody>`, etc.) MUST be minified into single-line strings without whitespace between tags.
    -   **Mobile UX**: Minified tables MUST be wrapped in `<div className="my-6 w-full overflow-y-auto">` to ensure horizontal scrollability on mobile devices.
-   **Styling**: `@tailwindcss/typography` (`prose` class) handles Markdown rendering.
-   **Language Sync**: Symmetric `hreflang` implementation across EN/ZH pairs to maintain global authority and signal language parity to search engines.

### Design System
-   **Framework**: Tailwind CSS.
-   **Theme**: "Clean & Calm" (Zinc/Neutral colors, Inter font).
-   **Dark Mode**: Implemented via `next-themes` with data-attribute strategy (`class` mode in Tailwind). Defaults to system preference.
-   **Components**:
    -   `mdx-components.tsx`: Maps standard HTML (h1, p, code, table, th, td) to styled Tailwind components with custom border and spacing.
    -   `copy-button`: Client component using DOM traversal to extract text at runtime (Turbopack compatible).
    -   `toc`: Dynamic TOC generator that re-scans for headers (H2, H3) on route changes. Supports hierarchical indentation (`pl-4` for H3) and multilingual headers ("On This Page" / "本页内容").

## Key Technical Decisions
1.  **No next-mdx-remote**: Chosen `@next/mdx` for better build-time optimization.
2.  **Explicit Routing**: `/en` and `/zh` are explicit path prefixes for SEO.
3.  **Search Architecture (Client-Side)**:
    -   Build-time indexing via `scripts/build-search.mjs` -> `public/search.json`.
    -   Client-side fuzzy search via `fuse.js`.
4.  **Table of Contents (Hybrid)**:
    -   Uses `IntersectionObserver` to track active headings.
    -   Generates missing IDs client-side to ensure robustness across different MDX processing modes.
5.  **No-Regret Routing**: Absolute paths under `/zh/docs` for technical documentation to ensure long-term link stability.

## Directory Structure
```
app/
├── (main)/             # English/Root Context
│   ├── page.tsx        # Landing Page
│   └── en/
│       ├── (docs)/     # Standard Docs (w/ Sidebar)
│       └── (articles)/ # Narrative Articles (No Sidebar)
├── (zh)/               # Chinese Context
│   ├── layout.tsx      # ZH Root Layout
│   └── zh/
│       ├── (docs)/     # Standard Docs (w/ Sidebar)
│       └── (articles)/ # Narrative Articles (No Sidebar)
components/
├── docs-sidebar.tsx    # Navigation
├── toc.tsx             # Table of Contents
└── search.tsx          # Local Search UI (cmdk)
```
