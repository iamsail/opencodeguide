**Status:** Completed
**Added:** 2026-01-15
**Updated:** 2026-01-15

## Original Request
When switching to Chinese in the header dropdown, default to the `/zh/docs` route.

## Thought Process
The user wants to change the landing destination when a user switches language from the header. Currently, the Chinese option points to `/zh/install`, but the user wants it to point to `/zh/docs`.

## Implementation Plan
- [x] Identify language switcher component (`components/language-switcher.tsx`)
- [x] Update Chinese link `href` to `/zh/docs`
- [x] Verify the change

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1.1 | Identify component | Complete | 2026-01-15 | Found in `components/language-switcher.tsx` |
| 1.2 | Update href to /zh/docs | Complete | 2026-01-15 | Updated `href` for Chinese link |

## Progress Log
### 2026-01-15
- Task initialized
- Found `LanguageSwitcher` in `components/language-switcher.tsx`
- Updated Chinese link `href` to `/zh/docs` in `components/language-switcher.tsx`
