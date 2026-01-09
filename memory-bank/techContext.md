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

## Constraints
*   **Static Export**: The site acts effectively as a static site.
*   **No Database**: All content is file-system based.
*   **Performance**: Must achieve high Lighthouse scores (minimal script execution).
