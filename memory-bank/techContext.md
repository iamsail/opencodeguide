# Tech Context

## Technology Stack
*   **Framework**: Next.js 16 (App Router)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS
*   **Content**: MDX (`@next/mdx`)
*   **Icons**: Lucide React
*   **Font**: Inter (via `next/font/google`)
*   **Package Manager**: NPM
*   **Deployment Target**: Vercel (Zero-config assumed)

## Development Environment
*   **Node Version**: >= 18.0.0
*   **PostCSS**: Configured via `postcss.config.mjs` for Tailwind processing.
*   **TypeScript**: Strict mode enabled.
*   **ESLint**: Next.js default config.

## Dependencies
*   `@opencode-ai/cli` (referred to in content, not a project dep)
*   `clsx`, `tailwind-merge` (Class utility)
*   `@tailwindcss/typography` (Markdown styling)
*   **Search**: `cmdk` (UI), `fuse.js` (Logic), `globby` (Build script)
*   **Theme**: `next-themes` (Dark mode)
*   **Analytics**: `@vercel/analytics`
*   **Code Highlighting**: `rehype-pretty-code`, `shiki`
*   **MDX Plugins**: `rehype-slug` (IDs), `rehype-autolink-headings` (Anchors)

## Constraints
*   **Static Export**: The site acts effectively as a static site.
*   **No Database**: All content is file-system based.
*   **Performance**: Must achieve high Lighthouse scores (minimal script execution).
*   **Next.js Turbopack**: Current configuration disables `rehypePlugin` injection of raw code properties in `mdx-components` to maintain Turbopack compatibility. "Copy Code" functionality relies on client-side DOM traversal as a fallback.
*   **MDX Plugin Options Serializability**: Injecting remark/rehype plugin functions via `@next/mdx` loader options can fail production builds under Next 16 + Turbopack (loader options must be serializable). 
    *   **Resolution**: We enabled `mdxRs: true` (Rust compiler) which is significantly faster but doesn't support JS plugins well. 
    *   **Workaround**: Complex MDX features like GFM Tables are implemented as raw HTML/Tailwind components within the MDX file, rather than relying on `remark-gfm`. This ensures server stability (avoiding 404/crashes) while maintaining visual fidelity.
