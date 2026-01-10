# System Patterns

## Architecture
The project is built as a **Static Site (SSG)** using **Next.js App Router**.

### Routing & Internationalization
We utilize **Route Groups** to handle multi-language root layouts completely separately.
-   `app/(main)/`: Handles Homepage (`/`) and English Content (`/en/...`). Sets `<html lang="en">`.
-   `app/(zh)/`: Handles Chinese Content (`/zh/...`). Sets `<html lang="zh">`.
-   This avoids complex i18n middleware for a static site and allows distinct UI/Fonts per language.

### Content Engine
-   **Source**: Local `.mdx` files stored in `app/(main)/en/**/*.mdx` and `app/(zh)/zh/**/*.mdx`.
-   **Processor**: `@next/mdx` (Native Next.js MDX implementation).
-   **Styling**: `@tailwindcss/typography` (`prose` class) handles Markdown rendering.

### Design System
-   **Framework**: Tailwind CSS.
-   **Theme**: "Clean & Calm" (Zinc/Neutral colors, Inter font).
-   **Dark Mode**: Implemented via `next-themes` with data-attribute strategy (`class` mode in Tailwind). defaults to system preference.
-   **Components**:
    -   `mdx-components.tsx`: Maps standard HTML (h1, p, code) to styled Tailwind components. Handles code block rendering.
    -   `copy-button`: Client component for code blocks. Uses DOM traversal (`parentElement.querySelector('pre')`) to extract text at runtime when server-side metadata is unavailable (Turbopack compatibility).
    -   `site-header`: Sticky, backdrop-blur, contains Search and Theme toggles.
    -   `site-footer`: Contains the mandatory unofficial disclaimer.
    -   `docs-sidebar`: Responsive navigation handling active states.

## Key Technical Decisions
1.  **No `next-mdx-remote`**: Chosen `@next/mdx` for better build-time optimization and simplicity in App Router.
2.  **Explicit Routing**: `/en` and `/zh` are explicit path prefixes, not query params, for SEO.
3.  **Search Architecture (Client-Side)**:
    -   **Indexing**: A custom script (`scripts/build-search.mjs`) runs at *build time*. It recursively scans `.mdx` files and generates a `public/search.json` index.
    -   **Querying**: The client fetches this JSON lazily (on first search interaction) and uses `fuse.js` for fuzzy searching.
    -   **Rationale**: Zero backend requirement, ultra-fast, offline capable.
4.  **Table of Contents (Hybrid)**:
    -   **Anchors**: `rehype-slug` adds IDs to headings at build time (Server).
    -   **Layout**: `IntersectionObserver` detects active headings at runtime (Client) to highlight the TOC.
5.  **Local vs Cloud**: The site itself requires no backend; it is purely static HTML/CSS/JS.

## Directory Structure
```
app/
├── (main)/             # English/Root Context
│   ├── page.tsx        # Landing Page
│   ├── layout.tsx      # Root & EN Layout (w/ Sidebar + TOC)
│   └── en/             # English MDX Pages
├── (zh)/               # Chinese Context
│   ├── layout.tsx      # ZH Layout (w/ Sidebar + TOC)
│   └── zh/             # Chinese MDX Pages
components/
├── docs-sidebar.tsx    # Mobile/Desktop Navigation
├── toc.tsx             # Table of Contents
├── search.tsx          # Local Search UI (cmdk)
└── theme-toggle.tsx    # Dark mode switcher
globals.css             # Global Tailwind directives
```
