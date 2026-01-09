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
-   **Components**:
    -   `mdx-components.tsx`: Maps standard HTML (h1, p, code) to styled Tailwind components.
    -   `site-header`: Sticky, backdrop-blur.
    -   `site-footer`: Contains the mandatory unofficial disclaimer.

## Key Technical Decisions
1.  **No `next-mdx-remote`**: Chosen `@next/mdx` for better build-time optimization and simplicity in App Router.
2.  **Explicit Routing**: `/en` and `/zh` are explicit path prefixes, not query params, for SEO.
3.  **Local vs Cloud**: The site itself requires no backend; it is purely static HTML/CSS/JS.

## Directory Structure
```
app/
├── (main)/             # English/Root Context
│   ├── page.tsx        # Landing Page
│   └── en/             # English MDX Pages
├── (zh)/               # Chinese Context
│   └── zh/             # Chinese MDX Pages
├── globals.css         # Global Tailwind directives
└── layout.tsx          # (Removed in favor of group layouts)
```
