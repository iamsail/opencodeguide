# Tech Context

## Technology Stack
*   **Framework**: Next.js 16.1.1 (App Router - confirmed via Turbopack build)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS
*   **Content**: MDX (`@next/mdx`)
*   **Icons**: Lucide React
*   **Font**: Inter (via `next/font/google`)
*   **Package Manager**: NPM
*   **Deployment Target**: Vercel (Zero-config assumed)

## Performance & Build
*   **Compiler**: `experimental.mdxRs: true` (Rust-based) is required for stability with Turbopack and to support GFM tables without external JS plugins.
*   **Dev Mode**: Turbopack enabled (`next dev --turbo`).
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
*   **Strict Static Export**: The site uses `output: 'export'`.
    *   **Prohibited**: Middleware (`middleware.ts`), Server Actions, ISR, on-demand revalidation, `headers()`/`cookies()` in layouts.
    *   **Redirects**: Must be handled in `vercel.json`, NOT `next.config.mjs`.
*   **No Database**: All content is file-system based.
*   **Performance**: 
    *   Links in dense lists (Sidebar/TOC) MUST use `prefetch={false}` to avoid request storms.
    *   Images are unoptimized.
*   **Next.js Turbopack**: Current configuration disables `rehypePlugin` injection of raw code properties in `mdx-components` to maintain Turbopack compatibility. "Copy Code" functionality relies on client-side DOM traversal as a fallback.
*   **MDX Plugin Options Serializability**: Injecting remark/rehype plugin functions via `@next/mdx` loader options can fail production builds under Next 16 + Turbopack (loader options must be serializable). 
    *   **Resolution**: We enabled `mdxRs: true` (Rust compiler) which is significantly faster but doesn't support JS plugins well. 
    *   **Workaround**: Complex MDX features like GFM Tables are implemented as raw HTML/Tailwind components within the MDX file, rather than relying on `remark-gfm`. This ensures server stability (avoiding 404/crashes) while maintaining visual fidelity.
