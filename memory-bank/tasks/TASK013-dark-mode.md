# [TASK013] - Implement Dark Mode

**Status:** Completed
**Added:** 2026-01-10
**Updated:** 2026-01-10

## Original Request
"Continue to finish dark mode, completely ending Phase 2."

## Thought Process
- Dark mode is standard for developer documentation.
- Using `next-themes` efficiently handles system preference detection and class toggling without FOUC (Flash of Unstyled Content).
- We need to wrap the application in a `ThemeProvider` and provide a UI toggle.
- Tailwind configuration already supports `darkMode: 'class'`, so existing `dark:` utility classes will automatically work.

## Implementation Plan
- [x] Install `next-themes` and `lucide-react` (if not present).
- [x] Create `components/theme-provider.tsx` (Client Component wrapper).
- [x] Create `components/theme-toggle.tsx` (UI button).
- [x] Wrap Root Layouts (`app/(main)/layout.tsx` and `app/(zh)/layout.tsx`) with the provider.
- [x] Add Toggle to `SiteHeader`.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 13.1 | Install Deps | Completed | 2026-01-10 | `next-themes` installed |
| 13.2 | Create Provider | Completed | 2026-01-10 | Added `components/theme-provider.tsx` |
| 13.3 | Create Toggle | Completed | 2026-01-10 | Added `components/theme-toggle.tsx` |
| 13.4 | Integration | Completed | 2026-01-10 | Wrapped layout options and updated Header |

## Progress Log
### 2026-01-10
- Installed `next-themes`.
- Added `ThemeProvider` with `attribute="class"` to ensure Tailwind compatibility.
- Updated `html` tag to include `suppressHydrationWarning` which is required for `next-themes` to prevent mismatches.
- Updated header styles to support dark mode (borders, background opacity).
