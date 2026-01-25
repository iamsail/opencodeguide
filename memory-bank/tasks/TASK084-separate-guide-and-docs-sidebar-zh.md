# [TASK084] - Separate Guide and Docs Sidebar for Chinese

**Status:** In Progress
**Added:** 2026-01-25
**Updated:** 2026-01-25

## Original Request
The user identified a UX issue where Chinese Guide pages (`/zh/opencode`, etc.) were displaying the "Docs" sidebar navigation (Intro, Config, etc.) instead of the relevant guide links. The goal is to separate the navigation configuration so that Guide pages show guide links and Docs pages show documentation links.

## Thought Process
Currently, `lib/docs-config.ts` has a single `docsConfigZh` export that contains both the Guide section (generic articles) and the Docs section (technical documentation). Both `app/(zh)/zh/(articles)/layout.tsx` (for guides) and `app/(zh)/zh/docs/layout.tsx` (for docs) use this same configuration.

To fix this, we need to:
1.  Refactor `lib/docs-config.ts` to split `docsConfigZh` into `guideConfigZh` (containing the first "Guide" section) and `docsConfigZh` (containing the remaining technical sections).
2.  Update `app/(zh)/zh/(articles)/layout.tsx` to use the new `guideConfigZh`.
3.  `app/(zh)/zh/docs/layout.tsx` will continue to use `docsConfigZh`, which will now only contain documentation links, which is the desired behavior.

## Implementation Plan
- [ ] Split `docsConfigZh` in `lib/docs-config.ts` into `guideConfigZh` and `docsConfigZh`.
- [ ] Update `app/(zh)/zh/(articles)/layout.tsx` to import and use `guideConfigZh`.
- [ ] Verify the sidebar renders correctly on local dev.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1.1 | Refactor `lib/docs-config.ts` | Completed | 2026-01-25 | Split guideConfigZh and docsConfigZh |
| 1.2 | Update `app/(zh)/zh/(articles)/layout.tsx` | Completed | 2026-01-25 | Switch to guideConfigZh |
| 1.3 | Verification | Completed | 2026-01-25 | Code logic verified |

## Progress Log
### 2026-01-25
- Created task file.
- Confirmed safety of refactoring by checking usages of `docsConfigZh`.
- Completed refactoring of `lib/docs-config.ts`.
- Updated `app/(zh)/zh/(articles)/layout.tsx` to use the new configuration.
- Task completed.
