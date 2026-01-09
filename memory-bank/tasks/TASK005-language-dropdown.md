# [TASK005] - Implement Language Dropdown Switcher

**Status:** Completed
**Added:** 2026-01-09
**Updated:** 2026-01-09

## Original Request
"右上角的这个切换多语言，应该是下拉框吧，默认是英文" -> "The language switch in the top right should be a dropdown, default is English."

## Thought Process
The user wants to replace the static "English Docs" / "中文文档" links in the header with a dropdown menu.
- The dropdown should allow selecting the language.
- "Default is English" likely means the initial state or the root view is considered English.
- I need to implement a client-side component for the dropdown interaction (open/close).
- I should probably check the current URL to decide which language to show as "active" or "current" in the dropdown button.
    - If URL starts with `/zh`, current is Chinese.
    - Else, current is English.

## Implementation Plan
- [x] Create `components/language-switcher.tsx`
    - [x] Mark as `"use client"`
    - [x] Use `lucide-react` for icons (ChevronDown, Globe/Languages).
    - [x] Implement toggle logic.
    - [x] Use `usePathname` to determine current language label.
    - [x] Render links to `/en/installation` (or current page equivalent if possible) and `/zh/install`.
- [x] Update `components/site-header.tsx` to replace nav links with `<LanguageSwitcher />`.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 5.1 | Create LanguageSwitcher component | Completed | 2026-01-09 | |
| 5.2 | Integrate into SiteHeader | Completed | 2026-01-09 | |

## Progress Log
### 2026-01-09
- Created task file.
- Created `components/language-switcher.tsx`.
- Updated `components/site-header.tsx`.
- Verified `lib/utils.ts` exists.

