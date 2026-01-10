# TASK016 - Fix Duplicate Language Text in Footer

**Status:** In Progress
**Added:** 2026-01-10
**Updated:** 2026-01-10

## Original Request
"看截图，底部的文案，同时展示了英文和中文，这个不合理啊" (Look at the screenshot, the footer text shows both English and Chinese, which is unreasonable).

## Thought Process
The user noticed that the footer currently displays both the English disclaimer and the Chinese disclaimer simultaneously. This is likely because the `SiteFooter` component statically renders both paragraphs without checking the current language context.

The project uses separate layouts for English `(main)` and Chinese `(zh)` routes.
- `app/(main)/layout.tsx` imports `SiteFooter`.
- `app/(zh)/layout.tsx` imports `SiteFooter`.

I need to modify `SiteFooter` to accept a `lang` prop (or similar mechanism) so that the parent layout can control which text receives display.

## Implementation Plan
-   [ ] Modify `components/site-footer.tsx` to accept a property (e.g., `lang?: 'en' | 'zh'`) to conditionally render the text.
-   [ ] Update `app/(main)/layout.tsx` to pass `lang="en"`.
-   [ ] Update `app/(zh)/layout.tsx` to pass `lang="zh"`.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1.1 | Update SiteFooter component | Completed | 2026-01-10 | Added `lang` prop |
| 1.2 | Update Main Layout | Completed | 2026-01-10 | Passed `lang="en"` |
| 1.3 | Update ZH Layout | Completed | 2026-01-10 | Passed `lang="zh"` |

## Progress Log
### 2026-01-10
-   Task created.
-   Updated `components/site-footer.tsx` to conditionally render text based on `lang` prop.
-   Updated layouts to pass the correct language.
-   Task completed.
