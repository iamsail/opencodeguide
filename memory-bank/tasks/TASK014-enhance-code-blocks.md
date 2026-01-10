# [TASK014] - Enhance Code Blocks (Highlighting & Copy)

**Status:** In Progress
**Added:** 2026-01-10
**Updated:** 2026-01-10

## Original Request
The user requested optimization of the code block display:
1.  Better visual style (currently too basic).
2.  Syntax highlighting.
3.  Add a "Copy" button.

## Thought Process
The approved solution uses:
-   `rehype-pretty-code` (based on Shiki) for build-time syntax highlighting.
-   A custom `CopyButton` client component.
-   Custom `pre` handling in `mdx-components.tsx` to inject the copy button.

## Implementation Plan
-   [x] Install `rehype-pretty-code`, `shiki`, `unist-util-visit`.
-   [x] Create `components/copy-button.tsx`.
-   [x] Configure `next.config.mjs` to add the plugin.
-   [x] Update `mdx-components.tsx`.
-   [x] Add global styles.

## Progress Log
### 2026-01-10
-   Task created.
-   Installed dependencies and configured build pipeline.
-   Implemented `CopyButton` and integrated it into `mdx-components.tsx`.
-   Added custom styles for syntax highlighting.
-   Task Completed.
-   **Regression Fixed**: The "Copy" button was missing because `rehype-pretty-code` plugins were disabled in `next.config.mjs` to support Turbopack, causing the `data-raw-code` attribute to be missing.
-   **Resolution**: Refactored `mdx-components.tsx` to unconditionally render `CopyButton`. Updated `CopyButton` to fallback to client-side DOM traversal (`innerText` extraction) when the raw code prop is missing.
