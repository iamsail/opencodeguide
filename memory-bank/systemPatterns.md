# System Patterns

## Architecture
The project is built as a **Static Site (SSG)** using **Next.js App Router**.

### Routing & Internationalization
We utilize **Route Groups** to handle multi-language root layouts completely separately.
-   `app/(main)/`: Handles Homepage (`/`) and English Content (`/en/...`). Sets `<html lang="en">`.
-   `app/(zh)/`: Handles Chinese Content (`/zh/...`). Sets `<html lang="zh">`.
-   This avoids complex i18n middleware for a static site and allows distinct UI/Fonts per language.

### Documentation Routing Strategy
We distinguish between "Technical Reference" and "Educational Articles/Blog":
-   **Technical Reference**: Tiered hierarchy under `/zh/docs/` (e.g., `/zh/docs/configure/tools`). Used for structured manual-style content.
-   **Educational Articles**: Flat structure under `/zh/` (e.g., `/zh/opencode-shi-yong`). Used for SEO-optimized entry points and deep-dives.
-   **Navigation**: Technical Reference pages feature a functional sidebar and TOC for navigation.

### Content Engine
-   **Source**: Local `.mdx` files stored in `app/(main)/en/**/*.mdx` and `app/(zh)/zh/**/*.mdx`.
-   **Processor**: `@next/mdx` (Native Next.js MDX implementation).
-   **Styling**: `@tailwindcss/typography` (`prose` class) handles Markdown rendering.

### Design System
-   **Framework**: Tailwind CSS.
-   **Theme**: "Clean & Calm" (Zinc/Neutral colors, Inter font).
-   **Dark Mode**: Implemented via `next-themes` with data-attribute strategy (`class` mode in Tailwind). Defaults to system preference.
-   **Components**:
    -   `mdx-components.tsx`: Maps standard HTML (h1, p, code) to styled Tailwind components.
    -   `copy-button`: Client component using DOM traversal to extract text at runtime (Turbopack compatible).
    -   `toc`: Dynamic TOC generator that re-scans for headers on route changes using `usePathname`.

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
│   └── en/             # English MDX Pages
├── (zh)/               # Chinese Context
│   ├── layout.tsx      # ZH Layout (w/ Sidebar + TOC)
│   └── zh/             # Chinese MDX Pages
│       ├── docs/       # Technical Reference (Tiered)
│       └── [article]   # SEO Articles (Flat)
components/
├── docs-sidebar.tsx    # Navigation
├── toc.tsx             # Table of Contents
└── search.tsx          # Local Search UI (cmdk)
```
