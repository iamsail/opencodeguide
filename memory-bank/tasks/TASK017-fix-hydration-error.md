# TASK017 - Fix Hydration Error (Extension Interference)

**Status:** In Progress
**Added:** 2026-01-10
**Updated:** 2026-01-10

## Original Request
"看截图，有个报错" (Look at the screenshot, there is an error).
The screenshot shows a React Hydration Mismatch error.
Diff: Server has `className="..."`, Client has `cz-shortcut-listen="true" className="..."`.
Location: `app/(main)/layout.tsx` at `<body>`.

## Thought Process
The error is caused by a browser extension (likely ColorZilla) injecting the `cz-shortcut-listen="true"` attribute into the `<body>` tag before or during React's hydration process. This causes a mismatch between the server-rendered HTML (clean string) and the client DOM (modified by extension).

To suppress this warning and prevent the runtime error overlay in development, I will add `suppressHydrationWarning` to the `<body>` tag in the root layouts.
We should apply this to both `(main)` and `(zh)` layouts to be consistent.

## Implementation Plan
-   [ ] Add `suppressHydrationWarning` to the `<body>` tag in `app/(main)/layout.tsx`.
-   [ ] Add `suppressHydrationWarning` to the `<body>` tag in `app/(zh)/layout.tsx`.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1.1 | Update Main Body Tag | Completed | 2026-01-10 | Added prop |
| 1.2 | Update ZH Body Tag | Completed | 2026-01-10 | Added prop |

## Progress Log
### 2026-01-10
-   Task created.
-   Added `suppressHydrationWarning` to `<body>` tags in both layouts.
-   Task completed.
