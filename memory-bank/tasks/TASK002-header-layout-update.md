# [TASK002] - Header Layout Update

**Status:** Completed
**Added:** 2026-01-09
**Updated:** 2026-01-09

## Original Request
Move the language switching links ("English Docs", "中文文档") to the top right corner of the header.

## Thought Process
Currently, the language links are situated next to the Site Logo on the left side.
The `SiteHeader` component uses Flexbox.
- There is a left container holding the Logo and the Nav.
- There is a right container (`flex-1 flex justify-end`) which is currently empty.
- I will move the `nav` element from the left container to the right container.

## Implementation Plan
- [x] Modify `components/site-header.tsx` to move the `nav` section to the right-aligned container.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 2.1 | Move nav links to right side | Completed | 2026-01-09 | |

## Progress Log
### 2026-01-09
- Created task file.
- Moved `nav` block from left container to right container in `components/site-header.tsx`.
- Completed task.
