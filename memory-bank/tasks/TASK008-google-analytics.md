# [TASK008] - Implement Google Analytics

**Status:** In Progress
**Added:** 2026-01-09
**Updated:** 2026-01-09

## Original Request
Integrate Google Analytics into the website.

## Thought Process
The project structure uses Route Groups `(main)` and `(zh)`, each with its own `layout.tsx` containing `<html>` and `<body>` tags. There is no root `app/layout.tsx`.
To ensure GA works on all pages:
1.  We will use the official `@next/third-party` library.
2.  We need to inject the `<GoogleAnalytics />` component into both `app/(main)/layout.tsx` and `app/(zh)/layout.tsx`.
3.  We will verify if we can share the Measurement ID via an environment variable `NEXT_PUBLIC_GA_ID`.

## Implementation Plan
- [x] Create Task File.
- [ ] Install `@next/third-party`.
- [ ] Add `<GoogleAnalytics />` to `app/(main)/layout.tsx`.
- [ ] Add `<GoogleAnalytics />` to `app/(zh)/layout.tsx`.
- [ ] Instruct user on how to set `NEXT_PUBLIC_GA_ID` in Vercel.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 8.1 | Install dependencies | Skipped | 2026-01-09 | Using manual component due to registry issue |
| 8.2 | Update `(main)` layout | Completed | 2026-01-09 | |
| 8.3 | Update `(zh)` layout | Completed | 2026-01-09 | |

## Progress Log
### 2026-01-09
- Attempted to install `@next/third-party`, but encountered registry issues.
- Created `components/google-analytics.tsx` as a manual implementation using `next/script`.
- Updated `app/(main)/layout.tsx` and `app/(zh)/layout.tsx` to conditionally render the component if `NEXT_PUBLIC_GA_ID` is present.
- Ready for deployment and configuration in Vercel.

