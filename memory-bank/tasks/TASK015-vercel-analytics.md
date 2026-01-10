# TASK015 - Integrate Vercel Analytics

**Status:** In Progress
**Added:** 2026-01-10
**Updated:** 2026-01-10

## Original Request
"看截图，vercel的埋点如何集成" (Referencing a screenshot showing Vercel Web Analytics setup instructions).

## Thought Process
The user wants to add Vercel Web Analytics to the Next.js project. The instructions are straightforward:
1.  Install `@vercel/analytics`.
2.  Import `Analytics` component.
3.  Add it to the root layout(s).

Since the project uses Route Groups `(main)` and `(zh)` which likely have separate root layouts (defining `<html>` and `<body>`), we need to ensure the `Analytics` component is added to both to cover all pages.

## Implementation Plan
-   [ ] Install `@vercel/analytics` package.
-   [ ] Add `<Analytics />` component to `app/(main)/layout.tsx`.
-   [ ] Add `<Analytics />` component to `app/(zh)/layout.tsx`.
-   [ ] Verify the build.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1.1 | Install package | Completed | 2026-01-10 | `npm i @vercel/analytics` |
| 1.2 | Update `(main)` layout | Completed | 2026-01-10 | Import and use component |
| 1.3 | Update `(zh)` layout | Completed | 2026-01-10 | Import and use component |

## Progress Log
### 2026-01-10
-   Task created based on user request.
-   Installed `@vercel/analytics`.
-   Added `<Analytics />` to `app/(main)/layout.tsx` and `app/(zh)/layout.tsx`.
-   Task completed.
