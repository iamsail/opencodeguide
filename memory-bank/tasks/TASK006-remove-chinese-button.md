# [TASK006] - Remove Chinese Guide Button from Homepage

**Status:** Completed
**Added:** 2026-01-09
**Updated:** 2026-01-09

## Original Request
"看截图，红框这里的中文指南，感觉不需要呢" -> "Look at the screenshot, the 'Chinese Guide' in the red box seems unnecessary."

## Thought Process
The user wants to remove the secondary CTA button on the homepage that links to the Chinese documentation.
This button likely exists in `app/(main)/page.tsx`.
I need to find the element containing the text "中文指南" and remove it.

## Implementation Plan
- [x] Read `app/(main)/page.tsx` to locate the button.
- [x] Remove the button element.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 6.1 | Remove Chinese Guide button | Completed | 2026-01-09 | |

## Progress Log
### 2026-01-09
- Created task file.
- Removed the "中文指南" button from `app/(main)/page.tsx`.
